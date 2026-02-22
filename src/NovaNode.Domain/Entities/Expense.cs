using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Expense record.
/// </summary>
public class Expense : TenantEntity
{
    public Guid CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime OccurredAt { get; set; }
    public string? Notes { get; set; }
    public Guid CreatedByUserId { get; set; }

    // Navigation
    public ExpenseCategory Category { get; set; } = null!;
}
