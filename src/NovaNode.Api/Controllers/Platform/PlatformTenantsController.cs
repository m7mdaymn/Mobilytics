using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.DTOs.Platform;
using NovaNode.Application.Interfaces;

namespace NovaNode.Api.Controllers.Platform;

[Authorize(Roles = "SuperAdmin")]
[Route("api/v1/platform/tenants")]
public class PlatformTenantsController : BaseApiController
{
    private readonly IPlatformService _svc;
    public PlatformTenantsController(IPlatformService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await _svc.GetTenantsAsync(ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        Ok(await _svc.GetTenantAsync(id, ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTenantRequest request, CancellationToken ct) =>
        Created(await _svc.CreateTenantAsync(request, ct));

    [HttpPost("onboard")]
    public async Task<IActionResult> Onboard([FromBody] OnboardTenantRequest request, CancellationToken ct) =>
        Created(await _svc.OnboardTenantAsync(request, ct));

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTenantRequest request, CancellationToken ct) =>
        Ok(await _svc.UpdateTenantAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _svc.DeleteTenantAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/suspend")]
    public async Task<IActionResult> Suspend(Guid id, CancellationToken ct)
    {
        await _svc.SuspendTenantAsync(id, ct);
        return Ok(new { message = "Tenant suspended." });
    }

    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
    {
        await _svc.ActivateTenantAsync(id, ct);
        return Ok(new { message = "Tenant activated." });
    }

    [HttpGet("{id:guid}/features")]
    public async Task<IActionResult> GetFeatures(Guid id, CancellationToken ct) =>
        Ok(await _svc.GetFeaturesAsync(id, ct));

    [HttpPut("{id:guid}/features")]
    public async Task<IActionResult> UpdateFeatures(Guid id, [FromBody] UpdateFeatureToggleRequest request, CancellationToken ct)
    {
        await _svc.UpdateFeaturesAsync(id, request, ct);
        return NoContent();
    }

    [HttpGet("{id:guid}/store-settings")]
    public async Task<IActionResult> GetStoreSettings(Guid id, CancellationToken ct) =>
        Ok(await _svc.GetStoreSettingsAsync(id, ct));

    [HttpPut("{id:guid}/store-settings")]
    public async Task<IActionResult> UpdateStoreSettings(Guid id, [FromBody] UpdateStoreSettingsRequest request, CancellationToken ct) =>
        Ok(await _svc.UpdateStoreSettingsAsync(id, request, ct));
}
