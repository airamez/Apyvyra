using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace backend.Services;

public interface IEmailService
{
    Task SendConfirmationEmailAsync(string toEmail, string userName, string confirmationUrl, bool isResend = false);
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

    public async Task SendConfirmationEmailAsync(string toEmail, string userName, string confirmationUrl, bool isResend = false)
    {
        try
        {
            var templatePath = "/home/jose/code/Apyvyra/email-templates/confirmation.html";
            _logger.LogInformation("Looking for template at: {TemplatePath}", templatePath);
            var template = await File.ReadAllTextAsync(templatePath);
            
            // Prepare template variables
            var emailBody = template
                .Replace("{{email_type}}", isResend ? "Apyvyra - Reminder" : "Welcome to Apyvyra!")
                .Replace("{{email_subtitle}}", isResend ? "Complete your registration to get started" : "Your journey to seamless inventory management starts here")
                .Replace("{{user_name}}", userName)
                .Replace("{{welcome_message}}", isResend 
                    ? "Here's a fresh confirmation link to complete your Apyvyra account setup."
                    : "Thank you for signing up for Apyvyra! We're excited to have you on board. To get started with your account, we just need to confirm your email address.")
                .Replace("{{confirmation_instruction}}", "Please click the button below to verify your email address and activate your account:")
                .Replace("{{confirmation_url}}", confirmationUrl)
                .Replace("{{expiry_class}}", isResend ? "warning" : "")
                .Replace("{{expiry_title}}", isResend ? "Time Sensitive" : "Important")
                .Replace("{{expiry_message}}", isResend 
                    ? "This confirmation link will expire in 24 hours for security reasons."
                    : "This confirmation link will expire in 24 hours for security reasons. If you don't confirm in time, you'll need to request a new confirmation email.")
                .Replace("{{security_title}}", isResend ? "Account Security" : "Security Notice")
                .Replace("{{security_message}}", isResend 
                    ? "If you didn't request this email or believe this was sent in error, please contact our support team immediately. We're here to help keep your account secure."
                    : "If you didn't create an account with Apyvyra, please ignore this email or contact our support team. We take security seriously and will never ask for your password via email.");

            // Handle conditional resend section
            if (isResend)
            {
                emailBody = emailBody.Replace("{{#is_resend}}", "").Replace("{{/is_resend}}", "");
            }
            else
            {
                // Remove the resend section completely for initial emails
                var startIndex = emailBody.IndexOf("{{#is_resend}}");
                var endIndex = emailBody.IndexOf("{{/is_resend}}") + "{{/is_resend}}".Length;
                if (startIndex != -1 && endIndex != -1)
                {
                    emailBody = emailBody.Remove(startIndex, endIndex - startIndex);
                }
            }

            var subject = isResend ? "Reminder: Confirm Your Email Address - Apyvyra" : "Confirm Your Email Address - Apyvyra";
            await SendEmailAsync(toEmail, subject, emailBody);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending confirmation email to {Email}", toEmail);
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
    public string FromName { get; set; } = "Apyvyra";
    public bool EnableSsl { get; set; } = true;
    public bool DevelopmentMode { get; set; } = false;
}
