using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Api.Middleware;
using NovaNode.Application.DTOs.Brands;
using NovaNode.Application.DTOs.Categories;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;

namespace NovaNode.Api.Controllers;

[Authorize]
public class BrandsController : BaseApiController
{
    private readonly IBrandService _svc;
    private readonly ITenantContext _tenantContext;
    private readonly IAuditService _audit;

    public BrandsController(IBrandService svc, ITenantContext tenantContext, IAuditService audit)
    {
        _svc = svc;
        _tenantContext = tenantContext;
        _audit = audit;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException());

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetAllAsync(tenantId, ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetByIdAsync(tenantId, id, ct));
    }

    [HttpPost]
    [RequirePermission("brands.manage")]
    public async Task<IActionResult> Create([FromBody] CreateBrandRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var result = await _svc.CreateAsync(tenantId, request, ct);
        await _audit.LogAsync(tenantId, GetUserId(), "Created", "Brand", result.Id.ToString(), null, result.Name, ct);
        return Created(result);
    }

    [HttpPut("{id:guid}")]
    [RequirePermission("brands.manage")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBrandRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var result = await _svc.UpdateAsync(tenantId, id, request, ct);
        await _audit.LogAsync(tenantId, GetUserId(), "Updated", "Brand", id.ToString(), null, result.Name, ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [RequirePermission("brands.manage")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _audit.LogAsync(tenantId, GetUserId(), "Deleted", "Brand", id.ToString(), null, null, ct);
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
