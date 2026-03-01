using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.DTOs.Reports;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;

namespace NovaNode.Api.Controllers;

[Authorize]
public class ReportsController : BaseApiController
{
    private readonly IReportService _svc;
    private readonly ITenantContext _tenantContext;

    public ReportsController(IReportService svc, ITenantContext tenantContext)
    {
        _svc = svc;
        _tenantContext = tenantContext;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard([FromQuery] DashboardFilterRequest filter, CancellationToken ct)
    {
        if (_tenantContext.TenantId is null)
            return BadRequest(new { message = "Tenant context not resolved. Ensure X-Tenant-Slug header is set." });

        var tenantId = _tenantContext.TenantId.Value;
        return Ok(await _svc.GetDashboardAsync(tenantId, filter, ct));
    }
}
