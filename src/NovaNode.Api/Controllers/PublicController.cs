using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.DTOs.Items;
using NovaNode.Application.DTOs.Leads;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;

namespace NovaNode.Api.Controllers;

public class PublicController : BaseApiController
{
    private readonly IStoreSettingsService _settings;
    private readonly IItemService _items;
    private readonly IHomeSectionService _sections;
    private readonly ILeadService _leads;
    private readonly ITenantContext _tenantContext;

    public PublicController(
        IStoreSettingsService settings,
        IItemService items,
        IHomeSectionService sections,
        ILeadService leads,
        ITenantContext tenantContext)
    {
        _settings = settings;
        _items = items;
        _sections = sections;
        _leads = leads;
        _tenantContext = tenantContext;
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings(CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _settings.GetPublicAsync(tenantId, ct));
    }

    [HttpGet("items")]
    public async Task<IActionResult> GetItems([FromQuery] ItemFilterRequest filter, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _items.GetAllAsync(tenantId, filter, ct));
    }

    [HttpGet("items/{slug}")]
    public async Task<IActionResult> GetItem(string slug, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _items.GetBySlugAsync(tenantId, slug, ct));
    }

    [HttpGet("sections")]
    public async Task<IActionResult> GetSections(CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _sections.GetAllAsync(tenantId, true, ct));
    }

    [HttpPost("whatsapp-click")]
    public async Task<IActionResult> WhatsAppClick([FromBody] WhatsAppClickRequest request, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        var lead = await _leads.CreateWhatsAppClickAsync(tenantId, request, ct);
        return Created(lead);
    }

    [HttpPost("follow-up")]
    public async Task<IActionResult> FollowUp([FromBody] FollowUpRequest request, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        var lead = await _leads.CreateFollowUpAsync(tenantId, request, ct);
        return Created(lead);
    }

    [HttpGet("follow-up-link/{id:guid}")]
    public async Task<IActionResult> GetFollowUpLink(Guid id, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        var link = await _leads.GetFollowUpLinkAsync(tenantId, id, ct);
        return Ok(new { link });
    }
}
