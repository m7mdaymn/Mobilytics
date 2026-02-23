using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.Interfaces;

namespace NovaNode.Api.Controllers.Platform;

[Authorize(Roles = "SuperAdmin")]
[Route("api/v1/platform/store-requests")]
public class PlatformStoreRequestsController : BaseApiController
{
    private readonly IPlatformService _svc;
    public PlatformStoreRequestsController(IPlatformService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, CancellationToken ct) =>
        Ok(await _svc.GetStoreRequestsAsync(status, ct));

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStoreRequestStatusBody body, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException());
        return Ok(await _svc.UpdateStoreRequestStatusAsync(id, body.Status, body.Notes, userId, ct));
    }
}

public class UpdateStoreRequestStatusBody
{
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
