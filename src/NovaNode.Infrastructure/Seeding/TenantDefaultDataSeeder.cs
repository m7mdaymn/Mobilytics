using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NovaNode.Domain.Entities;
using NovaNode.Domain.Enums;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Seeding;

/// <summary>
/// Seeds default brands, categories, item types, and home sections
/// when a new tenant is onboarded so the store is immediately usable.
/// Fully idempotent — safe to call multiple times per tenant.
/// </summary>
public static class TenantDefaultDataSeeder
{
    /// <summary>
    /// Idempotent seed: only inserts data that does not already exist for the tenant.
    /// </summary>
    public static async Task SeedAsync(AppDbContext db, Guid tenantId, CancellationToken ct = default)
    {
        // ── Brands (skip if tenant already has any) ──
        Brand[] brands;
        if (!await db.Brands.AnyAsync(b => b.TenantId == tenantId, ct))
        {
            brands = new[]
            {
                new Brand { TenantId = tenantId, Name = "Apple", Slug = "apple", DisplayOrder = 0, IsActive = true },
                new Brand { TenantId = tenantId, Name = "Samsung", Slug = "samsung", DisplayOrder = 1, IsActive = true },
                new Brand { TenantId = tenantId, Name = "Xiaomi", Slug = "xiaomi", DisplayOrder = 2, IsActive = true },
                new Brand { TenantId = tenantId, Name = "Oppo", Slug = "oppo", DisplayOrder = 3, IsActive = true },
                new Brand { TenantId = tenantId, Name = "Huawei", Slug = "huawei", DisplayOrder = 4, IsActive = true },
            };
            db.Brands.AddRange(brands);
        }
        else
        {
            brands = await db.Brands.Where(b => b.TenantId == tenantId).OrderBy(b => b.DisplayOrder).ToArrayAsync(ct);
        }

        // ── Categories (skip if tenant already has any) ──
        Category[] categories;
        if (!await db.Categories.AnyAsync(c => c.TenantId == tenantId, ct))
        {
            categories = new[]
            {
                new Category { TenantId = tenantId, Name = "Smartphones", Slug = "smartphones", DisplayOrder = 0, IsActive = true },
                new Category { TenantId = tenantId, Name = "Used Phones", Slug = "used-phones", DisplayOrder = 1, IsActive = true },
                new Category { TenantId = tenantId, Name = "Tablets", Slug = "tablets", DisplayOrder = 2, IsActive = true },
                new Category { TenantId = tenantId, Name = "Laptops", Slug = "laptops", DisplayOrder = 3, IsActive = true },
                new Category { TenantId = tenantId, Name = "Accessories", Slug = "accessories", DisplayOrder = 4, IsActive = true },
            };
            db.Categories.AddRange(categories);
        }
        else
        {
            categories = await db.Categories.Where(c => c.TenantId == tenantId).OrderBy(c => c.DisplayOrder).ToArrayAsync(ct);
        }

        // ── Item Types (skip if tenant already has any) ──
        if (!await db.ItemTypes.AnyAsync(it => it.TenantId == tenantId, ct))
        {
            db.ItemTypes.AddRange(
                new ItemType
                {
                    TenantId = tenantId, Name = "Smartphone", Slug = "smartphone",
                    IsDevice = true, IsStockItem = false,
                    SupportsIMEI = true, SupportsSerial = false,
                    SupportsBatteryHealth = true, SupportsWarranty = true,
                    DisplayOrder = 0, IsActive = true
                },
                new ItemType
                {
                    TenantId = tenantId, Name = "Tablet", Slug = "tablet",
                    IsDevice = true, IsStockItem = false,
                    SupportsIMEI = true, SupportsSerial = true,
                    SupportsBatteryHealth = true, SupportsWarranty = true,
                    DisplayOrder = 1, IsActive = true
                },
                new ItemType
                {
                    TenantId = tenantId, Name = "Laptop", Slug = "laptop",
                    IsDevice = true, IsStockItem = false,
                    SupportsIMEI = false, SupportsSerial = true,
                    SupportsBatteryHealth = true, SupportsWarranty = true,
                    DisplayOrder = 2, IsActive = true
                },
                new ItemType
                {
                    TenantId = tenantId, Name = "Accessory", Slug = "accessory",
                    IsDevice = false, IsStockItem = true,
                    SupportsIMEI = false, SupportsSerial = false,
                    SupportsBatteryHealth = false, SupportsWarranty = false,
                    DisplayOrder = 3, IsActive = true
                }
            );
        }

        await db.SaveChangesAsync(ct);

        // ── Home Sections (skip if tenant already has any) ──
        if (!await db.HomeSections.AnyAsync(hs => hs.TenantId == tenantId, ct))
        {
            var featuredSection = new HomeSection
            {
                TenantId = tenantId,
                Title = "Featured Products",
                SectionType = HomeSectionType.FeaturedItems,
                DisplayOrder = 0, IsActive = true
            };
            var categoriesSection = new HomeSection
            {
                TenantId = tenantId,
                Title = "Shop By Category",
                SectionType = HomeSectionType.CategoriesShowcase,
                DisplayOrder = 1, IsActive = true
            };
            var brandsSection = new HomeSection
            {
                TenantId = tenantId,
                Title = "Top Brands",
                SectionType = HomeSectionType.BrandsCarousel,
                DisplayOrder = 2, IsActive = true
            };
            var arrivalsSection = new HomeSection
            {
                TenantId = tenantId,
                Title = "New Arrivals",
                SectionType = HomeSectionType.NewArrivals,
                DisplayOrder = 3, IsActive = true
            };
            db.HomeSections.AddRange(featuredSection, categoriesSection, brandsSection, arrivalsSection);
            await db.SaveChangesAsync(ct);

            // Categories showcase items
            for (int i = 0; i < categories.Length; i++)
            {
                db.HomeSectionItems.Add(new HomeSectionItem
                {
                    HomeSectionId = categoriesSection.Id,
                    TargetType = HomeSectionTargetType.Category,
                    TargetId = categories[i].Id,
                    Title = categories[i].Name,
                    DisplayOrder = i
                });
            }

            // Brands carousel items
            for (int i = 0; i < brands.Length; i++)
            {
                db.HomeSectionItems.Add(new HomeSectionItem
                {
                    HomeSectionId = brandsSection.Id,
                    TargetType = HomeSectionTargetType.Brand,
                    TargetId = brands[i].Id,
                    Title = brands[i].Name,
                    DisplayOrder = i
                });
            }

            await db.SaveChangesAsync(ct);
        }

        // ── Ensure StoreSettings exist ──
        if (!await db.StoreSettings.AnyAsync(ss => ss.TenantId == tenantId, ct))
        {
            db.StoreSettings.Add(new StoreSettings
            {
                TenantId = tenantId,
                StoreName = "New Store",
                CurrencyCode = "EGP",
                ThemePresetId = 1
            });
            await db.SaveChangesAsync(ct);
        }
    }

    /// <summary>
    /// Backfill defaults for ALL existing tenants. Called once at startup.
    /// </summary>
    public static async Task BackfillAllTenantsAsync(IServiceProvider services, CancellationToken ct = default)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantIds = await db.Tenants.Select(t => t.Id).ToListAsync(ct);

        foreach (var tenantId in tenantIds)
        {
            await SeedAsync(db, tenantId, ct);
        }
    }
}
