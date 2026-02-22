using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Permission for a role within a tenant.
/// </summary>
public class Permission : TenantEntity
{
    public Guid EmployeeId { get; set; }
    public string Key { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;

    // Navigation
    public Employee Employee { get; set; } = null!;
}
