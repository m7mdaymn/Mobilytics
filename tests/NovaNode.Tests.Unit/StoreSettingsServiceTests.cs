using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Settings;
using NovaNode.Domain.Entities;
using NovaNode.Domain.Enums;
using NovaNode.Infrastructure.MultiTenancy;
using NovaNode.Infrastructure.Persistence;
using NovaNode.Infrastructure.Services;
using Xunit;

namespace NovaNode.Tests.Unit;

public class StoreSettingsServiceTests
{
    private static (AppDbContext db, Guid tenantId) CreateDb()
    {
        var tenantId = Guid.NewGuid();
        var tenantCtx = new TenantContext();
        tenantCtx.Set(tenantId, "test");

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var db = new AppDbContext(options, tenantCtx);
        db.Tenants.Add(new Tenant { Id = tenantId, Name = "Test Store", Slug = "test" });
        db.SaveChanges();
        return (db, tenantId);
    }

    [Fact]
    public async Task GetAsync_ShouldReturnDefault_WhenNoSettings()
    {
        var (db, tenantId) = CreateDb();
        var svc = new StoreSettingsService(db);

        var result = await svc.GetAsync(tenantId);

        Assert.Equal("New Store", result.StoreName);
    }

    [Fact]
    public async Task GetAsync_ShouldReturnSettings_WhenExist()
    {
        var (db, tenantId) = CreateDb();
        db.StoreSettings.Add(new StoreSettings
        {
            TenantId = tenantId, StoreName = "My Store", CurrencyCode = "USD",
            ThemePresetId = 3
        });
        await db.SaveChangesAsync();

        var svc = new StoreSettingsService(db);
        var result = await svc.GetAsync(tenantId);

        Assert.Equal("My Store", result.StoreName);
        Assert.Equal("USD", result.CurrencyCode);
        Assert.Equal(3, result.ThemePresetId);
    }

    [Fact]
    public async Task UpdateAsync_ShouldCreateSettings_WhenNotExist()
    {
        var (db, tenantId) = CreateDb();
        var svc = new StoreSettingsService(db);

        var result = await svc.UpdateAsync(tenantId, new StoreSettingsDto
        {
            StoreName = "Brand New Store",
            CurrencyCode = "SAR",
            ThemePresetId = 5
        });

        Assert.Equal("Brand New Store", result.StoreName);
        Assert.Equal("SAR", result.CurrencyCode);
        Assert.Equal(5, result.ThemePresetId);

        // Verify persisted
        var saved = await db.StoreSettings.FirstAsync();
        Assert.Equal("Brand New Store", saved.StoreName);
    }

    [Fact]
    public async Task UpdateAsync_ShouldUpdateExistingSettings()
    {
        var (db, tenantId) = CreateDb();
        db.StoreSettings.Add(new StoreSettings
        {
            TenantId = tenantId, StoreName = "Old Name", CurrencyCode = "EGP"
        });
        await db.SaveChangesAsync();

        var svc = new StoreSettingsService(db);
        var result = await svc.UpdateAsync(tenantId, new StoreSettingsDto
        {
            StoreName = "New Name",
            CurrencyCode = "USD",
            ThemePresetId = 2
        });

        Assert.Equal("New Name", result.StoreName);
        Assert.Equal("USD", result.CurrencyCode);
    }

    [Fact]
    public async Task UpdateThemeAsync_ShouldUpdatePreset()
    {
        var (db, tenantId) = CreateDb();
        var svc = new StoreSettingsService(db);

        await svc.UpdateThemeAsync(tenantId, new UpdateThemeRequest { ThemePresetId = 7 });

        var settings = await db.StoreSettings.FirstAsync();
        Assert.Equal(7, settings.ThemePresetId);
    }

    [Fact]
    public async Task UpdateFooterAsync_ShouldUpdateFields()
    {
        var (db, tenantId) = CreateDb();
        var svc = new StoreSettingsService(db);

        await svc.UpdateFooterAsync(tenantId, new UpdateFooterRequest
        {
            FooterAddress = "123 Main St",
            WorkingHours = "9am-5pm",
            MapUrl = "https://maps.google.com/test"
        });

        var settings = await db.StoreSettings.FirstAsync();
        Assert.Equal("123 Main St", settings.FooterAddress);
        Assert.Equal("9am-5pm", settings.WorkingHours);
    }

    [Fact]
    public async Task GetPublicAsync_ShouldResolveThemeColors()
    {
        var (db, tenantId) = CreateDb();
        // Add subscription for IsActive check
        db.Subscriptions.Add(new Subscription
        {
            TenantId = tenantId, Status = SubscriptionStatus.Active,
            StartDate = DateTime.UtcNow.AddMonths(-1), EndDate = DateTime.UtcNow.AddMonths(1)
        });
        db.StoreSettings.Add(new StoreSettings
        {
            TenantId = tenantId, StoreName = "Test", ThemePresetId = 2
        });
        await db.SaveChangesAsync();

        var svc = new StoreSettingsService(db);
        var result = await svc.GetPublicAsync(tenantId);

        Assert.Equal("Test", result.StoreName);
        Assert.True(result.IsActive);
        // Theme 2 = Ocean Blue
        Assert.Equal("#1e40af", result.PrimaryColor);
        Assert.Equal("#1e3a5f", result.SecondaryColor);
        Assert.Equal("#06b6d4", result.AccentColor);
    }

    [Fact]
    public async Task GetPublicAsync_ShouldReturnInactive_WhenNoSubscription()
    {
        var (db, tenantId) = CreateDb();
        db.StoreSettings.Add(new StoreSettings { TenantId = tenantId, StoreName = "Test" });
        await db.SaveChangesAsync();

        var svc = new StoreSettingsService(db);
        var result = await svc.GetPublicAsync(tenantId);

        Assert.False(result.IsActive);
    }

    [Fact]
    public async Task UpdateAsync_ShouldPersistLogoUrl()
    {
        var (db, tenantId) = CreateDb();
        var svc = new StoreSettingsService(db);

        var result = await svc.UpdateAsync(tenantId, new StoreSettingsDto
        {
            StoreName = "Logo Store",
            LogoUrl = "/uploads/test/logo.png"
        });

        Assert.Equal("/uploads/test/logo.png", result.LogoUrl);
    }
}
