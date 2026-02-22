using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Employee / staff member.
/// </summary>
public class Employee : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Manager"; // Owner or Manager
    public decimal SalaryMonthly { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Permission> Permissions { get; set; } = [];
}
