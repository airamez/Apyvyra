using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using backend.Services;

namespace backend.Controllers;

/// <summary>
/// Base controller with standardized error handling and query limiting
/// </summary>
[ApiController]
public abstract class BaseApiController : ControllerBase
{
    /// <summary>
    /// Gets the maximum number of records to return from queries (from appsettings.json)
    /// </summary>
    protected int MaxRecordsCount
    {
        get
        {
            var config = HttpContext.RequestServices.GetService<IConfiguration>();
            return config?.GetValue<int>("QuerySettings:MAX_RECORDS_QUERIES_COUNT") ?? 100;
        }
    }
    /// <summary>
    /// Returns a BadRequest with error messages in both body and headers
    /// </summary>
    protected ActionResult BadRequestWithErrors(params string[] errors)
    {
        return BadRequestWithErrors(errors.ToList());
    }

    /// <summary>
    /// Returns a BadRequest with error messages in both body and headers
    /// </summary>
    protected ActionResult BadRequestWithErrors(List<string> errors)
    {
        AddErrorsToContext(errors);
        return BadRequest(new { message = string.Join("; ", errors), errors });
    }

    /// <summary>
    /// Returns a NotFound with error message in both body and headers
    /// </summary>
    protected ActionResult NotFoundWithError(string error)
    {
        AddErrorsToContext(new List<string> { error });
        return NotFound(new { message = error, errors = new[] { error } });
    }

    /// <summary>
    /// Returns a Conflict with error message in both body and headers
    /// </summary>
    protected ActionResult ConflictWithError(string error)
    {
        AddErrorsToContext(new List<string> { error });
        return Conflict(new { message = error, errors = new[] { error } });
    }

    /// <summary>
    /// Returns an InternalServerError with error message in both body and headers
    /// </summary>
    protected ActionResult InternalServerErrorWithError(string error)
    {
        AddErrorsToContext(new List<string> { error });
        return StatusCode(500, new { message = error, errors = new[] { error } });
    }

    /// <summary>
    /// Returns validation errors from ModelState, translating any translation keys
    /// </summary>
    protected ActionResult ValidationErrors()
    {
        var translationService = HttpContext.RequestServices.GetService<ITranslationService>();
        
        var errors = ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => {
                var message = e.ErrorMessage;
                // If the error message looks like a translation key (UPPER_SNAKE_CASE), translate it
                if (translationService != null && System.Text.RegularExpressions.Regex.IsMatch(message, @"^[A-Z][A-Z0-9_]+$"))
                {
                    var translated = translationService.Translate("ApiMessages", message);
                    if (translated != message) return translated;
                }
                return message;
            })
            .ToList();

        return BadRequestWithErrors(errors);
    }

    /// <summary>
    /// Adds errors to HttpContext for middleware to include in headers
    /// </summary>
    private void AddErrorsToContext(List<string> errors)
    {
        HttpContext.Items["Errors"] = errors;
    }

    /// <summary>
    /// Executes a query with automatic limiting based on MAX_RECORDS_QUERIES_COUNT.
    /// Sets X-Has-More-Records and X-Total-Count headers if there are more records than the limit.
    /// </summary>
    /// <typeparam name="T">Entity type</typeparam>
    /// <param name="query">The IQueryable to execute</param>
    /// <returns>List of results limited by MAX_RECORDS_QUERIES_COUNT</returns>
    protected async Task<List<T>> ExecuteLimitedQueryAsync<T>(IQueryable<T> query)
    {
        var maxRecords = MaxRecordsCount;
        
        // Get total count
        var totalCount = await query.CountAsync();
        
        // Take only up to maxRecords + 1 to check if there are more
        var results = await query.Take(maxRecords + 1).ToListAsync();
        
        // Check if there are more records than the limit
        var hasMoreRecords = results.Count > maxRecords;
        
        // If there are more, remove the extra record
        if (hasMoreRecords)
        {
            results = results.Take(maxRecords).ToList();
        }
        
        // Set context items for middleware to add headers
        HttpContext.Items["HasMoreRecords"] = hasMoreRecords;
        HttpContext.Items["TotalCount"] = totalCount;
        
        return results;
    }

    /// <summary>
    /// Sets query metadata headers (total count and has more records flag)
    /// </summary>
    protected void SetQueryMetadata(int totalCount, bool hasMoreRecords)
    {
        HttpContext.Items["TotalCount"] = totalCount;
        HttpContext.Items["HasMoreRecords"] = hasMoreRecords;
    }

    /// <summary>
    /// Returns an Ok result with success wrapper
    /// </summary>
    protected ActionResult OkWithSuccess<T>(T data)
    {
        return Ok(new { data, success = true });
    }
}
