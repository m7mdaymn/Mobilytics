using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.DTOs.Platform;
using NovaNode.Application.Interfaces;

namespace NovaNode.Api.Controllers.Platform;

[Authorize(Roles = "SuperAdmin")]
[Route("api/v1/platform/plans")]
public class PlatformPlansController : BaseApiController
{
    private readonly IPlatformService _svc;
    public PlatformPlansController(IPlatformService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await _svc.GetPlansAsync(ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePlanRequest request, CancellationToken ct) =>
        Created(await _svc.CreatePlanAsync(request, ct));

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePlanRequest request, CancellationToken ct) =>
        Ok(await _svc.UpdatePlanAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _svc.DeletePlanAsync(id, ct);
        return NoContent();
    }
}
