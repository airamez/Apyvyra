namespace backend.Services;

public interface IGoogleMapsService
{
    Task<AddressValidationResult> ValidateAddressAsync(string address);
    bool IsMockValidation { get; }
}

public class AddressValidationResult
{
    public bool IsValid { get; set; }
    public bool IsExactMatch { get; set; }
    public string? PlaceId { get; set; }
    public string? FormattedAddress { get; set; }
    public string? OriginalAddress { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, object>? AddressComponents { get; set; }
    public List<string>? Suggestions { get; set; }
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
                IsExactMatch = false,
                OriginalAddress = address,
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
            var mockResult = await _mockService.ValidateAddressAsync(address);
            mockResult.OriginalAddress = address;
            mockResult.IsExactMatch = true; // Mock service assumes exact match
            return mockResult;
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
                IsExactMatch = false,
                OriginalAddress = address,
                ErrorMessage = _translationService.Translate("GoogleMaps", "GOOGLE_MAPS_VALIDATION_FAILED")
            };
        }
    }

    private async Task<AddressValidationResult> ValidateAddressWithGoogleApiAsync(string address)
    {
        // Normalize the input address for comparison
        var normalizedInput = NormalizeAddress(address);
        
        // Use Google Places Autocomplete API to find matching addresses
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
                IsExactMatch = false,
                OriginalAddress = address,
                ErrorMessage = _translationService.Translate("GoogleMaps", "GOOGLE_API_ERROR")
            };
        }
        
        var predictions = autocompleteData.GetProperty("predictions");
        if (predictions.GetArrayLength() == 0)
        {
            return new AddressValidationResult
            {
                IsValid = false,
                IsExactMatch = false,
                OriginalAddress = address,
                ErrorMessage = _translationService.Translate("GoogleMaps", "ADDRESS_NOT_FOUND")
            };
        }
        
        // Get all predictions for comparison and suggestions
        var suggestions = new List<string>();
        AddressValidationResult? bestMatch = null;
        double bestSimilarity = 0;
        
        foreach (var prediction in predictions.EnumerateArray().Take(5)) // Check top 5 results
        {
            var description = prediction.GetProperty("description").GetString();
            if (description != null)
            {
                suggestions.Add(description);
                
                var similarity = CalculateSimilarity(normalizedInput, NormalizeAddress(description));
                if (similarity > bestSimilarity)
                {
                    bestSimilarity = similarity;
                    var placeId = prediction.GetProperty("place_id").GetString();
                    
                    // Get place details for the best match
                    var detailsResult = await GetPlaceDetailsAsync(placeId!);
                    if (detailsResult != null)
                    {
                        bestMatch = detailsResult;
                        bestMatch.IsExactMatch = similarity >= 0.9; // 90% similarity threshold for exact match
                    }
                }
            }
        }
        
        if (bestMatch == null)
        {
            return new AddressValidationResult
            {
                IsValid = false,
                IsExactMatch = false,
                OriginalAddress = address,
                ErrorMessage = _translationService.Translate("GoogleMaps", "ADDRESS_NOT_FOUND")
            };
        }
        
        // Set the original address and suggestions
        bestMatch.OriginalAddress = address;
        bestMatch.Suggestions = suggestions;
        
        // If it's not an exact match, mark as invalid but provide suggestions
        if (!bestMatch.IsExactMatch)
        {
            bestMatch.IsValid = false;
            bestMatch.ErrorMessage = _translationService.Translate("GoogleMaps", "ADDRESS_MISMATCH_FOUND_SIMILAR");
        }
        
        _logger.LogInformation("Address validation for '{Address}': Best match '{FormattedAddress}' with {Similarity:P1} similarity. Exact match: {IsExactMatch}", 
            address, bestMatch.FormattedAddress, bestSimilarity, bestMatch.IsExactMatch);
        
        return bestMatch;
    }
    
    private async Task<AddressValidationResult?> GetPlaceDetailsAsync(string placeId)
    {
        try
        {
            var detailsUrl = $"https://maps.googleapis.com/maps/api/place/details/json?place_id={placeId}&key={_apiKey}&fields=formatted_address,address_components,place_id,geometry";
            
            var detailsResponse = await _httpClient.GetAsync(detailsUrl);
            detailsResponse.EnsureSuccessStatusCode();
            
            var detailsData = System.Text.Json.JsonDocument.Parse(await detailsResponse.Content.ReadAsStringAsync()).RootElement;
            
            if (detailsData.GetProperty("status").GetString() != "OK")
            {
                return null;
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
            
            return new AddressValidationResult
            {
                IsValid = true,
                PlaceId = placeId,
                FormattedAddress = formattedAddress,
                AddressComponents = addressComponents
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get place details for place ID {PlaceId}", placeId);
            return null;
        }
    }
    
    private string NormalizeAddress(string address)
    {
        if (string.IsNullOrEmpty(address)) return string.Empty;
        
        // Remove extra whitespace, convert to lowercase, remove punctuation
        var normalized = System.Text.RegularExpressions.Regex.Replace(address.ToLower(), @"\s+", " ");
        normalized = System.Text.RegularExpressions.Regex.Replace(normalized, @"[^\w\s]", "");
        return normalized.Trim();
    }
    
    private double CalculateSimilarity(string s1, string s2)
    {
        if (string.IsNullOrEmpty(s1) || string.IsNullOrEmpty(s2)) return 0;
        
        // Simple Levenshtein distance-based similarity
        var distance = LevenshteinDistance(s1, s2);
        var maxLength = Math.Max(s1.Length, s2.Length);
        return maxLength == 0 ? 1 : 1 - (double)distance / maxLength;
    }
    
    private int LevenshteinDistance(string s1, string s2)
    {
        var matrix = new int[s1.Length + 1, s2.Length + 1];
        
        for (int i = 0; i <= s1.Length; i++)
            matrix[i, 0] = i;
        
        for (int j = 0; j <= s2.Length; j++)
            matrix[0, j] = j;
        
        for (int i = 1; i <= s1.Length; i++)
        {
            for (int j = 1; j <= s2.Length; j++)
            {
                var cost = s1[i - 1] == s2[j - 1] ? 0 : 1;
                matrix[i, j] = Math.Min(
                    Math.Min(matrix[i - 1, j] + 1, matrix[i, j - 1] + 1),
                    matrix[i - 1, j - 1] + cost);
            }
        }
        
        return matrix[s1.Length, s2.Length];
    }
}
