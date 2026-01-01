using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.IO;
using System.Threading.Tasks;

namespace backend.Services
{
    public class EmailTemplateTest
    {
        private readonly EmailService _emailService;
        private readonly ILogger<EmailTemplateTest> _logger;

        public EmailTemplateTest(EmailService emailService, ILogger<EmailTemplateTest> logger)
        {
            _emailService = emailService;
            _logger = logger;
        }

        public async Task TestTemplatePaths()
        {
            _logger.LogInformation("=== Testing Email Template Paths ===");
            
            // Test confirmation template path
            var confirmationPath = GetLocalizedTemplatePath("confirmation.html");
            _logger.LogInformation("Confirmation template path: {Path}", confirmationPath);
            _logger.LogInformation("File exists: {Exists}", File.Exists(confirmationPath));
            
            // Test staff invitation template path
            var staffPath = GetLocalizedTemplatePath("staff-invitation.html");
            _logger.LogInformation("Staff invitation template path: {Path}", staffPath);
            _logger.LogInformation("File exists: {Exists}", File.Exists(staffPath));
            
            // Test order confirmation template path
            var orderPath = GetLocalizedTemplatePath("order-confirmation.html");
            _logger.LogInformation("Order confirmation template path: {Path}", orderPath);
            _logger.LogInformation("File exists: {Exists}", File.Exists(orderPath));
            
            // Test order shipped template path
            var shippedPath = GetLocalizedTemplatePath("order-shipped.html");
            _logger.LogInformation("Order shipped template path: {Path}", shippedPath);
            _logger.LogInformation("File exists: {Exists}", File.Exists(shippedPath));
            
            _logger.LogInformation("=== End Test ===");
        }

        private string GetLocalizedTemplatePath(string templateName)
        {
            var language = "pt-BR"; // Simulating the app setting
            var localizedPath = $"email-templates/{language}/{templateName}";
            
            // Check if localized template exists, fallback to default if not
            if (!File.Exists(localizedPath))
            {
                _logger.LogWarning("Localized template not found for language {Language}, falling back to default: {TemplatePath}", language, localizedPath);
                localizedPath = $"email-templates/{templateName}";
            }
            
            return localizedPath;
        }
    }
}
