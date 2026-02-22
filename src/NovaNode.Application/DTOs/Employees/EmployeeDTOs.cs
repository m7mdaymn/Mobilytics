namespace NovaNode.Application.DTOs.Employees;

public class EmployeeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public decimal SalaryMonthly { get; set; }
    public bool IsActive { get; set; }
    public List<PermissionDto> Permissions { get; set; } = [];
}

public class CreateEmployeeRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = "Manager";
    public decimal SalaryMonthly { get; set; }
}

public class UpdateEmployeeRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Manager";
    public decimal SalaryMonthly { get; set; }
    public bool IsActive { get; set; } = true;
}

public class PermissionDto
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
}

public class UpdatePermissionsRequest
{
    public List<PermissionEntry> Permissions { get; set; } = [];
}

public class PermissionEntry
{
    public string Key { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
}

public class GenerateSalaryExpensesRequest
{
    public string Month { get; set; } = string.Empty; // YYYY-MM
}
