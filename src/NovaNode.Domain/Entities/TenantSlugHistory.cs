using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Tracks slug changes so old URLs redirect to the current slug.
/// </summary>
public class TenantSlugHistory : BaseEntity
{
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;
    public string OldSlug { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}
