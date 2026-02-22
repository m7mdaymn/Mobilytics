using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Feature toggles per tenant.
/// </summary>
public class TenantFeatureToggle : BaseEntity
{
    public Guid TenantId { get; set; }
    public bool CanRemovePoweredBy { get; set; }
    public bool AdvancedReports { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
}
