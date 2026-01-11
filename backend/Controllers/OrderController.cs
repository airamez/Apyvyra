using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Services;
using backend.Enums;
using System.Security.Claims;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OrderController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly ILogger<OrderController> _logger;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ITranslationService _translationService;
    private readonly IGoogleMapsService _googleMapsService;

    public OrderController(
        AppDbContext context,
        ILogger<OrderController> logger,
        IEmailService emailService,
        IConfiguration configuration,
        ITranslationService translationService,
        IGoogleMapsService googleMapsService)
    {
        _context = context;
        _logger = logger;
        _emailService = emailService;
        _configuration = configuration;
        _translationService = translationService;
        _googleMapsService = googleMapsService;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    // GET: api/order
    [Authorize]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderResponse>>> GetOrders()
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            _logger.LogInformation("GetOrders called - UserId: {UserId}, UserRole: {UserRole}", userId, userRole);

            var query = _context.CustomerOrders
                .Include(o => o.Customer)
                    .ThenInclude(c => c.AppUser)
                .Include(o => o.ShippingAddress)
                .Include(o => o.OrderItems)
                .AsQueryable();

            var totalBeforeFilter = await _context.CustomerOrders.CountAsync();
            _logger.LogInformation("Total orders in database before filtering: {Count}", totalBeforeFilter);

            // Customers can only see their own orders (match by app_user_id through customer)
            if (userRole == "2")
            {
                query = query.Where(o => o.Customer.AppUserId == userId);
                _logger.LogInformation("Filtering by Customer.AppUserId: {UserId}", userId);
            }

            query = Helpers.QueryFilterHelper.ApplyQueryFilters(query, Request.Query);

            var orders = await ExecuteLimitedQueryAsync(query.OrderByDescending(o => o.OrderDate));
            
            _logger.LogInformation("Orders returned after filtering: {Count}", orders.Count);

            var response = orders.Select(o => MapToOrderResponse(o)).ToList();
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving orders");
            return InternalServerErrorWithError(_translationService.Translate("ApiMessages", "ERROR_RETRIEVING_ORDERS"));
        }
    }

    // GET: api/order/{id}
    [Authorize]
    [HttpGet("{id}")]
    public async Task<ActionResult<OrderResponse>> GetOrder(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var order = await _context.CustomerOrders
                .Include(o => o.Customer)
                    .ThenInclude(c => c.AppUser)
                .Include(o => o.ShippingAddress)
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFoundWithError(_translationService.Translate("ApiMessages", "ORDER_NOT_FOUND"));
            }

            // Customers can only see their own orders (match by app_user_id through customer)
            if (userRole == "2" && order.Customer.AppUserId != userId)
            {
                return NotFoundWithError(_translationService.Translate("ApiMessages", "ORDER_NOT_FOUND"));
            }

            return Ok(MapToOrderResponse(order));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving order {OrderId}", id);
            return InternalServerErrorWithError(_translationService.Translate("ApiMessages", "ERROR_RETRIEVING_ORDER"));
        }
    }

    // POST: api/order
    [Authorize(Roles = "2")]
    [HttpPost]
    public async Task<ActionResult<OrderResponse>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();

            if (request.Items == null || !request.Items.Any())
            {
                return BadRequestWithErrors(_translationService.Translate("ApiMessages", "ORDER_MUST_CONTAIN_ITEMS"));
            }

            // Find the customer record for this user
            var customer = await _context.Customers
                .Include(c => c.AppUser)
                .Include(c => c.Address)
                .FirstOrDefaultAsync(c => c.AppUserId == userId);

            if (customer == null)
            {
                return BadRequestWithErrors(_translationService.Translate("ApiMessages", "CUSTOMER_NOT_FOUND"));
            }

            // Determine shipping address
            Address shippingAddress;
            
            if (request.UseCustomerAddress)
            {
                // Use customer's current address - create a copy for the order
                if (customer.Address == null)
                {
                    return BadRequestWithErrors(_translationService.Translate("ApiMessages", "CUSTOMER_HAS_NO_ADDRESS"));
                }
                
                // Create a copy of the customer's address for this order
                shippingAddress = new Address
                {
                    AddressLine = customer.Address.AddressLine,
                    GooglePlaceId = customer.Address.GooglePlaceId,
                    FormattedAddress = customer.Address.FormattedAddress,
                    Country = customer.Address.Country,
                    CountryCode = customer.Address.CountryCode,
                    State = customer.Address.State,
                    StateCode = customer.Address.StateCode,
                    City = customer.Address.City,
                    PostalCode = customer.Address.PostalCode,
                    StreetNumber = customer.Address.StreetNumber,
                    Route = customer.Address.Route,
                    IsValidated = customer.Address.IsValidated,
                    CreatedBy = userId
                };
            }
            else
            {
                // Use provided shipping address
                if (string.IsNullOrWhiteSpace(request.ShippingAddress))
                {
                    return BadRequestWithErrors(_translationService.Translate("ApiMessages", "SHIPPING_ADDRESS_REQUIRED"));
                }
                
                // Validate and create new address
                shippingAddress = new Address
                {
                    AddressLine = request.ShippingAddress,
                    CreatedBy = userId
                };
                
                // Try to validate the address
                var validationResult = await _googleMapsService.ValidateAddressAsync(request.ShippingAddress);
                if (validationResult.IsValid)
                {
                    shippingAddress.GooglePlaceId = validationResult.PlaceId;
                    shippingAddress.FormattedAddress = validationResult.FormattedAddress;
                    shippingAddress.IsValidated = true;
                    
                    if (validationResult.AddressComponents != null)
                    {
                        shippingAddress.Country = GetAddressComponent(validationResult.AddressComponents, "country");
                        shippingAddress.CountryCode = GetAddressComponentShort(validationResult.AddressComponents, "country");
                        shippingAddress.State = GetAddressComponent(validationResult.AddressComponents, "administrative_area_level_1");
                        shippingAddress.StateCode = GetAddressComponentShort(validationResult.AddressComponents, "administrative_area_level_1");
                        shippingAddress.City = GetAddressComponent(validationResult.AddressComponents, "locality");
                        shippingAddress.PostalCode = GetAddressComponent(validationResult.AddressComponents, "postal_code");
                        shippingAddress.StreetNumber = GetAddressComponent(validationResult.AddressComponents, "street_number");
                        shippingAddress.Route = GetAddressComponent(validationResult.AddressComponents, "route");
                    }
                }
            }
            
            // Save the shipping address first
            _context.Addresses.Add(shippingAddress);
            await _context.SaveChangesAsync();

            // Validate products and calculate totals
            var productIds = request.Items.Select(i => i.ProductId).ToList();
            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id) && p.IsActive == true)
                .ToListAsync();

            if (products.Count != productIds.Distinct().Count())
            {
                return BadRequestWithErrors(_translationService.Translate("ApiMessages", "PRODUCTS_NOT_AVAILABLE"));
            }

            // Generate order number
            var orderNumber = GenerateOrderNumber();

            decimal subtotal = 0;
            decimal totalTax = 0;
            var orderItems = new List<OrderItem>();

            foreach (var item in request.Items)
            {
                var product = products.First(p => p.Id == item.ProductId);
                
                if (item.Quantity <= 0)
                {
                    return BadRequestWithErrors($"Invalid quantity for product {product.Name}");
                }

                var lineSubtotal = product.Price * item.Quantity;
                var lineTax = lineSubtotal * (product.TaxRate / 100);
                var lineTotal = lineSubtotal + lineTax;

                orderItems.Add(new OrderItem
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    ProductSku = product.Sku,
                    Quantity = item.Quantity,
                    UnitPrice = product.Price,
                    TaxRate = product.TaxRate,
                    TaxAmount = lineTax,
                    LineTotal = lineTotal
                });

                subtotal += lineSubtotal;
                totalTax += lineTax;
            }

            var order = new CustomerOrder
            {
                OrderNumber = orderNumber,
                CustomerId = customer.Id,
                Status = 0, // Pending
                ShippingAddressId = shippingAddress.Id,
                Subtotal = subtotal,
                TaxAmount = totalTax,
                TotalAmount = subtotal + totalTax,
                Notes = request.Notes,
                OrderDate = DateTime.UtcNow,
                CreatedBy = userId,
                OrderItems = orderItems
            };

            _context.CustomerOrders.Add(order);
            await _context.SaveChangesAsync();

            // Send order confirmation email
            try
            {
                await _emailService.SendOrderConfirmationEmailAsync(
                    customer.AppUser.Email,
                    customer.AppUser.FullName ?? customer.AppUser.Email,
                    order,
                    orderItems);
            }
            catch (Exception emailEx)
            {
                _logger.LogError(emailEx, "Failed to send order confirmation email for order {OrderNumber}", orderNumber);
            }

            // Reload with navigation properties
            var createdOrder = await _context.CustomerOrders
                .Include(o => o.Customer)
                    .ThenInclude(c => c.AppUser)
                .Include(o => o.ShippingAddress)
                .Include(o => o.OrderItems)
                .FirstAsync(o => o.Id == order.Id);

            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, MapToOrderResponse(createdOrder));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order");
            return InternalServerErrorWithError(_translationService.Translate("ApiMessages", "ERROR_CREATING_ORDER"));
        }
    }

    private string? GetAddressComponent(Dictionary<string, object> components, string type)
    {
        if (components.TryGetValue(type, out var value))
        {
            if (value is string strValue)
            {
                return strValue;
            }
            if (value is System.Text.Json.JsonElement jsonElement)
            {
                if (jsonElement.ValueKind == System.Text.Json.JsonValueKind.String)
                {
                    return jsonElement.GetString();
                }
                if (jsonElement.ValueKind == System.Text.Json.JsonValueKind.Object)
                {
                    if (jsonElement.TryGetProperty("long_name", out var longName))
                    {
                        return longName.GetString();
                    }
                }
            }
            var valueType = value.GetType();
            var longNameProp = valueType.GetProperty("long_name");
            if (longNameProp != null)
            {
                return longNameProp.GetValue(value)?.ToString();
            }
        }
        return null;
    }

    private string? GetAddressComponentShort(Dictionary<string, object> components, string type)
    {
        if (components.TryGetValue(type, out var value))
        {
            if (value is System.Text.Json.JsonElement jsonElement)
            {
                if (jsonElement.ValueKind == System.Text.Json.JsonValueKind.Object)
                {
                    if (jsonElement.TryGetProperty("short_name", out var shortName))
                    {
                        return shortName.GetString();
                    }
                }
            }
            var valueType = value.GetType();
            var shortNameProp = valueType.GetProperty("short_name");
            if (shortNameProp != null)
            {
                return shortNameProp.GetValue(value)?.ToString();
            }
        }
        return null;
    }

    // PUT: api/order/{id}/status
    [Authorize(Roles = "0,1")]
    [HttpPut("{id}/status")]
    public async Task<ActionResult<OrderResponse>> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();

            var order = await _context.CustomerOrders
                .Include(o => o.Customer)
                    .ThenInclude(c => c.AppUser)
                .Include(o => o.ShippingAddress)
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFoundWithError(_translationService.Translate("ApiMessages", "ORDER_NOT_FOUND"));
            }

            if (request.Status < 0 || request.Status > OrderStatus.OnHold)
            {
                return BadRequestWithErrors(_translationService.Translate("ApiMessages", "INVALID_ORDER_STATUS"));
            }

            order.Status = request.Status;
            order.UpdatedBy = userId;

            // Update status timestamps
            switch (request.Status)
            {
                case OrderStatus.Confirmed:
                    order.ConfirmedAt = DateTime.UtcNow;
                    break;
                case OrderStatus.Shipped:
                    order.ShippedAt = DateTime.UtcNow;
                    break;
                case OrderStatus.Completed:
                    order.DeliveredAt = DateTime.UtcNow;
                    break;
                case OrderStatus.Cancelled:
                    order.CancelledAt = DateTime.UtcNow;
                    break;
            }

            await _context.SaveChangesAsync();

            // Send shipping notification email when status changes to Shipped
            if (request.Status == OrderStatus.Shipped && order.Customer?.AppUser != null)
            {
                try
                {
                    await _emailService.SendOrderShippedEmailAsync(
                        order.Customer.AppUser.Email,
                        order.Customer.AppUser.FullName ?? order.Customer.AppUser.Email,
                        order,
                        order.OrderItems.ToList(),
                        request.ShippingDetails ?? "");
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, "Failed to send shipping notification email for order {OrderNumber}", order.OrderNumber);
                }
            }

            return Ok(MapToOrderResponse(order));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating order status for order {OrderId}", id);
            return InternalServerErrorWithError(_translationService.Translate("ApiMessages", "ERROR_UPDATING_ORDER_STATUS"));
        }
    }

    // GET: api/order/stats
    [Authorize(Roles = "0,1")]
    [HttpGet("stats")]
    public async Task<ActionResult<OrderStatsResponse>> GetOrderStats()
    {
        try
        {
            var totalOrders = await _context.CustomerOrders.CountAsync();
            var pendingOrders = await _context.CustomerOrders.CountAsync(o => o.Status == OrderStatus.PendingPayment);
            var paidOrders = await _context.CustomerOrders.CountAsync(o => o.Status == OrderStatus.Paid);
            var confirmedOrders = await _context.CustomerOrders.CountAsync(o => o.Status == OrderStatus.Confirmed);
            var processingOrders = await _context.CustomerOrders.CountAsync(o => o.Status == OrderStatus.Processing);
            var shippedOrders = await _context.CustomerOrders.CountAsync(o => o.Status == OrderStatus.Shipped);
            var completedOrders = await _context.CustomerOrders.CountAsync(o => o.Status == OrderStatus.Completed);
            var cancelledOrders = await _context.CustomerOrders.CountAsync(o => o.Status == OrderStatus.Cancelled);
            var onHoldOrders = await _context.CustomerOrders.CountAsync(o => o.Status == OrderStatus.OnHold);

            var pendingRevenue = await _context.CustomerOrders
                .Where(o => o.Status == OrderStatus.PendingPayment)
                .SumAsync(o => o.TotalAmount);
            var paidRevenue = await _context.CustomerOrders
                .Where(o => o.Status == OrderStatus.Paid)
                .SumAsync(o => o.TotalAmount);
            var confirmedRevenue = await _context.CustomerOrders
                .Where(o => o.Status == OrderStatus.Confirmed)
                .SumAsync(o => o.TotalAmount);
            var processingRevenue = await _context.CustomerOrders
                .Where(o => o.Status == OrderStatus.Processing)
                .SumAsync(o => o.TotalAmount);
            var shippedRevenue = await _context.CustomerOrders
                .Where(o => o.Status == OrderStatus.Shipped)
                .SumAsync(o => o.TotalAmount);
            var completedRevenue = await _context.CustomerOrders
                .Where(o => o.Status == OrderStatus.Completed)
                .SumAsync(o => o.TotalAmount);
            var cancelledRevenue = await _context.CustomerOrders
                .Where(o => o.Status == OrderStatus.Cancelled)
                .SumAsync(o => o.TotalAmount);
            var onHoldRevenue = await _context.CustomerOrders
                .Where(o => o.Status == OrderStatus.OnHold)
                .SumAsync(o => o.TotalAmount);

            return Ok(new OrderStatsResponse
            {
                TotalOrders = totalOrders,
                PendingOrders = pendingOrders,
                PaidOrders = paidOrders,
                ConfirmedOrders = confirmedOrders,
                ProcessingOrders = processingOrders,
                ShippedOrders = shippedOrders,
                CompletedOrders = completedOrders,
                CancelledOrders = cancelledOrders,
                OnHoldOrders = onHoldOrders,
                TotalRevenue = completedRevenue, // Only completed orders contribute to total revenue
                PendingRevenue = pendingRevenue,
                PaidRevenue = paidRevenue,
                ConfirmedRevenue = confirmedRevenue,
                ProcessingRevenue = processingRevenue,
                ShippedRevenue = shippedRevenue,
                CompletedRevenue = completedRevenue,
                CancelledRevenue = cancelledRevenue,
                OnHoldRevenue = onHoldRevenue
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving order stats");
            return InternalServerErrorWithError(_translationService.Translate("ApiMessages", "ERROR_RETRIEVING_ORDER_STATS"));
        }
    }

    private string GenerateOrderNumber()
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var random = new Random().Next(1000, 9999);
        return $"ORD-{timestamp}-{random}";
    }

    private OrderResponse MapToOrderResponse(CustomerOrder order)
    {
        return new OrderResponse
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            CustomerId = order.CustomerId,
            CustomerEmail = order.Customer?.AppUser?.Email ?? "",
            CustomerName = order.Customer?.AppUser?.FullName ?? order.Customer?.AppUser?.Email ?? "",
            Status = order.Status,
            StatusName = GetStatusName(order.Status),
            PaymentStatus = order.PaymentStatus,
            PaymentStatusName = GetPaymentStatusName(order.PaymentStatus),
            ShippingAddress = order.ShippingAddress != null ? new AddressResponse
            {
                Id = order.ShippingAddress.Id,
                AddressLine = order.ShippingAddress.AddressLine,
                FormattedAddress = order.ShippingAddress.FormattedAddress,
                GooglePlaceId = order.ShippingAddress.GooglePlaceId,
                Country = order.ShippingAddress.Country,
                CountryCode = order.ShippingAddress.CountryCode,
                State = order.ShippingAddress.State,
                StateCode = order.ShippingAddress.StateCode,
                City = order.ShippingAddress.City,
                PostalCode = order.ShippingAddress.PostalCode,
                StreetNumber = order.ShippingAddress.StreetNumber,
                Route = order.ShippingAddress.Route,
                IsValidated = order.ShippingAddress.IsValidated
            } : null,
            Subtotal = order.Subtotal,
            TaxAmount = order.TaxAmount,
            TotalAmount = order.TotalAmount,
            Notes = order.Notes,
            PaidAt = order.PaidAt,
            OrderDate = order.OrderDate,
            ConfirmedAt = order.ConfirmedAt,
            ShippedAt = order.ShippedAt,
            DeliveredAt = order.DeliveredAt,
            CancelledAt = order.CancelledAt,
            Items = order.OrderItems?.Select(i => new OrderItemResponse
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                ProductSku = i.ProductSku,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TaxRate = i.TaxRate,
                TaxAmount = i.TaxAmount,
                LineTotal = i.LineTotal
            }).ToList() ?? new List<OrderItemResponse>()
        };
    }

    private string GetStatusName(int status)
    {
        var key = OrderStatus.GetName(status);
        return _translationService.Translate("OrderStatus", key);
    }

    private string GetPaymentStatusName(int paymentStatus)
    {
        var key = PaymentStatus.GetName(paymentStatus);
        return _translationService.Translate("PaymentStatus", key);
    }
}

