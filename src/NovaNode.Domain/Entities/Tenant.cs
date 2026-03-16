using NovaNode.Domain.Common;
using NovaNode.Domain.Enums;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Represents a tenant (phone shop) on the platform.
/// </summary>
public class Tenant : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string FallbackSubdomain { get; set; } = string.Empty;
    public string PrimaryDomain { get; set; } = string.Empty;
    public string? CustomDomain { get; set; }
    public DomainVerificationStatus CustomDomainVerificationStatus { get; set; } = DomainVerificationStatus.Pending;
    public bool CustomDomainIsActive { get; set; }
    public DateTime? CustomDomainVerifiedAt { get; set; }
    public bool RedirectFallbackToPrimary { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public string? SupportPhone { get; set; }
    public string? SupportWhatsApp { get; set; }
    public string? Address { get; set; }
    public string? MapUrl { get; set; }

    // Navigation
    public ICollection<Subscription> Subscriptions { get; set; } = [];
    public TenantFeatureToggle? FeatureToggle { get; set; }
    public StoreSettings? StoreSettings { get; set; }
    public ICollection<TenantSlugHistory> SlugHistory { get; set; } = [];
}
