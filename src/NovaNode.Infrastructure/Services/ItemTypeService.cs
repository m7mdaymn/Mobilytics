using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Categories;
using NovaNode.Application.DTOs.ItemTypes;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Entities;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public partial class ItemTypeService : IItemTypeService
{
    private readonly AppDbContext _db;
    public ItemTypeService(AppDbContext db) => _db = db;

    public async Task<List<ItemTypeDto>> GetAllAsync(Guid tenantId, CancellationToken ct = default) =>
        await _db.ItemTypes.Where(it => it.TenantId == tenantId).OrderBy(it => it.DisplayOrder)
            .Select(it => MapDto(it)).ToListAsync(ct);

    public async Task<ItemTypeDto> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var it = await _db.ItemTypes.FirstOrDefaultAsync(x => x.TenantId == tenantId && x.Id == id, ct)
            ?? throw new KeyNotFoundException("ItemType not found.");
        return MapDto(it);
    }

    public async Task<ItemTypeDto> CreateAsync(Guid tenantId, CreateItemTypeRequest request, CancellationToken ct = default)
    {
        var it = new ItemType
        {
            TenantId = tenantId, Name = request.Name,
            Slug = string.IsNullOrEmpty(request.Slug) ? Slugify(request.Name) : request.Slug,
            IsDevice = request.IsDevice, IsStockItem = request.IsStockItem,
            SupportsIMEI = request.SupportsIMEI, SupportsSerial = request.SupportsSerial,
            SupportsBatteryHealth = request.SupportsBatteryHealth, SupportsWarranty = request.SupportsWarranty,
            DisplayOrder = request.DisplayOrder,
            IsVisibleInNav = request.IsVisibleInNav
        };
        _db.ItemTypes.Add(it);
        await _db.SaveChangesAsync(ct);
        return MapDto(it);
    }

    public async Task<ItemTypeDto> UpdateAsync(Guid tenantId, Guid id, UpdateItemTypeRequest request, CancellationToken ct = default)
    {
        var it = await _db.ItemTypes.FirstOrDefaultAsync(x => x.TenantId == tenantId && x.Id == id, ct)
            ?? throw new KeyNotFoundException("ItemType not found.");
        it.Name = request.Name;
        it.Slug = string.IsNullOrEmpty(request.Slug) ? Slugify(request.Name) : request.Slug;
        it.IsDevice = request.IsDevice; it.IsStockItem = request.IsStockItem;
        it.SupportsIMEI = request.SupportsIMEI; it.SupportsSerial = request.SupportsSerial;
        it.SupportsBatteryHealth = request.SupportsBatteryHealth; it.SupportsWarranty = request.SupportsWarranty;
        it.DisplayOrder = request.DisplayOrder; it.IsActive = request.IsActive;
        it.IsVisibleInNav = request.IsVisibleInNav;
        await _db.SaveChangesAsync(ct);
        return MapDto(it);
    }

    public async Task DeleteAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var it = await _db.ItemTypes.FirstOrDefaultAsync(x => x.TenantId == tenantId && x.Id == id, ct)
            ?? throw new KeyNotFoundException("ItemType not found.");
        _db.ItemTypes.Remove(it);
        await _db.SaveChangesAsync(ct);
    }

    public async Task ReorderAsync(Guid tenantId, ReorderRequest request, CancellationToken ct = default)
    {
        var types = await _db.ItemTypes.Where(it => it.TenantId == tenantId).ToListAsync(ct);
        foreach (var item in request.Items)
        {
            var t = types.FirstOrDefault(x => x.Id == item.Id);
            if (t != null) t.DisplayOrder = item.DisplayOrder;
        }
        await _db.SaveChangesAsync(ct);
    }

    private static ItemTypeDto MapDto(ItemType it) => new()
    {
        Id = it.Id, Name = it.Name, Slug = it.Slug, IsDevice = it.IsDevice,
        IsStockItem = it.IsStockItem, SupportsIMEI = it.SupportsIMEI,
        SupportsSerial = it.SupportsSerial, SupportsBatteryHealth = it.SupportsBatteryHealth,
        SupportsWarranty = it.SupportsWarranty, IsActive = it.IsActive,
        IsVisibleInNav = it.IsVisibleInNav, DisplayOrder = it.DisplayOrder
    };

    private static string Slugify(string text) =>
        SlugRegex().Replace(text.ToLowerInvariant().Replace(" ", "-"), "").Trim('-');

    [GeneratedRegex("[^a-z0-9-]")]
    private static partial Regex SlugRegex();
}
