using Microsoft.Extensions.Options;
using MailKit;
using MailKit.Net.Imap;
using MailKit.Search;
using MimeKit;
using System.Net;
using System.Net.Mail;

namespace backend.Services;

public interface IEmailClientService
{
    Task<List<EmailMessage>> GetEmailsAsync(EmailFilterRequest filter, string folder = "inbox");
    Task<EmailMessage?> GetEmailByIdAsync(string messageId, string folder = "inbox");
    Task<bool> SendEmailAsync(SendEmailRequest request);
    Task<bool> ReplyToEmailAsync(ReplyEmailRequest request);
}

public class EmailClientService : IEmailClientService
{
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<EmailClientService> _logger;
    private readonly ITranslationService _translationService;

    public EmailClientService(IOptions<EmailSettings> emailSettings, ILogger<EmailClientService> logger, ITranslationService translationService)
    {
        _emailSettings = emailSettings.Value;
        _logger = logger;
        _translationService = translationService;
    }

    public async Task<List<EmailMessage>> GetEmailsAsync(EmailFilterRequest filter, string folder = "inbox")
    {
        var emails = new List<EmailMessage>();

        if (_emailSettings.DevelopmentMode)
        {
            _logger.LogInformation("=== DEVELOPMENT MODE - Returning mock emails for {Folder} ===", folder);
            return folder.ToLower() == "sent" ? GetMockSentEmails(filter) : GetMockEmails(filter);
        }

        try
        {
            using var client = new ImapClient();
            
            // Gmail IMAP settings
            var imapServer = GetImapServer(_emailSettings.SmtpServer);
            var imapPort = 993;

            await client.ConnectAsync(imapServer, imapPort, true);
            await client.AuthenticateAsync(_emailSettings.Username, _emailSettings.Password);

            // Get the appropriate folder
            IMailFolder mailFolder;
            if (folder.ToLower() == "sent")
            {
                mailFolder = await GetSentFolderAsync(client);
            }
            else
            {
                mailFolder = client.Inbox;
            }
            
            await mailFolder.OpenAsync(FolderAccess.ReadOnly);

            // Build search query
            var query = BuildSearchQuery(filter);
            var uids = await mailFolder.SearchAsync(query);

            // Get emails in reverse order (newest first) and limit
            var sortedUids = uids.OrderByDescending(u => u.Id).Take(filter.Limit ?? 50).ToList();

            foreach (var uid in sortedUids)
            {
                var message = await mailFolder.GetMessageAsync(uid);
                emails.Add(MapToEmailMessage(message, uid.ToString()));
            }

            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching emails from IMAP server folder {Folder}", folder);
            throw;
        }

        return emails;
    }

    private async Task<IMailFolder> GetSentFolderAsync(ImapClient client)
    {
        // Try common sent folder names
        var sentFolderNames = new[] { "[Gmail]/Sent Mail", "Sent", "Sent Items", "Sent Messages", "[Gmail]/Sent" };
        
        foreach (var folderName in sentFolderNames)
        {
            try
            {
                var folder = await client.GetFolderAsync(folderName);
                if (folder != null)
                {
                    return folder;
                }
            }
            catch
            {
                // Try next folder name
            }
        }

        // Fallback: search in personal namespace
        var personal = client.GetFolder(client.PersonalNamespaces[0]);
        foreach (var subfolder in await personal.GetSubfoldersAsync(false))
        {
            if (subfolder.Attributes.HasFlag(FolderAttributes.Sent))
            {
                return subfolder;
            }
        }

        throw new Exception("Could not find sent folder");
    }

