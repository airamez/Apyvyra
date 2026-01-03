using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Services;

namespace backend.Controllers;

[Route("api/email-client")]
[Authorize]
public class EmailClientController : BaseApiController
{
    private readonly IEmailClientService _emailClientService;
    private readonly ILogger<EmailClientController> _logger;

    public EmailClientController(IEmailClientService emailClientService, ILogger<EmailClientController> logger)
    {
        _emailClientService = emailClientService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<EmailMessage>>> GetEmails(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? fromEmail,
        [FromQuery] string? searchText,
        [FromQuery] string folder = "inbox",
        [FromQuery] int? limit = 50)
    {
        try
        {
            var filter = new EmailFilterRequest
            {
                StartDate = startDate,
                EndDate = endDate,
                FromEmail = fromEmail,
                SearchText = searchText,
                Limit = limit
            };

            var emails = await _emailClientService.GetEmailsAsync(filter, folder);
            return Ok(emails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching emails from folder {Folder}", folder);
            return InternalServerErrorWithError("Failed to fetch emails. Please check your email configuration.");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EmailMessage>> GetEmail(string id, [FromQuery] string folder = "inbox")
    {
        try
        {
            var email = await _emailClientService.GetEmailByIdAsync(id, folder);
            if (email == null)
            {
                return NotFoundWithError($"Email with ID {id} not found");
            }
            return Ok(email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching email {Id}", id);
            return InternalServerErrorWithError("Failed to fetch email. Please check your email configuration.");
        }
    }

    [HttpPost("send")]
    public async Task<ActionResult> SendEmail([FromBody] SendEmailRequest request)
    {
        if (string.IsNullOrEmpty(request.To))
        {
            return BadRequestWithErrors("Recipient email is required");
        }

        if (string.IsNullOrEmpty(request.Subject))
        {
            return BadRequestWithErrors("Subject is required");
        }

        if (string.IsNullOrEmpty(request.Body))
        {
            return BadRequestWithErrors("Email body is required");
        }

        try
        {
            var result = await _emailClientService.SendEmailAsync(request);
            if (result)
            {
                return Ok(new { success = true, message = "Email sent successfully" });
            }
            return InternalServerErrorWithError("Failed to send email");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email to {To}", request.To);
            return InternalServerErrorWithError("Failed to send email. Please check your email configuration.");
        }
    }

    [HttpPost("reply")]
    public async Task<ActionResult> ReplyToEmail([FromBody] ReplyEmailRequest request)
    {
        if (string.IsNullOrEmpty(request.To))
        {
            return BadRequestWithErrors("Recipient email is required");
        }

        if (string.IsNullOrEmpty(request.Subject))
        {
            return BadRequestWithErrors("Subject is required");
        }

        if (string.IsNullOrEmpty(request.Body))
        {
            return BadRequestWithErrors("Email body is required");
        }

        try
        {
            var result = await _emailClientService.ReplyToEmailAsync(request);
            if (result)
            {
                return Ok(new { success = true, message = "Reply sent successfully" });
            }
            return InternalServerErrorWithError("Failed to send reply");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending reply to {To}", request.To);
            return InternalServerErrorWithError("Failed to send reply. Please check your email configuration.");
        }
    }
}
