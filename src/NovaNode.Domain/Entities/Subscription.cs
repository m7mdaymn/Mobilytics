using NovaNode.Domain.Common;
using NovaNode.Domain.Enums;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Subscription linking a tenant to a plan.
/// </summary>
public class Subscription : AuditableEntity
{
    public Guid TenantId { get; set; }
    public Guid PlanId { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Trial;
    public DateTime? TrialStart { get; set; }
    public DateTime? TrialEnd { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? GraceEnd { get; set; }
    public decimal? LastPaymentAmount { get; set; }
    public string? Notes { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public Plan Plan { get; set; } = null!;
}
