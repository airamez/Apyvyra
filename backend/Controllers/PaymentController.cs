using backend.Models;
using backend.Services;
using backend.Enums;
using backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Stripe;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PaymentController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly ILogger<PaymentController> _logger;
    private readonly IStripeService _stripeService;
    private readonly IConfiguration _configuration;

    public PaymentController(
        AppDbContext context,
        ILogger<PaymentController> logger,
        IStripeService stripeService,
        IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _stripeService = stripeService;
        _configuration = configuration;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    // GET: api/payment/config
    [HttpGet("config")]
    public ActionResult<PaymentConfigResponse> GetConfig()
    {
        var publishableKey = _configuration["Stripe:PublishableKey"];
        var testMode = _configuration.GetValue<bool>("Stripe:TestMode", true);
        var mockStripe = _stripeService.IsMockStripe;

        return Ok(new PaymentConfigResponse
        {
            PublishableKey = publishableKey ?? "",
            TestMode = testMode,
            MockStripe = mockStripe
        });
    }

    // POST: api/payment/create-intent/{orderId}
    [Authorize(Roles = "2")]
    [HttpPost("create-intent/{orderId}")]
    public async Task<ActionResult<PaymentIntentResponse>> CreatePaymentIntent(int orderId)
    {
        try
        {
            var userId = GetCurrentUserId();

            var order = await _context.CustomerOrders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.CustomerId == userId);

            if (order == null)
            {
                return NotFoundWithError("Order not found");
            }

            if (order.PaymentStatus == PaymentStatus.Succeeded)
            {
                return BadRequestWithErrors("Order has already been paid");
            }

            if (order.Status == OrderStatus.Cancelled)
            {
                return BadRequestWithErrors("Order has been cancelled");
            }

            // If there's an existing payment intent, return it
            if (!string.IsNullOrEmpty(order.StripePaymentIntentId))
            {
                var existingIntent = await _stripeService.GetPaymentIntentAsync(order.StripePaymentIntentId);
                
                if (existingIntent.Status == "requires_payment_method" || 
                    existingIntent.Status == "requires_confirmation" ||
                    existingIntent.Status == "requires_action")
                {
                    return Ok(new PaymentIntentResponse
                    {
                        ClientSecret = existingIntent.ClientSecret,
                        PaymentIntentId = existingIntent.Id,
                        Amount = order.TotalAmount,
                        Status = existingIntent.Status
                    });
                }
            }

            // Create new payment intent
            var paymentIntent = await _stripeService.CreatePaymentIntentAsync(order);

            // Update order with payment intent info
            order.StripePaymentIntentId = paymentIntent.Id;
            order.StripeClientSecret = paymentIntent.ClientSecret;
            order.UpdatedBy = userId;
            await _context.SaveChangesAsync();

            return Ok(new PaymentIntentResponse
            {
                ClientSecret = paymentIntent.ClientSecret,
                PaymentIntentId = paymentIntent.Id,
                Amount = order.TotalAmount,
                Status = paymentIntent.Status
            });
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error creating payment intent for order {OrderId}", orderId);
            return InternalServerErrorWithError($"Payment processing error: {ex.Message}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating payment intent for order {OrderId}", orderId);
            return InternalServerErrorWithError("An error occurred while processing payment");
        }
    }

    // POST: api/payment/confirm/{orderId}
    [Authorize(Roles = "2")]
    [HttpPost("confirm/{orderId}")]
    public async Task<ActionResult<PaymentConfirmResponse>> ConfirmPayment(int orderId)
    {
        try
        {
            var userId = GetCurrentUserId();

            var order = await _context.CustomerOrders
                .FirstOrDefaultAsync(o => o.Id == orderId && o.CustomerId == userId);

            if (order == null)
            {
                return NotFoundWithError("Order not found");
            }

            if (string.IsNullOrEmpty(order.StripePaymentIntentId))
            {
                return BadRequestWithErrors("No payment intent found for this order");
            }

            // In MockStripe mode, simulate successful payment
            if (_stripeService.IsMockStripe)
            {
                _logger.LogInformation("MockStripe: Simulating successful payment for order {OrderId}", orderId);
                
                // Update order status
                order.PaymentStatus = PaymentStatus.Succeeded;
                order.Status = OrderStatus.Paid;
                order.PaidAt = DateTime.UtcNow;
                order.UpdatedBy = userId;
                await _context.SaveChangesAsync();

                return Ok(new PaymentConfirmResponse
                {
                    Success = true,
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    PaymentStatus = "succeeded",
                    Message = "Payment completed successfully (mock mode)"
                });
            }

            var paymentIntent = await _stripeService.GetPaymentIntentAsync(order.StripePaymentIntentId);

            if (paymentIntent.Status == "succeeded")
            {
                // Update order status
                order.PaymentStatus = PaymentStatus.Succeeded;
                order.Status = OrderStatus.Paid;
                order.PaidAt = DateTime.UtcNow;
                order.UpdatedBy = userId;
                await _context.SaveChangesAsync();

                return Ok(new PaymentConfirmResponse
                {
                    Success = true,
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    PaymentStatus = "succeeded",
                    Message = "Payment completed successfully"
                });
            }

            return Ok(new PaymentConfirmResponse
            {
                Success = false,
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                PaymentStatus = paymentIntent.Status,
                Message = $"Payment status: {paymentIntent.Status}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming payment for order {OrderId}", orderId);
            return InternalServerErrorWithError("An error occurred while confirming payment");
        }
    }

    // POST: api/payment/webhook
    [HttpPost("webhook")]
    public async Task<IActionResult> HandleWebhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"].FirstOrDefault() ?? "";

        if (!_stripeService.ValidateWebhookSignature(json, signature, out var stripeEvent))
        {
            _logger.LogWarning("Invalid webhook signature");
            return BadRequest("Invalid signature");
        }

        try
        {
            switch (stripeEvent.Type)
            {
                case "payment_intent.succeeded":
                    await HandlePaymentSucceeded(stripeEvent);
                    break;
                case "payment_intent.payment_failed":
                    await HandlePaymentFailed(stripeEvent);
                    break;
                case "charge.refunded":
                    await HandleChargeRefunded(stripeEvent);
                    break;
                default:
                    _logger.LogInformation("Unhandled webhook event type: {EventType}", stripeEvent.Type);
                    break;
            }

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing webhook event {EventType}", stripeEvent.Type);
            return StatusCode(500);
        }
    }

    private async Task HandlePaymentSucceeded(Event stripeEvent)
    {
        var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
        if (paymentIntent == null) return;

        var order = await _context.CustomerOrders
            .FirstOrDefaultAsync(o => o.StripePaymentIntentId == paymentIntent.Id);

        if (order != null && order.PaymentStatus != PaymentStatus.Succeeded)
        {
            order.PaymentStatus = PaymentStatus.Succeeded;
            order.Status = OrderStatus.Paid;
            order.PaidAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Payment succeeded for order {OrderNumber}", order.OrderNumber);
        }
    }

    private async Task HandlePaymentFailed(Event stripeEvent)
    {
        var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
        if (paymentIntent == null) return;

        var order = await _context.CustomerOrders
            .FirstOrDefaultAsync(o => o.StripePaymentIntentId == paymentIntent.Id);

        if (order != null)
        {
            order.PaymentStatus = PaymentStatus.Failed;
            await _context.SaveChangesAsync();

            _logger.LogWarning("Payment failed for order {OrderNumber}", order.OrderNumber);
        }
    }

    private async Task HandleChargeRefunded(Event stripeEvent)
    {
        var charge = stripeEvent.Data.Object as Charge;
        if (charge == null) return;

        var order = await _context.CustomerOrders
            .FirstOrDefaultAsync(o => o.StripePaymentIntentId == charge.PaymentIntentId);

        if (order != null)
        {
            order.PaymentStatus = PaymentStatus.Refunded;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Payment refunded for order {OrderNumber}", order.OrderNumber);
        }
    }

    // POST: api/payment/refund/{orderId}
    [Authorize(Roles = "0,1")]
    [HttpPost("refund/{orderId}")]
    public async Task<ActionResult<RefundResponse>> RefundPayment(int orderId)
    {
        try
        {
            var userId = GetCurrentUserId();

            var order = await _context.CustomerOrders
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
            {
                return NotFoundWithError("Order not found");
            }

            if (order.PaymentStatus != 1)
            {
                return BadRequestWithErrors("Order has not been paid");
            }

            if (string.IsNullOrEmpty(order.StripePaymentIntentId))
            {
                return BadRequestWithErrors("No payment intent found for this order");
            }

            var refund = await _stripeService.RefundPaymentAsync(order.StripePaymentIntentId);

            order.PaymentStatus = PaymentStatus.Refunded;
            order.Status = OrderStatus.Cancelled;
            order.CancelledAt = DateTime.UtcNow;
            order.UpdatedBy = userId;
            await _context.SaveChangesAsync();

            return Ok(new RefundResponse
            {
                Success = true,
                RefundId = refund.Id,
                Amount = (decimal)refund.Amount / 100,
                Status = refund.Status,
                Message = "Refund processed successfully"
            });
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error refunding order {OrderId}", orderId);
            return InternalServerErrorWithError($"Refund processing error: {ex.Message}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refunding order {OrderId}", orderId);
            return InternalServerErrorWithError("An error occurred while processing refund");
        }
    }
}

// DTOs
public record PaymentConfigResponse
{
    public string PublishableKey { get; init; } = string.Empty;
    public bool TestMode { get; init; }
    public bool MockStripe { get; init; }
}

public record PaymentIntentResponse
{
    public string ClientSecret { get; init; } = string.Empty;
    public string PaymentIntentId { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string Status { get; init; } = string.Empty;
}

public record PaymentConfirmResponse
{
    public bool Success { get; init; }
    public int OrderId { get; init; }
    public string OrderNumber { get; init; } = string.Empty;
    public string PaymentStatus { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
}

public record RefundResponse
{
    public bool Success { get; init; }
    public string RefundId { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string Status { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
}
