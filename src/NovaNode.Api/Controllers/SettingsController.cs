using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaNode.Api.Middleware;
using NovaNode.Application.DTOs.Settings;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Api.Controllers;

[Authorize]
public class SettingsController : BaseApiController
{
    private readonly IStoreSettingsService _svc;
    private readonly ITenantContext _tenantContext;
    private readonly AppDbContext _db;

    public SettingsController(IStoreSettingsService svc, ITenantContext tenantContext, AppDbContext db)
    {
        _svc = svc;
        _tenantContext = tenantContext;
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetAsync(tenantId, ct));
    }

    [HttpPut]
    [RequirePermission("settings.edit")]
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
        return Ok(true);
    }

    [HttpPut("footer")]
    public async Task<IActionResult> UpdateFooter([FromBody] UpdateFooterRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _svc.UpdateFooterAsync(tenantId, request, ct);
        return Ok(true);
    }

    [HttpPut("whatsapp")]
    public async Task<IActionResult> UpdateWhatsAppTemplates([FromBody] UpdateWhatsAppTemplatesRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _svc.UpdateWhatsAppTemplatesAsync(tenantId, request, ct);
        return Ok(true);
    }

    [HttpPut("pwa")]
    public async Task<IActionResult> UpdatePwa([FromBody] UpdatePwaRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _svc.UpdatePwaAsync(tenantId, request, ct);
        return Ok(true);
    }

    [HttpGet("subscription")]
    public async Task<IActionResult> GetSubscription(CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var tenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tenantId, ct);
        var sub = await _db.Subscriptions
            .AsNoTracking()
            .Include(s => s.Plan)
            .Where(s => s.TenantId == tenantId)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(ct);

        return Ok(new
        {
            planName = sub?.Plan?.Name,
            status = sub?.Status.ToString(),
            trialEnd = sub?.TrialEnd,
            startDate = sub?.StartDate,
            endDate = sub?.EndDate,
            graceEnd = sub?.GraceEnd,
            supportWhatsApp = tenant?.SupportWhatsApp,
            supportPhone = tenant?.SupportPhone,
        });
    }
}
