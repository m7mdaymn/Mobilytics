using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.DTOs.Settings;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;

namespace NovaNode.Api.Controllers;

[Authorize]
public class SettingsController : BaseApiController
{
    private readonly IStoreSettingsService _svc;
    private readonly ITenantContext _tenantContext;

    public SettingsController(IStoreSettingsService svc, ITenantContext tenantContext)
    {
        _svc = svc;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetAsync(tenantId, ct));
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] StoreSettingsDto request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.UpdateAsync(tenantId, request, ct));
    }

    [HttpPut("theme")]
    public async Task<IActionResult> UpdateTheme([FromBody] UpdateThemeRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _svc.UpdateThemeAsync(tenantId, request, ct);
        return NoContent();
    }

    [HttpPut("footer")]
    public async Task<IActionResult> UpdateFooter([FromBody] UpdateFooterRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _svc.UpdateFooterAsync(tenantId, request, ct);
        return NoContent();
    }

    [HttpPut("whatsapp")]
    public async Task<IActionResult> UpdateWhatsAppTemplates([FromBody] UpdateWhatsAppTemplatesRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _svc.UpdateWhatsAppTemplatesAsync(tenantId, request, ct);
        return NoContent();
    }

    [HttpPut("pwa")]
    public async Task<IActionResult> UpdatePwa([FromBody] UpdatePwaRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _svc.UpdatePwaAsync(tenantId, request, ct);
        return NoContent();
    }
}