// DTOs
public record CreateOrderRequest
{
    public List<CreateOrderItemRequest> Items { get; init; } = new();
    public string? ShippingAddress { get; init; }
    public string? Notes { get; init; }
    public string? GooglePlaceId { get; init; }
    public bool UseCustomerAddress { get; init; }
}

public record CreateOrderItemRequest
{
    public int ProductId { get; init; }
    public int Quantity { get; init; }
}

public record UpdateOrderStatusRequest
{
    public int Status { get; init; }
    public string? ShippingDetails { get; init; }
}

public record AddressResponse
{
    public int Id { get; init; }
    public string AddressLine { get; init; } = string.Empty;
    public string? FormattedAddress { get; init; }
    public string? GooglePlaceId { get; init; }
    public string? Country { get; init; }
    public string? CountryCode { get; init; }
    public string? State { get; init; }
    public string? StateCode { get; init; }
    public string? City { get; init; }
    public string? PostalCode { get; init; }
    public string? StreetNumber { get; init; }
    public string? Route { get; init; }
    public bool IsValidated { get; init; }
}

public record OrderResponse
{
    public int Id { get; init; }
    public string OrderNumber { get; init; } = string.Empty;
    public int CustomerId { get; init; }
    public string CustomerEmail { get; init; } = string.Empty;
    public string CustomerName { get; init; } = string.Empty;
    public int Status { get; init; }
    public string StatusName { get; init; } = string.Empty;
    public int PaymentStatus { get; init; }
    public string PaymentStatusName { get; init; } = string.Empty;
    public AddressResponse? ShippingAddress { get; init; }
    public decimal Subtotal { get; init; }
    public decimal TaxAmount { get; init; }
    public decimal TotalAmount { get; init; }
    public string? Notes { get; init; }
    public DateTime? PaidAt { get; init; }
    public DateTime OrderDate { get; init; }
    public DateTime? ConfirmedAt { get; init; }
    public DateTime? ShippedAt { get; init; }
    public DateTime? DeliveredAt { get; init; }
    public DateTime? CancelledAt { get; init; }
    public List<OrderItemResponse> Items { get; init; } = new();
}

