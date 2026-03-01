using NovaNode.Domain.Interfaces;

namespace NovaNode.Api.Middleware;

/// <summary>
/// Validates that an authenticated user's JWT tenantId claim matches the resolved tenant context.
/// Prevents store owners from accessing other stores' data by manipulating the X-Tenant-Slug header.
/// Runs AFTER authentication and tenant resolution.
/// </summary>
public class TenantClaimValidationMiddleware
{
    private readonly RequestDelegate _next;

    /// <summary>
    /// Routes that skip tenant claim validation (platform routes, public routes, etc.)
    /// </summary>
    private static readonly string[] ExemptPrefixes =
    [
        "/api/v1/platform",
        "/api/v1/stores",
        "/api/v1/public",
        "/swagger",
        "/uploads",
        "/health"
    ];

    public TenantClaimValidationMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";

        // Skip validation for exempt routes
        if (ExemptPrefixes.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        // Only validate if the user is authenticated AND tenant context is resolved
        if (context.User?.Identity?.IsAuthenticated == true)
        {
            var tenantContext = context.RequestServices.GetRequiredService<ITenantContext>();

            if (tenantContext.IsResolved)
            {
                // Search all claims for one containing tenantId
                var tokenTenantId = context.User.FindFirst("tenantId")?.Value
                    ?? context.User.FindFirst("tenant_id")?.Value
                    ?? context.User.FindFirst("TenantId")?.Value
                    ?? context.User.Claims.FirstOrDefault(c =>
                        c.Type.Contains("tenantId", StringComparison.OrdinalIgnoreCase) ||
                        c.Type.Contains("tenant_id", StringComparison.OrdinalIgnoreCase))?.Value;

                if (!string.IsNullOrEmpty(tokenTenantId) &&
                    Guid.TryParse(tokenTenantId, out var claimTenantId) &&
                    claimTenantId != tenantContext.TenantId!.Value)
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(
                        "{\"success\":false,\"message\":\"Access denied. You can only access your own store.\"}");
                    return;
                }

                // If authenticated in a tenant context but no tenantId claim at all, deny access
                if (string.IsNullOrEmpty(tokenTenantId))
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(
                        "{\"success\":false,\"message\":\"Access denied. Token missing tenant information.\"}");
                    return;
                }
            }
        }

        await _next(context);
    }
}
