using System.Text.Json;

namespace backend.Services;

public interface ITranslationService
{
    string GetCurrentLanguage();
    Dictionary<string, string> GetTranslations(string component);
    string Translate(string component, string key);
}

public class TranslationService : ITranslationService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<TranslationService> _logger;
    private readonly string _language;
    private readonly string _resourcePath;
    private readonly Dictionary<string, Dictionary<string, string>> _translationCache;

    public TranslationService(IConfiguration configuration, ILogger<TranslationService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _language = _configuration["Localization:Language"] ?? "en-US";
        _resourcePath = _configuration["Localization:ResourcePath"] ?? "Resources/Translations";
        _translationCache = new Dictionary<string, Dictionary<string, string>>();
        
        _logger.LogInformation("TranslationService initialized with language: {Language}, path: {Path}", _language, _resourcePath);
    }

    public string GetCurrentLanguage() => _language;

    public Dictionary<string, string> GetTranslations(string component)
    {
        var cacheKey = $"{_language}:{component}";
        
        if (_translationCache.TryGetValue(cacheKey, out var cachedTranslations))
        {
            return cachedTranslations;
        }

        var translations = LoadTranslations(component);
        _translationCache[cacheKey] = translations;
        
        return translations;
    }

    public string Translate(string component, string key)
    {
        var translations = GetTranslations(component);
        
        if (translations.TryGetValue(key, out var translation))
        {
            return translation;
        }
        
        _logger.LogWarning("Translation not found for component: {Component}, key: {Key}", component, key);
        return key; // Return key as fallback
    }

    private Dictionary<string, string> LoadTranslations(string component)
    {
        var filePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, _resourcePath, _language, $"{component}.json");
        
        if (!File.Exists(filePath))
        {
            _logger.LogWarning("Translation file not found: {FilePath}", filePath);
            return new Dictionary<string, string>();
        }

        try
        {
            var json = File.ReadAllText(filePath);
            var translations = JsonSerializer.Deserialize<Dictionary<string, string>>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            
            _logger.LogInformation("Loaded {Count} translations for component: {Component}, language: {Language}", 
                translations?.Count ?? 0, component, _language);
            
            return translations ?? new Dictionary<string, string>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading translations for component: {Component}", component);
            return new Dictionary<string, string>();
        }
    }
}
