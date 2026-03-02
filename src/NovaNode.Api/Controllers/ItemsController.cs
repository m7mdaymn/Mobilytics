using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Api.Middleware;
using NovaNode.Application.DTOs.Items;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;

namespace NovaNode.Api.Controllers;

[Authorize]
public class ItemsController : BaseApiController
{
    private readonly IItemService _svc;
    private readonly ITenantContext _tenantContext;
    private readonly IAuditService _audit;

    public ItemsController(IItemService svc, ITenantContext tenantContext, IAuditService audit)
    {
        _svc = svc;
        _tenantContext = tenantContext;
        _audit = audit;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException());

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] ItemFilterRequest filter, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetAllAsync(tenantId, filter, ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetByIdAsync(tenantId, id, ct));
    }

    [HttpGet("slug/{slug}")]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetBySlugAsync(tenantId, slug, ct));
    }

    [HttpPost]
    [RequirePermission("items.create")]
    public async Task<IActionResult> Create([FromBody] CreateItemRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var result = await _svc.CreateAsync(tenantId, request, ct);
        await _audit.LogAsync(tenantId, GetUserId(), "Created", "Item", result.Id.ToString(), null, result.Title, ct);
        return Created(result);
    }

    [HttpPut("{id:guid}")]
    [RequirePermission("items.edit")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateItemRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var result = await _svc.UpdateAsync(tenantId, id, request, ct);
        await _audit.LogAsync(tenantId, GetUserId(), "Updated", "Item", id.ToString(), null, result.Title, ct);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateItemStatusRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _svc.UpdateStatusAsync(tenantId, id, request, ct);
        await _audit.LogAsync(tenantId, GetUserId(), "Updated", "Item", id.ToString(), null, $"Status → {request.Status}", ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [RequirePermission("items.delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _audit.LogAsync(tenantId, GetUserId(), "Deleted", "Item", id.ToString(), null, null, ct);
        await _svc.DeleteAsync(tenantId, id, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/images")]
    public async Task<IActionResult> UploadImage(Guid id, IFormFile file, [FromQuery] bool isMain, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        using var stream = file.OpenReadStream();
        var url = await _svc.UploadImageAsync(tenantId, id, stream, file.FileName, file.ContentType, isMain, ct);
        return Ok(url);
    }

    [HttpDelete("{id:guid}/images")]
    public async Task<IActionResult> DeleteImage(Guid id, [FromQuery] string imageKey, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _svc.DeleteImageAsync(tenantId, id, imageKey, ct);
        return NoContent();
    }
}
