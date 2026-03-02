using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Api.Middleware;
using NovaNode.Application.DTOs.Categories;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;

namespace NovaNode.Api.Controllers;

[Authorize]
public class CategoriesController : BaseApiController
{
    private readonly ICategoryService _svc;
    private readonly ITenantContext _tenantContext;
    private readonly IAuditService _audit;

    public CategoriesController(ICategoryService svc, ITenantContext tenantContext, IAuditService audit)
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

    [HttpGet("tree")]
    public async Task<IActionResult> GetTree(CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetTreeAsync(tenantId, ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetByIdAsync(tenantId, id, ct));
    }

    [HttpPost]
    [RequirePermission("categories.manage")]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var result = await _svc.CreateAsync(tenantId, request, ct);
        await _audit.LogAsync(tenantId, GetUserId(), "Created", "Category", result.Id.ToString(), null, result.Name, ct);
        return Created(result);
    }

    [HttpPut("{id:guid}")]
    [RequirePermission("categories.manage")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var result = await _svc.UpdateAsync(tenantId, id, request, ct);
        await _audit.LogAsync(tenantId, GetUserId(), "Updated", "Category", id.ToString(), null, result.Name, ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [RequirePermission("categories.manage")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _audit.LogAsync(tenantId, GetUserId(), "Deleted", "Category", id.ToString(), null, null, ct);
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
