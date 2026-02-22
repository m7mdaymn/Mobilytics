using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Subscription plan.
/// </summary>
public class Plan : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public decimal PriceMonthly { get; set; }
    public decimal ActivationFee { get; set; }
    public string? LimitsJson { get; set; }
    public string? FeaturesJson { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Subscription> Subscriptions { get; set; } = [];
}
