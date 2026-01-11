using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Services;
using System.Security.Claims;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "0,1")]
public class CustomerController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly ILogger<CustomerController> _logger;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ITranslationService _translationService;
    private readonly IGoogleMapsService _googleMapsService;

    public CustomerController(
        AppDbContext context,
        ILogger<CustomerController> logger,
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

    private string GetStatusName(int status)
    {
        return status switch
        {
            0 => _translationService.Translate("Customers", "PENDING_CONFIRMATION"),
            1 => _translationService.Translate("Customers", "ACTIVE"),
            2 => _translationService.Translate("Customers", "INACTIVE"),
            _ => _translationService.Translate("Common", "UNKNOWN")
        };
    }

    private string GetCallTypeName(int callType)
    {
        return callType switch
        {
            0 => _translationService.Translate("Customers", "CALL_TYPE_INBOUND"),
            1 => _translationService.Translate("Customers", "CALL_TYPE_OUTBOUND"),
            2 => _translationService.Translate("Customers", "CALL_TYPE_MISSED"),
            _ => _translationService.Translate("Common", "UNKNOWN")
        };
    }

    // GET: api/customer
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CustomerResponse>>> GetCustomers()
    {
        try
        {
            var query = _context.Customers
                .Include(c => c.AppUser)
                .Include(c => c.Address)
                .OrderByDescending(c => c.CreatedAt)
                .AsQueryable();

            query = Helpers.QueryFilterHelper.ApplyQueryFilters(query, Request.Query);

            var customers = await ExecuteLimitedQueryAsync(query);

            var userIds = customers
                .SelectMany(c => new[] { c.CreatedBy, c.UpdatedBy })
                .Where(id => id.HasValue || id != 0)
                .Select(id => id ?? 0)
                .Distinct()
                .ToList();

            var userNames = await _context.AppUsers
                .Where(u => userIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.FullName ?? u.Email);

            var response = customers.Select(c => new CustomerResponse
            {
                Id = c.Id,
                AppUserId = c.AppUserId,
                Email = c.AppUser.Email,
                FullName = c.AppUser.FullName,
                Phone = c.Phone,
                Address = c.Address != null ? new CustomerAddressResponse
                {
                    Id = c.Address.Id,
                    AddressLine = c.Address.AddressLine,
                    FormattedAddress = c.Address.FormattedAddress,
                    GooglePlaceId = c.Address.GooglePlaceId,
                    Country = c.Address.Country,
                    CountryCode = c.Address.CountryCode,
                    State = c.Address.State,
                    StateCode = c.Address.StateCode,
                    City = c.Address.City,
                    PostalCode = c.Address.PostalCode,
                    StreetNumber = c.Address.StreetNumber,
                    Route = c.Address.Route,
                    IsValidated = c.Address.IsValidated
                } : null,
                Status = c.AppUser.Status,
                StatusName = GetStatusName(c.AppUser.Status),
                EmailConfirmedAt = c.AppUser.EmailConfirmedAt,
                CreatedAt = c.CreatedAt,
                CreatedBy = c.CreatedBy,
                CreatedByName = userNames.GetValueOrDefault(c.CreatedBy),
                UpdatedAt = c.UpdatedAt,
                UpdatedBy = c.UpdatedBy,
                UpdatedByName = c.UpdatedBy.HasValue ? userNames.GetValueOrDefault(c.UpdatedBy.Value) : null,
                OrderCount = c.Orders.Count,
                PhoneCallCount = c.PhoneCalls.Count
            });

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving customers");
            return InternalServerErrorWithError(_translationService.Translate("Customers", "ERROR_RETRIEVING_CUSTOMERS"));
        }
    }

    // GET: api/customer/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<CustomerResponse>> GetCustomer(int id)
    {
        try
        {
            var customer = await _context.Customers
                .Include(c => c.AppUser)
                .Include(c => c.Address)
                .Include(c => c.Orders)
                .Include(c => c.PhoneCalls)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return NotFoundWithError(_translationService.Translate("Customers", "CUSTOMER_NOT_FOUND"));
            }

            var createdByName = await _context.AppUsers
                .Where(u => u.Id == customer.CreatedBy)
                .Select(u => u.FullName ?? u.Email)
                .FirstOrDefaultAsync();

            var updatedByName = customer.UpdatedBy.HasValue
                ? await _context.AppUsers
                    .Where(u => u.Id == customer.UpdatedBy.Value)
                    .Select(u => u.FullName ?? u.Email)
                    .FirstOrDefaultAsync()
                : null;

            return Ok(new CustomerResponse
            {
                Id = customer.Id,
                AppUserId = customer.AppUserId,
                Email = customer.AppUser.Email,
                FullName = customer.AppUser.FullName,
                Phone = customer.Phone,
                Address = customer.Address != null ? new CustomerAddressResponse
                {
                    Id = customer.Address.Id,
                    AddressLine = customer.Address.AddressLine,
                    FormattedAddress = customer.Address.FormattedAddress,
                    GooglePlaceId = customer.Address.GooglePlaceId,
                    Country = customer.Address.Country,
                    CountryCode = customer.Address.CountryCode,
                    State = customer.Address.State,
                    StateCode = customer.Address.StateCode,
                    City = customer.Address.City,
                    PostalCode = customer.Address.PostalCode,
                    StreetNumber = customer.Address.StreetNumber,
                    Route = customer.Address.Route,
                    IsValidated = customer.Address.IsValidated
                } : null,
                Status = customer.AppUser.Status,
                StatusName = GetStatusName(customer.AppUser.Status),
                EmailConfirmedAt = customer.AppUser.EmailConfirmedAt,
                CreatedAt = customer.CreatedAt,
                CreatedBy = customer.CreatedBy,
                CreatedByName = createdByName,
                UpdatedAt = customer.UpdatedAt,
                UpdatedBy = customer.UpdatedBy,
                UpdatedByName = updatedByName,
                OrderCount = customer.Orders.Count,
                PhoneCallCount = customer.PhoneCalls.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving customer {Id}", id);
            return InternalServerErrorWithError(_translationService.Translate("Customers", "ERROR_RETRIEVING_CUSTOMER"));
        }
    }

    // POST: api/customer
    [HttpPost]
    public async Task<ActionResult<CustomerResponse>> CreateCustomer(CreateCustomerRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.FullName))
            {
                return BadRequestWithErrors(_translationService.Translate("Customers", "FULL_NAME_REQUIRED"));
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequestWithErrors(_translationService.Translate("Customers", "EMAIL_REQUIRED"));
            }

            if (await _context.AppUsers.AnyAsync(u => u.Email == request.Email))
            {
                return ConflictWithError(_translationService.Translate("Common", "EMAIL_ALREADY_EXISTS"));
            }

            var currentUserId = GetCurrentUserId();

            // Create address if provided
            Address? customerAddress = null;
            if (!string.IsNullOrWhiteSpace(request.Address))
            {
                customerAddress = new Address
                {
                    AddressLine = request.Address,
                    CreatedBy = currentUserId
                };

                if (!request.BypassAddressValidation)
                {
                    var validationResult = await _googleMapsService.ValidateAddressAsync(request.Address);
                    if (validationResult.IsValid)
                    {
                        customerAddress.GooglePlaceId = validationResult.PlaceId;
                        customerAddress.FormattedAddress = validationResult.FormattedAddress;
                        customerAddress.IsValidated = true;

                        if (validationResult.AddressComponents != null)
                        {
                            customerAddress.Country = GetAddressComponent(validationResult.AddressComponents, "country");
                            customerAddress.CountryCode = GetAddressComponentShort(validationResult.AddressComponents, "country");
                            customerAddress.State = GetAddressComponent(validationResult.AddressComponents, "administrative_area_level_1");
                            customerAddress.StateCode = GetAddressComponentShort(validationResult.AddressComponents, "administrative_area_level_1");
                            customerAddress.City = GetAddressComponent(validationResult.AddressComponents, "locality");
                            customerAddress.PostalCode = GetAddressComponent(validationResult.AddressComponents, "postal_code");
                            customerAddress.StreetNumber = GetAddressComponent(validationResult.AddressComponents, "street_number");
                            customerAddress.Route = GetAddressComponent(validationResult.AddressComponents, "route");
                        }
                    }
                    else
                    {
                        return BadRequestWithErrors(validationResult.ErrorMessage ?? _translationService.Translate("Customers", "ADDRESS_VALIDATION_FAILED"));
                    }
                }

                _context.Addresses.Add(customerAddress);
                await _context.SaveChangesAsync();
            }

            // Generate a random temporary password
            var tempPassword = Guid.NewGuid().ToString("N").Substring(0, 16);
            var confirmationToken = Guid.NewGuid().ToString("N");
            var tokenExpiry = DateTime.UtcNow.AddHours(72);

            // Create app_user with customer type (2)
            var appUser = new AppUser
            {
                Email = request.Email,
                FullName = request.FullName,
                Password = BCrypt.Net.BCrypt.HashPassword(tempPassword),
                UserType = 2, // Customer
                Status = 0, // pending_confirmation
                ConfirmationToken = confirmationToken,
                ConfirmationTokenExpiresAt = tokenExpiry,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = currentUserId,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = currentUserId
            };

            _context.AppUsers.Add(appUser);
            await _context.SaveChangesAsync();

            // Create customer record
            var customer = new Customer
            {
                AppUserId = appUser.Id,
                Phone = request.Phone,
                AddressId = customerAddress?.Id,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = currentUserId,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = currentUserId
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // Send password setup email (reusing reset-password flow)
            try
            {
                var setupUrl = $"{_configuration["BaseUrl"]}/reset-password/{confirmationToken}";
                await _emailService.SendCustomerWelcomeEmailAsync(appUser.Email, appUser.FullName ?? "", setupUrl);
            }
            catch (Exception emailEx)
            {
                _logger.LogError(emailEx, "Failed to send welcome email to customer {Email}", appUser.Email);
            }

            var createdByName = await _context.AppUsers
                .Where(u => u.Id == currentUserId)
                .Select(u => u.FullName ?? u.Email)
                .FirstOrDefaultAsync();

            return Created($"/api/customer/{customer.Id}", new CustomerResponse
            {
                Id = customer.Id,
                AppUserId = customer.AppUserId,
                Email = appUser.Email,
                FullName = appUser.FullName,
                Phone = customer.Phone,
                Address = customerAddress != null ? new CustomerAddressResponse
                {
                    Id = customerAddress.Id,
                    AddressLine = customerAddress.AddressLine,
                    FormattedAddress = customerAddress.FormattedAddress,
                    GooglePlaceId = customerAddress.GooglePlaceId,
                    Country = customerAddress.Country,
                    CountryCode = customerAddress.CountryCode,
                    State = customerAddress.State,
                    StateCode = customerAddress.StateCode,
                    City = customerAddress.City,
                    PostalCode = customerAddress.PostalCode,
                    StreetNumber = customerAddress.StreetNumber,
                    Route = customerAddress.Route,
                    IsValidated = customerAddress.IsValidated
                } : null,
                Status = appUser.Status,
                StatusName = GetStatusName(appUser.Status),
                EmailConfirmedAt = appUser.EmailConfirmedAt,
                CreatedAt = customer.CreatedAt,
                CreatedBy = customer.CreatedBy,
                CreatedByName = createdByName,
                UpdatedAt = customer.UpdatedAt,
                UpdatedBy = customer.UpdatedBy,
                UpdatedByName = createdByName,
                OrderCount = 0,
                PhoneCallCount = 0
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating customer");
            return InternalServerErrorWithError(_translationService.Translate("Customers", "ERROR_CREATING_CUSTOMER"));
        }
    }

    // PUT: api/customer/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult<CustomerResponse>> UpdateCustomer(int id, UpdateCustomerRequest request)
    {
        try
        {
            var customer = await _context.Customers
                .Include(c => c.AppUser)
                .Include(c => c.Address)
                .Include(c => c.Orders)
                .Include(c => c.PhoneCalls)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return NotFoundWithError(_translationService.Translate("Customers", "CUSTOMER_NOT_FOUND"));
            }

            var currentUserId = GetCurrentUserId();

            // Update app_user fields
            if (!string.IsNullOrWhiteSpace(request.FullName))
            {
                customer.AppUser.FullName = request.FullName;
            }

            if (request.Status.HasValue)
            {
                customer.AppUser.Status = request.Status.Value;
            }

            customer.AppUser.UpdatedAt = DateTime.UtcNow;
            customer.AppUser.UpdatedBy = currentUserId;

            // Update customer fields
            customer.Phone = request.Phone;

            // Handle address update
            var currentAddressLine = customer.Address?.AddressLine;
            if (request.Address != currentAddressLine)
            {
                if (!string.IsNullOrWhiteSpace(request.Address))
                {
                    // Create or update address
                    var newAddress = new Address
                    {
                        AddressLine = request.Address,
                        CreatedBy = currentUserId
                    };

                    if (!request.BypassAddressValidation)
                    {
                        var validationResult = await _googleMapsService.ValidateAddressAsync(request.Address);
                        if (validationResult.IsValid)
                        {
                            newAddress.GooglePlaceId = validationResult.PlaceId;
                            newAddress.FormattedAddress = validationResult.FormattedAddress;
                            newAddress.IsValidated = true;

                            if (validationResult.AddressComponents != null)
                            {
                                newAddress.Country = GetAddressComponent(validationResult.AddressComponents, "country");
                                newAddress.CountryCode = GetAddressComponentShort(validationResult.AddressComponents, "country");
                                newAddress.State = GetAddressComponent(validationResult.AddressComponents, "administrative_area_level_1");
                                newAddress.StateCode = GetAddressComponentShort(validationResult.AddressComponents, "administrative_area_level_1");
                                newAddress.City = GetAddressComponent(validationResult.AddressComponents, "locality");
                                newAddress.PostalCode = GetAddressComponent(validationResult.AddressComponents, "postal_code");
                                newAddress.StreetNumber = GetAddressComponent(validationResult.AddressComponents, "street_number");
                                newAddress.Route = GetAddressComponent(validationResult.AddressComponents, "route");
                            }
                        }
                        else
                        {
                            return BadRequestWithErrors(validationResult.ErrorMessage ?? _translationService.Translate("Customers", "ADDRESS_VALIDATION_FAILED"));
                        }
                    }

                    _context.Addresses.Add(newAddress);
                    await _context.SaveChangesAsync();
                    customer.AddressId = newAddress.Id;
                }
                else
                {
                    // Clear address
                    customer.AddressId = null;
                }
            }

            customer.UpdatedAt = DateTime.UtcNow;
            customer.UpdatedBy = currentUserId;

            await _context.SaveChangesAsync();

            // Reload address
            await _context.Entry(customer).Reference(c => c.Address).LoadAsync();

            var createdByName = await _context.AppUsers
                .Where(u => u.Id == customer.CreatedBy)
                .Select(u => u.FullName ?? u.Email)
                .FirstOrDefaultAsync();

            var updatedByName = await _context.AppUsers
                .Where(u => u.Id == currentUserId)
                .Select(u => u.FullName ?? u.Email)
                .FirstOrDefaultAsync();

            return Ok(new CustomerResponse
            {
                Id = customer.Id,
                AppUserId = customer.AppUserId,
                Email = customer.AppUser.Email,
                FullName = customer.AppUser.FullName,
                Phone = customer.Phone,
                Address = customer.Address != null ? new CustomerAddressResponse
                {
                    Id = customer.Address.Id,
                    AddressLine = customer.Address.AddressLine,
                    FormattedAddress = customer.Address.FormattedAddress,
                    GooglePlaceId = customer.Address.GooglePlaceId,
                    Country = customer.Address.Country,
                    CountryCode = customer.Address.CountryCode,
                    State = customer.Address.State,
                    StateCode = customer.Address.StateCode,
                    City = customer.Address.City,
                    PostalCode = customer.Address.PostalCode,
                    StreetNumber = customer.Address.StreetNumber,
                    Route = customer.Address.Route,
                    IsValidated = customer.Address.IsValidated
                } : null,
                Status = customer.AppUser.Status,
                StatusName = GetStatusName(customer.AppUser.Status),
                EmailConfirmedAt = customer.AppUser.EmailConfirmedAt,
                CreatedAt = customer.CreatedAt,
                CreatedBy = customer.CreatedBy,
                CreatedByName = createdByName,
                UpdatedAt = customer.UpdatedAt,
                UpdatedBy = customer.UpdatedBy,
                UpdatedByName = updatedByName,
                OrderCount = customer.Orders?.Count ?? 0,
                PhoneCallCount = customer.PhoneCalls?.Count ?? 0
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating customer {Id}", id);
            return InternalServerErrorWithError(_translationService.Translate("Customers", "ERROR_UPDATING_CUSTOMER"));
        }
    }

    // DELETE: api/customer/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCustomer(int id)
    {
        try
        {
            var customer = await _context.Customers
                .Include(c => c.AppUser)
                .Include(c => c.Orders)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return NotFoundWithError(_translationService.Translate("Customers", "CUSTOMER_NOT_FOUND"));
            }

            if (customer.Orders.Any())
            {
                return BadRequestWithErrors(_translationService.Translate("Customers", "CANNOT_DELETE_CUSTOMER_WITH_ORDERS"));
            }

            // Delete customer (cascade will handle phone calls)
            _context.Customers.Remove(customer);
            
            // Delete associated app_user
            _context.AppUsers.Remove(customer.AppUser);
            
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting customer {Id}", id);
            return InternalServerErrorWithError(_translationService.Translate("Customers", "ERROR_DELETING_CUSTOMER"));
        }
    }

    // POST: api/customer/{id}/resend-welcome
    [HttpPost("{id}/resend-welcome")]
    public async Task<IActionResult> ResendWelcomeEmail(int id)
    {
        try
        {
            var customer = await _context.Customers
                .Include(c => c.AppUser)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return NotFoundWithError(_translationService.Translate("Customers", "CUSTOMER_NOT_FOUND"));
            }

            if (customer.AppUser.Status == 1)
            {
                return BadRequestWithErrors(_translationService.Translate("Customers", "CUSTOMER_ALREADY_ACTIVE"));
            }

            var confirmationToken = Guid.NewGuid().ToString("N");
            var tokenExpiry = DateTime.UtcNow.AddHours(72);

            customer.AppUser.ConfirmationToken = confirmationToken;
            customer.AppUser.ConfirmationTokenExpiresAt = tokenExpiry;
            customer.AppUser.UpdatedAt = DateTime.UtcNow;
            customer.AppUser.UpdatedBy = GetCurrentUserId();

            await _context.SaveChangesAsync();

            try
            {
                var setupUrl = $"{_configuration["BaseUrl"]}/reset-password/{confirmationToken}";
                await _emailService.SendCustomerWelcomeEmailAsync(customer.AppUser.Email, customer.AppUser.FullName ?? "", setupUrl);
            }
            catch (Exception emailEx)
            {
                _logger.LogError(emailEx, "Failed to send welcome email to customer {Email}", customer.AppUser.Email);
                return InternalServerErrorWithError(_translationService.Translate("Customers", "FAILED_SEND_WELCOME_EMAIL"));
            }

            return Ok(new { message = _translationService.Translate("Customers", "WELCOME_EMAIL_SENT") });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resending welcome email to customer {Id}", id);
            return InternalServerErrorWithError(_translationService.Translate("Customers", "ERROR_RESENDING_WELCOME_EMAIL"));
        }
    }

    // GET: api/customer/{id}/orders
    [HttpGet("{id}/orders")]
    public async Task<ActionResult<IEnumerable<CustomerOrderResponse>>> GetCustomerOrders(int id)
    {
        try
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFoundWithError(_translationService.Translate("Customers", "CUSTOMER_NOT_FOUND"));
            }

            var orders = await _context.CustomerOrders
                .Include(o => o.OrderItems)
                .Include(o => o.ShippingAddress)
                .Where(o => o.CustomerId == id)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            var response = orders.Select(o => new CustomerOrderResponse
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                Status = o.Status,
                StatusName = GetOrderStatusName(o.Status),
                PaymentStatus = o.PaymentStatus,
                PaymentStatusName = GetPaymentStatusName(o.PaymentStatus),
                ShippingAddress = o.ShippingAddress?.AddressLine ?? "",
                TotalAmount = o.TotalAmount,
                OrderDate = o.OrderDate,
                ItemCount = o.OrderItems.Count
            });

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving orders for customer {Id}", id);
            return InternalServerErrorWithError(_translationService.Translate("Customers", "ERROR_RETRIEVING_CUSTOMER_ORDERS"));
        }
    }

    // GET: api/customer/{id}/phone-calls
    [HttpGet("{id}/phone-calls")]
    public async Task<ActionResult<IEnumerable<PhoneCallResponse>>> GetCustomerPhoneCalls(int id)
    {
        try
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFoundWithError(_translationService.Translate("Customers", "CUSTOMER_NOT_FOUND"));
            }

            var phoneCalls = await _context.CustomerPhoneCalls
                .Where(pc => pc.CustomerId == id)
                .OrderByDescending(pc => pc.CallDate)
                .ToListAsync();

            var userIds = phoneCalls
                .SelectMany(pc => new[] { pc.CreatedBy, pc.UpdatedBy })
                .Where(uid => uid.HasValue || uid != 0)
                .Select(uid => uid ?? 0)
                .Distinct()
                .ToList();

            var userNames = await _context.AppUsers
                .Where(u => userIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.FullName ?? u.Email);

            var response = phoneCalls.Select(pc => new PhoneCallResponse
            {
                Id = pc.Id,
                CustomerId = pc.CustomerId,
                CallDate = pc.CallDate,
                CallType = pc.CallType,
                CallTypeName = GetCallTypeName(pc.CallType),
                DurationMinutes = pc.DurationMinutes,
                Notes = pc.Notes,
                CreatedAt = pc.CreatedAt,
                CreatedBy = pc.CreatedBy,
                CreatedByName = userNames.GetValueOrDefault(pc.CreatedBy),
                UpdatedAt = pc.UpdatedAt,
                UpdatedBy = pc.UpdatedBy,
                UpdatedByName = pc.UpdatedBy.HasValue ? userNames.GetValueOrDefault(pc.UpdatedBy.Value) : null
            });

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving phone calls for customer {Id}", id);
            return InternalServerErrorWithError(_translationService.Translate("Customers", "ERROR_RETRIEVING_PHONE_CALLS"));
        }
    }

    // POST: api/customer/{id}/phone-calls
    [HttpPost("{id}/phone-calls")]
    public async Task<ActionResult<PhoneCallResponse>> CreatePhoneCall(int id, CreatePhoneCallRequest request)
    {
        try
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFoundWithError(_translationService.Translate("Customers", "CUSTOMER_NOT_FOUND"));
            }

            var currentUserId = GetCurrentUserId();

            var phoneCall = new CustomerPhoneCall
            {
                CustomerId = id,
                CallDate = request.CallDate ?? DateTime.UtcNow,
                CallType = request.CallType,
                DurationMinutes = request.DurationMinutes,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = currentUserId,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = currentUserId
            };

            _context.CustomerPhoneCalls.Add(phoneCall);
            await _context.SaveChangesAsync();

            var createdByName = await _context.AppUsers
                .Where(u => u.Id == currentUserId)
                .Select(u => u.FullName ?? u.Email)
                .FirstOrDefaultAsync();

            return Created($"/api/customer/{id}/phone-calls/{phoneCall.Id}", new PhoneCallResponse
            {
                Id = phoneCall.Id,
                CustomerId = phoneCall.CustomerId,
                CallDate = phoneCall.CallDate,
                CallType = phoneCall.CallType,
                CallTypeName = GetCallTypeName(phoneCall.CallType),
                DurationMinutes = phoneCall.DurationMinutes,
                Notes = phoneCall.Notes,
                CreatedAt = phoneCall.CreatedAt,
                CreatedBy = phoneCall.CreatedBy,
                CreatedByName = createdByName,
                UpdatedAt = phoneCall.UpdatedAt,
                UpdatedBy = phoneCall.UpdatedBy,
                UpdatedByName = createdByName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating phone call for customer {Id}", id);
            return InternalServerErrorWithError(_translationService.Translate("Customers", "ERROR_CREATING_PHONE_CALL"));
        }
    }

    // PUT: api/customer/{customerId}/phone-calls/{callId}
    [HttpPut("{customerId}/phone-calls/{callId}")]
    public async Task<ActionResult<PhoneCallResponse>> UpdatePhoneCall(int customerId, int callId, UpdatePhoneCallRequest request)
    {
        try
        {
            var phoneCall = await _context.CustomerPhoneCalls
                .FirstOrDefaultAsync(pc => pc.Id == callId && pc.CustomerId == customerId);

            if (phoneCall == null)
            {
                return NotFoundWithError(_translationService.Translate("Customers", "PHONE_CALL_NOT_FOUND"));
            }

            var currentUserId = GetCurrentUserId();

            phoneCall.CallDate = request.CallDate ?? phoneCall.CallDate;
            phoneCall.CallType = request.CallType ?? phoneCall.CallType;
            phoneCall.DurationMinutes = request.DurationMinutes;
            phoneCall.Notes = request.Notes;
            phoneCall.UpdatedAt = DateTime.UtcNow;
            phoneCall.UpdatedBy = currentUserId;

            await _context.SaveChangesAsync();

            var createdByName = await _context.AppUsers
                .Where(u => u.Id == phoneCall.CreatedBy)
                .Select(u => u.FullName ?? u.Email)
                .FirstOrDefaultAsync();

            var updatedByName = await _context.AppUsers
                .Where(u => u.Id == currentUserId)
                .Select(u => u.FullName ?? u.Email)
                .FirstOrDefaultAsync();

            return Ok(new PhoneCallResponse
            {
                Id = phoneCall.Id,
                CustomerId = phoneCall.CustomerId,
                CallDate = phoneCall.CallDate,
                CallType = phoneCall.CallType,
                CallTypeName = GetCallTypeName(phoneCall.CallType),
                DurationMinutes = phoneCall.DurationMinutes,
                Notes = phoneCall.Notes,
                CreatedAt = phoneCall.CreatedAt,
                CreatedBy = phoneCall.CreatedBy,
                CreatedByName = createdByName,
                UpdatedAt = phoneCall.UpdatedAt,
                UpdatedBy = phoneCall.UpdatedBy,
                UpdatedByName = updatedByName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating phone call {CallId} for customer {CustomerId}", callId, customerId);
            return InternalServerErrorWithError(_translationService.Translate("Customers", "ERROR_UPDATING_PHONE_CALL"));
        }
    }

    // DELETE: api/customer/{customerId}/phone-calls/{callId}
    [HttpDelete("{customerId}/phone-calls/{callId}")]
    public async Task<IActionResult> DeletePhoneCall(int customerId, int callId)
    {
        try
        {
            var phoneCall = await _context.CustomerPhoneCalls
                .FirstOrDefaultAsync(pc => pc.Id == callId && pc.CustomerId == customerId);

            if (phoneCall == null)
            {
                return NotFoundWithError(_translationService.Translate("Customers", "PHONE_CALL_NOT_FOUND"));
            }

            _context.CustomerPhoneCalls.Remove(phoneCall);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting phone call {CallId} for customer {CustomerId}", callId, customerId);
            return InternalServerErrorWithError(_translationService.Translate("Customers", "ERROR_DELETING_PHONE_CALL"));
        }
    }

    // ==================== PRIVATE METHODS ====================

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
                    if (jsonElement.TryGetProperty("short_name", out var shortName))
                    {
                        return shortName.GetString();
                    }
                }
            }
            // Handle anonymous type from mock service
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

    private string GetOrderStatusName(int status)
    {
        var key = Enums.OrderStatus.GetName(status);
        return _translationService.Translate("OrderStatus", key);
    }

    private string GetPaymentStatusName(int paymentStatus)
    {
        var key = Enums.PaymentStatus.GetName(paymentStatus);
        return _translationService.Translate("PaymentStatus", key);
    }
}

