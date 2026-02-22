using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Represents a tenant (phone shop) on the platform.
/// </summary>
public class Tenant : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string? SupportPhone { get; set; }
    public string? SupportWhatsApp { get; set; }
    public string? Address { get; set; }
    public string? MapUrl { get; set; }

    // Navigation
    public ICollection<Subscription> Subscriptions { get; set; } = [];
    public TenantFeatureToggle? FeatureToggle { get; set; }
    public StoreSettings? StoreSettings { get; set; }
}
