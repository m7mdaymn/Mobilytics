using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Api.Middleware;
using NovaNode.Application.DTOs.Employees;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;

namespace NovaNode.Api.Controllers;

[Authorize]
public class EmployeesController : BaseApiController
{
    private readonly IEmployeeService _svc;
    private readonly ITenantContext _tenantContext;
    private readonly IAuditService _audit;

    public EmployeesController(IEmployeeService svc, ITenantContext tenantContext, IAuditService audit)
    {
        _svc = svc;
        _tenantContext = tenantContext;
        _audit = audit;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException());

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetAllAsync(tenantId, ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetByIdAsync(tenantId, id, ct));
    }

    [HttpPost]
    [RequirePermission("employees.manage")]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var result = await _svc.CreateAsync(tenantId, request, ct);
        await _audit.LogAsync(tenantId, GetUserId(), "Created", "Employee", result.Id.ToString(), null, result.Name, ct);
        return Created(result);
    }

    [HttpPut("{id:guid}")]
    [RequirePermission("employees.manage")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmployeeRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var result = await _svc.UpdateAsync(tenantId, id, request, ct);
        await _audit.LogAsync(tenantId, GetUserId(), "Updated", "Employee", id.ToString(), null, result.Name, ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [RequirePermission("employees.manage")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _audit.LogAsync(tenantId, GetUserId(), "Deleted", "Employee", id.ToString(), null, null, ct);
        await _svc.DeleteAsync(tenantId, id, ct);
        return Ok(true);
    }

    [HttpPut("{id:guid}/permissions")]
    public async Task<IActionResult> UpdatePermissions(Guid id, [FromBody] UpdatePermissionsRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _svc.UpdatePermissionsAsync(tenantId, id, request, ct);
        await _audit.LogAsync(tenantId, GetUserId(), "Updated", "Permissions", id.ToString(), null, null, ct);
        return Ok(true);
    }

    [HttpPost("generate-salary-expenses")]
    public async Task<IActionResult> GenerateSalaryExpenses([FromBody] GenerateSalaryExpensesRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var userId = GetUserId();
        var count = await _svc.GenerateSalaryExpensesAsync(tenantId, request.Month, userId, ct);
        return Ok(count);
    }

    // ── Absences ──

    [HttpGet("absences")]
    public async Task<IActionResult> GetAbsences([FromQuery] Guid? employeeId, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetAbsencesAsync(tenantId, employeeId, ct));
    }

    [HttpPost("absences")]
    [RequirePermission("employees.manage")]
    public async Task<IActionResult> CreateAbsence([FromBody] CreateAbsenceRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var result = await _svc.CreateAbsenceAsync(tenantId, request, ct);
        await _audit.LogAsync(tenantId, GetUserId(), "Created", "Absence", result.Id.ToString(), null, result.EmployeeName, ct);
        return Created(result);
    }

    [HttpDelete("absences/{id:guid}")]
    [RequirePermission("employees.manage")]
    public async Task<IActionResult> DeleteAbsence(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _audit.LogAsync(tenantId, GetUserId(), "Deleted", "Absence", id.ToString(), null, null, ct);
        await _svc.DeleteAbsenceAsync(tenantId, id, ct);
        return NoContent();
    }
}
