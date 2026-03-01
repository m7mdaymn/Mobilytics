using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Common;
using NovaNode.Application.DTOs.Items;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Entities;
using NovaNode.Domain.Enums;
using NovaNode.Domain.Interfaces;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public partial class ItemService : IItemService
{
    private readonly AppDbContext _db;
    private readonly IFileStorage _fileStorage;

    public ItemService(AppDbContext db, IFileStorage fileStorage)
    {
        _db = db;
        _fileStorage = fileStorage;
    }

    public async Task<PagedResult<ItemDto>> GetAllAsync(Guid tenantId, ItemFilterRequest filter, CancellationToken ct = default)
    {
        var query = _db.Items
            .Include(i => i.Brand).Include(i => i.Category)
            .Where(i => i.TenantId == tenantId);

        if (filter.CategoryId.HasValue) query = query.Where(i => i.CategoryId == filter.CategoryId.Value);
        else if (!string.IsNullOrEmpty(filter.CategorySlug)) query = query.Where(i => i.Category != null && i.Category.Slug == filter.CategorySlug);
        // Legacy: still support ItemTypeSlug filter via category slug
        else if (!string.IsNullOrEmpty(filter.ItemTypeSlug)) query = query.Where(i => i.Category != null && i.Category.Slug == filter.ItemTypeSlug);
        if (filter.TypeId.HasValue) query = query.Where(i => i.CategoryId == filter.TypeId.Value);
        if (filter.BrandId.HasValue) query = query.Where(i => i.BrandId == filter.BrandId.Value);
        else if (!string.IsNullOrEmpty(filter.BrandSlug)) query = query.Where(i => i.Brand != null && i.Brand.Slug == filter.BrandSlug);
        if (filter.Condition.HasValue) query = query.Where(i => i.Condition == filter.Condition.Value);
        if (filter.PriceMin.HasValue) query = query.Where(i => i.Price >= filter.PriceMin.Value);
        if (filter.PriceMax.HasValue) query = query.Where(i => i.Price <= filter.PriceMax.Value);
        if (filter.Status.HasValue) query = query.Where(i => i.Status == filter.Status.Value);
        if (filter.Featured.HasValue) query = query.Where(i => i.IsFeatured == filter.Featured.Value);
        if (!string.IsNullOrEmpty(filter.Search))
            query = query.Where(i => i.Title.Contains(filter.Search) || (i.Description != null && i.Description.Contains(filter.Search)));
        if (!string.IsNullOrEmpty(filter.Color))
            query = query.Where(i => i.Color != null && i.Color == filter.Color);
        if (!string.IsNullOrEmpty(filter.Storage))
            query = query.Where(i => i.Storage != null && i.Storage == filter.Storage);
        if (!string.IsNullOrEmpty(filter.RAM))
            query = query.Where(i => i.RAM != null && i.RAM == filter.RAM);
        if (filter.InstallmentAvailable.HasValue)
            query = query.Where(i => i.InstallmentAvailable == filter.InstallmentAvailable.Value);
        if (filter.WarrantyType.HasValue)
            query = query.Where(i => i.WarrantyType == filter.WarrantyType.Value);

        query = filter.Sort?.ToLowerInvariant() switch
        {
            "price_asc" => query.OrderBy(i => i.Price),
            "price_desc" => query.OrderByDescending(i => i.Price),
            "newest" => query.OrderByDescending(i => i.CreatedAt),
            "oldest" => query.OrderBy(i => i.CreatedAt),
            _ => query.OrderByDescending(i => i.CreatedAt)
        };

        var total = await query.CountAsync(ct);
        var items = await query.Skip((filter.Page - 1) * filter.PageSize).Take(filter.PageSize)
            .Select(i => MapDto(i)).ToListAsync(ct);

        return new PagedResult<ItemDto> { Items = items, TotalCount = total, Page = filter.Page, PageSize = filter.PageSize };
    }

    public async Task<ItemDto> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var item = await _db.Items.Include(i => i.Brand).Include(i => i.Category)
            .FirstOrDefaultAsync(i => i.TenantId == tenantId && i.Id == id, ct)
            ?? throw new KeyNotFoundException("Item not found.");
        return MapDto(item);
    }

    public async Task<ItemDto?> GetBySlugAsync(Guid tenantId, string slug, CancellationToken ct = default)
    {
        var item = await _db.Items.Include(i => i.Brand).Include(i => i.Category)
            .FirstOrDefaultAsync(i => i.TenantId == tenantId && i.Slug == slug, ct);
        return item == null ? null : MapDto(item);
    }

    public async Task<ItemDto> CreateAsync(Guid tenantId, CreateItemRequest request, CancellationToken ct = default)
    {
        var item = new Item
        {
            TenantId = tenantId, BrandId = request.BrandId,
            CategoryId = request.CategoryId, Title = request.Title,
            Slug = string.IsNullOrEmpty(request.Slug) ? Slugify(request.Title) : request.Slug,
            Description = request.Description, Price = request.Price, OldPrice = request.OldPrice,
            TaxStatus = request.TaxStatus, VatPercent = request.VatPercent, Condition = request.Condition,
            BatteryHealth = request.BatteryHealth, IMEI = request.IMEI, SerialNumber = request.SerialNumber,
            WarrantyType = request.WarrantyType, WarrantyMonths = request.WarrantyMonths,
            Quantity = request.Quantity, ChecklistJson = request.ChecklistJson,
            CustomFieldsJson = request.CustomFieldsJson, IsFeatured = request.IsFeatured,
            Color = request.Color, Storage = request.Storage, RAM = request.RAM,
            InstallmentAvailable = request.InstallmentAvailable,
            Specs = request.Specs, WhatsInTheBox = request.WhatsInTheBox
        };
        _db.Items.Add(item);
        await _db.SaveChangesAsync(ct);

        return await GetByIdAsync(tenantId, item.Id, ct);
    }

    public async Task<ItemDto> UpdateAsync(Guid tenantId, Guid id, UpdateItemRequest request, CancellationToken ct = default)
    {
        var item = await _db.Items.FirstOrDefaultAsync(i => i.TenantId == tenantId && i.Id == id, ct)
            ?? throw new KeyNotFoundException("Item not found.");

        item.BrandId = request.BrandId;
        item.CategoryId = request.CategoryId; item.Title = request.Title;
        item.Slug = string.IsNullOrEmpty(request.Slug) ? Slugify(request.Title) : request.Slug;
        item.Description = request.Description; item.Price = request.Price; item.OldPrice = request.OldPrice;
        item.TaxStatus = request.TaxStatus; item.VatPercent = request.VatPercent; item.Condition = request.Condition;
        item.BatteryHealth = request.BatteryHealth; item.IMEI = request.IMEI; item.SerialNumber = request.SerialNumber;
        item.WarrantyType = request.WarrantyType; item.WarrantyMonths = request.WarrantyMonths;
        item.Quantity = request.Quantity; item.ChecklistJson = request.ChecklistJson;
        item.CustomFieldsJson = request.CustomFieldsJson; item.IsFeatured = request.IsFeatured;
        item.Color = request.Color; item.Storage = request.Storage; item.RAM = request.RAM;
        item.InstallmentAvailable = request.InstallmentAvailable;
        item.Specs = request.Specs; item.WhatsInTheBox = request.WhatsInTheBox;
        await _db.SaveChangesAsync(ct);

        return await GetByIdAsync(tenantId, item.Id, ct);
    }

    public async Task UpdateStatusAsync(Guid tenantId, Guid id, UpdateItemStatusRequest request, CancellationToken ct = default)
    {
        var item = await _db.Items.FirstOrDefaultAsync(i => i.TenantId == tenantId && i.Id == id, ct)
            ?? throw new KeyNotFoundException("Item not found.");
        item.Status = request.Status;
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var item = await _db.Items.FirstOrDefaultAsync(i => i.TenantId == tenantId && i.Id == id, ct)
            ?? throw new KeyNotFoundException("Item not found.");
        _db.Items.Remove(item);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<string> UploadImageAsync(Guid tenantId, Guid itemId, Stream stream, string fileName, string contentType, bool isMain, CancellationToken ct = default)
    {
        var item = await _db.Items.FirstOrDefaultAsync(i => i.TenantId == tenantId && i.Id == itemId, ct)
            ?? throw new KeyNotFoundException("Item not found.");

        var url = await _fileStorage.SaveFileAsync(tenantId, "items", stream, fileName, contentType, ct);

        if (isMain)
        {
            item.MainImageUrl = url;
        }
        else
        {
            var gallery = string.IsNullOrEmpty(item.GalleryImagesJson)
                ? new List<string>() : JsonSerializer.Deserialize<List<string>>(item.GalleryImagesJson) ?? [];
            if (gallery.Count >= 5) throw new InvalidOperationException("Maximum 5 gallery images allowed.");
            gallery.Add(url);
            item.GalleryImagesJson = JsonSerializer.Serialize(gallery);
        }

        await _db.SaveChangesAsync(ct);
        return url;
    }

    public async Task DeleteImageAsync(Guid tenantId, Guid itemId, string imageKey, CancellationToken ct = default)
    {
        var item = await _db.Items.FirstOrDefaultAsync(i => i.TenantId == tenantId && i.Id == itemId, ct)
            ?? throw new KeyNotFoundException("Item not found.");

        if (imageKey == "main")
        {
            if (!string.IsNullOrEmpty(item.MainImageUrl))
                await _fileStorage.DeleteFileAsync(item.MainImageUrl, ct);
            item.MainImageUrl = null;
        }
        else
        {
            var gallery = string.IsNullOrEmpty(item.GalleryImagesJson)
                ? new List<string>() : JsonSerializer.Deserialize<List<string>>(item.GalleryImagesJson) ?? [];
            var img = gallery.FirstOrDefault(g => g.Contains(imageKey));
            if (img != null)
            {
                await _fileStorage.DeleteFileAsync(img, ct);
                gallery.Remove(img);
                item.GalleryImagesJson = JsonSerializer.Serialize(gallery);
            }
        }
        await _db.SaveChangesAsync(ct);
    }

    private static ItemDto MapDto(Item i) => new()
    {
        Id = i.Id, ItemTypeId = i.ItemTypeId, ItemTypeName = i.Category?.Name,
        BrandId = i.BrandId, BrandName = i.Brand?.Name,
        CategoryId = i.CategoryId, CategoryName = i.Category?.Name,
        Title = i.Title, Slug = i.Slug, Description = i.Description,
        Price = i.Price, OldPrice = i.OldPrice, TaxStatus = i.TaxStatus, VatPercent = i.VatPercent,
        Condition = i.Condition, BatteryHealth = i.BatteryHealth, IMEI = i.IMEI,
        SerialNumber = i.SerialNumber, WarrantyType = i.WarrantyType, WarrantyMonths = i.WarrantyMonths,
        Quantity = i.Quantity, Status = i.Status, MainImageUrl = i.MainImageUrl,
        GalleryImagesJson = i.GalleryImagesJson, ChecklistJson = i.ChecklistJson,
        CustomFieldsJson = i.CustomFieldsJson, IsFeatured = i.IsFeatured,
        Color = i.Color, Storage = i.Storage, RAM = i.RAM,
        InstallmentAvailable = i.InstallmentAvailable,
        Specs = i.Specs, WhatsInTheBox = i.WhatsInTheBox,
        CreatedAt = i.CreatedAt, UpdatedAt = i.UpdatedAt
    };

    private static string Slugify(string text) =>
        SlugRegex().Replace(text.ToLowerInvariant().Replace(" ", "-"), "").Trim('-');

    [GeneratedRegex("[^a-z0-9-]")]
    private static partial Regex SlugRegex();
}
