using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaNode.Domain.Entities;
using NovaNode.Domain.Interfaces;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Api.Controllers;

[Authorize]
public class SpecFieldsController : BaseApiController
{
    private readonly AppDbContext _db;
    private readonly ITenantContext _tenantContext;

    public SpecFieldsController(AppDbContext db, ITenantContext tenantContext)
    {
        _db = db;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// Get all saved spec field templates for the tenant.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? deviceType, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var query = _db.SpecFieldTemplates.Where(s => s.TenantId == tenantId);
        if (!string.IsNullOrEmpty(deviceType))
            query = query.Where(s => s.DeviceType == null || s.DeviceType == deviceType);

        var results = await query.OrderBy(s => s.Label).Select(s => new
        {
            s.Id,
            s.Label,
            s.DeviceType,
            s.OptionsJson
        }).ToListAsync(ct);

        return Ok(results);
    }

    /// <summary>
    /// Save a new custom spec field label for future reuse.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSpecFieldRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;

        // Check if already exists
        var exists = await _db.SpecFieldTemplates.AnyAsync(
            s => s.TenantId == tenantId && s.Label == request.Label && s.DeviceType == request.DeviceType, ct);
        if (exists) return Ok(new { message = "Already exists" });

        var entity = new SpecFieldTemplate
        {
            TenantId = tenantId,
            Label = request.Label,
            DeviceType = request.DeviceType,
            OptionsJson = request.OptionsJson
        };
        _db.SpecFieldTemplates.Add(entity);
        await _db.SaveChangesAsync(ct);

        return Created(string.Empty, new { entity.Id, entity.Label, entity.DeviceType, entity.OptionsJson });
    }

    /// <summary>
    /// Delete a spec field template.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var entity = await _db.SpecFieldTemplates.FirstOrDefaultAsync(
            s => s.TenantId == tenantId && s.Id == id, ct);
        if (entity == null) return NotFound();

        _db.SpecFieldTemplates.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public class CreateSpecFieldRequest
{
    public string Label { get; set; } = string.Empty;
    public string? DeviceType { get; set; }
    public string? OptionsJson { get; set; }
}
