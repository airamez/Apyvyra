using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Services;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AddressController : BaseApiController
{
    private readonly IGoogleMapsService _googleMapsService;
    private readonly ILogger<AddressController> _logger;

    public AddressController(
        IGoogleMapsService googleMapsService,
        ILogger<AddressController> logger)
    {
        _googleMapsService = googleMapsService;
        _logger = logger;
    }

    [Authorize]
    [HttpPost("validate")]
    public async Task<ActionResult<AddressValidationResponse>> ValidateAddress([FromBody] ValidateAddressRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Address))
            {
                return BadRequestWithErrors("Address is required");
            }

            var result = await _googleMapsService.ValidateAddressAsync(request.Address);

            var response = new AddressValidationResponse
            {
                IsValid = result.IsValid,
                PlaceId = result.PlaceId,
                FormattedAddress = result.FormattedAddress,
                ErrorMessage = result.ErrorMessage,
                AddressComponents = result.AddressComponents,
                IsMockValidation = _googleMapsService.IsMockValidation
            };

            _logger.LogInformation("Address validation completed for address '{Address}'. Valid: {IsValid}, Mock: {IsMock}", 
                request.Address, result.IsValid, _googleMapsService.IsMockValidation);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating address '{Address}'", request.Address);
            return InternalServerErrorWithError("An error occurred while validating the address");
        }
    }
}

// DTOs
public record ValidateAddressRequest
{
    public string Address { get; init; } = string.Empty;
}

public record AddressValidationResponse
{
    public bool IsValid { get; init; }
    public string? PlaceId { get; init; }
    public string? FormattedAddress { get; init; }
    public string? ErrorMessage { get; init; }
    public Dictionary<string, object>? AddressComponents { get; init; }
    public bool IsMockValidation { get; init; }
}
