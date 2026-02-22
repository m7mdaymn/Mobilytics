using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.Interfaces;

namespace NovaNode.Api.Controllers.Platform;

[Authorize(Roles = "SuperAdmin")]
[Route("api/v1/platform/dashboard")]
public class PlatformDashboardController : BaseApiController
{
    private readonly IPlatformService _svc;
    public PlatformDashboardController(IPlatformService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string range = "month", CancellationToken ct = default) =>
        Ok(await _svc.GetDashboardAsync(range, ct));
}
