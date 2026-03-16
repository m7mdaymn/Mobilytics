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
        {
            await db.Database.MigrateAsync();

            // Some environments may have migration history drift where tenant domain columns are missing
            // despite migrations being marked as applied. Reconcile schema idempotently before further seeding.
            await EnsureTenantDomainSchemaAsync(db);
        }
        else
            await db.Database.EnsureCreatedAsync();

        // Seed platform users
        if (!await db.PlatformUsers.AnyAsync(u => u.Email == "admin@novanode.com"))
        {
            db.PlatformUsers.Add(new PlatformUser
            {
                Email = "admin@novanode.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = "SuperAdmin"
            });
        }

        if (!await db.PlatformUsers.AnyAsync(u => u.Email == "employee@novanode.com"))
        {
            db.PlatformUsers.Add(new PlatformUser
            {
                Email = "employee@novanode.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Employee@123"),
                Role = "PlatformEmployee"
            });
        }

        // Seed default plans
        if (!await db.Plans.AnyAsync())
        {
            db.Plans.AddRange(
                new Plan
                {
                    Name = "تجريبية",
                    PriceMonthly = 0m,
                    ActivationFee = 0m,
                    LimitsJson = "{\"maxItems\":20,\"maxEmployees\":2,\"maxImages\":3,\"maxStorageMB\":100}",
                    FeaturesJson = "{\"canRemovePoweredBy\":false,\"advancedReports\":false,\"customDomain\":false,\"apiAccess\":false,\"prioritySupport\":false}",
                    IsActive = true
                },
                new Plan
                {
                    Name = "قياسية",
                    PriceMonthly = 500m,
                    ActivationFee = 1500m,
                    LimitsJson = "{\"maxItems\":500,\"maxEmployees\":10,\"maxImages\":10,\"maxStorageMB\":2048}",
                    FeaturesJson = "{\"canRemovePoweredBy\":true,\"advancedReports\":true,\"customDomain\":false,\"apiAccess\":false,\"prioritySupport\":false}",
                    IsActive = true
                },
                new Plan
                {
                    Name = "مميزة",
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
                Name = "متجر تجريبي",
                Slug = "demo",
                FallbackSubdomain = "demo",
                PrimaryDomain = "demo.mobilytics.app",
                SupportPhone = "+201000000000",
                SupportWhatsApp = "+201000000000"
            };
            db.Tenants.Add(tenant);
            await db.SaveChangesAsync();

            // ===== STORE SETTINGS =====
            db.StoreSettings.Add(new StoreSettings 
            { 
                TenantId = tenant.Id, 
                StoreName = "تك هب للإلكترونيات",
                CurrencyCode = "EGP",
                ThemePresetId = 1,
                SystemThemeId = 4,
                PwaSettingsJson = "{\"shortName\":\"تك هب\",\"description\":\"متجرك الذكي للأجهزة والإكسسوارات\"}"
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
                Name = "مالك المتجر",
                Email = "owner@demo.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo@123"),
                Role = "Owner"
            });

            // Mark tenant active (has an active subscription)
            tenant.IsActive = true;

            // ===== CATEGORIES =====
            var categories = new[]
            {
                new Category { TenantId = tenant.Id, Name = "هواتف ذكية", Slug = "smartphones", DisplayOrder = 0 },
                new Category { TenantId = tenant.Id, Name = "أجهزة لوحية", Slug = "tablets", DisplayOrder = 1 },
                new Category { TenantId = tenant.Id, Name = "لابتوبات", Slug = "laptops", DisplayOrder = 2 },
                new Category { TenantId = tenant.Id, Name = "إكسسوارات", Slug = "accessories", DisplayOrder = 3 },
                new Category { TenantId = tenant.Id, Name = "صوتيات", Slug = "audio", DisplayOrder = 4 },
            }.ToList();
            db.Categories.AddRange(categories);

            // ===== BRANDS =====
            var brands = new[]
            {
                new Brand { TenantId = tenant.Id, Name = "آبل", Slug = "apple", LogoUrl = "https://via.placeholder.com/200x100?text=Apple" },
                new Brand { TenantId = tenant.Id, Name = "سامسونج", Slug = "samsung", LogoUrl = "https://via.placeholder.com/200x100?text=Samsung" },
                new Brand { TenantId = tenant.Id, Name = "سوني", Slug = "sony", LogoUrl = "https://via.placeholder.com/200x100?text=Sony" },
                new Brand { TenantId = tenant.Id, Name = "LG", Slug = "lg", LogoUrl = "https://via.placeholder.com/200x100?text=LG" },
                new Brand { TenantId = tenant.Id, Name = "ديل", Slug = "dell", LogoUrl = "https://via.placeholder.com/200x100?text=Dell" },
            }.ToList();
            db.Brands.AddRange(brands);

            // ===== ITEM TYPES =====
            var itemTypes = new[]
            {
                new ItemType { TenantId = tenant.Id, Name = "هاتف ذكي", Slug = "smartphone", IsDevice = true, IsStockItem = false },
                new ItemType { TenantId = tenant.Id, Name = "لابتوب", Slug = "laptop", IsDevice = true, IsStockItem = false },
                new ItemType { TenantId = tenant.Id, Name = "جهاز لوحي", Slug = "tablet", IsDevice = true, IsStockItem = false },
                new ItemType { TenantId = tenant.Id, Name = "ملحق", Slug = "accessory", IsDevice = false, IsStockItem = true },
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
                    Description = "هاتف آبل الرائد بأحدث تقنيات الكاميرا والأداء",
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
                    Description = "هاتف أندرويد رائد بمزايا ذكاء اصطناعي متقدمة",
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
                    Description = "جهاز لوحي عالي الأداء مناسب للعمل والترفيه",
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
                    Description = "لابتوب قوي للاستخدام الاحترافي",
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
                    Description = "سماعات عالية الجودة بعزل ضوضاء احترافي",
                    Price = 3999,
                    IsFeatured = true,
                    Status = ItemStatus.Available,
                    MainImageUrl = "https://via.placeholder.com/400x400?text=Headphones"
                },
                new Item 
                { 
                    TenantId = tenant.Id, 
                    Title = "كابل USB-C بطول 2 متر",
                    Slug = "usb-c-cable-2m",
                    CategoryId = categories[3].Id,
                    BrandId = null,
                    ItemTypeId = itemTypes[3].Id,
                    Description = "كابل شحن USB-C عالي الجودة",
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
                Title = "🔥 عروض الأسبوع",
                SectionType = HomeSectionType.BannerSlider,
                DisplayOrder = 0,
                IsActive = true
            };
            var featuredSection = new HomeSection
            {
                TenantId = tenant.Id,
                Title = "منتجات مميزة",
                SectionType = HomeSectionType.FeaturedItems,
                DisplayOrder = 1,
                IsActive = true
            };
            var categoriesSection = new HomeSection
            {
                TenantId = tenant.Id,
                Title = "تسوق حسب التصنيف",
                SectionType = HomeSectionType.CategoriesShowcase,
                DisplayOrder = 2,
                IsActive = true
            };
            var brandsSection = new HomeSection
            {
                TenantId = tenant.Id,
                Title = "أفضل الماركات",
                SectionType = HomeSectionType.BrandsCarousel,
                DisplayOrder = 3,
                IsActive = true
            };
            db.HomeSections.AddRange(bannerSection, featuredSection, categoriesSection, brandsSection);
            await db.SaveChangesAsync();

            // ===== HOME SECTION ITEMS =====
            db.HomeSectionItems.AddRange(
                new HomeSectionItem { HomeSectionId = bannerSection.Id, TargetType = HomeSectionTargetType.Url, Title = "احصل على iPhone 15 Pro Max بأفضل سعر", ImageUrl = "https://via.placeholder.com/1200x400?text=iPhone+Deal", Url = "/catalog?search=iphone", DisplayOrder = 0 },
                new HomeSectionItem { HomeSectionId = bannerSection.Id, TargetType = HomeSectionTargetType.Url, Title = "وصول جديد لهاتف Samsung Galaxy S24", ImageUrl = "https://via.placeholder.com/1200x400?text=Samsung+Deal", Url = "/catalog?brand=samsung", DisplayOrder = 1 },
                new HomeSectionItem { HomeSectionId = categoriesSection.Id, TargetType = HomeSectionTargetType.Category, TargetId = categories[0].Id, Title = "هواتف ذكية", ImageUrl = "https://via.placeholder.com/200x200?text=Phones", DisplayOrder = 0 },
                new HomeSectionItem { HomeSectionId = categoriesSection.Id, TargetType = HomeSectionTargetType.Category, TargetId = categories[1].Id, Title = "أجهزة لوحية", ImageUrl = "https://via.placeholder.com/200x200?text=Tablets", DisplayOrder = 1 },
                new HomeSectionItem { HomeSectionId = categoriesSection.Id, TargetType = HomeSectionTargetType.Category, TargetId = categories[2].Id, Title = "لابتوبات", ImageUrl = "https://via.placeholder.com/200x200?text=Laptops", DisplayOrder = 2 },
                new HomeSectionItem { HomeSectionId = categoriesSection.Id, TargetType = HomeSectionTargetType.Category, TargetId = categories[3].Id, Title = "إكسسوارات", ImageUrl = "https://via.placeholder.com/200x200?text=Accessories", DisplayOrder = 3 },
                new HomeSectionItem { HomeSectionId = brandsSection.Id, TargetType = HomeSectionTargetType.Brand, TargetId = brands[0].Id, Title = "آبل", ImageUrl = "https://via.placeholder.com/200x100?text=Apple", DisplayOrder = 0 },
                new HomeSectionItem { HomeSectionId = brandsSection.Id, TargetType = HomeSectionTargetType.Brand, TargetId = brands[1].Id, Title = "سامسونج", ImageUrl = "https://via.placeholder.com/200x100?text=Samsung", DisplayOrder = 1 },
                new HomeSectionItem { HomeSectionId = brandsSection.Id, TargetType = HomeSectionTargetType.Brand, TargetId = brands[2].Id, Title = "سوني", ImageUrl = "https://via.placeholder.com/200x100?text=Sony", DisplayOrder = 2 }
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
                Notes = "متجر تجريبي - تفعيل لمدة سنة كاملة"
            });

            // ===== SAMPLE STORE REGISTRATION (lead) =====
            db.Set<StoreRegistration>().Add(new StoreRegistration
            {
                StoreName = "إلكترو مارت",
                Category = "إلكترونيات",
                Location = "القاهرة، مصر",
                OwnerName = "أحمد حسن",
                Email = "ahmed@electromart.com",
                Phone = "+201234567890",
                NumberOfStores = "2",
                MonthlyRevenue = "50000-100000",
                Source = "إعلان فيسبوك",
                Status = RegistrationStatus.PendingApproval,
                SubmittedAt = DateTime.UtcNow.AddDays(-2)
            });
            db.Set<StoreRegistration>().Add(new StoreRegistration
            {
                StoreName = "فون زون",
                Category = "هواتف محمولة",
                Location = "الإسكندرية، مصر",
                OwnerName = "سارة علي",
                Email = "sara@phonezone.com",
                Phone = "+201098765432",
                NumberOfStores = "1",
                MonthlyRevenue = "20000-50000",
                Source = "إحالة",
                Status = RegistrationStatus.PendingApproval,
                SubmittedAt = DateTime.UtcNow.AddDays(-1)
            });

            await db.SaveChangesAsync();
        }
    }

    private static async Task EnsureTenantDomainSchemaAsync(AppDbContext db)
    {
        const string sql = @"
IF COL_LENGTH('Tenants', 'CustomDomain') IS NULL
    ALTER TABLE [Tenants] ADD [CustomDomain] nvarchar(255) NULL;

IF COL_LENGTH('Tenants', 'CustomDomainIsActive') IS NULL
    ALTER TABLE [Tenants] ADD [CustomDomainIsActive] bit NOT NULL CONSTRAINT [DF_Tenants_CustomDomainIsActive] DEFAULT(0);

IF COL_LENGTH('Tenants', 'CustomDomainVerificationStatus') IS NULL
    ALTER TABLE [Tenants] ADD [CustomDomainVerificationStatus] int NOT NULL CONSTRAINT [DF_Tenants_CustomDomainVerificationStatus] DEFAULT(0);

IF COL_LENGTH('Tenants', 'CustomDomainVerifiedAt') IS NULL
    ALTER TABLE [Tenants] ADD [CustomDomainVerifiedAt] datetime2 NULL;

IF COL_LENGTH('Tenants', 'FallbackSubdomain') IS NULL
    ALTER TABLE [Tenants] ADD [FallbackSubdomain] nvarchar(100) NOT NULL CONSTRAINT [DF_Tenants_FallbackSubdomain] DEFAULT('');

IF COL_LENGTH('Tenants', 'PrimaryDomain') IS NULL
    ALTER TABLE [Tenants] ADD [PrimaryDomain] nvarchar(255) NOT NULL CONSTRAINT [DF_Tenants_PrimaryDomain] DEFAULT('');

IF COL_LENGTH('Tenants', 'RedirectFallbackToPrimary') IS NULL
    ALTER TABLE [Tenants] ADD [RedirectFallbackToPrimary] bit NOT NULL CONSTRAINT [DF_Tenants_RedirectFallbackToPrimary] DEFAULT(1);
";

        const string postSql = @"
IF COL_LENGTH('Tenants', 'FallbackSubdomain') IS NOT NULL
    EXEC('UPDATE [Tenants] SET [FallbackSubdomain] = [Slug] WHERE ([FallbackSubdomain] IS NULL OR [FallbackSubdomain] = '''') AND [Slug] IS NOT NULL;');

IF COL_LENGTH('Tenants', 'PrimaryDomain') IS NOT NULL AND COL_LENGTH('Tenants', 'FallbackSubdomain') IS NOT NULL
    EXEC('UPDATE [Tenants] SET [PrimaryDomain] = LOWER([FallbackSubdomain]) + ''.mobilytics.app'' WHERE ([PrimaryDomain] IS NULL OR [PrimaryDomain] = '''') AND [FallbackSubdomain] IS NOT NULL AND [FallbackSubdomain] <> '''';');

IF COL_LENGTH('Tenants', 'CustomDomain') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tenants_CustomDomain' AND object_id = OBJECT_ID('Tenants'))
    EXEC('CREATE UNIQUE INDEX [IX_Tenants_CustomDomain] ON [Tenants]([CustomDomain]) WHERE [CustomDomain] IS NOT NULL;');

IF COL_LENGTH('Tenants', 'FallbackSubdomain') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tenants_FallbackSubdomain' AND object_id = OBJECT_ID('Tenants'))
    EXEC('CREATE UNIQUE INDEX [IX_Tenants_FallbackSubdomain] ON [Tenants]([FallbackSubdomain]);');

IF COL_LENGTH('Tenants', 'PrimaryDomain') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tenants_PrimaryDomain' AND object_id = OBJECT_ID('Tenants'))
    EXEC('CREATE INDEX [IX_Tenants_PrimaryDomain] ON [Tenants]([PrimaryDomain]);');
";

        await db.Database.ExecuteSqlRawAsync(sql);
        await db.Database.ExecuteSqlRawAsync(postSql);
    }
}
