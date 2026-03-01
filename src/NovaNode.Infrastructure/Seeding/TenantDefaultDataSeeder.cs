using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NovaNode.Domain.Entities;
using NovaNode.Domain.Enums;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Seeding;

/// <summary>
/// Seeds default brands, categories, item types, expense categories, and installment providers
/// when a new tenant is onboarded so the store is immediately usable.
/// Fully idempotent — safe to call multiple times per tenant.
/// </summary>
public static class TenantDefaultDataSeeder
{
    /// <summary>
    /// Idempotent seed: only inserts data that does not already exist for the tenant.
    /// </summary>
    public static async Task SeedAsync(AppDbContext db, Guid tenantId, CancellationToken ct = default)
        => await SeedAsync(db, tenantId, null, ct);

    /// <summary>
    /// Idempotent seed with optional store name override.
    /// </summary>
    public static async Task SeedAsync(AppDbContext db, Guid tenantId, string? storeName, CancellationToken ct = default)
    {
        // ── Brands (add any missing by slug) ──
        var defaultBrands = new (string Name, string Slug, int Order, string? Logo)[]
        {
            ("Apple", "apple", 0, "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/500px-Apple_logo_black.svg.png"),
            ("Samsung", "samsung", 1, "https://images.samsung.com/is/image/samsung/assets/global/about-us/brand/logo/300_186_4.png?$568_N_PNG$"),
            ("Xiaomi", "xiaomi", 2, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Xiaomi_logo_%282021-%29.svg/960px-Xiaomi_logo_%282021-%29.svg.png"),
            ("Oppo", "oppo", 3, "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/OPPO_Logo_wiki.png/960px-OPPO_Logo_wiki.png"),
            ("Realme", "realme", 4, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Realme_logo.svg/960px-Realme_logo.svg.png"),
            ("Infinix", "infinix", 5, "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Infinix_logo.jpg/960px-Infinix_logo.jpg"),
            ("Anker", "anker", 6, "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Anker-logo.svg/960px-Anker-logo.svg.png"),
        };
        var existingBrandSlugs = await db.Brands.Where(b => b.TenantId == tenantId).Select(b => b.Slug).ToListAsync(ct);
        var newBrands = defaultBrands.Where(b => !existingBrandSlugs.Contains(b.Slug))
            .Select(b => new Brand { TenantId = tenantId, Name = b.Name, Slug = b.Slug, DisplayOrder = b.Order, LogoUrl = b.Logo, IsActive = true })
            .ToArray();
        if (newBrands.Length > 0) db.Brands.AddRange(newBrands);

        // Update logos for existing brands that have no logo set
        var existingBrandsNoLogo = await db.Brands
            .Where(b => b.TenantId == tenantId && (b.LogoUrl == null || b.LogoUrl == ""))
            .ToListAsync(ct);
        foreach (var eb in existingBrandsNoLogo)
        {
            var match = defaultBrands.FirstOrDefault(d => d.Slug == eb.Slug);
            if (match.Logo != null) eb.LogoUrl = match.Logo;
        }
        var brands = await db.Brands.Where(b => b.TenantId == tenantId).OrderBy(b => b.DisplayOrder).ToArrayAsync(ct);

        // ── Categories (add any missing by slug, with capability flags) ──
        var defaultCategories = new (string Name, string Slug, int Order, bool IsDevice, bool IsStock, bool IMEI, bool Serial, bool Battery, bool Warranty)[]
        {
            ("Smartphones", "smartphones", 0, true, false, true, false, true, true),
            ("Used Phones", "used-phones", 1, true, false, true, true, true, true),
            ("Tablets", "tablets", 2, true, false, true, true, true, true),
            ("Laptops", "laptops", 3, true, false, false, true, true, true),
            ("Accessories", "accessories", 4, false, true, false, false, false, false),
        };
        var existingCatSlugs = await db.Categories.Where(c => c.TenantId == tenantId).Select(c => c.Slug).ToListAsync(ct);
        var newCats = defaultCategories.Where(c => !existingCatSlugs.Contains(c.Slug))
            .Select(c => new Category
            {
                TenantId = tenantId, Name = c.Name, Slug = c.Slug, DisplayOrder = c.Order, IsActive = true,
                IsDevice = c.IsDevice, IsStockItem = c.IsStock,
                SupportsIMEI = c.IMEI, SupportsSerial = c.Serial,
                SupportsBatteryHealth = c.Battery, SupportsWarranty = c.Warranty
            }).ToArray();
        if (newCats.Length > 0) db.Categories.AddRange(newCats);

        // Backfill capability flags for existing categories that don't have them set
        var existingCatsNoFlags = await db.Categories
            .Where(c => c.TenantId == tenantId && !c.IsDevice && !c.IsStockItem)
            .ToListAsync(ct);
        foreach (var ec in existingCatsNoFlags)
        {
            var match = defaultCategories.FirstOrDefault(d => d.Slug == ec.Slug);
            if (match != default)
            {
                ec.IsDevice = match.IsDevice; ec.IsStockItem = match.IsStock;
                ec.SupportsIMEI = match.IMEI; ec.SupportsSerial = match.Serial;
                ec.SupportsBatteryHealth = match.Battery; ec.SupportsWarranty = match.Warranty;
            }
        }
        var categories = await db.Categories.Where(c => c.TenantId == tenantId).OrderBy(c => c.DisplayOrder).ToArrayAsync(ct);

        // ── Item Types (add any missing by slug) ──
        var existingTypeSlugs = await db.ItemTypes.Where(it => it.TenantId == tenantId).Select(it => it.Slug).ToListAsync(ct);
        var defaultTypes = new (string Name, string Slug, bool IsDevice, bool IsStock, bool IMEI, bool Serial, bool Battery, bool Warranty, int Order)[]
        {
            ("Smartphone", "smartphone", true, false, true, false, true, true, 0),
            ("Tablet", "tablet", true, false, true, true, true, true, 1),
            ("Laptop", "laptop", true, false, false, true, true, true, 2),
            ("Accessory", "accessory", false, true, false, false, false, false, 3),
            ("Used Unit", "used-unit", true, false, true, true, true, true, 4),
        };
        foreach (var t in defaultTypes.Where(t => !existingTypeSlugs.Contains(t.Slug)))
        {
            db.ItemTypes.Add(new ItemType
            {
                TenantId = tenantId, Name = t.Name, Slug = t.Slug,
                IsDevice = t.IsDevice, IsStockItem = t.IsStock,
                SupportsIMEI = t.IMEI, SupportsSerial = t.Serial,
                SupportsBatteryHealth = t.Battery, SupportsWarranty = t.Warranty,
                DisplayOrder = t.Order, IsActive = true
            });
        }

        await db.SaveChangesAsync(ct);

        // ── Resolve actual store name ──
        var resolvedName = storeName;
        if (string.IsNullOrWhiteSpace(resolvedName))
        {
            var tenant = await db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tenantId, ct);
            resolvedName = tenant?.Name ?? "New Store";
        }

        // ── Ensure StoreSettings exist ──
        if (!await db.StoreSettings.AnyAsync(ss => ss.TenantId == tenantId, ct))
        {
            db.StoreSettings.Add(new StoreSettings
            {
                TenantId = tenantId,
                StoreName = resolvedName,
                CurrencyCode = "EGP",
                ThemePresetId = 1,
                HeaderNoticeText = $"🚚 Free Delivery | ✅ Warranty on all products | 💳 Installment plans available",
                AboutTitle = $"Welcome to {resolvedName}",
                AboutDescription = $"{resolvedName} is your trusted destination for the latest smartphones, tablets, laptops and accessories. We offer genuine products with manufacturer warranty, flexible installment plans, and exceptional after-sales support. Whether you're looking for the newest flagship or a quality pre-owned device, we've got you covered with competitive prices and personalized service.",
                AboutImageUrl = null,
                HeroBannersJson = $@"[
                    {{""imageUrl"":"""",""title"":""Welcome to {resolvedName}"",""subtitle"":""Your trusted destination for smartphones, tablets & accessories"",""linkUrl"":""/catalog""}},
                    {{""imageUrl"":"""",""title"":""Latest Smartphones"",""subtitle"":""Discover the newest arrivals with warranty & installment options"",""linkUrl"":""/catalog""}},
                    {{""imageUrl"":"""",""title"":""Buy Now, Pay Later"",""subtitle"":""Flexible installment plans with 0% interest from top providers"",""linkUrl"":""/catalog?installmentAvailable=true""}},
                    {{""imageUrl"":"""",""title"":""Certified Pre-Owned"",""subtitle"":""Quality checked used phones at unbeatable prices"",""linkUrl"":""/catalog?condition=Used""}},
                    {{""imageUrl"":"""",""title"":""Accessories & More"",""subtitle"":""Cases, chargers, earphones and everything your device needs"",""linkUrl"":""/catalog?category=accessories""}}
                ]",
                TestimonialsJson = @"[
                    {""name"":""Ahmed M."",""text"":""Excellent store with genuine products and great prices. The installment plan made it easy to get the latest iPhone. Highly recommend!"",""rating"":5},
                    {""name"":""Sara K."",""text"":""Fast delivery and amazing customer service. They answered all my questions on WhatsApp instantly. Will definitely buy again."",""rating"":5},
                    {""name"":""Omar H."",""text"":""Best phone store in the area. Bought a Samsung Galaxy and the warranty support has been outstanding."",""rating"":4},
                    {""name"":""Fatma A."",""text"":""Great selection of accessories at competitive prices. The team helped me pick the perfect case and screen protector."",""rating"":5},
                    {""name"":""Mahmoud R."",""text"":""Bought a used iPhone in perfect condition. The 30-day warranty gave me confidence. Very professional store."",""rating"":5}
                ]",
                FooterAddress = "Cairo, Egypt",
                WorkingHours = "10:00 AM - 10:00 PM, Saturday - Thursday",
                MapUrl = null,
                SocialLinksJson = @"{""facebook"":"""",""instagram"":"""",""tiktok"":"""",""twitter"":"""",""whatsapp"":""""}",
                PoliciesJson = @"{
                    ""return"":""We offer a 14-day return policy on all unused products in their original packaging. Used devices have a 7-day return window. Items must be in their original condition with all accessories included. Refunds are processed within 3-5 business days."",
                    ""warranty"":""All new devices come with full manufacturer warranty (typically 12 months). Used devices include a 30-day store warranty covering hardware defects. Extended warranty options are available at purchase."",
                    ""privacy"":""We respect your privacy and are committed to protecting your personal information. We collect only the data necessary to process your orders and provide customer service. Your information is never shared with third parties without your consent."",
                    ""shipping"":""We offer free delivery within the city for orders above 2000 EGP. Standard delivery takes 1-3 business days. Express same-day delivery is available for an additional fee."",
                    ""terms"":""By using our services, you agree to these terms. Prices are subject to change without notice. All sales are final for opened software products. We reserve the right to limit quantities.""
                }",
                FaqJson = @"[
                    {""question"":""Do you offer installment plans?"",""answer"":""Yes! We partner with leading BNPL providers like ValU, Souhoola, Contact, Shahry and Forsa to offer flexible installment plans with competitive rates starting from 0% interest.""},
                    {""question"":""What is your return policy?"",""answer"":""We offer a 14-day return policy on all unused products in their original packaging with all accessories. Used devices have a 7-day return window.""},
                    {""question"":""Do you sell genuine products?"",""answer"":""Absolutely. All our new products are sourced from authorized distributors and come with full manufacturer warranty. Pre-owned devices are thoroughly inspected, certified and graded.""},
                    {""question"":""How can I contact you?"",""answer"":""You can reach us via WhatsApp for instant support, call us during working hours, or visit our store. We typically respond within minutes!""},
                    {""question"":""Do you offer warranty on used phones?"",""answer"":""Yes, all pre-owned devices come with a minimum 30-day store warranty covering hardware defects. Extended warranty options are also available.""},
                    {""question"":""Can I trade in my old phone?"",""answer"":""Yes! We accept trade-ins on most smartphone brands. Bring your device for a free evaluation and get credit towards your new purchase.""},
                    {""question"":""Do you offer delivery?"",""answer"":""Yes, we offer free delivery within the city for orders above 2000 EGP. Same-day express delivery is also available for an additional fee.""},
                    {""question"":""What payment methods do you accept?"",""answer"":""We accept cash, InstaPay, bank transfers, and installment plans through our BNPL partners. Choose the method that works best for you.""}
                ]",
                TrustBadgesJson = @"[""✅ Trusted Store"",""🔒 Genuine Products"",""⚡ Fast Response"",""💳 Installment Available"",""🚚 Free Delivery"",""🛡️ Warranty Included""]",
                WhatsAppTemplatesJson = @"[
                    {""name"":""Welcome"",""template"":""Welcome to our store! 👋 How can we help you today?""},
                    {""name"":""Price Inquiry"",""template"":""Thank you for your interest! The price for {product} is {price} EGP. Would you like to know about our installment options?""},
                    {""name"":""Order Confirmation"",""template"":""Your order has been confirmed! 🎉 Order #{orderId}. We will contact you shortly with delivery details.""},
                    {""name"":""Follow Up"",""template"":""Hi! Just checking in to see if you had any questions about the {product} you were interested in. We're here to help! 😊""},
                    {""name"":""After Sale"",""template"":""Thank you for your purchase! 🙏 We hope you're enjoying your new {product}. Don't hesitate to reach out if you need anything.""}
                ]",
            });
            await db.SaveChangesAsync(ct);
        }

        // ── Seed default HomeSections (add missing by SectionType) ──
        var existingSectionTypes = await db.HomeSections
            .Where(hs => hs.TenantId == tenantId).Select(hs => hs.SectionType).ToListAsync(ct);

        var sectionsToAdd = new List<HomeSection>();
        if (!existingSectionTypes.Contains(HomeSectionType.BannerSlider))
            sectionsToAdd.Add(new HomeSection { TenantId = tenantId, Title = "Hero Banners", SectionType = HomeSectionType.BannerSlider, DisplayOrder = 0, IsActive = true });
        if (!existingSectionTypes.Contains(HomeSectionType.FeaturedItems))
            sectionsToAdd.Add(new HomeSection { TenantId = tenantId, Title = "Featured Products", SectionType = HomeSectionType.FeaturedItems, DisplayOrder = 1, IsActive = true });
        if (!existingSectionTypes.Contains(HomeSectionType.NewArrivals))
            sectionsToAdd.Add(new HomeSection { TenantId = tenantId, Title = "New Arrivals", SectionType = HomeSectionType.NewArrivals, DisplayOrder = 2, IsActive = true });

        HomeSection? categoriesSection = null;
        if (!existingSectionTypes.Contains(HomeSectionType.CategoriesShowcase))
        {
            categoriesSection = new HomeSection { TenantId = tenantId, Title = "Shop by Category", SectionType = HomeSectionType.CategoriesShowcase, DisplayOrder = 3, IsActive = true };
            sectionsToAdd.Add(categoriesSection);
        }

        HomeSection? brandsSection = null;
        if (!existingSectionTypes.Contains(HomeSectionType.BrandsCarousel))
        {
            brandsSection = new HomeSection { TenantId = tenantId, Title = "Our Brands", SectionType = HomeSectionType.BrandsCarousel, DisplayOrder = 4, IsActive = true };
            sectionsToAdd.Add(brandsSection);
        }

        if (!existingSectionTypes.Contains(HomeSectionType.Testimonials))
            sectionsToAdd.Add(new HomeSection { TenantId = tenantId, Title = "What Our Customers Say", SectionType = HomeSectionType.Testimonials, DisplayOrder = 5, IsActive = true });
        if (!existingSectionTypes.Contains(HomeSectionType.InstallmentOffers))
            sectionsToAdd.Add(new HomeSection { TenantId = tenantId, Title = "Installment Offers", SectionType = HomeSectionType.InstallmentOffers, DisplayOrder = 6, IsActive = true });

        if (sectionsToAdd.Count > 0)
        {
            db.HomeSections.AddRange(sectionsToAdd);
            await db.SaveChangesAsync(ct);

            // Add category items to the categories showcase section
            if (categoriesSection != null && categories.Length > 0)
            {
                var categoryItems = categories.Select((c, i) => new HomeSectionItem
                {
                    HomeSectionId = categoriesSection.Id,
                    TargetType = HomeSectionTargetType.Category,
                    TargetId = c.Id,
                    Title = c.Name,
                    DisplayOrder = i
                }).ToArray();
                db.HomeSectionItems.AddRange(categoryItems);
            }

            // Add brand items to the brands carousel section
            if (brandsSection != null && brands.Length > 0)
            {
                var brandItems = brands.Select((b, i) => new HomeSectionItem
                {
                    HomeSectionId = brandsSection.Id,
                    TargetType = HomeSectionTargetType.Brand,
                    TargetId = b.Id,
                    Title = b.Name,
                    DisplayOrder = i
                }).ToArray();
                db.HomeSectionItems.AddRange(brandItems);
            }

            await db.SaveChangesAsync(ct);
        }

        // ── Expense Categories (add missing by name) ──
        var existingExpCatNames = await db.ExpenseCategories.Where(ec => ec.TenantId == tenantId).Select(ec => ec.Name).ToListAsync(ct);
        var defaultExpCats = new[] { "Rent", "Utilities", "Marketing", "Supplies", "Shipping", "Other" };
        var newExpCats = defaultExpCats.Where(n => !existingExpCatNames.Contains(n))
            .Select(n => new ExpenseCategory { TenantId = tenantId, Name = n, IsActive = true })
            .ToArray();
        if (newExpCats.Length > 0)
        {
            db.ExpenseCategories.AddRange(newExpCats);
            await db.SaveChangesAsync(ct);
        }

        // ── Installment Providers (add missing by name) ──
        var existingProviderNames = await db.InstallmentProviders.Where(ip => ip.TenantId == tenantId).Select(ip => ip.Name).ToListAsync(ct);
        var defaultProviders = new[] { ("ValU", 0), ("Souhoola", 1), ("Contact", 2), ("Shahry", 3), ("Forsa", 4) };
        var newProviders = defaultProviders.Where(p => !existingProviderNames.Contains(p.Item1))
            .Select(p => new InstallmentProvider { TenantId = tenantId, Name = p.Item1, Type = "BNPL", IsActive = true, DisplayOrder = p.Item2 })
            .ToArray();
        if (newProviders.Length > 0)
        {
            db.InstallmentProviders.AddRange(newProviders);
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
