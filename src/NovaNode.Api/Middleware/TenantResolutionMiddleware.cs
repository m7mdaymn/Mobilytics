using Microsoft.EntityFrameworkCore;
using NovaNode.Domain.Interfaces;
using NovaNode.Domain.Enums;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Api.Middleware;

/// <summary>
/// Resolves tenant context from request host/domain.
/// Tenant identity is host-first and no longer depends on X-Tenant-Slug.
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

    private readonly IConfiguration _configuration;

    public TenantResolutionMiddleware(RequestDelegate next, IConfiguration configuration)
    {
        _next = next;
        _configuration = configuration;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";

        // Skip tenant resolution entirely for platform routes, swagger, uploads, and health
        if (ExemptPrefixes.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        // For public endpoints: tenant resolution is optional.
        var isOptional = OptionalTenantPrefixes.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase));

        var effectiveHost = GetEffectiveHost(context);
        var rootDomain = (_configuration["Domain:PlatformRootDomain"] ?? "mobilytics.app").Trim().ToLowerInvariant();
        var platformAdminHost = (_configuration["Domain:PlatformAdminHost"] ?? $"admin.{rootDomain}").Trim().ToLowerInvariant();

        // Platform hosts should not resolve as tenants.
        if (IsPlatformHost(effectiveHost, rootDomain, platformAdminHost))
        {
            if (!isOptional)
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    "{\"success\":false,\"message\":\"Tenant not resolved for this host.\"}");
                return;
            }

            await _next(context);
            return;
        }

        var db = context.RequestServices.GetRequiredService<AppDbContext>();
        var tenant = await ResolveTenantByHostAsync(db, effectiveHost, rootDomain, context.RequestAborted);

        if (tenant == null)
        {
            if (isOptional)
            {
                // Public optional endpoint may proceed unresolved.
                await _next(context);
                return;
            }

            context.Response.StatusCode = StatusCodes.Status404NotFound;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(
                "{\"success\":false,\"message\":\"Tenant not found for this host.\"}");
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

    private static async Task<Domain.Entities.Tenant?> ResolveTenantByHostAsync(
        AppDbContext db,
        string host,
        string rootDomain,
        CancellationToken ct)
    {
        // 1) Verified active custom domain has priority.
        var byCustom = await db.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t =>
                t.CustomDomain != null &&
                t.CustomDomainIsActive &&
                t.CustomDomainVerificationStatus == DomainVerificationStatus.Verified &&
                t.CustomDomain.ToLower() == host,
                ct);
        if (byCustom != null) return byCustom;

        // 2) Fallback subdomain under platform root.
        if (host.EndsWith($".{rootDomain}", StringComparison.OrdinalIgnoreCase))
        {
            var sub = host[..^(rootDomain.Length + 1)].Trim().ToLowerInvariant();
            if (!string.IsNullOrWhiteSpace(sub) && !sub.Contains('.'))
            {
                return await db.Tenants.AsNoTracking()
                    .FirstOrDefaultAsync(t => t.FallbackSubdomain.ToLower() == sub, ct);
            }
        }

        // 3) Direct host match with configured primary domain.
        return await db.Tenants.AsNoTracking()
            .FirstOrDefaultAsync(t => t.PrimaryDomain.ToLower() == host, ct);
    }

    private static bool IsPlatformHost(string host, string rootDomain, string platformAdminHost)
    {
        if (string.IsNullOrWhiteSpace(host)) return true;
        if (host.Equals(rootDomain, StringComparison.OrdinalIgnoreCase)) return true;
        if (host.Equals($"www.{rootDomain}", StringComparison.OrdinalIgnoreCase)) return true;
        if (host.Equals(platformAdminHost, StringComparison.OrdinalIgnoreCase)) return true;
        if (host.Equals("localhost", StringComparison.OrdinalIgnoreCase)) return true;
        if (host.StartsWith("localhost:", StringComparison.OrdinalIgnoreCase)) return true;
        if (host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)) return true;
        if (host.StartsWith("127.0.0.1:", StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }

    private static string GetEffectiveHost(HttpContext context)
    {
        static string? ParseHost(string value)
        {
            if (Uri.TryCreate(value, UriKind.Absolute, out var uri))
            {
                return uri.Host.ToLowerInvariant();
            }

            var raw = value.Trim();
            if (string.IsNullOrWhiteSpace(raw)) return null;
            if (raw.Contains(',')) raw = raw.Split(',')[0].Trim();
            if (raw.Contains(':')) raw = raw.Split(':')[0].Trim();
            return raw.ToLowerInvariant();
        }

        var appHost = context.Request.Headers["X-App-Host"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(appHost))
        {
            var host = ParseHost(appHost);
            if (!string.IsNullOrWhiteSpace(host)) return host;
        }

        // For browser traffic, Origin/Referer better represents tenant host than proxy forwarded host.
        var origin = context.Request.Headers["Origin"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(origin))
        {
            var host = ParseHost(origin);
            if (!string.IsNullOrWhiteSpace(host)) return host;
        }

        var referer = context.Request.Headers["Referer"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(referer))
        {
            var host = ParseHost(referer);
            if (!string.IsNullOrWhiteSpace(host)) return host;
        }

        var xfh = context.Request.Headers["X-Forwarded-Host"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(xfh))
        {
            var host = ParseHost(xfh);
            if (!string.IsNullOrWhiteSpace(host)) return host;
        }

        return context.Request.Host.Host.ToLowerInvariant();
    }
}
