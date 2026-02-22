using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.DTOs.Leads;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;

namespace NovaNode.Api.Controllers;

[Authorize]
public class LeadsController : BaseApiController
{
    private readonly ILeadService _svc;
    private readonly ITenantContext _tenantContext;

    public LeadsController(ILeadService svc, ITenantContext tenantContext)
    {
        _svc = svc;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] LeadFilterRequest filter, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetAllAsync(tenantId, filter, ct));
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateLeadStatusRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _svc.UpdateStatusAsync(tenantId, id, request, ct);
        return NoContent();
    }

    [HttpGet("{id:guid}/follow-up-link")]
    public async Task<IActionResult> GetFollowUpLink(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var link = await _svc.GetFollowUpLinkAsync(tenantId, id, ct);
        return Ok(link);
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export([FromQuery] LeadFilterRequest filter, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var bytes = await _svc.ExportAsync(tenantId, filter, ct);
        return File(bytes, "text/csv", "leads.csv");
    }
}
