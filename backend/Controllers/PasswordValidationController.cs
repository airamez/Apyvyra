using Microsoft.AspNetCore.Mvc;
using backend.Services;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PasswordValidationController : BaseApiController
{
    private readonly IPasswordValidationService _passwordValidationService;
    private readonly ILogger<PasswordValidationController> _logger;

    public PasswordValidationController(
        IPasswordValidationService passwordValidationService,
        ILogger<PasswordValidationController> logger)
    {
        _passwordValidationService = passwordValidationService;
        _logger = logger;
    }

    [HttpPost("validate")]
    public ActionResult<PasswordValidationResponse> ValidatePassword([FromBody] PasswordValidationRequest request)
    {
        try
        {
            if (request == null || string.IsNullOrEmpty(request.Password))
            {
                return BadRequestWithErrors("Password is required");
            }

            var result = _passwordValidationService.ValidatePassword(request.Password);

            return OkWithSuccess(new PasswordValidationResponse
            {
                IsValid = result.IsValid,
                Errors = result.Errors
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating password");
            return InternalServerErrorWithError("An error occurred while validating the password");
        }
    }

    [HttpPost("rules-status")]
    public ActionResult<PasswordRulesStatusResponse> GetPasswordRulesStatus([FromBody] PasswordValidationRequest request)
    {
        try
        {
            var status = _passwordValidationService.GetPasswordRulesStatus(request?.Password ?? string.Empty);

            return OkWithSuccess(new PasswordRulesStatusResponse
            {
                IsValid = status.IsValid,
                HasMinLength = status.HasMinLength,
                HasMaxLength = status.HasMaxLength,
                HasUppercase = status.HasUppercase,
                HasLowercase = status.HasLowercase,
                HasDigit = status.HasDigit,
                HasSpecialChar = status.HasSpecialChar,
                HasNoSpaces = status.HasNoSpaces,
                HasNoSequential = status.HasNoSequential
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting password rules status");
            return InternalServerErrorWithError("An error occurred while checking password rules");
        }
    }
}

public record PasswordValidationRequest
{
    public string Password { get; init; } = string.Empty;
}

public record PasswordRulesStatusResponse
{
    public bool IsValid { get; init; }
    public bool HasMinLength { get; init; }
    public bool HasMaxLength { get; init; }
    public bool HasUppercase { get; init; }
    public bool HasLowercase { get; init; }
    public bool HasDigit { get; init; }
    public bool HasSpecialChar { get; init; }
    public bool HasNoSpaces { get; init; }
    public bool HasNoSequential { get; init; }
}

public record PasswordValidationResponse
{
    public bool IsValid { get; init; }
    public List<string> Errors { get; init; } = new();
}
