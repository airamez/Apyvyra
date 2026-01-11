namespace backend.Services;

public interface IGoogleMapsService
{
    Task<AddressValidationResult> ValidateAddressAsync(string address);
    bool IsMockValidation { get; }
}

public class AddressValidationResult
{
    public bool IsValid { get; set; }
    public string? PlaceId { get; set; }
    public string? FormattedAddress { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, object>? AddressComponents { get; set; }
}

public class GoogleMapsService : IGoogleMapsService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleMapsService> _logger;
    private readonly HttpClient _httpClient;
    private readonly ITranslationService _translationService;
    private readonly IGoogleMapsMockService? _mockService;
    private readonly bool _mockValidation;
    private readonly string? _apiKey;

    public bool IsMockValidation => _mockValidation;

    public GoogleMapsService(
        IConfiguration configuration, 
        ILogger<GoogleMapsService> logger, 
        HttpClient httpClient, 
        ITranslationService translationService,
        IGoogleMapsMockService? mockService = null)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClient;
        _translationService = translationService;
        _mockService = mockService;
        
        _mockValidation = _configuration.GetValue<bool>("GoogleMaps:MockAddressValidation", true);
        _apiKey = _configuration["GoogleMaps:ApiKey"];

        if (_mockValidation)
        {
            _logger.LogWarning("MockAddressValidation mode is enabled - address validation will be simulated locally without Google Maps API");
            return;
        }

        if (string.IsNullOrEmpty(_apiKey))
        {
            _logger.LogWarning("GoogleMaps:ApiKey is not configured, falling back to mock validation");
            _mockValidation = true;
            return;
        }
    }

    public async Task<AddressValidationResult> ValidateAddressAsync(string address)
    {
        if (string.IsNullOrWhiteSpace(address))
        {
            return new AddressValidationResult
            {
                IsValid = false,
                ErrorMessage = _translationService.Translate("GoogleMaps", "ADDRESS_REQUIRED")
            };
        }

        if (_mockValidation)
        {
            if (_mockService == null)
            {
                throw new InvalidOperationException("Mock validation is enabled but mock service is not registered.");
            }
            
            _logger.LogInformation("MockAddressValidation: Validating address '{Address}'", address);
            return await _mockService.ValidateAddressAsync(address);
        }

        try
        {
            return await ValidateAddressWithGoogleApiAsync(address);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to validate address with Google Maps API: '{Address}'", address);
            return new AddressValidationResult
            {
                IsValid = false,
                ErrorMessage = _translationService.Translate("GoogleMaps", "GOOGLE_MAPS_VALIDATION_FAILED")
            };
        }
    }

    private async Task<AddressValidationResult> ValidateAddressWithGoogleApiAsync(string address)
    {
        // Use Google Places Autocomplete API for address validation
        var autocompleteUrl = $"https://maps.googleapis.com/maps/api/place/autocomplete/json?input={Uri.EscapeDataString(address)}&key={_apiKey}&types=address&components=country:us";
        
        var autocompleteResponse = await _httpClient.GetAsync(autocompleteUrl);
        autocompleteResponse.EnsureSuccessStatusCode();
        
        var autocompleteData = System.Text.Json.JsonDocument.Parse(await autocompleteResponse.Content.ReadAsStringAsync()).RootElement;
        
        if (autocompleteData.GetProperty("status").GetString() != "OK" && 
            autocompleteData.GetProperty("status").GetString() != "ZERO_RESULTS")
        {
            var status = autocompleteData.GetProperty("status").GetString();
            return new AddressValidationResult
            {
                IsValid = false,
                ErrorMessage = _translationService.Translate("GoogleMaps", "GOOGLE_API_ERROR")
            };
        }
        
        var predictions = autocompleteData.GetProperty("predictions");
        if (predictions.GetArrayLength() == 0)
        {
            return new AddressValidationResult
            {
                IsValid = false,
                ErrorMessage = _translationService.Translate("GoogleMaps", "ADDRESS_NOT_FOUND")
            };
        }
        
        // Get the first prediction
        var prediction = predictions[0];
        var placeId = prediction.GetProperty("place_id").GetString();
        
        // Get place details for more information
        var detailsUrl = $"https://maps.googleapis.com/maps/api/place/details/json?place_id={placeId}&key={_apiKey}&fields=formatted_address,address_components,place_id,geometry";
        
        var detailsResponse = await _httpClient.GetAsync(detailsUrl);
        detailsResponse.EnsureSuccessStatusCode();
        
        var detailsData = System.Text.Json.JsonDocument.Parse(await detailsResponse.Content.ReadAsStringAsync()).RootElement;
        
        if (detailsData.GetProperty("status").GetString() != "OK")
        {
            var status = detailsData.GetProperty("status").GetString();
            return new AddressValidationResult
            {
                IsValid = false,
                ErrorMessage = _translationService.Translate("GoogleMaps", "FAILED_GET_ADDRESS_DETAILS")
            };
        }
        
        var result = detailsData.GetProperty("result");
        var formattedAddress = result.GetProperty("formatted_address").GetString();
        var addressComponents = new Dictionary<string, object>();
        
        foreach (var component in result.GetProperty("address_components").EnumerateArray())
        {
            var types = component.GetProperty("types").EnumerateArray().Select(t => t.GetString()).ToArray();
            var longName = component.GetProperty("long_name").GetString();
            var shortName = component.GetProperty("short_name").GetString();
            
            foreach (var type in types)
            {
                if (!string.IsNullOrEmpty(type) && !addressComponents.ContainsKey(type))
                {
                    addressComponents[type] = new { long_name = longName, short_name = shortName };
                }
            }
        }
        
        _logger.LogInformation("Successfully validated address '{Address}' with place ID {PlaceId}", formattedAddress, placeId);
        
        return new AddressValidationResult
        {
            IsValid = true,
            PlaceId = placeId,
            FormattedAddress = formattedAddress,
            AddressComponents = addressComponents
        };
    }
}
