using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Installment plan offered by a provider for a specific item or globally.
/// </summary>
public class InstallmentPlan : TenantEntity
{
    public Guid ProviderId { get; set; }
    public InstallmentProvider Provider { get; set; } = null!;

    /// <summary>Optional link to a specific item. Null = available for all items.</summary>
    public Guid? ItemId { get; set; }
    public Item? Item { get; set; }

    public int Months { get; set; }
    public decimal MonthlyPayment { get; set; }
    public decimal DownPayment { get; set; }
    public decimal AdminFees { get; set; }
    public decimal TotalAmount { get; set; }

    /// <summary>Down payment as percentage of item price (0-100). Null = use fixed DownPayment.</summary>
    public decimal? DownPaymentPercent { get; set; }

    /// <summary>Admin fees as percentage of item price (0-100). Null = use fixed AdminFees.</summary>
    public decimal? AdminFeesPercent { get; set; }

    /// <summary>Interest rate as annual percentage. Null = no interest / use fixed totals.</summary>
    public decimal? InterestRate { get; set; }

    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
}
