using Stripe;
using backend.Models;

namespace backend.Services;

public interface IStripeService
{
    Task<PaymentIntent> CreatePaymentIntentAsync(CustomerOrder order);
    Task<PaymentIntent> GetPaymentIntentAsync(string paymentIntentId);
    Task<PaymentIntent> ConfirmPaymentIntentAsync(string paymentIntentId);
    Task<PaymentIntent> CancelPaymentIntentAsync(string paymentIntentId);
    Task<Refund> RefundPaymentAsync(string paymentIntentId, long? amount = null);
    bool ValidateWebhookSignature(string payload, string signature, out Event stripeEvent);
    bool IsMockStripe { get; }
}

public class StripeService : IStripeService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<StripeService> _logger;
    private readonly string _webhookSecret;
    private readonly bool _mockStripe;

    public bool IsMockStripe => _mockStripe;

    public StripeService(IConfiguration configuration, ILogger<StripeService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        
        _mockStripe = _configuration.GetValue<bool>("Stripe:MockStripe", false);
        _webhookSecret = _configuration["Stripe:WebhookSecret"] ?? "";

        if (_mockStripe)
        {
            _logger.LogWarning("MockStripe mode is enabled - payments will be simulated locally without Stripe");
            return;
        }

        var secretKey = _configuration["Stripe:SecretKey"] 
            ?? throw new InvalidOperationException("Stripe:SecretKey is not configured");
        
        StripeConfiguration.ApiKey = secretKey;
    }

    public async Task<PaymentIntent> CreatePaymentIntentAsync(CustomerOrder order)
    {
        if (_mockStripe)
        {
            _logger.LogInformation("MockStripe: Creating simulated PaymentIntent for Order {OrderNumber}", order.OrderNumber);
            return CreateMockPaymentIntent(order);
        }

        try
        {
            var options = new PaymentIntentCreateOptions
            {
                Amount = ConvertToStripeAmount(order.TotalAmount),
                Currency = "usd",
                AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                {
                    Enabled = true,
                },
                Metadata = new Dictionary<string, string>
                {
                    { "order_id", order.Id.ToString() },
                    { "order_number", order.OrderNumber },
                    { "customer_id", order.CustomerId.ToString() }
                },
                Description = $"Order {order.OrderNumber}"
            };

            var service = new PaymentIntentService();
            var paymentIntent = await service.CreateAsync(options);

            _logger.LogInformation("Created PaymentIntent {PaymentIntentId} for Order {OrderNumber}", 
                paymentIntent.Id, order.OrderNumber);

            return paymentIntent;
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to create PaymentIntent for Order {OrderNumber}", order.OrderNumber);
            throw;
        }
    }

    public async Task<PaymentIntent> GetPaymentIntentAsync(string paymentIntentId)
    {
        if (_mockStripe)
        {
            _logger.LogInformation("MockStripe: Returning simulated PaymentIntent {PaymentIntentId}", paymentIntentId);
            return CreateMockPaymentIntentById(paymentIntentId, "succeeded");
        }

        try
        {
            var service = new PaymentIntentService();
            return await service.GetAsync(paymentIntentId);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to get PaymentIntent {PaymentIntentId}", paymentIntentId);
            throw;
        }
    }

    public async Task<PaymentIntent> ConfirmPaymentIntentAsync(string paymentIntentId)
    {
        if (_mockStripe)
        {
            _logger.LogInformation("MockStripe: Confirming simulated PaymentIntent {PaymentIntentId}", paymentIntentId);
            return CreateMockPaymentIntentById(paymentIntentId, "succeeded");
        }

        try
        {
            var service = new PaymentIntentService();
            return await service.ConfirmAsync(paymentIntentId);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to confirm PaymentIntent {PaymentIntentId}", paymentIntentId);
            throw;
        }
    }

    public async Task<PaymentIntent> CancelPaymentIntentAsync(string paymentIntentId)
    {
        if (_mockStripe)
        {
            _logger.LogInformation("MockStripe: Cancelling simulated PaymentIntent {PaymentIntentId}", paymentIntentId);
            return CreateMockPaymentIntentById(paymentIntentId, "canceled");
        }

        try
        {
            var service = new PaymentIntentService();
            return await service.CancelAsync(paymentIntentId);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to cancel PaymentIntent {PaymentIntentId}", paymentIntentId);
            throw;
        }
    }

    public async Task<Refund> RefundPaymentAsync(string paymentIntentId, long? amount = null)
    {
        if (_mockStripe)
        {
            _logger.LogInformation("MockStripe: Creating simulated Refund for PaymentIntent {PaymentIntentId}", paymentIntentId);
            return CreateMockRefund(paymentIntentId, amount ?? 0);
        }

        try
        {
            var options = new RefundCreateOptions
            {
                PaymentIntent = paymentIntentId,
                Amount = amount
            };

            var service = new RefundService();
            var refund = await service.CreateAsync(options);

            _logger.LogInformation("Created Refund {RefundId} for PaymentIntent {PaymentIntentId}", 
                refund.Id, paymentIntentId);

            return refund;
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to refund PaymentIntent {PaymentIntentId}", paymentIntentId);
            throw;
        }
    }

    public bool ValidateWebhookSignature(string payload, string signature, out Event stripeEvent)
    {
        stripeEvent = null!;

        if (_mockStripe)
        {
            _logger.LogInformation("MockStripe: Skipping webhook signature validation");
            return false;
        }
        
        if (string.IsNullOrEmpty(_webhookSecret))
        {
            _logger.LogWarning("Webhook secret is not configured, skipping signature validation");
            try
            {
                stripeEvent = EventUtility.ParseEvent(payload);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse webhook event");
                return false;
            }
        }

        try
        {
            stripeEvent = EventUtility.ConstructEvent(payload, signature, _webhookSecret);
            return true;
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Webhook signature validation failed");
            return false;
        }
    }

    private static long ConvertToStripeAmount(decimal amount)
    {
        return (long)(amount * 100);
    }

    private PaymentIntent CreateMockPaymentIntent(CustomerOrder order)
    {
        var paymentIntentId = $"pi_mock_{order.Id}_{DateTime.UtcNow.Ticks}";
        var clientSecret = $"{paymentIntentId}_secret_mock";
        
        return new PaymentIntent
        {
            Id = paymentIntentId,
            ClientSecret = clientSecret,
            Amount = ConvertToStripeAmount(order.TotalAmount),
            Currency = "usd",
            Status = "requires_payment_method",
            Created = DateTime.UtcNow,
            Metadata = new Dictionary<string, string>
            {
                { "order_id", order.Id.ToString() },
                { "order_number", order.OrderNumber },
                { "customer_id", order.CustomerId.ToString() },
                { "mock_stripe", "true" }
            }
        };
    }

    private static PaymentIntent CreateMockPaymentIntentById(string paymentIntentId, string status)
    {
        return new PaymentIntent
        {
            Id = paymentIntentId,
            ClientSecret = $"{paymentIntentId}_secret_mock",
            Status = status,
            Created = DateTime.UtcNow
        };
    }

    private static Refund CreateMockRefund(string paymentIntentId, long amount)
    {
        return new Refund
        {
            Id = $"re_mock_{DateTime.UtcNow.Ticks}",
            PaymentIntentId = paymentIntentId,
            Amount = amount,
            Status = "succeeded",
            Created = DateTime.UtcNow
        };
    }
}
