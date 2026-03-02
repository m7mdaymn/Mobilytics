using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

public class EmployeeAbsence : TenantEntity
{
    public Guid EmployeeId { get; set; }
    public DateTime AbsenceDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public bool IsExcused { get; set; }

    // Navigation
    public Employee Employee { get; set; } = null!;
}
