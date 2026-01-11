namespace backend.Services;

public interface IGoogleMapsMockService
{
    Task<AddressValidationResult> ValidateAddressAsync(string address);
}

public class GoogleMapsMockService : IGoogleMapsMockService
{
    private readonly ILogger<GoogleMapsMockService> _logger;
    private readonly ITranslationService _translationService;
    private readonly Dictionary<string, string> _stateAbbreviations;
    private readonly string[] _mockCountries;
    private readonly string[] _mockStates;
    private readonly string[] _mockCities;

    public GoogleMapsMockService(ILogger<GoogleMapsMockService> logger, ITranslationService translationService)
    {
        _logger = logger;
        _translationService = translationService;
        
        // Initialize mock data
        _stateAbbreviations = new Dictionary<string, string>
        {
            {"AL", "Alabama"}, {"AK", "Alaska"}, {"AZ", "Arizona"}, {"AR", "Arkansas"},
            {"CA", "California"}, {"CO", "Colorado"}, {"CT", "Connecticut"}, {"DE", "Delaware"},
            {"FL", "Florida"}, {"GA", "Georgia"}, {"HI", "Hawaii"}, {"ID", "Idaho"},
            {"IL", "Illinois"}, {"IN", "Indiana"}, {"IA", "Iowa"}, {"KS", "Kansas"},
            {"KY", "Kentucky"}, {"LA", "Louisiana"}, {"ME", "Maine"}, {"MD", "Maryland"},
            {"MA", "Massachusetts"}, {"MI", "Michigan"}, {"MN", "Minnesota"}, {"MS", "Mississippi"},
            {"MO", "Missouri"}, {"MT", "Montana"}, {"NE", "Nebraska"}, {"NV", "Nevada"},
            {"NH", "New Hampshire"}, {"NJ", "New Jersey"}, {"NM", "New Mexico"}, {"NY", "New York"},
            {"NC", "North Carolina"}, {"ND", "North Dakota"}, {"OH", "Ohio"}, {"OK", "Oklahoma"},
            {"OR", "Oregon"}, {"PA", "Pennsylvania"}, {"RI", "Rhode Island"}, {"SC", "South Carolina"},
            {"SD", "South Dakota"}, {"TN", "Tennessee"}, {"TX", "Texas"}, {"UT", "Utah"},
            {"VT", "Vermont"}, {"VA", "Virginia"}, {"WA", "Washington"}, {"WV", "West Virginia"},
            {"WI", "Wisconsin"}, {"WY", "Wyoming"}
        };

        _mockCountries = new[] { "United States", "Canada", "United Kingdom", "Australia" };
        _mockStates = new[] { 
            "California", "New York", "Texas", "Florida", "Washington", "Oregon", 
            "Arizona", "Nevada", "Colorado", "Illinois", "Pennsylvania", "Ohio",
            "Ontario", "British Columbia", "Quebec", "Alberta"
        };
        _mockCities = new[] { 
            "Los Angeles", "New York City", "Houston", "Miami", "Toronto", "Vancouver",
            "Chicago", "Seattle", "Portland", "Phoenix", "Denver", "Boston"
        };
    }

    public async Task<AddressValidationResult> ValidateAddressAsync(string address)
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
        var random = new Random();
        
        // Try to extract postal code from address (look for patterns like 12345 or A1B 2C3)
        var postalCodeMatch = System.Text.RegularExpressions.Regex.Match(address, @"\b(\d{5}(-\d{4})?|[A-Z]\d[A-Z]\s?\d[A-Z]\d)\b", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        var postalCode = postalCodeMatch.Success ? postalCodeMatch.Value : $"{random.Next(10000, 99999)}";
        
        // Try to find state abbreviation
        string? detectedState = null;
        string? detectedStateShort = null;
        foreach (var abbr in _stateAbbreviations)
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
        var state = detectedState ?? _mockStates[random.Next(_mockStates.Length)];
        var stateShort = detectedStateShort ?? GetStateAbbreviation(state) ?? state.Substring(0, 2).ToUpper();
        var city = _mockCities[random.Next(_mockCities.Length)];
        
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

    private string? GetStateAbbreviation(string stateName)
    {
        return _stateAbbreviations.FirstOrDefault(x => x.Value.Equals(stateName, StringComparison.OrdinalIgnoreCase)).Key;
    }
}
