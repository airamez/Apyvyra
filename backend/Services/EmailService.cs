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

    public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
    {
        _emailSettings = emailSettings.Value;
        _logger = logger;
    }

    public async Task SendConfirmationEmailAsync(string toEmail, string confirmationUrl)
    {
        try
        {
            var templatePath = "email-templates/confirmation.html";
            _logger.LogInformation("Looking for template at: {TemplatePath}", templatePath);
            var template = await File.ReadAllTextAsync(templatePath);
            
            // Prepare template variables - always use the same template since new token is created
            var emailBody = template
                .Replace("{{email_type}}", "EMAIL_TYPE_WELCOME")
                .Replace("{{email_subtitle}}", "EMAIL_SUBTITLE_JOURNEY_STARTS")
                .Replace("{{confirmation_instruction}}", "EMAIL_CONFIRMATION_INSTRUCTION")
                .Replace("{{confirmation_url}}", confirmationUrl)
                .Replace("{{expiry_class}}", "")
                .Replace("{{expiry_title}}", "EMAIL_EXPIRY_TITLE")
                .Replace("{{expiry_message}}", "EMAIL_EXPIRY_MESSAGE")
                .Replace("{{security_title}}", "EMAIL_SECURITY_TITLE")
                .Replace("{{security_message}}", "EMAIL_SECURITY_MESSAGE");

            // Remove the resend section completely since we always use the same template
            var startIndex = emailBody.IndexOf("{{#is_resend}}");
            var endIndex = emailBody.IndexOf("{{/is_resend}}") + "{{/is_resend}}".Length;
            if (startIndex != -1 && endIndex != -1)
            {
                emailBody = emailBody.Remove(startIndex, endIndex - startIndex);
            }

            var subject = "EMAIL_SUBJECT_CONFIRM_EMAIL";
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
            var templatePath = "email-templates/staff-invitation.html";
            _logger.LogInformation("Looking for staff invitation template at: {TemplatePath}", templatePath);
            var template = await File.ReadAllTextAsync(templatePath);
            
            var emailBody = template
                .Replace("{{full_name}}", fullName)
                .Replace("{{setup_url}}", setupUrl);

            var subject = "You've Been Invited to Join Apyvyra - Staff Account Setup";
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
            var templatePath = "email-templates/order-confirmation.html";
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

            var subject = $"Order Confirmation - {order.OrderNumber} - Apyvyra";
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
            var templatePath = "email-templates/order-shipped.html";
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

            var subject = $"Your Order Has Shipped - {order.OrderNumber} - Apyvyra";
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
