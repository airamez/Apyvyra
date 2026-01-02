using Microsoft.AspNetCore.Mvc;
using backend.Services;
using System.Linq;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TranslationController : BaseApiController
{
    private readonly ITranslationService _translationService;
    private readonly ILogger<TranslationController> _logger;

    public TranslationController(
        ITranslationService translationService,
        ILogger<TranslationController> logger)
    {
        _translationService = translationService;
        _logger = logger;
    }

    [HttpGet("language")]
    public ActionResult<LanguageResponse> GetLanguage()
    {
        var language = _translationService.GetCurrentLanguage();
        return OkWithSuccess(new LanguageResponse { Language = language });
    }

    [HttpGet("{component}")]
    public ActionResult<Dictionary<string, string>> GetTranslations(string component)
    {
        
        var translations = _translationService.GetTranslations(component);
        
        if (translations.Count == 0)
        {
            _logger.LogWarning("No translations found for component: {Component}", component);
        }
        
        return OkWithSuccess(translations);
    }
}

public record LanguageResponse
{
    public string Language { get; init; } = string.Empty;
}
