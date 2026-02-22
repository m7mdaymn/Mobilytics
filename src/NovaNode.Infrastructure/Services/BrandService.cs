using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Brands;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Entities;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public partial class BrandService : IBrandService
{
    private readonly AppDbContext _db;
    public BrandService(AppDbContext db) => _db = db;

    public async Task<List<BrandDto>> GetAllAsync(Guid tenantId, CancellationToken ct = default)
    {
        return await _db.Brands.Where(b => b.TenantId == tenantId)
            .OrderBy(b => b.DisplayOrder)
            .Select(b => MapDto(b)).ToListAsync(ct);
    }

    public async Task<BrandDto> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var brand = await _db.Brands.FirstOrDefaultAsync(b => b.TenantId == tenantId && b.Id == id, ct)
            ?? throw new KeyNotFoundException("Brand not found.");
        return MapDto(brand);
    }

    public async Task<BrandDto> CreateAsync(Guid tenantId, CreateBrandRequest request, CancellationToken ct = default)
    {
        var brand = new Brand
        {
            TenantId = tenantId,
            Name = request.Name,
            Slug = string.IsNullOrEmpty(request.Slug) ? Slugify(request.Name) : request.Slug,
            DisplayOrder = request.DisplayOrder,
            IsActive = request.IsActive
        };
        _db.Brands.Add(brand);
        await _db.SaveChangesAsync(ct);
        return MapDto(brand);
    }

    public async Task<BrandDto> UpdateAsync(Guid tenantId, Guid id, UpdateBrandRequest request, CancellationToken ct = default)
    {
        var brand = await _db.Brands.FirstOrDefaultAsync(b => b.TenantId == tenantId && b.Id == id, ct)
            ?? throw new KeyNotFoundException("Brand not found.");
        brand.Name = request.Name;
        brand.Slug = string.IsNullOrEmpty(request.Slug) ? Slugify(request.Name) : request.Slug;
        brand.DisplayOrder = request.DisplayOrder;
        brand.IsActive = request.IsActive;
        await _db.SaveChangesAsync(ct);
        return MapDto(brand);
    }

    public async Task DeleteAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var brand = await _db.Brands.FirstOrDefaultAsync(b => b.TenantId == tenantId && b.Id == id, ct)
            ?? throw new KeyNotFoundException("Brand not found.");
        _db.Brands.Remove(brand);
        await _db.SaveChangesAsync(ct);
    }

    private static BrandDto MapDto(Brand b) => new()
    {
        Id = b.Id, Name = b.Name, Slug = b.Slug,
        LogoUrl = b.LogoUrl, DisplayOrder = b.DisplayOrder, IsActive = b.IsActive
    };

    private static string Slugify(string text) =>
        SlugRegex().Replace(text.ToLowerInvariant().Replace(" ", "-"), "").Trim('-');

    [GeneratedRegex("[^a-z0-9-]")]
    private static partial Regex SlugRegex();
}
