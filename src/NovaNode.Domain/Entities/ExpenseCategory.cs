using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Expense category.
/// </summary>
public class ExpenseCategory : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public ICollection<Expense> Expenses { get; set; } = [];
}
