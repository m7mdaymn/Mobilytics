using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Categories;
using NovaNode.Application.DTOs.HomeSections;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Entities;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public class HomeSectionService : IHomeSectionService
{
    private readonly AppDbContext _db;
    public HomeSectionService(AppDbContext db) => _db = db;

    public async Task<List<HomeSectionDto>> GetAllAsync(Guid tenantId, bool activeOnly = false, CancellationToken ct = default)
    {
        var query = _db.HomeSections.Include(hs => hs.Items)
            .Where(hs => hs.TenantId == tenantId);
        if (activeOnly)
        {
            var now = DateTime.UtcNow;
            query = query.Where(hs => hs.IsActive &&
                (!hs.StartDate.HasValue || hs.StartDate <= now) &&
                (!hs.EndDate.HasValue || hs.EndDate >= now));
        }
        return await query.OrderBy(hs => hs.DisplayOrder).Select(hs => MapDto(hs)).ToListAsync(ct);
    }

    public async Task<HomeSectionDto> CreateAsync(Guid tenantId, CreateHomeSectionRequest request, CancellationToken ct = default)
    {
        var hs = new HomeSection
        {
            TenantId = tenantId, Title = request.Title, SectionType = request.SectionType,
            DisplayOrder = request.DisplayOrder, IsActive = request.IsActive,
            StartDate = request.StartDate, EndDate = request.EndDate,
            BackgroundColor = request.BackgroundColor, TextColor = request.TextColor,
            Items = request.Items.Select(i => new HomeSectionItem
            {
                TargetType = i.TargetType, TargetId = i.TargetId, Title = i.Title,
                ImageUrl = i.ImageUrl, Url = i.Url, Html = i.Html, DisplayOrder = i.DisplayOrder
            }).ToList()
        };
        _db.HomeSections.Add(hs);
        await _db.SaveChangesAsync(ct);
        return MapDto(hs);
    }

    public async Task<HomeSectionDto> UpdateAsync(Guid tenantId, Guid id, UpdateHomeSectionRequest request, CancellationToken ct = default)
    {
        var hs = await _db.HomeSections.Include(h => h.Items)
            .FirstOrDefaultAsync(h => h.TenantId == tenantId && h.Id == id, ct)
            ?? throw new KeyNotFoundException("HomeSection not found.");

        hs.Title = request.Title; hs.SectionType = request.SectionType;
        hs.DisplayOrder = request.DisplayOrder; hs.IsActive = request.IsActive;
        hs.StartDate = request.StartDate; hs.EndDate = request.EndDate;
        hs.BackgroundColor = request.BackgroundColor; hs.TextColor = request.TextColor;

        _db.HomeSectionItems.RemoveRange(hs.Items);
        hs.Items = request.Items.Select(i => new HomeSectionItem
        {
            HomeSectionId = hs.Id, TargetType = i.TargetType, TargetId = i.TargetId,
            Title = i.Title, ImageUrl = i.ImageUrl, Url = i.Url, Html = i.Html, DisplayOrder = i.DisplayOrder
        }).ToList();

        await _db.SaveChangesAsync(ct);
        return MapDto(hs);
    }

    public async Task DeleteAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var hs = await _db.HomeSections.FirstOrDefaultAsync(h => h.TenantId == tenantId && h.Id == id, ct)
            ?? throw new KeyNotFoundException("HomeSection not found.");
        _db.HomeSections.Remove(hs);
        await _db.SaveChangesAsync(ct);
    }

    public async Task ReorderAsync(Guid tenantId, ReorderRequest request, CancellationToken ct = default)
    {
        var sections = await _db.HomeSections.Where(hs => hs.TenantId == tenantId).ToListAsync(ct);
        foreach (var item in request.Items)
        {
            var s = sections.FirstOrDefault(x => x.Id == item.Id);
            if (s != null) s.DisplayOrder = item.DisplayOrder;
        }
        await _db.SaveChangesAsync(ct);
    }

    private static HomeSectionDto MapDto(HomeSection hs) => new()
    {
        Id = hs.Id, Title = hs.Title, SectionType = hs.SectionType,
        DisplayOrder = hs.DisplayOrder, IsActive = hs.IsActive,
        StartDate = hs.StartDate, EndDate = hs.EndDate,
        BackgroundColor = hs.BackgroundColor, TextColor = hs.TextColor,
        Items = hs.Items.OrderBy(i => i.DisplayOrder).Select(i => new HomeSectionItemDto
        {
            Id = i.Id, TargetType = i.TargetType, TargetId = i.TargetId,
            Title = i.Title, ImageUrl = i.ImageUrl, Url = i.Url, Html = i.Html, DisplayOrder = i.DisplayOrder
        }).ToList()
    };
}
