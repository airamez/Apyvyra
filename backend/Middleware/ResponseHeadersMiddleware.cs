using System.Text.Json;
using Microsoft.AspNetCore.Http;

namespace backend.Middleware;

/// <summary>
/// Middleware to add standardized success and error headers to all API responses
/// </summary>
public class ResponseHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public ResponseHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var originalBodyStream = context.Response.Body;

        using var responseBody = new MemoryStream();
        context.Response.Body = responseBody;

        await _next(context);

        // Add success header based on status code
        var isSuccess = context.Response.StatusCode >= 200 && context.Response.StatusCode < 300;
        context.Response.Headers["X-Success"] = isSuccess.ToString().ToLower();

        // If errors were added to response items, include them in header
        if (context.Items.TryGetValue("Errors", out var errors) && errors is List<string> errorList)
        {
            context.Response.Headers["X-Errors"] = JsonSerializer.Serialize(errorList);
        }

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        await responseBody.CopyToAsync(originalBodyStream);
    }
}
