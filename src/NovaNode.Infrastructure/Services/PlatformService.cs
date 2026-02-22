using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Platform;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Entities;
using NovaNode.Domain.Enums;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public class PlatformService : IPlatformService
{
    private readonly AppDbContext _db;
    public PlatformService(AppDbContext db) => _db = db;

    public async Task<List<TenantDto>> GetTenantsAsync(CancellationToken ct = default) =>
        await _db.Tenants
            .Include(t => t.Subscriptions).ThenInclude(s => s.Plan)
            .Include(t => t.FeatureToggle)
            .Select(t => MapTenantDto(t)).ToListAsync(ct);

    public async Task<TenantDto> GetTenantAsync(Guid id, CancellationToken ct = default)
    {
        var t = await _db.Tenants
            .Include(t => t.Subscriptions).ThenInclude(s => s.Plan)
            .Include(t => t.FeatureToggle)
            .FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new KeyNotFoundException("Tenant not found.");
        return MapTenantDto(t);
    }

    public async Task<TenantDto> CreateTenantAsync(CreateTenantRequest request, CancellationToken ct = default)
    {
        if (await _db.Tenants.AnyAsync(t => t.Slug == request.Slug, ct))
            throw new InvalidOperationException("Slug already exists.");

        var tenant = new Tenant
        {
            Name = request.Name, Slug = request.Slug,
            SupportPhone = request.SupportPhone, SupportWhatsApp = request.SupportWhatsApp,
            Address = request.Address, MapUrl = request.MapUrl
        };
        _db.Tenants.Add(tenant);

        // Create feature toggle
        _db.TenantFeatureToggles.Add(new TenantFeatureToggle { TenantId = tenant.Id });

        // Create store settings
        _db.StoreSettings.Add(new StoreSettings { TenantId = tenant.Id, StoreName = request.Name });

        // Create owner employee
        _db.Employees.Add(new Employee
        {
            TenantId = tenant.Id, Name = request.OwnerName, Email = request.OwnerEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.OwnerPassword),
            Role = "Owner"
        });

        await _db.SaveChangesAsync(ct);
        return await GetTenantAsync(tenant.Id, ct);
    }

    public async Task<TenantDto> UpdateTenantAsync(Guid id, UpdateTenantRequest request, CancellationToken ct = default)
    {
        var t = await _db.Tenants.FindAsync([id], ct) ?? throw new KeyNotFoundException("Tenant not found.");
        t.Name = request.Name; t.Slug = request.Slug;
        t.SupportPhone = request.SupportPhone; t.SupportWhatsApp = request.SupportWhatsApp;
        t.Address = request.Address; t.MapUrl = request.MapUrl;
        await _db.SaveChangesAsync(ct);
        return await GetTenantAsync(id, ct);
    }

    public async Task DeleteTenantAsync(Guid id, CancellationToken ct = default)
    {
        var t = await _db.Tenants.FindAsync([id], ct) ?? throw new KeyNotFoundException("Tenant not found.");
        _db.Tenants.Remove(t);
        await _db.SaveChangesAsync(ct);
    }

    public async Task SuspendTenantAsync(Guid id, CancellationToken ct = default)
    {
        var t = await _db.Tenants.FindAsync([id], ct) ?? throw new KeyNotFoundException("Tenant not found.");
        t.IsActive = false;
        var sub = await _db.Subscriptions.Where(s => s.TenantId == id).OrderByDescending(s => s.CreatedAt).FirstOrDefaultAsync(ct);
        if (sub != null) sub.Status = SubscriptionStatus.Suspended;
        await _db.SaveChangesAsync(ct);
    }

    public async Task ActivateTenantAsync(Guid id, CancellationToken ct = default)
    {
        var t = await _db.Tenants.FindAsync([id], ct) ?? throw new KeyNotFoundException("Tenant not found.");
        t.IsActive = true;
        var sub = await _db.Subscriptions.Where(s => s.TenantId == id).OrderByDescending(s => s.CreatedAt).FirstOrDefaultAsync(ct);
        if (sub != null) sub.Status = SubscriptionStatus.Active;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<PlanDto>> GetPlansAsync(CancellationToken ct = default) =>
        await _db.Plans.Select(p => MapPlanDto(p)).ToListAsync(ct);

    public async Task<PlanDto> CreatePlanAsync(CreatePlanRequest request, CancellationToken ct = default)
    {
        var plan = new Plan
        {
            Name = request.Name, PriceMonthly = request.PriceMonthly,
            ActivationFee = request.ActivationFee, LimitsJson = request.LimitsJson, FeaturesJson = request.FeaturesJson
        };
        _db.Plans.Add(plan);
        await _db.SaveChangesAsync(ct);
        return MapPlanDto(plan);
    }

    public async Task<PlanDto> UpdatePlanAsync(Guid id, UpdatePlanRequest request, CancellationToken ct = default)
    {
        var plan = await _db.Plans.FindAsync([id], ct) ?? throw new KeyNotFoundException("Plan not found.");
        plan.Name = request.Name; plan.PriceMonthly = request.PriceMonthly;
        plan.ActivationFee = request.ActivationFee; plan.LimitsJson = request.LimitsJson;
        plan.FeaturesJson = request.FeaturesJson; plan.IsActive = request.IsActive;
        await _db.SaveChangesAsync(ct);
        return MapPlanDto(plan);
    }

    public async Task DeletePlanAsync(Guid id, CancellationToken ct = default)
    {
        var plan = await _db.Plans.FindAsync([id], ct) ?? throw new KeyNotFoundException("Plan not found.");
        _db.Plans.Remove(plan);
        await _db.SaveChangesAsync(ct);
    }

    public async Task StartTrialAsync(Guid tenantId, StartTrialRequest request, CancellationToken ct = default)
    {
        var sub = new Subscription
        {
            TenantId = tenantId, PlanId = request.PlanId,
            Status = SubscriptionStatus.Trial,
            TrialStart = DateTime.UtcNow,
            TrialEnd = DateTime.UtcNow.AddDays(7)
        };
        _db.Subscriptions.Add(sub);
        await _db.SaveChangesAsync(ct);
    }

    public async Task ActivateSubscriptionAsync(Guid tenantId, ActivateSubscriptionRequest request, CancellationToken ct = default)
    {
        var plan = await _db.Plans.FindAsync([request.PlanId], ct) ?? throw new KeyNotFoundException("Plan not found.");
        var sub = await _db.Subscriptions.Where(s => s.TenantId == tenantId).OrderByDescending(s => s.CreatedAt).FirstOrDefaultAsync(ct);

        if (sub != null)
        {
            sub.Status = SubscriptionStatus.Active;
            sub.PlanId = request.PlanId;
            sub.StartDate = DateTime.UtcNow;
            sub.EndDate = DateTime.UtcNow.AddMonths(1);
            sub.GraceEnd = DateTime.UtcNow.AddMonths(1).AddDays(3);
            sub.LastPaymentAmount = request.PaymentAmount;
            sub.Notes = request.Notes;
        }
        else
        {
            _db.Subscriptions.Add(new Subscription
            {
                TenantId = tenantId, PlanId = request.PlanId,
                Status = SubscriptionStatus.Active,
                StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddMonths(1),
                GraceEnd = DateTime.UtcNow.AddMonths(1).AddDays(3),
                LastPaymentAmount = request.PaymentAmount, Notes = request.Notes
            });
        }
        await _db.SaveChangesAsync(ct);
    }

    public async Task RenewSubscriptionAsync(Guid tenantId, RenewSubscriptionRequest request, CancellationToken ct = default)
    {
        var sub = await _db.Subscriptions.Where(s => s.TenantId == tenantId).OrderByDescending(s => s.CreatedAt).FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException("No subscription found.");
        sub.Status = SubscriptionStatus.Active;
        sub.StartDate = DateTime.UtcNow;
        sub.EndDate = DateTime.UtcNow.AddMonths(request.Months);
        sub.GraceEnd = DateTime.UtcNow.AddMonths(request.Months).AddDays(3);
        sub.LastPaymentAmount = request.PaymentAmount;
        sub.Notes = request.Notes;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<SubscriptionSummaryDto>> GetExpiringSubscriptionsAsync(int days, CancellationToken ct = default)
    {
        var cutoff = DateTime.UtcNow.AddDays(days);
        return await _db.Subscriptions.Include(s => s.Plan)
            .Where(s => s.EndDate != null && s.EndDate <= cutoff && s.Status == SubscriptionStatus.Active)
            .Select(s => new SubscriptionSummaryDto
            {
                Id = s.Id, PlanId = s.PlanId, PlanName = s.Plan.Name,
                Status = s.Status, TrialEnd = s.TrialEnd, EndDate = s.EndDate, GraceEnd = s.GraceEnd
            }).ToListAsync(ct);
    }

    public async Task<FeatureToggleDto> GetFeaturesAsync(Guid tenantId, CancellationToken ct = default)
    {
        var ft = await _db.TenantFeatureToggles.FirstOrDefaultAsync(f => f.TenantId == tenantId, ct);
        return new FeatureToggleDto
        {
            CanRemovePoweredBy = ft?.CanRemovePoweredBy ?? false,
            AdvancedReports = ft?.AdvancedReports ?? false
        };
    }

    public async Task UpdateFeaturesAsync(Guid tenantId, UpdateFeatureToggleRequest request, CancellationToken ct = default)
    {
        var ft = await _db.TenantFeatureToggles.FirstOrDefaultAsync(f => f.TenantId == tenantId, ct);
        if (ft == null)
        {
            ft = new TenantFeatureToggle { TenantId = tenantId };
            _db.TenantFeatureToggles.Add(ft);
        }
        ft.CanRemovePoweredBy = request.CanRemovePoweredBy;
        ft.AdvancedReports = request.AdvancedReports;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<PlatformDashboardDto> GetDashboardAsync(string range, CancellationToken ct = default)
    {
        var tenants = await _db.Tenants.CountAsync(ct);
        var active = await _db.Tenants.CountAsync(t => t.IsActive, ct);
        var trial = await _db.Subscriptions.CountAsync(s => s.Status == SubscriptionStatus.Trial, ct);
        var expired = await _db.Subscriptions.CountAsync(s => s.Status == SubscriptionStatus.Expired, ct);
        var suspended = await _db.Subscriptions.CountAsync(s => s.Status == SubscriptionStatus.Suspended, ct);
        var revenue = await _db.Subscriptions.SumAsync(s => (decimal?)s.LastPaymentAmount, ct) ?? 0;

        return new PlatformDashboardDto
        {
            TotalTenants = tenants, ActiveTenants = active, TrialTenants = trial,
            ExpiredTenants = expired, SuspendedTenants = suspended, TotalRevenue = revenue
        };
    }

    private static TenantDto MapTenantDto(Tenant t)
    {
        var sub = t.Subscriptions.OrderByDescending(s => s.CreatedAt).FirstOrDefault();
        return new TenantDto
        {
            Id = t.Id, Name = t.Name, Slug = t.Slug, IsActive = t.IsActive,
            SupportPhone = t.SupportPhone, SupportWhatsApp = t.SupportWhatsApp,
            Address = t.Address, MapUrl = t.MapUrl, CreatedAt = t.CreatedAt,
            CurrentSubscription = sub == null ? null : new SubscriptionSummaryDto
            {
                Id = sub.Id, PlanId = sub.PlanId, PlanName = sub.Plan?.Name,
                Status = sub.Status, TrialEnd = sub.TrialEnd, EndDate = sub.EndDate, GraceEnd = sub.GraceEnd
            },
            Features = t.FeatureToggle == null ? null : new FeatureToggleDto
            {
                CanRemovePoweredBy = t.FeatureToggle.CanRemovePoweredBy,
                AdvancedReports = t.FeatureToggle.AdvancedReports
            }
        };
    }

    private static PlanDto MapPlanDto(Plan p) => new()
    {
        Id = p.Id, Name = p.Name, PriceMonthly = p.PriceMonthly,
        ActivationFee = p.ActivationFee, LimitsJson = p.LimitsJson,
        FeaturesJson = p.FeaturesJson, IsActive = p.IsActive
    };
}