    public async Task<EmailMessage?> GetEmailByIdAsync(string messageId, string folder = "inbox")
    {
        if (_emailSettings.DevelopmentMode)
        {
            _logger.LogInformation("=== DEVELOPMENT MODE - Returning mock email ===");
            var mockEmails = folder.ToLower() == "sent" 
                ? GetMockSentEmails(new EmailFilterRequest()) 
                : GetMockEmails(new EmailFilterRequest());
            return mockEmails.FirstOrDefault(e => e.Id == messageId);
        }

        try
        {
            using var client = new ImapClient();
            
            var imapServer = GetImapServer(_emailSettings.SmtpServer);
            var imapPort = 993;

            await client.ConnectAsync(imapServer, imapPort, true);
            await client.AuthenticateAsync(_emailSettings.Username, _emailSettings.Password);

            var inbox = client.Inbox;
            await inbox.OpenAsync(FolderAccess.ReadOnly);

            if (uint.TryParse(messageId, out var uid))
            {
                var message = await inbox.GetMessageAsync(new UniqueId(uid));
                await client.DisconnectAsync(true);
                return MapToEmailMessage(message, messageId);
            }

            await client.DisconnectAsync(true);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching email {MessageId} from IMAP server", messageId);
            throw;
        }
    }

    public async Task<bool> SendEmailAsync(SendEmailRequest request)
    {
        if (_emailSettings.DevelopmentMode)
        {
            _logger.LogInformation("=== DEVELOPMENT MODE - EMAIL NOT SENT ===");
            _logger.LogInformation("To: {To}", request.To);
            _logger.LogInformation("Subject: {Subject}", request.Subject);
            _logger.LogInformation("Body: {Body}", request.Body);
            _logger.LogInformation("=== END EMAIL CONTENT ===");
            return true;
        }

        try
        {
            using var smtpClient = new SmtpClient(_emailSettings.SmtpServer, _emailSettings.SmtpPort)
            {
                Credentials = new NetworkCredential(_emailSettings.Username, _emailSettings.Password),
                EnableSsl = _emailSettings.EnableSsl
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(_emailSettings.FromEmail, _emailSettings.FromName),
                Subject = request.Subject,
                Body = request.Body,
                IsBodyHtml = request.IsHtml
            };
            mailMessage.To.Add(request.To);

            if (!string.IsNullOrEmpty(request.Cc))
            {
                mailMessage.CC.Add(request.Cc);
            }

            await smtpClient.SendMailAsync(mailMessage);
            _logger.LogInformation("Email sent successfully to {To}", request.To);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email to {To}", request.To);
            throw;
        }
    }

    public async Task<bool> ReplyToEmailAsync(ReplyEmailRequest request)
    {
        var subject = request.Subject.StartsWith("Re:", StringComparison.OrdinalIgnoreCase)
            ? request.Subject
            : $"Re: {request.Subject}";

        var sendRequest = new SendEmailRequest
        {
            To = request.To,
            Subject = subject,
            Body = request.Body,
            IsHtml = request.IsHtml,
            Cc = request.Cc
        };

        return await SendEmailAsync(sendRequest);
    }

    private string GetImapServer(string smtpServer)
    {
        // Map SMTP servers to their IMAP equivalents
        return smtpServer.ToLower() switch
        {
            "smtp.gmail.com" => "imap.gmail.com",
            "smtp.office365.com" => "outlook.office365.com",
            "smtp.mail.yahoo.com" => "imap.mail.yahoo.com",
            _ => smtpServer.Replace("smtp.", "imap.")
        };
    }

    private SearchQuery BuildSearchQuery(EmailFilterRequest filter)
    {
        var query = SearchQuery.All;

        if (filter.StartDate.HasValue)
        {
            query = query.And(SearchQuery.DeliveredAfter(filter.StartDate.Value));
        }

        if (filter.EndDate.HasValue)
        {
            query = query.And(SearchQuery.DeliveredBefore(filter.EndDate.Value.AddDays(1)));
        }

        if (!string.IsNullOrEmpty(filter.FromEmail))
        {
            query = query.And(SearchQuery.FromContains(filter.FromEmail));
        }

        if (!string.IsNullOrEmpty(filter.SearchText))
        {
            query = query.And(
                SearchQuery.SubjectContains(filter.SearchText)
                    .Or(SearchQuery.BodyContains(filter.SearchText))
            );
        }

        return query;
    }

