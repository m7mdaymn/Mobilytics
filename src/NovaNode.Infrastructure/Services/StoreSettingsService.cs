using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Settings;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Entities;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public class StoreSettingsService : IStoreSettingsService
{
    private readonly AppDbContext _db;
    public StoreSettingsService(AppDbContext db) => _db = db;

    public async Task<StoreSettingsDto> GetAsync(Guid tenantId, CancellationToken ct = default)
    {
        var s = await _db.StoreSettings.FirstOrDefaultAsync(ss => ss.TenantId == tenantId, ct);
        if (s == null) return new StoreSettingsDto { StoreName = "New Store" };
        return MapDto(s);
    }

    public async Task<PublicSettingsDto> GetPublicAsync(Guid tenantId, CancellationToken ct = default)
    {
        var tenant = await _db.Tenants.Include(t => t.StoreSettings).Include(t => t.FeatureToggle)
            .Include(t => t.Subscriptions)
            .FirstOrDefaultAsync(t => t.Id == tenantId, ct)
            ?? throw new KeyNotFoundException("Tenant not found.");

        var isActive = tenant.IsActive && IsSubscriptionValid(tenant);
        var poweredByEnabled = tenant.FeatureToggle == null || !tenant.FeatureToggle.CanRemovePoweredBy;
        var s = tenant.StoreSettings;
        var presetId = s?.ThemePresetId ?? 1;
        var preset = StoreSettings.Presets.GetValueOrDefault(presetId, StoreSettings.Presets[1]);

        return new PublicSettingsDto
        {
            StoreName = s?.StoreName ?? tenant.Name,
            LogoUrl = s?.LogoUrl,
            BannerUrl = s?.BannerUrl,
            WhatsAppNumber = s?.WhatsAppNumber,
            PhoneNumber = s?.PhoneNumber,
            ThemePresetId = presetId,
            PrimaryColor = preset.Primary,
            SecondaryColor = preset.Secondary,
            AccentColor = preset.Accent,
            CurrencyCode = s?.CurrencyCode ?? "EGP",
            FooterAddress = s?.FooterAddress,
            WorkingHours = s?.WorkingHours,
            SocialLinksJson = s?.SocialLinksJson,
            PoliciesJson = s?.PoliciesJson,
            MapUrl = s?.MapUrl,
            PwaSettingsJson = s?.PwaSettingsJson,
            WhatsAppTemplatesJson = s?.WhatsAppTemplatesJson,
            IsActive = isActive,
            PoweredByEnabled = poweredByEnabled
        };
    }

    public async Task<StoreSettingsDto> UpdateAsync(Guid tenantId, StoreSettingsDto request, CancellationToken ct = default)
    {
        var s = await _db.StoreSettings.FirstOrDefaultAsync(ss => ss.TenantId == tenantId, ct);
        if (s == null)
        {
            s = new StoreSettings { TenantId = tenantId };
            _db.StoreSettings.Add(s);
        }
        s.StoreName = request.StoreName; s.LogoUrl = request.LogoUrl; s.BannerUrl = request.BannerUrl;
        s.WhatsAppNumber = request.WhatsAppNumber; s.PhoneNumber = request.PhoneNumber;
        s.ThemePresetId = request.ThemePresetId;
        s.CurrencyCode = request.CurrencyCode; s.FooterAddress = request.FooterAddress;
        s.WorkingHours = request.WorkingHours; s.SocialLinksJson = request.SocialLinksJson;
        s.PoliciesJson = request.PoliciesJson; s.MapUrl = request.MapUrl;
        s.PwaSettingsJson = request.PwaSettingsJson; s.WhatsAppTemplatesJson = request.WhatsAppTemplatesJson;
        await _db.SaveChangesAsync(ct);
        return MapDto(s);
    }

    public async Task UpdateThemeAsync(Guid tenantId, UpdateThemeRequest request, CancellationToken ct = default)
    {
        var s = await GetOrCreateSettings(tenantId, ct);
        s.ThemePresetId = request.ThemePresetId;
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateFooterAsync(Guid tenantId, UpdateFooterRequest request, CancellationToken ct = default)
    {
        var s = await GetOrCreateSettings(tenantId, ct);
        s.FooterAddress = request.FooterAddress; s.WorkingHours = request.WorkingHours;
        s.SocialLinksJson = request.SocialLinksJson; s.PoliciesJson = request.PoliciesJson;
        s.MapUrl = request.MapUrl;
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateWhatsAppTemplatesAsync(Guid tenantId, UpdateWhatsAppTemplatesRequest request, CancellationToken ct = default)
    {
        var s = await GetOrCreateSettings(tenantId, ct);
        s.WhatsAppTemplatesJson = request.WhatsAppTemplatesJson;
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdatePwaAsync(Guid tenantId, UpdatePwaRequest request, CancellationToken ct = default)
    {
        var s = await GetOrCreateSettings(tenantId, ct);
        s.PwaSettingsJson = request.PwaSettingsJson;
        await _db.SaveChangesAsync(ct);
    }

    private async Task<StoreSettings> GetOrCreateSettings(Guid tenantId, CancellationToken ct)
    {
        var s = await _db.StoreSettings.FirstOrDefaultAsync(ss => ss.TenantId == tenantId, ct);
        if (s == null)
        {
            s = new StoreSettings { TenantId = tenantId, StoreName = "New Store" };
            _db.StoreSettings.Add(s);
        }
        return s;
    }

    private static bool IsSubscriptionValid(Domain.Entities.Tenant tenant)
    {
        var sub = tenant.Subscriptions.OrderByDescending(s => s.CreatedAt).FirstOrDefault();
        if (sub == null) return false;
        return sub.Status is Domain.Enums.SubscriptionStatus.Trial
            or Domain.Enums.SubscriptionStatus.Active
            or Domain.Enums.SubscriptionStatus.Grace;
    }

    private static StoreSettingsDto MapDto(StoreSettings s) => new()
    {
        StoreName = s.StoreName, LogoUrl = s.LogoUrl, BannerUrl = s.BannerUrl,
        WhatsAppNumber = s.WhatsAppNumber, PhoneNumber = s.PhoneNumber,
        ThemePresetId = s.ThemePresetId,
        CurrencyCode = s.CurrencyCode, FooterAddress = s.FooterAddress,
        WorkingHours = s.WorkingHours, SocialLinksJson = s.SocialLinksJson,
        PoliciesJson = s.PoliciesJson, MapUrl = s.MapUrl,
        PwaSettingsJson = s.PwaSettingsJson, WhatsAppTemplatesJson = s.WhatsAppTemplatesJson
    };
}
