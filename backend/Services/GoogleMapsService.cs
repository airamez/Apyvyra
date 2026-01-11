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
    private readonly bool _mockValidation;
    private readonly string? _apiKey;

    public bool IsMockValidation => _mockValidation;

    public GoogleMapsService(IConfiguration configuration, ILogger<GoogleMapsService> logger, HttpClient httpClient, ITranslationService translationService)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClient;
        _translationService = translationService;
        
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
            _logger.LogInformation("MockAddressValidation: Validating address '{Address}'", address);
            return await ValidateAddressMockAsync(address);
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

    private async Task<AddressValidationResult> ValidateAddressMockAsync(string address)
    {
        // Simulate API delay
        await Task.Delay(300);

        _logger.LogInformation("MockAddressValidation: Starting validation for address: '{Address}'", address);

        // Simple validation - just check if there are enough parts for an address
        var parts = address.Split(new[] { ' ', ',', '.', ';' }, StringSplitOptions.RemoveEmptyEntries);
        var hasEnoughParts = parts.Length >= 3; // At least street, city, state/zip
        
        _logger.LogInformation("MockAddressValidation: Address has {PartCount} parts, needs at least 3: {HasEnoughParts}", parts.Length, hasEnoughParts);

        if (!hasEnoughParts)
        {
            _logger.LogWarning("MockAddressValidation: Validation failed - not enough address parts");
            return new AddressValidationResult
            {
                IsValid = false,
                ErrorMessage = _translationService.Translate("GoogleMaps", "INCOMPLETE_ADDRESS")
            };
        }

        // Create a simple mock response with realistic address components
        var mockPlaceId = $"mock_{Guid.NewGuid():N}";
        
        // Generate mock address metadata
        var mockCountries = new[] { "United States", "Canada", "United Kingdom", "Australia" };
        var mockStates = new[] { "California", "New York", "Texas", "Florida", "Ontario", "British Columbia" };
        var mockCities = new[] { "Los Angeles", "New York City", "Houston", "Miami", "Toronto", "Vancouver" };
        var random = new Random();
        
        // Try to extract postal code from address (look for patterns like 12345 or A1B 2C3)
        var postalCodeMatch = System.Text.RegularExpressions.Regex.Match(address, @"\b(\d{5}(-\d{4})?|[A-Z]\d[A-Z]\s?\d[A-Z]\d)\b", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        var postalCode = postalCodeMatch.Success ? postalCodeMatch.Value : $"{random.Next(10000, 99999)}";
        
        // Try to find state abbreviation
        var stateAbbreviations = new Dictionary<string, string>
        {
            {"CA", "California"}, {"NY", "New York"}, {"TX", "Texas"}, {"FL", "Florida"},
            {"WA", "Washington"}, {"OR", "Oregon"}, {"AZ", "Arizona"}, {"NV", "Nevada"},
            {"CO", "Colorado"}, {"IL", "Illinois"}, {"PA", "Pennsylvania"}, {"OH", "Ohio"}
        };
        
        string? detectedState = null;
        string? detectedStateShort = null;
        foreach (var abbr in stateAbbreviations)
        {
            if (address.Contains(abbr.Key, StringComparison.OrdinalIgnoreCase) || 
                address.Contains(abbr.Value, StringComparison.OrdinalIgnoreCase))
            {
                detectedState = abbr.Value;
                detectedStateShort = abbr.Key;
                break;
            }
        }
        
        var country = "United States";
        var countryShort = "US";
        var state = detectedState ?? mockStates[random.Next(mockStates.Length)];
        var stateShort = detectedStateShort ?? state.Substring(0, 2).ToUpper();
        var city = mockCities[random.Next(mockCities.Length)];
        
        _logger.LogInformation("MockAddressValidation: Validation successful for address: '{Address}'", address);
        
        return new AddressValidationResult
        {
            IsValid = true,
            PlaceId = mockPlaceId,
            FormattedAddress = address.Trim(),
            AddressComponents = new Dictionary<string, object>
            {
                ["street_number"] = new { long_name = parts[0], short_name = parts[0] },
                ["route"] = new { long_name = parts.Length > 1 ? string.Join(" ", parts[1..Math.Min(3, parts.Length)]) : "Main Street", short_name = parts.Length > 1 ? parts[1] : "Main St" },
                ["locality"] = new { long_name = city, short_name = city },
                ["administrative_area_level_1"] = new { long_name = state, short_name = stateShort },
                ["postal_code"] = new { long_name = postalCode, short_name = postalCode },
                ["country"] = new { long_name = country, short_name = countryShort }
            }
        };
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
