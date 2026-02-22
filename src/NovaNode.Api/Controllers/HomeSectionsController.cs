using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.DTOs.Categories;
using NovaNode.Application.DTOs.HomeSections;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;

namespace NovaNode.Api.Controllers;

[Authorize]
public class HomeSectionsController : BaseApiController
{
    private readonly IHomeSectionService _svc;
    private readonly ITenantContext _tenantContext;

    public HomeSectionsController(IHomeSectionService svc, ITenantContext tenantContext)
    {
        _svc = svc;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetAllAsync(tenantId, activeOnly, ct));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateHomeSectionRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Created(await _svc.CreateAsync(tenantId, request, ct));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateHomeSectionRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.UpdateAsync(tenantId, id, request, ct));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _svc.DeleteAsync(tenantId, id, ct);
        return NoContent();
    }

    [HttpPut("reorder")]
    public async Task<IActionResult> Reorder([FromBody] ReorderRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _svc.ReorderAsync(tenantId, request, ct);
        return NoContent();
    }
}
