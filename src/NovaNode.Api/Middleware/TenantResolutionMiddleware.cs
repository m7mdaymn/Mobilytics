using Microsoft.EntityFrameworkCore;
using NovaNode.Domain.Interfaces;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Api.Middleware;

/// <summary>
/// Resolves the current tenant from the X-Tenant-Slug request header.
/// The backend API runs on a single fixed host (e.g. https://api.mobilytics.com)
/// while tenants are identified exclusively by this header.
/// </summary>
public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;

    private static readonly string[] ExemptPrefixes =
    [
        "/api/v1/platform",
        "/swagger",
        "/uploads",
        "/health"
    ];

    public TenantResolutionMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";

        // Skip tenant resolution for platform routes, swagger, uploads, and health
        if (ExemptPrefixes.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        // Resolve tenant ONLY from X-Tenant-Slug header (case-insensitive header lookup)
        if (!context.Request.Headers.TryGetValue("X-Tenant-Slug", out var headerSlug) ||
            string.IsNullOrWhiteSpace(headerSlug.ToString()))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(
                "{\"success\":false,\"message\":\"X-Tenant-Slug header is required for tenant-scoped endpoints.\"}");
            return;
        }

        var slug = headerSlug.ToString().Trim();

        var db = context.RequestServices.GetRequiredService<AppDbContext>();
        var tenant = await db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Slug == slug);

        if (tenant != null)
        {
            var tenantContext = context.RequestServices.GetRequiredService<ITenantContext>();
            tenantContext.Set(tenant.Id, tenant.Slug);
        }

        await _next(context);
    }
}
