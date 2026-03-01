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

    /// <summary>
    /// Prefixes that skip tenant resolution entirely (no slug needed).
    /// </summary>
    private static readonly string[] ExemptPrefixes =
    [
        "/api/v1/platform",
        "/api/v1/stores",
        "/swagger",
        "/uploads",
        "/health"
    ];

    /// <summary>
    /// Prefixes where tenant resolution is optional — try to resolve if header present,
    /// but don't fail if missing. Individual endpoints handle the unresolved case.
    /// </summary>
    private static readonly string[] OptionalTenantPrefixes =
    [
        "/api/v1/public"
    ];

    public TenantResolutionMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";

        // Skip tenant resolution entirely for platform routes, swagger, uploads, and health
        if (ExemptPrefixes.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        // For public endpoints: try to resolve tenant if header is present, but don't require it
        var isOptional = OptionalTenantPrefixes.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase));

        if (!context.Request.Headers.TryGetValue("X-Tenant-Slug", out var headerSlug) ||
            string.IsNullOrWhiteSpace(headerSlug.ToString()))
        {
            if (isOptional)
            {
                // No header, but that's OK for public endpoints — proceed without tenant
                await _next(context);
                return;
            }

            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(
                "{\"success\":false,\"message\":\"X-Tenant-Slug header is required for tenant-scoped endpoints.\"}");
            return;
        }

        var slug = headerSlug.ToString().Trim();

        var db = context.RequestServices.GetRequiredService<AppDbContext>();
        var tenant = await db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Slug == slug);

        if (tenant == null)
        {
            if (isOptional)
            {
                // Slug provided but not found — still allow through for public (controller handles it)
                await _next(context);
                return;
            }

            context.Response.StatusCode = StatusCodes.Status404NotFound;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(
                $"{{\"success\":false,\"message\":\"Tenant '{slug}' not found.\"}}");
            return;
        }

        // Block suspended/inactive tenants (except public routes which can show a "store unavailable" message)
        if (!tenant.IsActive && !isOptional)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(
                "{\"success\":false,\"message\":\"This store is currently suspended. Please contact support.\"}");
            return;
        }

        var tenantContext = context.RequestServices.GetRequiredService<ITenantContext>();
        tenantContext.Set(tenant.Id, tenant.Slug);

        await _next(context);
    }
}
