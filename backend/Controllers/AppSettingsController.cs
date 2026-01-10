using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using backend.Services;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AppSettingsController : BaseApiController
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<AppSettingsController> _logger;
        private readonly ITranslationService _translationService;

        public AppSettingsController(IConfiguration configuration, ILogger<AppSettingsController> logger, ITranslationService translationService)
        {
            _configuration = configuration;
            _logger = logger;
            _translationService = translationService;
        }

        [HttpGet("settings")]
        public ActionResult GetAppSettings()
        {
            try
            {
                _logger.LogInformation("Getting app settings");

                // Get required configuration values
                var locale = _configuration["Localization:Language"];
                if (string.IsNullOrEmpty(locale))
                {
                    throw new InvalidOperationException(_translationService.Translate("ApiMessages", "REQUIRED_LOCALIZATION_LANGUAGE"));
                }

                var currencyCode = _configuration["Localization:Currency:Code"];
                if (string.IsNullOrEmpty(currencyCode))
                {
                    throw new InvalidOperationException(_translationService.Translate("ApiMessages", "REQUIRED_CURRENCY_CODE"));
                }

                var currencySymbol = _configuration["Localization:Currency:Symbol"];
                if (string.IsNullOrEmpty(currencySymbol))
                {
                    throw new InvalidOperationException(_translationService.Translate("ApiMessages", "REQUIRED_CURRENCY_SYMBOL"));
                }

                var dateFormat = _configuration["Localization:DateFormat"];
                if (string.IsNullOrEmpty(dateFormat))
                {
                    throw new InvalidOperationException(_translationService.Translate("ApiMessages", "REQUIRED_DATE_FORMAT"));
                }

                var companyName = _configuration["AppSettings:Company:Name"];
                if (string.IsNullOrEmpty(companyName))
                {
                    throw new InvalidOperationException(_translationService.Translate("ApiMessages", "REQUIRED_COMPANY_NAME"));
                }

                var settings = new
                {
                    data = new
                    {
                        locale = locale,
                        currency = new
                        {
                            code = currencyCode,
                            symbol = currencySymbol
                        },
                        dateFormat = dateFormat,
                        company = new
                        {
                            name = companyName,
                            logo = _configuration["AppSettings:Company:Logo"] ?? "",
                            website = _configuration["AppSettings:Company:Website"] ?? ""
                        }
                    }
                };

                return OkWithSuccess(settings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve app settings");
                return InternalServerErrorWithError(_translationService.Translate("ApiMessages", "FAILED_RETRIEVE_APP_SETTINGS"));
            }
        }
    }
}
