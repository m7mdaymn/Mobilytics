using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NovaNode.Domain.Entities;
using NovaNode.Domain.Enums;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Seeding;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Use MigrateAsync for relational DBs, EnsureCreatedAsync for InMemory (tests)
        if (db.Database.IsRelational())
            await db.Database.MigrateAsync();
        else
            await db.Database.EnsureCreatedAsync();

        // Seed super-admin
        if (!await db.PlatformUsers.AnyAsync())
        {
            db.PlatformUsers.Add(new PlatformUser
            {
                Email = "admin@novanode.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123")
            });
        }

        // Seed default plan
        if (!await db.Plans.AnyAsync())
        {
            db.Plans.Add(new Plan
            {
                Name = "Standard",
                PriceMonthly = 500m,
                ActivationFee = 1500m,
                LimitsJson = "{}",
                FeaturesJson = "{}",
                IsActive = true
            });
        }

        await db.SaveChangesAsync();

        // Optional demo tenant
        var demoSeed = Environment.GetEnvironmentVariable("DEMO_SEED");
        if (string.Equals(demoSeed, "true", StringComparison.OrdinalIgnoreCase) && !await db.Tenants.AnyAsync(t => t.Slug == "demo"))
        {
            var plan = await db.Plans.FirstAsync();
            var tenant = new Tenant
            {
                Name = "Demo Store",
                Slug = "demo",
                SupportPhone = "+201000000000",
                SupportWhatsApp = "+201000000000"
            };
            db.Tenants.Add(tenant);
            await db.SaveChangesAsync();

            // ===== STORE SETTINGS =====
            db.StoreSettings.Add(new StoreSettings 
            { 
                TenantId = tenant.Id, 
                StoreName = "TechHub Electronics",
                Currency = "EGP",
                IsActive = true,
                ThemeId = 1,
                PrimaryColor = "#2563eb",
                SecondaryColor = "#64748b",
                AccentColor = "#f97316",
                PwaShortName = "TechHub",
                PwaDescription = "Your Ultimate Tech Store",
                CanRemovePoweredBy = true,
                ShowPoweredBy = false
            });

            db.TenantFeatureToggles.Add(new TenantFeatureToggle 
            { 
                TenantId = tenant.Id, 
                CanRemovePoweredBy = true, 
                AdvancedReports = true 
            });

            db.Subscriptions.Add(new Subscription
            {
                TenantId = tenant.Id,
                PlanId = plan.Id,
                Status = SubscriptionStatus.Active,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddMonths(12),
                GraceEnd = DateTime.UtcNow.AddMonths(12).AddDays(3)
            });

            db.Employees.Add(new Employee
            {
                TenantId = tenant.Id,
                Name = "Owner",
                Email = "owner@demo.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo@123"),
                Role = "Owner"
            });

            // ===== CATEGORIES =====
            var categories = new[]
            {
                new Category { TenantId = tenant.Id, Name = "Smartphones", Slug = "smartphones", DisplayOrder = 0 },
                new Category { TenantId = tenant.Id, Name = "Tablets", Slug = "tablets", DisplayOrder = 1 },
                new Category { TenantId = tenant.Id, Name = "Laptops", Slug = "laptops", DisplayOrder = 2 },
                new Category { TenantId = tenant.Id, Name = "Accessories", Slug = "accessories", DisplayOrder = 3 },
                new Category { TenantId = tenant.Id, Name = "Audio", Slug = "audio", DisplayOrder = 4 },
            }.ToList();
            db.Categories.AddRange(categories);

            // ===== BRANDS =====
            var brands = new[]
            {
                new Brand { TenantId = tenant.Id, Name = "Apple", Slug = "apple", LogoUrl = "https://via.placeholder.com/200x100?text=Apple" },
                new Brand { TenantId = tenant.Id, Name = "Samsung", Slug = "samsung", LogoUrl = "https://via.placeholder.com/200x100?text=Samsung" },
                new Brand { TenantId = tenant.Id, Name = "Sony", Slug = "sony", LogoUrl = "https://via.placeholder.com/200x100?text=Sony" },
                new Brand { TenantId = tenant.Id, Name = "LG", Slug = "lg", LogoUrl = "https://via.placeholder.com/200x100?text=LG" },
                new Brand { TenantId = tenant.Id, Name = "Dell", Slug = "dell", LogoUrl = "https://via.placeholder.com/200x100?text=Dell" },
            }.ToList();
            db.Brands.AddRange(brands);

            // ===== ITEM TYPES =====
            var itemTypes = new[]
            {
                new ItemType { TenantId = tenant.Id, Name = "Smartphone", Slug = "smartphone", IsDevice = true, IsStockItem = false },
                new ItemType { TenantId = tenant.Id, Name = "Laptop", Slug = "laptop", IsDevice = true, IsStockItem = false },
                new ItemType { TenantId = tenant.Id, Name = "Tablet", Slug = "tablet", IsDevice = true, IsStockItem = false },
                new ItemType { TenantId = tenant.Id, Name = "Accessory", Slug = "accessory", IsDevice = false, IsStockItem = true },
            }.ToList();
            db.ItemTypes.AddRange(itemTypes);

            await db.SaveChangesAsync();

            // ===== ITEMS (PRODUCTS) =====
            var items = new[]
            {
                new Item 
                { 
                    TenantId = tenant.Id, 
                    Title = "iPhone 15 Pro Max",
                    Slug = "iphone-15-pro-max",
                    CategoryId = categories[0].Id,
                    BrandId = brands[0].Id,
                    ItemTypeId = itemTypes[0].Id,
                    Description = "Latest Apple flagship with advanced camera system",
                    PriceEgp = 24999,
                    IsFeatured = true,
                    Status = ItemStatus.Available,
                    ImageUrl = "https://via.placeholder.com/400x400?text=iPhone+15+Pro"
                },
                new Item 
                { 
                    TenantId = tenant.Id, 
                    Title = "Samsung Galaxy S24",
                    Slug = "samsung-galaxy-s24",
                    CategoryId = categories[0].Id,
                    BrandId = brands[1].Id,
                    ItemTypeId = itemTypes[0].Id,
                    Description = "Premium Android phone with AI features",
                    PriceEgp = 23999,
                    IsFeatured = true,
                    Status = ItemStatus.Available,
                    ImageUrl = "https://via.placeholder.com/400x400?text=Galaxy+S24"
                },
                new Item 
                { 
                    TenantId = tenant.Id, 
                    Title = "iPad Air 11",
                    Slug = "ipad-air-11",
                    CategoryId = categories[1].Id,
                    BrandId = brands[0].Id,
                    ItemTypeId = itemTypes[2].Id,
                    Description = "High-performance tablet perfect for work and play",
                    PriceEgp = 15999,
                    IsFeatured = true,
                    Status = ItemStatus.Available,
                    ImageUrl = "https://via.placeholder.com/400x400?text=iPad+Air"
                },
                new Item 
                { 
                    TenantId = tenant.Id, 
                    Title = "MacBook Pro 16",
                    Slug = "macbook-pro-16",
                    CategoryId = categories[2].Id,
                    BrandId = brands[0].Id,
                    ItemTypeId = itemTypes[1].Id,
                    Description = "Powerful laptop for professionals",
                    PriceEgp = 49999,
                    IsFeatured = true,
                    Status = ItemStatus.Available,
                    ImageUrl = "https://via.placeholder.com/400x400?text=MacBook+Pro"
                },
                new Item 
                { 
                    TenantId = tenant.Id, 
                    Title = "Sony WH-1000XM5",
                    Slug = "sony-wh1000xm5",
                    CategoryId = categories[4].Id,
                    BrandId = brands[2].Id,
                    ItemTypeId = itemTypes[3].Id,
                    Description = "Premium noise-cancelling headphones",
                    PriceEgp = 3999,
                    IsFeatured = true,
                    Status = ItemStatus.Available,
                    ImageUrl = "https://via.placeholder.com/400x400?text=Headphones"
                },
                new Item 
                { 
                    TenantId = tenant.Id, 
                    Title = "USB-C Cable (2m)",
                    Slug = "usb-c-cable-2m",
                    CategoryId = categories[3].Id,
                    BrandId = null,
                    ItemTypeId = itemTypes[3].Id,
                    Description = "High-quality USB-C charging cable",
                    PriceEgp = 89,
                    IsFeatured = false,
                    Status = ItemStatus.Available,
                    ImageUrl = "https://via.placeholder.com/400x400?text=USB-C"
                },
            }.ToList();
            db.Items.AddRange(items);

            await db.SaveChangesAsync();

            // ===== HOME SECTIONS =====
            var homeSections = new[]
            {
                new HomeSection
                {
                    TenantId = tenant.Id,
                    Title = "🔥 Hot Deals This Week",
                    Type = "BannerSlider",
                    DisplayOrder = 0,
                    IsActive = true,
                    ItemsJson = "[{\"id\":1,\"title\":\"Get iPhone 15 Pro Max at Best Price!\",\"imageUrl\":\"https://via.placeholder.com/1200x400?text=iPhone+Deal\",\"ctaText\":\"Shop Now\",\"linkValue\":\"/catalog?search=iphone\"},{\"id\":2,\"title\":\"Fresh Samsung Galaxy S24 Arrivals\",\"imageUrl\":\"https://via.placeholder.com/1200x400?text=Samsung+Deal\",\"ctaText\":\"Explore\",\"linkValue\":\"/catalog?brand=samsung\"}]"
                },
                new HomeSection
                {
                    TenantId = tenant.Id,
                    Title = "Featured Products",
                    Type = "FeaturedItems",
                    DisplayOrder = 1,
                    IsActive = true
                },
                new HomeSection
                {
                    TenantId = tenant.Id,
                    Title = "Shop By Category",
                    Type = "CategoriesShowcase",
                    DisplayOrder = 2,
                    IsActive = true,
                    ItemsJson = "[{\"id\":1,\"title\":\"Smartphones\",\"imageUrl\":\"https://via.placeholder.com/200x200?text=Phones\",\"linkValue\":\"smartphones\"},{\"id\":2,\"title\":\"Tablets\",\"imageUrl\":\"https://via.placeholder.com/200x200?text=Tablets\",\"linkValue\":\"tablets\"},{\"id\":3,\"title\":\"Laptops\",\"imageUrl\":\"https://via.placeholder.com/200x200?text=Laptops\",\"linkValue\":\"laptops\"},{\"id\":4,\"title\":\"Accessories\",\"imageUrl\":\"https://via.placeholder.com/200x200?text=Accessories\",\"linkValue\":\"accessories\"}]"
                },
                new HomeSection
                {
                    TenantId = tenant.Id,
                    Title = "Top Brands",
                    Type = "BrandsCarousel",
                    DisplayOrder = 3,
                    IsActive = true
                },
            }.ToList();
            db.HomeSections.AddRange(homeSections);

            await db.SaveChangesAsync();
        }
    }
}
