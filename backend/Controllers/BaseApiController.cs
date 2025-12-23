using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace backend.Controllers;

/// <summary>
/// Base controller with standardized error handling
/// </summary>
[ApiController]
public abstract class BaseApiController : ControllerBase
{
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
    /// Returns validation errors from ModelState
    /// </summary>
    protected ActionResult ValidationErrors()
    {
        var errors = ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
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
}
