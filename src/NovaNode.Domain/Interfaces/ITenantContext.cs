namespace NovaNode.Domain.Interfaces;

/// <summary>
/// Provides current tenant context resolved from the request.
/// </summary>
public interface ITenantContext
{
    Guid? TenantId { get; }
    string? TenantSlug { get; }
    bool IsResolved { get; }
    void Set(Guid tenantId, string slug);
}
