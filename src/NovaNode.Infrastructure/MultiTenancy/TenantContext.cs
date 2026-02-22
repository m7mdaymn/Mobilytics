using NovaNode.Domain.Interfaces;

namespace NovaNode.Infrastructure.MultiTenancy;

/// <summary>
/// Scoped service that holds current tenant context per request.
/// </summary>
public class TenantContext : ITenantContext
{
    public Guid? TenantId { get; private set; }
    public string? TenantSlug { get; private set; }
    public bool IsResolved => TenantId.HasValue;

    public void Set(Guid tenantId, string slug)
    {
        TenantId = tenantId;
        TenantSlug = slug;
    }
}
