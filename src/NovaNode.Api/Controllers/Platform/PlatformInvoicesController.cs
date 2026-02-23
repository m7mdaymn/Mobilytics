using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.Interfaces;

namespace NovaNode.Api.Controllers.Platform;

[Authorize(Roles = "SuperAdmin")]
[Route("api/v1/platform/invoices")]
public class PlatformInvoicesController : BaseApiController
{
    private readonly IPlatformService _svc;
    public PlatformInvoicesController(IPlatformService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? tenantId, CancellationToken ct) =>
        Ok(await _svc.GetInvoicesAsync(tenantId, ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        Ok(await _svc.GetInvoiceAsync(id, ct));
}