public record OrderItemResponse
{
    public int Id { get; init; }
    public int ProductId { get; init; }
    public string ProductName { get; init; } = string.Empty;
    public string ProductSku { get; init; } = string.Empty;
    public int Quantity { get; init; }
    public decimal UnitPrice { get; init; }
    public decimal TaxRate { get; init; }
    public decimal TaxAmount { get; init; }
    public decimal LineTotal { get; init; }
}

public record OrderStatsResponse
{
    public int TotalOrders { get; init; }
    public int PendingOrders { get; init; }
    public int PaidOrders { get; init; }
    public int ConfirmedOrders { get; init; }
    public int ProcessingOrders { get; init; }
    public int ShippedOrders { get; init; }
    public int CompletedOrders { get; init; }
    public int CancelledOrders { get; init; }
    public int OnHoldOrders { get; init; }
    public decimal TotalRevenue { get; init; }
    public decimal PendingRevenue { get; init; }
    public decimal PaidRevenue { get; init; }
    public decimal ConfirmedRevenue { get; init; }
    public decimal ProcessingRevenue { get; init; }
    public decimal ShippedRevenue { get; init; }
    public decimal CompletedRevenue { get; init; }
    public decimal CancelledRevenue { get; init; }
    public decimal OnHoldRevenue { get; init; }
}
