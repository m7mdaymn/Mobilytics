using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.DTOs.Installments;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;

namespace NovaNode.Api.Controllers;

[Authorize]
public class InstallmentsController : BaseApiController
{
    private readonly IInstallmentService _svc;
    private readonly ITenantContext _tenantContext;

    public InstallmentsController(IInstallmentService svc, ITenantContext tenantContext)
    {
        _svc = svc;
        _tenantContext = tenantContext;
    }

    // ── Providers ──

    [HttpGet("providers")]
    public async Task<IActionResult> GetProviders(CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetProvidersAsync(tenantId, ct));
    }

    [HttpGet("providers/{id:guid}")]
    public async Task<IActionResult> GetProvider(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetProviderAsync(tenantId, id, ct));
    }

    [HttpPost("providers")]
    public async Task<IActionResult> CreateProvider([FromBody] CreateProviderRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Created(await _svc.CreateProviderAsync(tenantId, request, ct));
    }

    [HttpPut("providers/{id:guid}")]
    public async Task<IActionResult> UpdateProvider(Guid id, [FromBody] UpdateProviderRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.UpdateProviderAsync(tenantId, id, request, ct));
    }

    [HttpDelete("providers/{id:guid}")]
    public async Task<IActionResult> DeleteProvider(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _svc.DeleteProviderAsync(tenantId, id, ct);
        return NoContent();
    }

    // ── Plans ──

    [HttpGet("plans")]
    public async Task<IActionResult> GetPlans([FromQuery] Guid? providerId, [FromQuery] Guid? itemId, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetPlansAsync(tenantId, providerId, itemId, ct));
    }

    [HttpPost("plans")]
    public async Task<IActionResult> CreatePlan([FromBody] CreateInstallmentPlanRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Created(await _svc.CreatePlanAsync(tenantId, request, ct));
    }

    [HttpPut("plans/{id:guid}")]
    public async Task<IActionResult> UpdatePlan(Guid id, [FromBody] UpdateInstallmentPlanRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.UpdatePlanAsync(tenantId, id, request, ct));
    }

    [HttpDelete("plans/{id:guid}")]
    public async Task<IActionResult> DeletePlan(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _svc.DeletePlanAsync(tenantId, id, ct);
        return NoContent();
    }
}
