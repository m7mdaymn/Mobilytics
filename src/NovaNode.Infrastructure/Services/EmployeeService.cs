using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Employees;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Entities;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public class EmployeeService : IEmployeeService
{
    private readonly AppDbContext _db;
    public EmployeeService(AppDbContext db) => _db = db;

    public async Task<List<EmployeeDto>> GetAllAsync(Guid tenantId, CancellationToken ct = default) =>
        await _db.Employees.Include(e => e.Permissions).Where(e => e.TenantId == tenantId)
            .Select(e => MapDto(e)).ToListAsync(ct);

    public async Task<EmployeeDto> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var emp = await _db.Employees.Include(e => e.Permissions)
            .FirstOrDefaultAsync(e => e.TenantId == tenantId && e.Id == id, ct)
            ?? throw new KeyNotFoundException("Employee not found.");
        return MapDto(emp);
    }

    public async Task<EmployeeDto> CreateAsync(Guid tenantId, CreateEmployeeRequest request, CancellationToken ct = default)
    {
        var emp = new Employee
        {
            TenantId = tenantId, Name = request.Name, Phone = request.Phone,
            Email = request.Email, PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role, SalaryMonthly = request.SalaryMonthly
        };
        _db.Employees.Add(emp);
        await _db.SaveChangesAsync(ct);
        return MapDto(emp);
    }

    public async Task<EmployeeDto> UpdateAsync(Guid tenantId, Guid id, UpdateEmployeeRequest request, CancellationToken ct = default)
    {
        var emp = await _db.Employees.Include(e => e.Permissions)
            .FirstOrDefaultAsync(e => e.TenantId == tenantId && e.Id == id, ct)
            ?? throw new KeyNotFoundException("Employee not found.");
        emp.Name = request.Name; emp.Phone = request.Phone; emp.Email = request.Email;
        emp.Role = request.Role; emp.SalaryMonthly = request.SalaryMonthly; emp.IsActive = request.IsActive;
        await _db.SaveChangesAsync(ct);
        return MapDto(emp);
    }

    public async Task DeleteAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var emp = await _db.Employees.FirstOrDefaultAsync(e => e.TenantId == tenantId && e.Id == id, ct)
            ?? throw new KeyNotFoundException("Employee not found.");
        _db.Employees.Remove(emp);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdatePermissionsAsync(Guid tenantId, Guid employeeId, UpdatePermissionsRequest request, CancellationToken ct = default)
    {
        var emp = await _db.Employees.Include(e => e.Permissions)
            .FirstOrDefaultAsync(e => e.TenantId == tenantId && e.Id == employeeId, ct)
            ?? throw new KeyNotFoundException("Employee not found.");

        _db.Permissions.RemoveRange(emp.Permissions);
        foreach (var p in request.Permissions)
        {
            _db.Permissions.Add(new Permission
            {
                TenantId = tenantId, EmployeeId = employeeId, Key = p.Key, IsEnabled = p.IsEnabled
            });
        }
        await _db.SaveChangesAsync(ct);
    }

    public async Task<int> GenerateSalaryExpensesAsync(Guid tenantId, string month, Guid userId, CancellationToken ct = default)
    {
        if (!DateTime.TryParse($"{month}-01", out var monthDate))
            throw new ArgumentException("Invalid month format. Use YYYY-MM.");

        var employees = await _db.Employees.Where(e => e.TenantId == tenantId && e.IsActive && e.SalaryMonthly > 0).ToListAsync(ct);

        // Find or create Salaries expense category
        var salariesCat = await _db.ExpenseCategories.FirstOrDefaultAsync(ec => ec.TenantId == tenantId && ec.Name == "Salaries", ct);
        if (salariesCat == null)
        {
            salariesCat = new ExpenseCategory { TenantId = tenantId, Name = "Salaries" };
            _db.ExpenseCategories.Add(salariesCat);
            await _db.SaveChangesAsync(ct);
        }

        int count = 0;
        foreach (var emp in employees)
        {
            _db.Expenses.Add(new Expense
            {
                TenantId = tenantId, CategoryId = salariesCat.Id,
                Title = $"Salary - {emp.Name} ({month})",
                Amount = emp.SalaryMonthly, OccurredAt = monthDate,
                CreatedByUserId = userId
            });
            count++;
        }
        await _db.SaveChangesAsync(ct);
        return count;
    }

    private static EmployeeDto MapDto(Employee e) => new()
    {
        Id = e.Id, Name = e.Name, Phone = e.Phone, Email = e.Email,
        Role = e.Role, SalaryMonthly = e.SalaryMonthly, IsActive = e.IsActive,
        Permissions = e.Permissions.Select(p => new PermissionDto { Id = p.Id, Key = p.Key, IsEnabled = p.IsEnabled }).ToList()
    };
}