// DTOs
public record CreateCustomerRequest
{
    public string FullName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? Phone { get; init; }
    public string? Address { get; init; }
    public bool BypassAddressValidation { get; init; }
}

public record UpdateCustomerRequest
{
    public string? FullName { get; init; }
    public string? Phone { get; init; }
    public string? Address { get; init; }
    public int? Status { get; init; }
    public bool BypassAddressValidation { get; init; }
}

public record CustomerAddressResponse
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

public record CustomerResponse
{
    public int Id { get; init; }
    public int AppUserId { get; init; }
    public string Email { get; init; } = string.Empty;
    public string? FullName { get; init; }
    public string? Phone { get; init; }
    public CustomerAddressResponse? Address { get; init; }
    public int Status { get; init; }
    public string StatusName { get; init; } = string.Empty;
    public DateTime? EmailConfirmedAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public int CreatedBy { get; init; }
    public string? CreatedByName { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public int? UpdatedBy { get; init; }
    public string? UpdatedByName { get; init; }
    public int OrderCount { get; init; }
    public int PhoneCallCount { get; init; }
}

public record CustomerOrderResponse
{
    public int Id { get; init; }
    public string OrderNumber { get; init; } = string.Empty;
    public int Status { get; init; }
    public string StatusName { get; init; } = string.Empty;
    public int PaymentStatus { get; init; }
    public string PaymentStatusName { get; init; } = string.Empty;
    public string ShippingAddress { get; init; } = string.Empty;
    public decimal TotalAmount { get; init; }
    public DateTime OrderDate { get; init; }
    public int ItemCount { get; init; }
}

public record CreatePhoneCallRequest
{
    public DateTime? CallDate { get; init; }
    public int CallType { get; init; }
    public int? DurationMinutes { get; init; }
    public string? Notes { get; init; }
}

public record UpdatePhoneCallRequest
{
    public DateTime? CallDate { get; init; }
    public int? CallType { get; init; }
    public int? DurationMinutes { get; init; }
    public string? Notes { get; init; }
}

public record PhoneCallResponse
{
    public int Id { get; init; }
    public int CustomerId { get; init; }
    public DateTime CallDate { get; init; }
    public int CallType { get; init; }
    public string CallTypeName { get; init; } = string.Empty;
    public int? DurationMinutes { get; init; }
    public string? Notes { get; init; }
    public DateTime CreatedAt { get; init; }
    public int CreatedBy { get; init; }
    public string? CreatedByName { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public int? UpdatedBy { get; init; }
    public string? UpdatedByName { get; init; }
}

