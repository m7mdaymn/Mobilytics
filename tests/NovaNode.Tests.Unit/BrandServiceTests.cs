using Microsoft.EntityFrameworkCore;
using NovaNode.Domain.Entities;
using NovaNode.Infrastructure.MultiTenancy;
using NovaNode.Infrastructure.Persistence;
using NovaNode.Infrastructure.Services;
using Xunit;

namespace NovaNode.Tests.Unit;

public class BrandServiceTests
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

        // Add tenant
        db.Tenants.Add(new Tenant { Id = tenantId, Name = "Test", Slug = "test" });
        db.SaveChanges();

        return (db, tenantId);
    }

    [Fact]
    public async Task CreateAsync_ShouldCreateBrand()
    {
        var (db, tenantId) = CreateDb();
        var svc = new BrandService(db);

        var result = await svc.CreateAsync(tenantId, new Application.DTOs.Brands.CreateBrandRequest { Name = "Apple" });

        Assert.Equal("Apple", result.Name);
        Assert.Equal("apple", result.Slug);
        Assert.NotEqual(Guid.Empty, result.Id);
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnBrands()
    {
        var (db, tenantId) = CreateDb();
        db.Brands.Add(new Brand { TenantId = tenantId, Name = "Apple", Slug = "apple" });
        db.Brands.Add(new Brand { TenantId = tenantId, Name = "Samsung", Slug = "samsung" });
        await db.SaveChangesAsync();

        var svc = new BrandService(db);
        var result = await svc.GetAllAsync(tenantId);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetAllAsync_ShouldNotReturnOtherTenantBrands()
    {
        var (db, tenantId) = CreateDb();
        var otherTenantId = Guid.NewGuid();

        db.Brands.Add(new Brand { TenantId = tenantId, Name = "Apple", Slug = "apple" });
        db.Brands.Add(new Brand { TenantId = otherTenantId, Name = "Samsung", Slug = "samsung" });
        await db.SaveChangesAsync();

        var svc = new BrandService(db);
        var result = await svc.GetAllAsync(tenantId);

        // Due to global query filter, should only see the current tenant's brands
        Assert.Single(result);
        Assert.Equal("Apple", result[0].Name);
    }

    [Fact]
    public async Task UpdateAsync_ShouldUpdateBrand()
    {
        var (db, tenantId) = CreateDb();
        var brand = new Brand { TenantId = tenantId, Name = "Apple", Slug = "apple" };
        db.Brands.Add(brand);
        await db.SaveChangesAsync();

        var svc = new BrandService(db);
        var result = await svc.UpdateAsync(tenantId, brand.Id,
            new Application.DTOs.Brands.UpdateBrandRequest { Name = "Apple Inc" });

        Assert.Equal("Apple Inc", result.Name);
        Assert.Equal("apple-inc", result.Slug);
    }

    [Fact]
    public async Task DeleteAsync_ShouldRemoveBrand()
    {
        var (db, tenantId) = CreateDb();
        var brand = new Brand { TenantId = tenantId, Name = "Apple", Slug = "apple" };
        db.Brands.Add(brand);
        await db.SaveChangesAsync();

        var svc = new BrandService(db);
        await svc.DeleteAsync(tenantId, brand.Id);

        Assert.Empty(await db.Brands.ToListAsync());
    }

    [Fact]
    public async Task GetByIdAsync_ShouldThrow_WhenNotFound()
    {
        var (db, tenantId) = CreateDb();
        var svc = new BrandService(db);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => svc.GetByIdAsync(tenantId, Guid.NewGuid()));
    }
}
