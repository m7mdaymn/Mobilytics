using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;

namespace NovaNode.Api.Controllers;

[Authorize]
public class AuditController : BaseApiController
{
    private readonly IAuditService _svc;
    private readonly ITenantContext _tenantContext;

    public AuditController(IAuditService svc, ITenantContext tenantContext)
    {
        _svc = svc;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetLogsAsync(tenantId, page, pageSize, ct));
    }
}
