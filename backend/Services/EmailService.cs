using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace backend.Services;

public interface IEmailService
{
    Task SendConfirmationEmailAsync(string toEmail, string confirmationUrl);
    Task SendStaffInvitationEmailAsync(string toEmail, string fullName, string setupUrl);
    Task SendOrderConfirmationEmailAsync(string toEmail, string customerName, backend.Models.CustomerOrder order, List<backend.Models.OrderItem> items);
    Task SendOrderShippedEmailAsync(string toEmail, string customerName, backend.Models.CustomerOrder order, List<backend.Models.OrderItem> items, string shippingDetails);
}

public class EmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<EmailService> _logger;
    private readonly IConfiguration _configuration;
    private readonly string _defaultLanguage;

    public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger, IConfiguration configuration)
    {
        _emailSettings = emailSettings.Value;
        _logger = logger;
        _configuration = configuration;
        _defaultLanguage = _configuration["Localization:Language"] ?? "en-US";
    }

    private string GetLocalizedTemplatePath(string templateName)
    {
        var language = _defaultLanguage;
        var localizedPath = $"email-templates/{language}/{templateName}";
        
        // Check if localized template exists, fallback to default if not
        if (!File.Exists(localizedPath))
        {
            _logger.LogWarning("Localized template not found for language {Language}, falling back to default: {TemplatePath}", language, localizedPath);
            localizedPath = $"email-templates/{templateName}";
        }
        
        return localizedPath;
    }

    public async Task SendConfirmationEmailAsync(string toEmail, string confirmationUrl)
    {
        try
        {
            var templatePath = GetLocalizedTemplatePath("confirmation.html");
            _logger.LogInformation("Looking for template at: {TemplatePath}", templatePath);
            var template = await File.ReadAllTextAsync(templatePath);
            
            // Prepare template variables - only replace data variables, not text
            var emailBody = template
                .Replace("{{confirmation_url}}", confirmationUrl)
                .Replace("{{expiry_class}}", "");

            // Remove the resend section completely since we always use the same template
            var startIndex = emailBody.IndexOf("{{#is_resend}}");
            var endIndex = emailBody.IndexOf("{{/is_resend}}") + "{{/is_resend}}".Length;
            if (startIndex != -1 && endIndex != -1)
            {
                emailBody = emailBody.Remove(startIndex, endIndex - startIndex);
            }

            var subject = _defaultLanguage == "pt-BR" ? "Confirme seu endereço de email - Apyvyra" : "Confirm your email address - Apyvyra";
            await SendEmailAsync(toEmail, subject, emailBody);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending confirmation email to {Email}", toEmail);
            throw;
        }
    }

    public async Task SendStaffInvitationEmailAsync(string toEmail, string fullName, string setupUrl)
    {
        try
        {
            var templatePath = GetLocalizedTemplatePath("staff-invitation.html");
            _logger.LogInformation("Looking for staff invitation template at: {TemplatePath}", templatePath);
            var template = await File.ReadAllTextAsync(templatePath);
            
            var emailBody = template
                .Replace("{{full_name}}", fullName)
                .Replace("{{setup_url}}", setupUrl);

            var subject = _defaultLanguage == "pt-BR" ? "Você foi convidado a se juntar à Apyvyra - Configuração de Conta da Equipe" : "You've Been Invited to Join Apyvyra - Staff Account Setup";
            await SendEmailAsync(toEmail, subject, emailBody);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending staff invitation email to {Email}", toEmail);
            throw;
        }
    }

    public async Task SendOrderConfirmationEmailAsync(string toEmail, string customerName, backend.Models.CustomerOrder order, List<backend.Models.OrderItem> items)
    {
        try
        {
            var templatePath = GetLocalizedTemplatePath("order-confirmation.html");
            _logger.LogInformation("Looking for order confirmation template at: {TemplatePath}", templatePath);
            var template = await File.ReadAllTextAsync(templatePath);

            // Build order items HTML
            var itemsHtml = new StringBuilder();
            foreach (var item in items)
            {
                itemsHtml.Append($@"
                <tr>
                    <td style=""padding: 12px; border-bottom: 1px solid #e5e7eb;"">{item.ProductName}</td>
                    <td style=""padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;"">{item.Quantity}</td>
                    <td style=""padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;"">${item.UnitPrice:F2}</td>
                    <td style=""padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;"">${item.LineTotal:F2}</td>
                </tr>");
            }

            var emailBody = template
                .Replace("{{customer_name}}", customerName)
                .Replace("{{order_number}}", order.OrderNumber)
                .Replace("{{order_date}}", order.OrderDate.ToString("MMMM dd, yyyy"))
                .Replace("{{order_items}}", itemsHtml.ToString())
                .Replace("{{subtotal}}", order.Subtotal.ToString("F2"))
                .Replace("{{tax_amount}}", order.TaxAmount.ToString("F2"))
                .Replace("{{total_amount}}", order.TotalAmount.ToString("F2"))
                .Replace("{{shipping_address}}", order.ShippingAddress.Replace("\n", "<br>"));

            var subject = _defaultLanguage == "pt-BR" ? $"Confirmação de Pedido - {order.OrderNumber} - Apyvyra" : $"Order Confirmation - {order.OrderNumber} - Apyvyra";
            await SendEmailAsync(toEmail, subject, emailBody);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending order confirmation email to {Email}", toEmail);
            throw;
        }
    }

    public async Task SendOrderShippedEmailAsync(string toEmail, string customerName, backend.Models.CustomerOrder order, List<backend.Models.OrderItem> items, string shippingDetails)
    {
        try
        {
            var templatePath = GetLocalizedTemplatePath("order-shipped.html");
            _logger.LogInformation("Looking for order shipped template at: {TemplatePath}", templatePath);
            var template = await File.ReadAllTextAsync(templatePath);

            // Build order items HTML
            var itemsHtml = new StringBuilder();
            foreach (var item in items)
            {
                itemsHtml.Append($@"
                <tr>
                    <td style=""padding: 12px; border-bottom: 1px solid #e5e7eb;"">{item.ProductName}</td>
                    <td style=""padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;"">{item.Quantity}</td>
                    <td style=""padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;"">${item.UnitPrice:F2}</td>
                    <td style=""padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;"">${item.LineTotal:F2}</td>
                </tr>");
            }

            // Format shipping details - convert newlines to HTML breaks
            var formattedShippingDetails = string.IsNullOrWhiteSpace(shippingDetails) 
                ? "No additional shipping details provided." 
                : shippingDetails.Replace("\n", "<br>");

            var emailBody = template
                .Replace("{{customer_name}}", customerName)
                .Replace("{{order_number}}", order.OrderNumber)
                .Replace("{{shipped_date}}", DateTime.UtcNow.ToString("MMMM dd, yyyy"))
                .Replace("{{order_items}}", itemsHtml.ToString())
                .Replace("{{subtotal}}", order.Subtotal.ToString("F2"))
                .Replace("{{tax_amount}}", order.TaxAmount.ToString("F2"))
                .Replace("{{total_amount}}", order.TotalAmount.ToString("F2"))
                .Replace("{{shipping_address}}", order.ShippingAddress.Replace("\n", "<br>"))
                .Replace("{{shipping_details}}", formattedShippingDetails);

            var subject = _defaultLanguage == "pt-BR" ? $"Seu Pedido Foi Enviado - {order.OrderNumber} - Apyvyra" : $"Your Order Has Shipped - {order.OrderNumber} - Apyvyra";
            await SendEmailAsync(toEmail, subject, emailBody);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending order shipped email to {Email}", toEmail);
            throw;
        }
    }

    private async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        if (_emailSettings.DevelopmentMode)
        {
            // In development mode, just log the email content instead of sending
            _logger.LogInformation("=== DEVELOPMENT MODE - EMAIL NOT SENT ===");
            _logger.LogInformation("To: {Email}", toEmail);
            _logger.LogInformation("Subject: {Subject}", subject);
            _logger.LogInformation("Body: {Body}", body);
            _logger.LogInformation("=== END EMAIL CONTENT ===");
            return;
        }

        using var client = new SmtpClient(_emailSettings.SmtpServer, _emailSettings.SmtpPort)
        {
            Credentials = new NetworkCredential(_emailSettings.Username, _emailSettings.Password),
            EnableSsl = _emailSettings.EnableSsl
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(_emailSettings.FromEmail, _emailSettings.FromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };
        mailMessage.To.Add(toEmail);

        await client.SendMailAsync(mailMessage);
        _logger.LogInformation("Email sent successfully to {Email}", toEmail);
    }
}

public class EmailSettings
{
    public string SmtpServer { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = "APYVYRA";
    public bool EnableSsl { get; set; } = true;
    public bool DevelopmentMode { get; set; } = false;
}
