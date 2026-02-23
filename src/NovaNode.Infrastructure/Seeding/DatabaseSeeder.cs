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

        // Seed default plans
        if (!await db.Plans.AnyAsync())
        {
            db.Plans.AddRange(
                new Plan
                {
                    Name = "Trial",
                    PriceMonthly = 0m,
                    ActivationFee = 0m,
                    LimitsJson = "{\"maxItems\":20,\"maxEmployees\":2,\"maxImages\":3,\"maxStorageMB\":100}",
                    FeaturesJson = "{\"canRemovePoweredBy\":false,\"advancedReports\":false,\"customDomain\":false,\"apiAccess\":false,\"prioritySupport\":false}",
                    IsActive = true
                },
                new Plan
                {
                    Name = "Standard",
                    PriceMonthly = 500m,
                    ActivationFee = 1500m,
                    LimitsJson = "{\"maxItems\":500,\"maxEmployees\":10,\"maxImages\":10,\"maxStorageMB\":2048}",
                    FeaturesJson = "{\"canRemovePoweredBy\":true,\"advancedReports\":true,\"customDomain\":false,\"apiAccess\":false,\"prioritySupport\":false}",
                    IsActive = true
                },
                new Plan
                {
                    Name = "Premium",
                    PriceMonthly = 1200m,
                    ActivationFee = 2500m,
                    LimitsJson = "{\"maxItems\":5000,\"maxEmployees\":50,\"maxImages\":20,\"maxStorageMB\":10240}",
                    FeaturesJson = "{\"canRemovePoweredBy\":true,\"advancedReports\":true,\"customDomain\":true,\"apiAccess\":true,\"prioritySupport\":true}",
                    IsActive = true
                }
            );
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
                CurrencyCode = "EGP",
                ThemePresetId = 1,
                PwaSettingsJson = "{\"shortName\":\"TechHub\",\"description\":\"Your Ultimate Tech Store\"}"
            });

            db.TenantFeatureToggles.Add(new TenantFeatureToggle 
            { 
                TenantId = tenant.Id, 
                CanRemovePoweredBy = true, 
                AdvancedReports = true 
            });

            var demoSubscription = new Subscription
            {
                TenantId = tenant.Id,
                PlanId = plan.Id,
                Status = SubscriptionStatus.Active,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddMonths(12),
                GraceEnd = DateTime.UtcNow.AddMonths(12).AddDays(3)
            };
            db.Subscriptions.Add(demoSubscription);

            db.Employees.Add(new Employee
            {
                TenantId = tenant.Id,
                Name = "Owner",
                Email = "owner@demo.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo@123"),
                Role = "Owner"
            });

            // Mark tenant active (has an active subscription)
            tenant.IsActive = true;

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
                    Price = 24999,
                    IsFeatured = true,
                    Status = ItemStatus.Available,
                    MainImageUrl = "https://via.placeholder.com/400x400?text=iPhone+15+Pro"
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
                    Price = 23999,
                    IsFeatured = true,
                    Status = ItemStatus.Available,
                    MainImageUrl = "https://via.placeholder.com/400x400?text=Galaxy+S24"
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
                    Price = 15999,
                    IsFeatured = true,
                    Status = ItemStatus.Available,
                    MainImageUrl = "https://via.placeholder.com/400x400?text=iPad+Air"
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
                    Price = 49999,
                    IsFeatured = true,
                    Status = ItemStatus.Available,
                    MainImageUrl = "https://via.placeholder.com/400x400?text=MacBook+Pro"
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
                    Price = 3999,
                    IsFeatured = true,
                    Status = ItemStatus.Available,
                    MainImageUrl = "https://via.placeholder.com/400x400?text=Headphones"
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
                    Price = 89,
                    IsFeatured = false,
                    Status = ItemStatus.Available,
                    MainImageUrl = "https://via.placeholder.com/400x400?text=USB-C"
                },
            }.ToList();
            db.Items.AddRange(items);

            await db.SaveChangesAsync();

            // ===== HOME SECTIONS =====
            var bannerSection = new HomeSection
            {
                TenantId = tenant.Id,
                Title = "🔥 Hot Deals This Week",
                SectionType = HomeSectionType.BannerSlider,
                DisplayOrder = 0,
                IsActive = true
            };
            var featuredSection = new HomeSection
            {
                TenantId = tenant.Id,
                Title = "Featured Products",
                SectionType = HomeSectionType.FeaturedItems,
                DisplayOrder = 1,
                IsActive = true
            };
            var categoriesSection = new HomeSection
            {
                TenantId = tenant.Id,
                Title = "Shop By Category",
                SectionType = HomeSectionType.CategoriesShowcase,
                DisplayOrder = 2,
                IsActive = true
            };
            var brandsSection = new HomeSection
            {
                TenantId = tenant.Id,
                Title = "Our Top Brands",
                SectionType = HomeSectionType.BrandsCarousel,
                DisplayOrder = 3,
                IsActive = true
            };
            db.HomeSections.AddRange(bannerSection, featuredSection, categoriesSection, brandsSection);
            await db.SaveChangesAsync();

            // ===== HOME SECTION ITEMS =====
            db.HomeSectionItems.AddRange(
                new HomeSectionItem { HomeSectionId = bannerSection.Id, TargetType = HomeSectionTargetType.Url, Title = "Get iPhone 15 Pro Max at Best Price!", ImageUrl = "https://via.placeholder.com/1200x400?text=iPhone+Deal", Url = "/catalog?search=iphone", DisplayOrder = 0 },
                new HomeSectionItem { HomeSectionId = bannerSection.Id, TargetType = HomeSectionTargetType.Url, Title = "Fresh Samsung Galaxy S24 Arrivals", ImageUrl = "https://via.placeholder.com/1200x400?text=Samsung+Deal", Url = "/catalog?brand=samsung", DisplayOrder = 1 },
                new HomeSectionItem { HomeSectionId = categoriesSection.Id, TargetType = HomeSectionTargetType.Category, TargetId = categories[0].Id, Title = "Smartphones", ImageUrl = "https://via.placeholder.com/200x200?text=Phones", DisplayOrder = 0 },
                new HomeSectionItem { HomeSectionId = categoriesSection.Id, TargetType = HomeSectionTargetType.Category, TargetId = categories[1].Id, Title = "Tablets", ImageUrl = "https://via.placeholder.com/200x200?text=Tablets", DisplayOrder = 1 },
                new HomeSectionItem { HomeSectionId = categoriesSection.Id, TargetType = HomeSectionTargetType.Category, TargetId = categories[2].Id, Title = "Laptops", ImageUrl = "https://via.placeholder.com/200x200?text=Laptops", DisplayOrder = 2 },
                new HomeSectionItem { HomeSectionId = categoriesSection.Id, TargetType = HomeSectionTargetType.Category, TargetId = categories[3].Id, Title = "Accessories", ImageUrl = "https://via.placeholder.com/200x200?text=Accessories", DisplayOrder = 3 },
                new HomeSectionItem { HomeSectionId = brandsSection.Id, TargetType = HomeSectionTargetType.Brand, TargetId = brands[0].Id, Title = "Apple", ImageUrl = "https://via.placeholder.com/200x100?text=Apple", DisplayOrder = 0 },
                new HomeSectionItem { HomeSectionId = brandsSection.Id, TargetType = HomeSectionTargetType.Brand, TargetId = brands[1].Id, Title = "Samsung", ImageUrl = "https://via.placeholder.com/200x100?text=Samsung", DisplayOrder = 1 },
                new HomeSectionItem { HomeSectionId = brandsSection.Id, TargetType = HomeSectionTargetType.Brand, TargetId = brands[2].Id, Title = "Sony", ImageUrl = "https://via.placeholder.com/200x100?text=Sony", DisplayOrder = 2 }
            );

            await db.SaveChangesAsync();

            // ===== PLATFORM INVOICE (demo subscription) =====
            db.PlatformInvoices.Add(new PlatformInvoice
            {
                InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-DEMO01",
                TenantId = tenant.Id,
                PlanId = plan.Id,
                SubscriptionId = demoSubscription.Id,
                InvoiceType = "Activation",
                Months = 12,
                ActivationFee = plan.ActivationFee,
                SubscriptionAmount = plan.PriceMonthly * 12,
                Discount = 0,
                Total = plan.ActivationFee + (plan.PriceMonthly * 12),
                PaymentMethod = PaymentMethod.Cash,
                PaymentStatus = PaymentStatus.Paid,
                Notes = "Demo store — full year activation"
            });

            // ===== SAMPLE STORE REGISTRATION (lead) =====
            db.Set<StoreRegistration>().Add(new StoreRegistration
            {
                StoreName = "ElectroMart",
                Category = "Electronics",
                Location = "Cairo, Egypt",
                OwnerName = "Ahmed Hassan",
                Email = "ahmed@electromart.com",
                Phone = "+201234567890",
                NumberOfStores = "2",
                MonthlyRevenue = "50000-100000",
                Source = "Facebook Ad",
                Status = RegistrationStatus.PendingApproval,
                SubmittedAt = DateTime.UtcNow.AddDays(-2)
            });
            db.Set<StoreRegistration>().Add(new StoreRegistration
            {
                StoreName = "PhoneZone",
                Category = "Mobile Phones",
                Location = "Alexandria, Egypt",
                OwnerName = "Sara Ali",
                Email = "sara@phonezone.com",
                Phone = "+201098765432",
                NumberOfStores = "1",
                MonthlyRevenue = "20000-50000",
                Source = "Referral",
                Status = RegistrationStatus.PendingApproval,
                SubmittedAt = DateTime.UtcNow.AddDays(-1)
            });

            await db.SaveChangesAsync();
        }
    }
}
