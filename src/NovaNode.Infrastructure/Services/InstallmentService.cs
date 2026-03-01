using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Installments;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Entities;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public class InstallmentService : IInstallmentService
{
    private readonly AppDbContext _db;
    public InstallmentService(AppDbContext db) => _db = db;

    // ── Providers ──

    public async Task<List<InstallmentProviderDto>> GetProvidersAsync(Guid tenantId, CancellationToken ct = default)
    {
        return await _db.InstallmentProviders
            .Where(p => p.TenantId == tenantId)
            .OrderBy(p => p.DisplayOrder)
            .Select(p => new InstallmentProviderDto
            {
                Id = p.Id, Name = p.Name, Type = p.Type,
                LogoUrl = p.LogoUrl, IsActive = p.IsActive,
                DisplayOrder = p.DisplayOrder,
                PlanCount = p.Plans.Count
            }).ToListAsync(ct);
    }

    public async Task<InstallmentProviderDto> GetProviderAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var p = await _db.InstallmentProviders.Include(x => x.Plans)
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.Id == id, ct)
            ?? throw new KeyNotFoundException("Provider not found.");
        return new InstallmentProviderDto
        {
            Id = p.Id, Name = p.Name, Type = p.Type,
            LogoUrl = p.LogoUrl, IsActive = p.IsActive,
            DisplayOrder = p.DisplayOrder,
            PlanCount = p.Plans.Count
        };
    }

    public async Task<InstallmentProviderDto> CreateProviderAsync(Guid tenantId, CreateProviderRequest request, CancellationToken ct = default)
    {
        var provider = new InstallmentProvider
        {
            TenantId = tenantId, Name = request.Name, Type = request.Type,
            LogoUrl = request.LogoUrl, IsActive = request.IsActive,
            DisplayOrder = request.DisplayOrder
        };
        _db.InstallmentProviders.Add(provider);
        await _db.SaveChangesAsync(ct);
        return await GetProviderAsync(tenantId, provider.Id, ct);
    }

    public async Task<InstallmentProviderDto> UpdateProviderAsync(Guid tenantId, Guid id, UpdateProviderRequest request, CancellationToken ct = default)
    {
        var p = await _db.InstallmentProviders.FirstOrDefaultAsync(x => x.TenantId == tenantId && x.Id == id, ct)
            ?? throw new KeyNotFoundException("Provider not found.");
        p.Name = request.Name; p.Type = request.Type;
        p.LogoUrl = request.LogoUrl; p.IsActive = request.IsActive;
        p.DisplayOrder = request.DisplayOrder;
        await _db.SaveChangesAsync(ct);
        return await GetProviderAsync(tenantId, id, ct);
    }

    public async Task DeleteProviderAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var p = await _db.InstallmentProviders.FirstOrDefaultAsync(x => x.TenantId == tenantId && x.Id == id, ct)
            ?? throw new KeyNotFoundException("Provider not found.");
        _db.InstallmentProviders.Remove(p);
        await _db.SaveChangesAsync(ct);
    }

    // ── Plans ──

    public async Task<List<InstallmentPlanDto>> GetPlansAsync(Guid tenantId, Guid? providerId = null, Guid? itemId = null, CancellationToken ct = default)
    {
        var query = _db.InstallmentPlans
            .Include(p => p.Provider).Include(p => p.Item)
            .Where(p => p.TenantId == tenantId);

        if (providerId.HasValue) query = query.Where(p => p.ProviderId == providerId.Value);
        if (itemId.HasValue) query = query.Where(p => p.ItemId == itemId.Value || p.ItemId == null);

        return await query.OrderBy(p => p.Months).Select(p => MapPlanDto(p)).ToListAsync(ct);
    }

    public async Task<InstallmentPlanDto> CreatePlanAsync(Guid tenantId, CreateInstallmentPlanRequest request, CancellationToken ct = default)
    {
        var plan = new InstallmentPlan
        {
            TenantId = tenantId, ProviderId = request.ProviderId, ItemId = request.ItemId,
            Months = request.Months,
            DownPayment = request.DownPayment, AdminFees = request.AdminFees,
            Notes = request.Notes, IsActive = request.IsActive,
            DownPaymentPercent = request.DownPaymentPercent,
            AdminFeesPercent = request.AdminFeesPercent,
            InterestRate = request.InterestRate
        };
        _db.InstallmentPlans.Add(plan);
        await _db.SaveChangesAsync(ct);
        return (await GetPlansAsync(tenantId, ct: ct)).First(p => p.Id == plan.Id);
    }

    public async Task<InstallmentPlanDto> UpdatePlanAsync(Guid tenantId, Guid id, UpdateInstallmentPlanRequest request, CancellationToken ct = default)
    {
        var plan = await _db.InstallmentPlans.FirstOrDefaultAsync(p => p.TenantId == tenantId && p.Id == id, ct)
            ?? throw new KeyNotFoundException("Plan not found.");
        plan.ProviderId = request.ProviderId; plan.ItemId = request.ItemId;
        plan.Months = request.Months;
        plan.DownPayment = request.DownPayment; plan.AdminFees = request.AdminFees;
        plan.Notes = request.Notes; plan.IsActive = request.IsActive;
        plan.DownPaymentPercent = request.DownPaymentPercent;
        plan.AdminFeesPercent = request.AdminFeesPercent;
        plan.InterestRate = request.InterestRate;
        await _db.SaveChangesAsync(ct);
        return (await GetPlansAsync(tenantId, ct: ct)).First(p => p.Id == id);
    }

    public async Task DeletePlanAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var plan = await _db.InstallmentPlans.FirstOrDefaultAsync(p => p.TenantId == tenantId && p.Id == id, ct)
            ?? throw new KeyNotFoundException("Plan not found.");
        _db.InstallmentPlans.Remove(plan);
        await _db.SaveChangesAsync(ct);
    }

    // ── Public ──

    public async Task<List<ItemInstallmentInfoDto>> GetItemInstallmentsAsync(Guid tenantId, Guid itemId, CancellationToken ct = default)
    {
        return await _db.InstallmentPlans
            .Include(p => p.Provider)
            .Where(p => p.TenantId == tenantId && p.IsActive && p.Provider.IsActive)
            .Where(p => p.ItemId == itemId || p.ItemId == null)
            .OrderBy(p => p.Months)
            .Select(p => new ItemInstallmentInfoDto
            {
                ProviderName = p.Provider.Name,
                ProviderType = p.Provider.Type,
                ProviderLogoUrl = p.Provider.LogoUrl,
                Months = p.Months,
                DownPayment = p.DownPayment
            }).ToListAsync(ct);
    }

    private static InstallmentPlanDto MapPlanDto(InstallmentPlan p) => new()
    {
        Id = p.Id, ProviderId = p.ProviderId,
        ProviderName = p.Provider?.Name ?? "", ProviderType = p.Provider?.Type ?? "",
        ProviderLogoUrl = p.Provider?.LogoUrl,
        ItemId = p.ItemId, ItemTitle = p.Item?.Title,
        Months = p.Months,
        DownPayment = p.DownPayment, AdminFees = p.AdminFees,
        Notes = p.Notes, IsActive = p.IsActive,
        DownPaymentPercent = p.DownPaymentPercent,
        AdminFeesPercent = p.AdminFeesPercent,
        InterestRate = p.InterestRate
    };
}