    private EmailMessage MapToEmailMessage(MimeMessage message, string id)
    {
        return new EmailMessage
        {
            Id = id,
            From = message.From.Mailboxes.FirstOrDefault()?.Address ?? "",
            FromName = message.From.Mailboxes.FirstOrDefault()?.Name ?? "",
            To = string.Join(", ", message.To.Mailboxes.Select(m => m.Address)),
            Subject = message.Subject ?? _translationService.Translate("EmailClient", "NO_SUBJECT"),
            Body = message.TextBody ?? message.HtmlBody ?? "",
            HtmlBody = message.HtmlBody,
            Date = message.Date.UtcDateTime,
            IsRead = true,
            HasAttachments = message.Attachments.Any()
        };
    }

    private List<EmailMessage> GetMockEmails(EmailFilterRequest filter)
    {
        var mockEmails = new List<EmailMessage>
        {
            new()
            {
                Id = "1",
                From = "customer1@example.com",
                FromName = "John Smith",
                To = _emailSettings.FromEmail,
                Subject = "Question about my order #12345",
                Body = "Hello,\n\nI placed an order yesterday and I was wondering when it will be shipped?\n\nThank you,\nJohn Smith",
                Date = DateTime.UtcNow.AddHours(-2),
                IsRead = false,
                HasAttachments = false
            },
            new()
            {
                Id = "2",
                From = "customer2@example.com",
                FromName = "Jane Doe",
                To = _emailSettings.FromEmail,
                Subject = "Return request for order #12340",
                Body = "Hi,\n\nI would like to return the product I received. It doesn't match the description on your website.\n\nPlease advise on the return process.\n\nBest regards,\nJane Doe",
                Date = DateTime.UtcNow.AddHours(-5),
                IsRead = true,
                HasAttachments = false
            },
            new()
            {
                Id = "3",
                From = "supplier@vendor.com",
                FromName = "Vendor Support",
                To = _emailSettings.FromEmail,
                Subject = "Invoice #INV-2024-001",
                Body = "Dear Customer,\n\nPlease find attached the invoice for your recent order.\n\nThank you for your business.\n\nVendor Support Team",
                Date = DateTime.UtcNow.AddDays(-1),
                IsRead = true,
                HasAttachments = true
            },
            new()
            {
                Id = "4",
                From = "customer3@example.com",
                FromName = "Bob Wilson",
                To = _emailSettings.FromEmail,
                Subject = "Product inquiry - Electronics category",
                Body = "Hello,\n\nI'm interested in purchasing some electronics from your store. Do you have any bulk discounts available?\n\nThanks,\nBob Wilson",
                Date = DateTime.UtcNow.AddDays(-2),
                IsRead = false,
                HasAttachments = false
            },
            new()
            {
                Id = "5",
                From = "support@payment.com",
                FromName = "Payment Gateway",
                To = _emailSettings.FromEmail,
                Subject = "Monthly statement available",
                Body = "Your monthly payment statement is now available. Please log in to your account to view the details.",
                Date = DateTime.UtcNow.AddDays(-3),
                IsRead = true,
                HasAttachments = true
            }
        };

        // Apply filters
        var filtered = mockEmails.AsEnumerable();

        if (filter.StartDate.HasValue)
        {
            filtered = filtered.Where(e => e.Date >= filter.StartDate.Value);
        }

        if (filter.EndDate.HasValue)
        {
            filtered = filtered.Where(e => e.Date <= filter.EndDate.Value.AddDays(1));
        }

        if (!string.IsNullOrEmpty(filter.FromEmail))
        {
            filtered = filtered.Where(e => e.From.Contains(filter.FromEmail, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrEmpty(filter.SearchText))
        {
            filtered = filtered.Where(e =>
                e.Subject.Contains(filter.SearchText, StringComparison.OrdinalIgnoreCase) ||
                e.Body.Contains(filter.SearchText, StringComparison.OrdinalIgnoreCase));
        }

        return filtered.OrderByDescending(e => e.Date).Take(filter.Limit ?? 50).ToList();
    }

    private List<EmailMessage> GetMockSentEmails(EmailFilterRequest filter)
    {
        var mockEmails = new List<EmailMessage>
        {
            new()
            {
                Id = "sent-1",
                From = _emailSettings.FromEmail,
                FromName = _emailSettings.FromName,
                To = "customer1@example.com",
                Subject = "Re: Question about my order #12345",
                Body = "Hello John,\n\nThank you for your inquiry. Your order #12345 has been shipped and should arrive within 3-5 business days.\n\nBest regards,\nApyvyra Support",
                Date = DateTime.UtcNow.AddHours(-1),
                IsRead = true,
                HasAttachments = false
            },
            new()
            {
                Id = "sent-2",
                From = _emailSettings.FromEmail,
                FromName = _emailSettings.FromName,
                To = "customer2@example.com",
                Subject = "Re: Return request for order #12340",
                Body = "Hi Jane,\n\nWe're sorry to hear the product didn't meet your expectations. Please follow these steps to initiate your return:\n\n1. Log into your account\n2. Go to Order History\n3. Select the order and click 'Request Return'\n\nBest regards,\nApyvyra Support",
                Date = DateTime.UtcNow.AddHours(-4),
                IsRead = true,
                HasAttachments = false
            },
            new()
            {
                Id = "sent-3",
                From = _emailSettings.FromEmail,
                FromName = _emailSettings.FromName,
                To = "customer3@example.com",
                Subject = "Re: Product inquiry - Electronics category",
                Body = "Hello Bob,\n\nThank you for your interest in our electronics. Yes, we do offer bulk discounts for orders over 10 units. Please contact our sales team for a custom quote.\n\nBest regards,\nApyvyra Support",
                Date = DateTime.UtcNow.AddDays(-1),
                IsRead = true,
                HasAttachments = false
            },
            new()
            {
                Id = "sent-4",
                From = _emailSettings.FromEmail,
                FromName = _emailSettings.FromName,
                To = "newsletter@example.com",
                Subject = "Weekly Newsletter - New Products",
                Body = "Dear Subscribers,\n\nCheck out our new arrivals this week! We have exciting new products in all categories.\n\nVisit our store to see what's new.\n\nBest regards,\nApyvyra Team",
                Date = DateTime.UtcNow.AddDays(-2),
                IsRead = true,
                HasAttachments = true
            }
        };

        // Apply filters
        var filtered = mockEmails.AsEnumerable();

        if (filter.StartDate.HasValue)
        {
            filtered = filtered.Where(e => e.Date >= filter.StartDate.Value);
        }

        if (filter.EndDate.HasValue)
        {
            filtered = filtered.Where(e => e.Date <= filter.EndDate.Value.AddDays(1));
        }

        if (!string.IsNullOrEmpty(filter.FromEmail))
        {
            filtered = filtered.Where(e => e.To.Contains(filter.FromEmail, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrEmpty(filter.SearchText))
        {
            filtered = filtered.Where(e =>
                e.Subject.Contains(filter.SearchText, StringComparison.OrdinalIgnoreCase) ||
                e.Body.Contains(filter.SearchText, StringComparison.OrdinalIgnoreCase));
        }

        return filtered.OrderByDescending(e => e.Date).Take(filter.Limit ?? 50).ToList();
    }
}

public class EmailMessage
{
    public string Id { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? HtmlBody { get; set; }
    public DateTime Date { get; set; }
    public bool IsRead { get; set; }
    public bool HasAttachments { get; set; }
}

public class EmailFilterRequest
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? FromEmail { get; set; }
    public string? SearchText { get; set; }
    public int? Limit { get; set; } = 50;
}

public class SendEmailRequest
{
    public string To { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsHtml { get; set; } = false;
    public string? Cc { get; set; }
}

public class ReplyEmailRequest
{
    public string To { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsHtml { get; set; } = false;
    public string? Cc { get; set; }
    public string? OriginalMessageId { get; set; }
}
