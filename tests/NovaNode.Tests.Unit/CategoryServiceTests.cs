using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Categories;
using NovaNode.Domain.Entities;
using NovaNode.Infrastructure.MultiTenancy;
using NovaNode.Infrastructure.Persistence;
using NovaNode.Infrastructure.Services;
using Xunit;

namespace NovaNode.Tests.Unit;

public class CategoryServiceTests
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
        db.Tenants.Add(new Tenant { Id = tenantId, Name = "Test", Slug = "test" });
        db.SaveChanges();
        return (db, tenantId);
    }

    [Fact]
    public async Task CreateAsync_ShouldCreateCategory()
    {
        var (db, tenantId) = CreateDb();
        var svc = new CategoryService(db);

        var result = await svc.CreateAsync(tenantId, new CreateCategoryRequest { Name = "Electronics" });

        Assert.Equal("Electronics", result.Name);
        Assert.Equal("electronics", result.Slug);
        Assert.NotEqual(Guid.Empty, result.Id);
    }

    [Fact]
    public async Task CreateAsync_ShouldAutoGenerateSlug()
    {
        var (db, tenantId) = CreateDb();
        var svc = new CategoryService(db);

        var result = await svc.CreateAsync(tenantId, new CreateCategoryRequest { Name = "Smart Phones" });

        Assert.Equal("smart-phones", result.Slug);
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnCategories()
    {
        var (db, tenantId) = CreateDb();
        db.Categories.Add(new Category { TenantId = tenantId, Name = "Phones", Slug = "phones" });
        db.Categories.Add(new Category { TenantId = tenantId, Name = "Accessories", Slug = "accessories" });
        await db.SaveChangesAsync();

        var svc = new CategoryService(db);
        var result = await svc.GetAllAsync(tenantId);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetAllAsync_ShouldNotReturnOtherTenantCategories()
    {
        var (db, tenantId) = CreateDb();
        var otherTenantId = Guid.NewGuid();

        db.Categories.Add(new Category { TenantId = tenantId, Name = "Phones", Slug = "phones" });
        db.Categories.Add(new Category { TenantId = otherTenantId, Name = "Tablets", Slug = "tablets" });
        await db.SaveChangesAsync();

        var svc = new CategoryService(db);
        var result = await svc.GetAllAsync(tenantId);

        Assert.Single(result);
        Assert.Equal("Phones", result[0].Name);
    }

    [Fact]
    public async Task GetTreeAsync_ShouldReturnHierarchy()
    {
        var (db, tenantId) = CreateDb();
        var parent = new Category { TenantId = tenantId, Name = "Electronics", Slug = "electronics" };
        db.Categories.Add(parent);
        await db.SaveChangesAsync();

        db.Categories.Add(new Category { TenantId = tenantId, Name = "Phones", Slug = "phones", ParentId = parent.Id });
        db.Categories.Add(new Category { TenantId = tenantId, Name = "Tablets", Slug = "tablets", ParentId = parent.Id });
        await db.SaveChangesAsync();

        var svc = new CategoryService(db);
        var tree = await svc.GetTreeAsync(tenantId);

        Assert.Single(tree); // Only root
        Assert.Equal("Electronics", tree[0].Name);
        Assert.Equal(2, tree[0].Children.Count);
    }

    [Fact]
    public async Task UpdateAsync_ShouldUpdateCategory()
    {
        var (db, tenantId) = CreateDb();
        var cat = new Category { TenantId = tenantId, Name = "Phones", Slug = "phones" };
        db.Categories.Add(cat);
        await db.SaveChangesAsync();

        var svc = new CategoryService(db);
        var result = await svc.UpdateAsync(tenantId, cat.Id,
            new UpdateCategoryRequest { Name = "Smartphones" });

        Assert.Equal("Smartphones", result.Name);
        Assert.Equal("smartphones", result.Slug);
    }

    [Fact]
    public async Task DeleteAsync_ShouldRemoveCategory()
    {
        var (db, tenantId) = CreateDb();
        var cat = new Category { TenantId = tenantId, Name = "Phones", Slug = "phones" };
        db.Categories.Add(cat);
        await db.SaveChangesAsync();

        var svc = new CategoryService(db);
        await svc.DeleteAsync(tenantId, cat.Id);

        Assert.Empty(await db.Categories.ToListAsync());
    }

    [Fact]
    public async Task GetByIdAsync_ShouldThrow_WhenNotFound()
    {
        var (db, tenantId) = CreateDb();
        var svc = new CategoryService(db);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => svc.GetByIdAsync(tenantId, Guid.NewGuid()));
    }

    [Fact]
    public async Task CreateAsync_WithDeviceFlags_ShouldPersist()
    {
        var (db, tenantId) = CreateDb();
        var svc = new CategoryService(db);

        var result = await svc.CreateAsync(tenantId, new CreateCategoryRequest
        {
            Name = "Devices",
            IsDevice = true,
            SupportsIMEI = true,
            SupportsBatteryHealth = true,
            SupportsWarranty = true
        });

        Assert.True(result.IsDevice);
        Assert.True(result.SupportsIMEI);
        Assert.True(result.SupportsBatteryHealth);
        Assert.True(result.SupportsWarranty);
    }
}
