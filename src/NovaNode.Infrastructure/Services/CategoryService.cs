using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Categories;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Entities;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public partial class CategoryService : ICategoryService
{
    private readonly AppDbContext _db;
    public CategoryService(AppDbContext db) => _db = db;

    public async Task<List<CategoryDto>> GetAllAsync(Guid tenantId, CancellationToken ct = default) =>
        await _db.Categories.Where(c => c.TenantId == tenantId).OrderBy(c => c.DisplayOrder)
            .Select(c => MapDto(c)).ToListAsync(ct);

    public async Task<List<CategoryDto>> GetTreeAsync(Guid tenantId, CancellationToken ct = default)
    {
        var all = await _db.Categories.Where(c => c.TenantId == tenantId).OrderBy(c => c.DisplayOrder).ToListAsync(ct);
        return BuildTree(all, null);
    }

    private static List<CategoryDto> BuildTree(List<Category> all, Guid? parentId)
    {
        return all.Where(c => c.ParentId == parentId).Select(c => new CategoryDto
        {
            Id = c.Id, Name = c.Name, Slug = c.Slug, ImageUrl = c.ImageUrl,
            ParentId = c.ParentId, DisplayOrder = c.DisplayOrder, IsActive = c.IsActive,
            MetaTitle = c.MetaTitle, MetaDesc = c.MetaDesc,
            Children = BuildTree(all, c.Id)
        }).ToList();
    }

    public async Task<CategoryDto> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var cat = await _db.Categories.FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Id == id, ct)
            ?? throw new KeyNotFoundException("Category not found.");
        return MapDto(cat);
    }

    public async Task<CategoryDto> CreateAsync(Guid tenantId, CreateCategoryRequest request, CancellationToken ct = default)
    {
        var cat = new Category
        {
            TenantId = tenantId, Name = request.Name,
            Slug = string.IsNullOrEmpty(request.Slug) ? Slugify(request.Name) : request.Slug,
            ParentId = request.ParentId, DisplayOrder = request.DisplayOrder,
            IsActive = request.IsActive, MetaTitle = request.MetaTitle, MetaDesc = request.MetaDesc
        };
        _db.Categories.Add(cat);
        await _db.SaveChangesAsync(ct);
        return MapDto(cat);
    }

    public async Task<CategoryDto> UpdateAsync(Guid tenantId, Guid id, UpdateCategoryRequest request, CancellationToken ct = default)
    {
        var cat = await _db.Categories.FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Id == id, ct)
            ?? throw new KeyNotFoundException("Category not found.");
        cat.Name = request.Name;
        cat.Slug = string.IsNullOrEmpty(request.Slug) ? Slugify(request.Name) : request.Slug;
        cat.ParentId = request.ParentId;
        cat.DisplayOrder = request.DisplayOrder;
        cat.IsActive = request.IsActive;
        cat.MetaTitle = request.MetaTitle;
        cat.MetaDesc = request.MetaDesc;
        await _db.SaveChangesAsync(ct);
        return MapDto(cat);
    }

    public async Task DeleteAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var cat = await _db.Categories.FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Id == id, ct)
            ?? throw new KeyNotFoundException("Category not found.");
        _db.Categories.Remove(cat);
        await _db.SaveChangesAsync(ct);
    }

    public async Task ReorderAsync(Guid tenantId, ReorderRequest request, CancellationToken ct = default)
    {
        var cats = await _db.Categories.Where(c => c.TenantId == tenantId).ToListAsync(ct);
        foreach (var item in request.Items)
        {
            var cat = cats.FirstOrDefault(c => c.Id == item.Id);
            if (cat != null) cat.DisplayOrder = item.DisplayOrder;
        }
        await _db.SaveChangesAsync(ct);
    }

    private static CategoryDto MapDto(Category c) => new()
    {
        Id = c.Id, Name = c.Name, Slug = c.Slug, ImageUrl = c.ImageUrl,
        ParentId = c.ParentId, DisplayOrder = c.DisplayOrder, IsActive = c.IsActive,
        MetaTitle = c.MetaTitle, MetaDesc = c.MetaDesc
    };

    private static string Slugify(string text) =>
        SlugRegex().Replace(text.ToLowerInvariant().Replace(" ", "-"), "").Trim('-');

    [GeneratedRegex("[^a-z0-9-]")]
    private static partial Regex SlugRegex();
}
