using Microsoft.EntityFrameworkCore;
using NovaNode.Domain.Enums;
using NovaNode.Domain.Interfaces;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Api.Middleware;

public class SubscriptionEnforcementMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly HashSet<string> _bypassPrefixes = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/v1/platform",
        "/api/v1/auth",
        "/api/v1/public",
        "/swagger",
        "/uploads",
        "/health"
    };

    public SubscriptionEnforcementMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";

        // Bypass for platform, auth, public, swagger, static
        if (_bypassPrefixes.Any(prefix => path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        var tenantContext = context.RequestServices.GetRequiredService<ITenantContext>();
        if (!tenantContext.IsResolved)
        {
            await _next(context);
            return;
        }

        var db = context.RequestServices.GetRequiredService<AppDbContext>();
        var tenant = await db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tenantContext.TenantId);

        if (tenant != null && !tenant.IsActive)
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new { error = "Tenant is suspended." });
            return;
        }

        // Check subscription status
        var sub = await db.Subscriptions.AsNoTracking()
            .Where(s => s.TenantId == tenantContext.TenantId)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();

        if (sub != null)
        {
            var now = DateTime.UtcNow;
            // Auto-transition: Trial → Expired
            if (sub.Status == SubscriptionStatus.Trial && sub.TrialEnd.HasValue && sub.TrialEnd.Value < now)
            {
                sub = null; // treat as expired
            }
            // Auto-transition: Active → Grace → Expired
            else if (sub.Status == SubscriptionStatus.Active && sub.EndDate.HasValue && sub.EndDate.Value < now)
            {
                if (sub.GraceEnd.HasValue && sub.GraceEnd.Value >= now)
                {
                    // In grace period - allow read-only
                    if (!HttpMethods.IsGet(context.Request.Method) && !HttpMethods.IsHead(context.Request.Method))
                    {
                        context.Response.StatusCode = 403;
                        await context.Response.WriteAsJsonAsync(new { error = "Subscription in grace period. Read-only access." });
                        return;
                    }
                }
                else
                {
                    context.Response.StatusCode = 403;
                    await context.Response.WriteAsJsonAsync(new { error = "Subscription expired." });
                    return;
                }
            }
            else if (sub.Status == SubscriptionStatus.Expired || sub.Status == SubscriptionStatus.Suspended)
            {
                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new { error = $"Subscription {sub.Status.ToString().ToLower()}." });
                return;
            }
        }

        await _next(context);
    }
}
