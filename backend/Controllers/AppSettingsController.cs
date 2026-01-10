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

                var settings = new
                {
                    data = new
                    {
                        currency = new
                        {
                            code = _configuration["AppSettings:Currency:Code"] ?? "USD",
                            symbol = _configuration["AppSettings:Currency:Symbol"] ?? "$",
                            locale = _configuration["AppSettings:Currency:Locale"] ?? "en-US"
                        },
                        dateFormat = new
                        {
                            locale = _configuration["AppSettings:DateFormat:Locale"] ?? "en-US",
                            options = new
                            {
                                year = "numeric",
                                month = "short",
                                day = "numeric"
                            }
                        },
                        company = new
                        {
                            name = _configuration["AppSettings:Company:Name"] ?? "Apyvyra",
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
