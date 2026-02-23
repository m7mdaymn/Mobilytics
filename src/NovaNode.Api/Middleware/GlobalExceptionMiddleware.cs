using System.Net;
using System.Text.Json;
using FluentValidation;

namespace NovaNode.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    private static readonly JsonSerializerOptions _jsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            var errors = ex.Errors.Select(e => $"{e.PropertyName}: {e.ErrorMessage}").ToList();
            await WriteEnvelope(context, 400, string.Join(" ", errors), errors);
        }
        catch (KeyNotFoundException ex)
        {
            await WriteEnvelope(context, 404, ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            await WriteEnvelope(context, 401, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            await WriteEnvelope(context, 400, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            await WriteEnvelope(context, 500, "An unexpected error occurred.");
        }
    }

    private static async Task WriteEnvelope(HttpContext context, int statusCode, string message, List<string>? errors = null)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        var envelope = new { success = false, message, errors, data = (object?)null };
        await context.Response.WriteAsync(JsonSerializer.Serialize(envelope, _jsonOpts));
    }
}
