using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NovaNode.Domain.Entities;
using NovaNode.Domain.Enums;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Seeding;

/// <summary>
/// Seeds default brands, categories, item types, expense categories, and installment providers
/// when a new tenant is onboarded so the store is immediately usable.
/// Fully idempotent ΓÇö safe to call multiple times per tenant.
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
        // ΓöÇΓöÇ Brands (add any missing by slug) ΓöÇΓöÇ
        var defaultBrands = new (string Name, string Slug, int Order, string? Logo)[]
        {
            ("آبل", "apple", 0, "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/500px-Apple_logo_black.svg.png"),
            ("سامسونج", "samsung", 1, "https://images.samsung.com/is/image/samsung/assets/global/about-us/brand/logo/300_186_4.png?$568_N_PNG$"),
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

        // ΓöÇΓöÇ Categories (add any missing by slug, with capability flags) ΓöÇΓöÇ
        var defaultCategories = new (string Name, string Slug, int Order, bool IsDevice, bool IsStock, bool IMEI, bool Serial, bool Battery, bool Warranty)[]
        {
            ("هواتف ذكية", "smartphones", 0, true, false, true, false, true, true),
            ("هواتف مستعملة", "used-phones", 1, true, false, true, true, true, true),
            ("أجهزة لوحية", "tablets", 2, true, false, true, true, true, true),
            ("لابتوبات", "laptops", 3, true, false, false, true, true, true),
            ("إكسسوارات", "accessories", 4, false, true, false, false, false, false),
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

        // ΓöÇΓöÇ Item Types (add any missing by slug) ΓöÇΓöÇ
        var existingTypeSlugs = await db.ItemTypes.Where(it => it.TenantId == tenantId).Select(it => it.Slug).ToListAsync(ct);
        var defaultTypes = new (string Name, string Slug, bool IsDevice, bool IsStock, bool IMEI, bool Serial, bool Battery, bool Warranty, int Order)[]
        {
            ("هاتف ذكي", "smartphone", true, false, true, false, true, true, 0),
            ("جهاز لوحي", "tablet", true, false, true, true, true, true, 1),
            ("لابتوب", "laptop", true, false, false, true, true, true, 2),
            ("ملحق", "accessory", false, true, false, false, false, false, 3),
            ("جهاز مستعمل", "used-unit", true, false, true, true, true, true, 4),
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

        // ΓöÇΓöÇ Resolve actual store name ΓöÇΓöÇ
        var resolvedName = storeName;
        if (string.IsNullOrWhiteSpace(resolvedName))
        {
            var tenant = await db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tenantId, ct);
            resolvedName = tenant?.Name ?? "متجر جديد";
        }

        // ΓöÇΓöÇ Ensure StoreSettings exist ΓöÇΓöÇ
        if (!await db.StoreSettings.AnyAsync(ss => ss.TenantId == tenantId, ct))
        {
            db.StoreSettings.Add(new StoreSettings
            {
                TenantId = tenantId,
                StoreName = resolvedName,
                CurrencyCode = "EGP",
                ThemePresetId = 1,
                SystemThemeId = 4,
                HeaderNoticeText = $"🚚 توصيل مجاني | 🛡 ضمان على جميع المنتجات | 💳 خطط تقسيط متاحة",
                AboutTitle = $"مرحباً بك في {resolvedName}",
                AboutDescription = $"{resolvedName} وجهتك الموثوقة لأحدث الهواتف الذكية والأجهزة اللوحية واللابتوبات والإكسسوارات. نوفر منتجات أصلية بضمان رسمي وخيارات تقسيط مرنة ودعم ما بعد البيع باحترافية.",
                AboutImageUrl = null,
                HeroBannersJson = $@"[
                    {{""imageUrl"":""https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=1600&q=80"",""title"":""مرحباً بك في {resolvedName}"",""subtitle"":""وجهتك الموثوقة للهواتف والأجهزة والإكسسوارات"",""linkUrl"":""/catalog""}},
                    {{""imageUrl"":""https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1600&q=80"",""title"":""أحدث الهواتف الذكية"",""subtitle"":""اكتشف أحدث الإصدارات مع ضمان وخيارات تقسيط"",""linkUrl"":""/catalog""}},
                    {{""imageUrl"":""https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80"",""title"":""اشتري الآن وادفع لاحقاً"",""subtitle"":""خطط تقسيط مرنة من أفضل الجهات"",""linkUrl"":""/catalog?installmentAvailable=true""}},
                    {{""imageUrl"":""https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1600&q=80"",""title"":""أجهزة مستعملة مضمونة"",""subtitle"":""هواتف مستعملة مفحوصة بأسعار منافسة"",""linkUrl"":""/catalog?condition=Used""}},
                    {{""imageUrl"":""https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&q=80"",""title"":""إكسسوارات وأكثر"",""subtitle"":""جرابات وشواحن وسماعات وكل ما يحتاجه جهازك"",""linkUrl"":""/catalog?category=accessories""}}
                ]",
                TestimonialsJson = @"[
                    {""name"":""أحمد م."",""text"":""المتجر ممتاز ومنتجاته أصلية وأسعاره قوية. التقسيط كان سهل جداً."",""rating"":5},
                    {""name"":""سارة ك."",""text"":""التوصيل سريع وخدمة العملاء رائعة. ردوا على كل أسئلتي فوراً."",""rating"":5},
                    {""name"":""عمر ح."",""text"":""أفضل متجر موبايلات في المنطقة. اشتريت جهاز وضمانه ممتاز."",""rating"":4},
                    {""name"":""فاطمة أ."",""text"":""تشكيلة الإكسسوارات ممتازة والأسعار مناسبة جداً."",""rating"":5},
                    {""name"":""محمود ر."",""text"":""اشتريت آيفون مستعمل بحالة ممتازة وتعامل احترافي جداً."",""rating"":5}
                ]",
                FooterAddress = "القاهرة، مصر",
                WorkingHours = "10:00 ص - 10:00 م، من السبت إلى الخميس",
                MapUrl = null,
                SocialLinksJson = @"{""facebook"":"""",""instagram"":"""",""tiktok"":"""",""twitter"":"""",""whatsapp"":""""}",
                PoliciesJson = @"{
                    ""return"":""نوفر سياسة استرجاع خلال 14 يوماً للمنتجات الجديدة غير المستخدمة، و7 أيام للأجهزة المستعملة."",
                    ""warranty"":""الأجهزة الجديدة بضمان الشركة المصنعة، والمستعملة بضمان متجر لا يقل عن 30 يوماً."",
                    ""privacy"":""نحترم خصوصيتك ونستخدم بياناتك فقط لمعالجة الطلبات وتقديم الخدمة."",
                    ""shipping"":""نوفر توصيلاً مجانياً داخل المدينة للطلبات المؤهلة، مع خيار توصيل سريع برسوم إضافية."",
                    ""terms"":""باستخدامك خدماتنا فإنك توافق على الشروط والأحكام، وقد تتغير الأسعار دون إشعار مسبق.""
                }",
                FaqJson = @"[
                    {""question"":""هل لديكم تقسيط؟"",""answer"":""نعم، نوفر خطط تقسيط مرنة مع جهات تمويل متعددة وبنسب تنافسية.""},
                    {""question"":""ما سياسة الاسترجاع؟"",""answer"":""يمكنك الاسترجاع خلال 14 يوماً للمنتجات الجديدة غير المستخدمة، و7 أيام للأجهزة المستعملة.""},
                    {""question"":""هل المنتجات أصلية؟"",""answer"":""نعم، جميع المنتجات الجديدة أصلية وبضمان رسمي، والمستعملة مفحوصة ومعتمدة.""},
                    {""question"":""كيف أتواصل معكم؟"",""answer"":""يمكنك التواصل عبر واتساب أو الاتصال بنا خلال ساعات العمل أو زيارة المتجر.""},
                    {""question"":""هل يوجد ضمان على المستعمل؟"",""answer"":""نعم، الأجهزة المستعملة عليها ضمان متجر لا يقل عن 30 يوماً.""},
                    {""question"":""هل يوجد خدمة استبدال؟"",""answer"":""نعم، يمكنك استبدال جهازك القديم بعد تقييمه داخل المتجر.""},
                    {""question"":""هل يوجد توصيل؟"",""answer"":""نعم، يوجد توصيل مجاني داخل المدينة للطلبات المؤهلة.""},
                    {""question"":""ما طرق الدفع المتاحة؟"",""answer"":""نقبل الدفع النقدي والتحويلات وخيارات التقسيط المتاحة.""}
                ]",
                TrustBadgesJson = @"[""✅ متجر موثوق"",""📦 منتجات أصلية"",""⚡ رد سريع"",""💳 تقسيط متاح"",""🚚 توصيل مجاني"",""🛡️ ضمان شامل""]",
                WhatsAppTemplatesJson = @"[
                    {""name"":""ترحيب"",""template"":""أهلاً بك في متجرنا 😊 كيف نقدر نساعدك اليوم؟""},
                    {""name"":""استفسار سعر"",""template"":""شكراً لاهتمامك! سعر {product} هو {price} جنيه. هل تحب تعرف خيارات التقسيط؟""},
                    {""name"":""تأكيد طلب"",""template"":""تم تأكيد طلبك بنجاح 🎉 رقم الطلب #{orderId}. سنتواصل معك قريباً بتفاصيل التسليم.""},
                    {""name"":""متابعة"",""template"":""مرحباً! هل لديك أي استفسار بخصوص {product}؟ نحن جاهزون للمساعدة 😊""},
                    {""name"":""ما بعد البيع"",""template"":""شكراً لشرائك من متجرنا 🙏 نتمنى أن تستمتع بـ {product}. نحن معك لأي دعم.""}
                ]",
            });
            await db.SaveChangesAsync(ct);
        }

        // ΓöÇΓöÇ Seed default HomeSections (add missing by SectionType) ΓöÇΓöÇ
        var existingSectionTypes = await db.HomeSections
            .Where(hs => hs.TenantId == tenantId).Select(hs => hs.SectionType).ToListAsync(ct);

        var sectionsToAdd = new List<HomeSection>();
        if (!existingSectionTypes.Contains(HomeSectionType.BannerSlider))
            sectionsToAdd.Add(new HomeSection { TenantId = tenantId, Title = "بنرات رئيسية", SectionType = HomeSectionType.BannerSlider, DisplayOrder = 0, IsActive = true });
        if (!existingSectionTypes.Contains(HomeSectionType.FeaturedItems))
            sectionsToAdd.Add(new HomeSection { TenantId = tenantId, Title = "منتجات مميزة", SectionType = HomeSectionType.FeaturedItems, DisplayOrder = 1, IsActive = true });
        if (!existingSectionTypes.Contains(HomeSectionType.NewArrivals))
            sectionsToAdd.Add(new HomeSection { TenantId = tenantId, Title = "وصل حديثاً", SectionType = HomeSectionType.NewArrivals, DisplayOrder = 2, IsActive = true });

        HomeSection? categoriesSection = null;
        if (!existingSectionTypes.Contains(HomeSectionType.CategoriesShowcase))
        {
            categoriesSection = new HomeSection { TenantId = tenantId, Title = "تسوق حسب التصنيف", SectionType = HomeSectionType.CategoriesShowcase, DisplayOrder = 3, IsActive = true };
            sectionsToAdd.Add(categoriesSection);
        }

        HomeSection? brandsSection = null;
        if (!existingSectionTypes.Contains(HomeSectionType.BrandsCarousel))
        {
            brandsSection = new HomeSection { TenantId = tenantId, Title = "ماركاتنا", SectionType = HomeSectionType.BrandsCarousel, DisplayOrder = 4, IsActive = true };
            sectionsToAdd.Add(brandsSection);
        }

        if (!existingSectionTypes.Contains(HomeSectionType.Testimonials))
            sectionsToAdd.Add(new HomeSection { TenantId = tenantId, Title = "آراء العملاء", SectionType = HomeSectionType.Testimonials, DisplayOrder = 5, IsActive = true });
        if (!existingSectionTypes.Contains(HomeSectionType.InstallmentOffers))
            sectionsToAdd.Add(new HomeSection { TenantId = tenantId, Title = "عروض التقسيط", SectionType = HomeSectionType.InstallmentOffers, DisplayOrder = 6, IsActive = true });

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

        // ΓöÇΓöÇ Expense Categories (add missing by name) ΓöÇΓöÇ
        var existingExpCatNames = await db.ExpenseCategories.Where(ec => ec.TenantId == tenantId).Select(ec => ec.Name).ToListAsync(ct);
        var defaultExpCats = new[] { "إيجار", "مرافق", "تسويق", "مستلزمات", "شحن", "أخرى" };
        var newExpCats = defaultExpCats.Where(n => !existingExpCatNames.Contains(n))
            .Select(n => new ExpenseCategory { TenantId = tenantId, Name = n, IsActive = true })
            .ToArray();
        if (newExpCats.Length > 0)
        {
            db.ExpenseCategories.AddRange(newExpCats);
            await db.SaveChangesAsync(ct);
        }

        // ΓöÇΓöÇ Installment Providers (add missing by name, with logo URLs) ΓöÇΓöÇ
        var existingProviderNames = await db.InstallmentProviders.Where(ip => ip.TenantId == tenantId).Select(ip => ip.Name).ToListAsync(ct);
        var defaultProviders = new (string Name, int Order, string? LogoUrl)[]
        {
            ("ValU", 0, "https://mir-s3-cdn-cf.behance.net/project_modules/fs/0efea2100159065.5f031e3e8c32c.jpg"),
            ("Souhoola", 1, "https://www.souhoola.net/assets/img/home/Group%203100-min.png"),
            ("Contact", 2, "https://contact-app-prod.s3.us-east-2.amazonaws.com/contact.eg/alahly_momkn.svg"),
            ("Fawry", 3, "https://contact-app-prod.s3.us-east-2.amazonaws.com/contact.eg/Homepage_channels_logos/fawry.svg"),
            ("\u0636\u0627\u0645\u0646", 4, "https://contact-app-prod.s3.us-east-2.amazonaws.com/contact.eg/Homepage_channels_logos/damen.svg"),
            ("Aman", 5, "https://contact-app-prod.s3.us-east-2.amazonaws.com/contact.eg/Homepage_channels_logos/aman.svg"),
            ("Momkn", 6, "https://contact-app-prod.s3.us-east-2.amazonaws.com/contact.eg/alahly_momkn.svg"),
        };
        var newProviders = defaultProviders.Where(p => !existingProviderNames.Contains(p.Name))
            .Select(p => new InstallmentProvider { TenantId = tenantId, Name = p.Name, Type = "BNPL", LogoUrl = p.LogoUrl, IsActive = true, DisplayOrder = p.Order })
            .ToArray();

        // Also update logo URLs for existing providers that have no logo
        var existingProviders = await db.InstallmentProviders.Where(ip => ip.TenantId == tenantId && ip.LogoUrl == null).ToListAsync(ct);
        foreach (var ep in existingProviders)
        {
            var match = defaultProviders.FirstOrDefault(p => p.Name == ep.Name);
            if (match.LogoUrl != null) ep.LogoUrl = match.LogoUrl;
        }

        if (newProviders.Length > 0)
        {
            db.InstallmentProviders.AddRange(newProviders);
        }
        await db.SaveChangesAsync(ct);
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
