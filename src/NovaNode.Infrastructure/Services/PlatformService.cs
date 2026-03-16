using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs;
using NovaNode.Application.DTOs.Platform;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Entities;
using NovaNode.Domain.Enums;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public class PlatformService : IPlatformService
{
    private const string PlatformRootDomain = "mobilytics.app";
    private readonly AppDbContext _db;
    private readonly string _webRootPath;

    public PlatformService(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _webRootPath = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
    }

    // ─── Tenants ────────────────────────────────────────

    public async Task<List<TenantDto>> GetTenantsAsync(CancellationToken ct = default)
    {
        var tenants = await _db.Tenants
            .Include(t => t.Subscriptions).ThenInclude(s => s.Plan)
            .Include(t => t.FeatureToggle)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        var result = new List<TenantDto>();
        foreach (var t in tenants)
        {
            var owner = await _db.Employees.FirstOrDefaultAsync(e => e.TenantId == t.Id && e.Role == "Owner", ct);
            result.Add(MapTenantDto(t, owner));
        }
        return result;
    }

    public async Task<TenantDto> GetTenantAsync(Guid id, CancellationToken ct = default)
    {
        var t = await _db.Tenants
            .Include(t => t.Subscriptions).ThenInclude(s => s.Plan)
            .Include(t => t.FeatureToggle)
            .FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new KeyNotFoundException("Tenant not found.");
        var owner = await _db.Employees.FirstOrDefaultAsync(e => e.TenantId == id && e.Role == "Owner", ct);
        var settings = await _db.StoreSettings.FirstOrDefaultAsync(s => s.TenantId == id, ct);
        return MapTenantDto(t, owner, settings);
    }

    public async Task<TenantDto> CreateTenantAsync(CreateTenantRequest request, CancellationToken ct = default)
    {
        if (await _db.Tenants.AnyAsync(t => t.Slug == request.Slug, ct))
            throw new InvalidOperationException("Slug already exists.");

        var fallbackSubdomain = request.Slug.Trim().ToLowerInvariant();
        var fallbackDomain = $"{fallbackSubdomain}.{PlatformRootDomain}";
        var useCustomAsPrimary = request.CustomDomainIsActive && !string.IsNullOrWhiteSpace(request.CustomDomain);
        var normalizedCustom = string.IsNullOrWhiteSpace(request.CustomDomain) ? null : request.CustomDomain.Trim().ToLowerInvariant();

        var tenant = new Tenant
        {
            Name = request.Name, Slug = request.Slug,
            FallbackSubdomain = fallbackSubdomain,
            CustomDomain = normalizedCustom,
            CustomDomainIsActive = useCustomAsPrimary,
            CustomDomainVerificationStatus = useCustomAsPrimary ? DomainVerificationStatus.Verified : DomainVerificationStatus.Pending,
            CustomDomainVerifiedAt = useCustomAsPrimary ? DateTime.UtcNow : null,
            PrimaryDomain = useCustomAsPrimary ? normalizedCustom! : fallbackDomain,
            RedirectFallbackToPrimary = request.RedirectFallbackToPrimary,
            SupportPhone = request.SupportPhone, SupportWhatsApp = request.SupportWhatsApp,
            Address = request.Address, MapUrl = request.MapUrl
        };
        _db.Tenants.Add(tenant);

        _db.TenantFeatureToggles.Add(new TenantFeatureToggle { TenantId = tenant.Id });
        _db.StoreSettings.Add(new StoreSettings { TenantId = tenant.Id, StoreName = request.Name });

        _db.Employees.Add(new Employee
        {
            TenantId = tenant.Id, Name = request.OwnerName, Email = request.OwnerEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.OwnerPassword),
            Role = "Owner"
        });

        await _db.SaveChangesAsync(ct);

        // Seed default data for the new tenant
        await Seeding.TenantDefaultDataSeeder.SeedAsync(_db, tenant.Id, request.Name, ct);

        return await GetTenantAsync(tenant.Id, ct);
    }

    public async Task<TenantDto> UpdateTenantAsync(Guid id, UpdateTenantRequest request, CancellationToken ct = default)
    {
        var t = await _db.Tenants.FindAsync([id], ct) ?? throw new KeyNotFoundException("Tenant not found.");
        t.Name = request.Name; t.Slug = request.Slug;
        t.FallbackSubdomain = request.Slug.Trim().ToLowerInvariant();
        t.CustomDomain = string.IsNullOrWhiteSpace(request.CustomDomain) ? null : request.CustomDomain.Trim().ToLowerInvariant();
        t.CustomDomainIsActive = request.CustomDomainIsActive && !string.IsNullOrWhiteSpace(t.CustomDomain);
        t.CustomDomainVerificationStatus = t.CustomDomainIsActive ? DomainVerificationStatus.Verified : DomainVerificationStatus.Pending;
        t.CustomDomainVerifiedAt = t.CustomDomainIsActive ? DateTime.UtcNow : null;
        t.PrimaryDomain = t.CustomDomainIsActive && !string.IsNullOrWhiteSpace(t.CustomDomain)
            ? t.CustomDomain
            : $"{t.FallbackSubdomain}.{PlatformRootDomain}";
        t.RedirectFallbackToPrimary = request.RedirectFallbackToPrimary;
        t.SupportPhone = request.SupportPhone; t.SupportWhatsApp = request.SupportWhatsApp;
        t.Address = request.Address; t.MapUrl = request.MapUrl;
        await _db.SaveChangesAsync(ct);
        return await GetTenantAsync(id, ct);
    }

    public async Task DeleteTenantAsync(Guid id, CancellationToken ct = default)
    {
        var t = await _db.Tenants.FindAsync([id], ct) ?? throw new KeyNotFoundException("Tenant not found.");

        // Cascade delete all tenant-scoped data
        _db.Notifications.RemoveRange(await _db.Notifications.Where(n => n.TenantId == id).ToListAsync(ct));
        _db.AuditLogs.RemoveRange(await _db.AuditLogs.Where(a => a.TenantId == id).ToListAsync(ct));
        _db.Permissions.RemoveRange(await _db.Permissions.Where(p => p.TenantId == id).ToListAsync(ct));

        // Delete invoice items then invoices
        var invoiceIds = await _db.Invoices.Where(i => i.TenantId == id).Select(i => i.Id).ToListAsync(ct);
        _db.InvoiceItems.RemoveRange(await _db.InvoiceItems.Where(ii => invoiceIds.Contains(ii.InvoiceId)).ToListAsync(ct));
        _db.Invoices.RemoveRange(await _db.Invoices.Where(i => i.TenantId == id).ToListAsync(ct));

        // Delete installment plans then providers
        var providerIds = await _db.InstallmentProviders.Where(p => p.TenantId == id).Select(p => p.Id).ToListAsync(ct);
        _db.InstallmentPlans.RemoveRange(await _db.InstallmentPlans.Where(ip => providerIds.Contains(ip.ProviderId)).ToListAsync(ct));
        _db.InstallmentProviders.RemoveRange(await _db.InstallmentProviders.Where(p => p.TenantId == id).ToListAsync(ct));

        _db.Leads.RemoveRange(await _db.Leads.Where(l => l.TenantId == id).ToListAsync(ct));
        _db.HomeSectionItems.RemoveRange(await _db.HomeSectionItems.Where(h => _db.HomeSections.Where(s => s.TenantId == id).Select(s => s.Id).Contains(h.HomeSectionId)).ToListAsync(ct));
        _db.HomeSections.RemoveRange(await _db.HomeSections.Where(h => h.TenantId == id).ToListAsync(ct));
        _db.Items.RemoveRange(await _db.Items.Where(i => i.TenantId == id).ToListAsync(ct));
        _db.CustomFieldDefinitions.RemoveRange(await _db.CustomFieldDefinitions.Where(c => c.TenantId == id).ToListAsync(ct));
        _db.Expenses.RemoveRange(await _db.Expenses.Where(e => e.TenantId == id).ToListAsync(ct));
        _db.ExpenseCategories.RemoveRange(await _db.ExpenseCategories.Where(e => e.TenantId == id).ToListAsync(ct));
        _db.EmployeeAbsences.RemoveRange(await _db.EmployeeAbsences.Where(a => a.TenantId == id).ToListAsync(ct));
        _db.Employees.RemoveRange(await _db.Employees.Where(e => e.TenantId == id).ToListAsync(ct));
        _db.Categories.RemoveRange(await _db.Categories.Where(c => c.TenantId == id).ToListAsync(ct));
        _db.Brands.RemoveRange(await _db.Brands.Where(b => b.TenantId == id).ToListAsync(ct));
        _db.ItemTypes.RemoveRange(await _db.ItemTypes.Where(it => it.TenantId == id).ToListAsync(ct));
        _db.SpecFieldTemplates.RemoveRange(await _db.SpecFieldTemplates.Where(s => s.TenantId == id).ToListAsync(ct));
        _db.StoreSettings.RemoveRange(await _db.StoreSettings.Where(s => s.TenantId == id).ToListAsync(ct));
        _db.TenantSlugHistories.RemoveRange(await _db.TenantSlugHistories.Where(h => h.TenantId == id).ToListAsync(ct));

        // Delete subscriptions and feature toggles
        _db.Subscriptions.RemoveRange(await _db.Subscriptions.Where(s => s.TenantId == id).ToListAsync(ct));
        _db.TenantFeatureToggles.RemoveRange(await _db.TenantFeatureToggles.Where(f => f.TenantId == id).ToListAsync(ct));

        // Delete platform invoices for this tenant
        _db.PlatformInvoices.RemoveRange(await _db.PlatformInvoices.Where(pi => pi.TenantId == id).ToListAsync(ct));

        _db.Tenants.Remove(t);
        await _db.SaveChangesAsync(ct);

        // Clean up uploaded files from disk
        var uploadsDir = Path.Combine(_webRootPath, "uploads", id.ToString());
        if (Directory.Exists(uploadsDir))
            Directory.Delete(uploadsDir, true);
    }

    public async Task<TenantStatsDto> GetTenantStatsAsync(Guid tenantId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var items = _db.Items.Where(i => i.TenantId == tenantId);
        var invoices = _db.Invoices.Where(i => i.TenantId == tenantId && !i.IsRefund);
        var employees = _db.Employees.Where(e => e.TenantId == tenantId);

        var totalProducts = await items.CountAsync(ct);
        var availableProducts = await items.Where(i => i.Status == ItemStatus.Available).CountAsync(ct);
        var soldProducts = await items.Where(i => i.Status == ItemStatus.Sold).CountAsync(ct);

        var totalInvoices = await invoices.CountAsync(ct);
        var totalRevenue = await invoices.SumAsync(i => i.Total, ct);
        var monthlyRevenue = await invoices.Where(i => i.CreatedAt >= monthStart).SumAsync(i => i.Total, ct);

        var totalEmployees = await employees.CountAsync(ct);
        var activeEmployees = await employees.Where(e => e.IsActive).CountAsync(ct);

        var totalBrands = await _db.Brands.Where(b => b.TenantId == tenantId).CountAsync(ct);
        var totalCategories = await _db.Categories.Where(c => c.TenantId == tenantId).CountAsync(ct);
        var totalLeads = await _db.Leads.Where(l => l.TenantId == tenantId).CountAsync(ct);

        var totalExpenses = await _db.Expenses.Where(e => e.TenantId == tenantId).CountAsync(ct);
        var totalExpenseAmount = await _db.Expenses.Where(e => e.TenantId == tenantId).SumAsync(e => e.Amount, ct);

        // Revenue chart - last 6 months
        var chartStart = monthStart.AddMonths(-5);
        var allInvoices = await invoices.Where(i => i.CreatedAt >= chartStart)
            .Select(i => new { i.CreatedAt, i.Total }).ToListAsync(ct);
        var revenueChart = Enumerable.Range(0, 6).Select(offset =>
        {
            var m = chartStart.AddMonths(offset);
            return new RevenueChartPoint
            {
                Label = m.ToString("MMM yyyy"),
                Amount = allInvoices.Where(i => i.CreatedAt.Year == m.Year && i.CreatedAt.Month == m.Month).Sum(i => i.Total)
            };
        }).ToList();

        // Top sold products
        var topProducts = await _db.InvoiceItems
            .Where(ii => _db.Invoices.Where(inv => inv.TenantId == tenantId && !inv.IsRefund).Select(inv => inv.Id).Contains(ii.InvoiceId))
            .GroupBy(ii => ii.ItemTitleSnapshot)
            .Select(g => new TopProductDto
            {
                Title = g.Key,
                QuantitySold = g.Sum(x => x.Quantity),
                Price = g.Average(x => x.UnitPrice)
            })
            .OrderByDescending(x => x.QuantitySold)
            .Take(5)
            .ToListAsync(ct);

        return new TenantStatsDto
        {
            TotalProducts = totalProducts,
            AvailableProducts = availableProducts,
            SoldProducts = soldProducts,
            TotalInvoices = totalInvoices,
            TotalRevenue = totalRevenue,
            MonthlyRevenue = monthlyRevenue,
            TotalEmployees = totalEmployees,
            ActiveEmployees = activeEmployees,
            TotalBrands = totalBrands,
            TotalCategories = totalCategories,
            TotalLeads = totalLeads,
            TotalExpenses = totalExpenses,
            TotalExpenseAmount = totalExpenseAmount,
            RevenueChart = revenueChart,
            TopProducts = topProducts
        };
    }

    public async Task<TenantStatsDto> GetTenantOperationalStatsAsync(Guid tenantId, CancellationToken ct = default)
    {
        var full = await GetTenantStatsAsync(tenantId, ct);

        return new TenantStatsDto
        {
            TotalProducts = full.TotalProducts,
            AvailableProducts = full.AvailableProducts,
            SoldProducts = full.SoldProducts,
            TotalInvoices = 0,
            TotalRevenue = 0,
            MonthlyRevenue = 0,
            TotalEmployees = full.TotalEmployees,
            ActiveEmployees = full.ActiveEmployees,
            TotalBrands = full.TotalBrands,
            TotalCategories = full.TotalCategories,
            TotalLeads = full.TotalLeads,
            TotalExpenses = full.TotalExpenses,
            TotalExpenseAmount = 0,
            RevenueChart = [],
            TopProducts = full.TopProducts.Select(p => new TopProductDto
            {
                Title = p.Title,
                CategoryName = p.CategoryName,
                QuantitySold = p.QuantitySold,
                Price = 0
            }).ToList()
        };
    }

    public async Task SuspendTenantAsync(Guid id, CancellationToken ct = default)
    {
        var t = await _db.Tenants.FindAsync([id], ct) ?? throw new KeyNotFoundException("Tenant not found.");
        t.IsActive = false;
        var sub = await _db.Subscriptions.Where(s => s.TenantId == id).OrderByDescending(s => s.CreatedAt).FirstOrDefaultAsync(ct);
        if (sub != null) sub.Status = SubscriptionStatus.Suspended;
        await _db.SaveChangesAsync(ct);
    }

    public async Task ActivateTenantAsync(Guid id, CancellationToken ct = default)
    {
        var t = await _db.Tenants.FindAsync([id], ct) ?? throw new KeyNotFoundException("Tenant not found.");
        t.IsActive = true;
        var sub = await _db.Subscriptions.Where(s => s.TenantId == id).OrderByDescending(s => s.CreatedAt).FirstOrDefaultAsync(ct);
        if (sub != null) sub.Status = SubscriptionStatus.Active;
        await _db.SaveChangesAsync(ct);
    }

    // ─── Onboard (single transaction) ───────────────────

    public async Task<OnboardTenantResponse> OnboardTenantAsync(OnboardTenantRequest request, CancellationToken ct = default)
    {
        // ── Validation ──
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(request.StoreName)) errors.Add("Store Name is required.");
        if (string.IsNullOrWhiteSpace(request.Category)) errors.Add("Store category is required.");
        if (string.IsNullOrWhiteSpace(request.Location)) errors.Add("Store location is required.");
        if (string.IsNullOrWhiteSpace(request.NumberOfStores)) errors.Add("Number of stores is required.");
        if (!request.AgreeTerms) errors.Add("Terms agreement is required.");
        if (string.IsNullOrWhiteSpace(request.Slug)) errors.Add("Slug is required.");
        if (string.IsNullOrWhiteSpace(request.OwnerName)) errors.Add("Owner Name is required.");
        if (string.IsNullOrWhiteSpace(request.OwnerEmail)) errors.Add("Owner Email is required.");
        if (string.IsNullOrWhiteSpace(request.OwnerPhone)) errors.Add("Owner phone is required.");
        if (string.IsNullOrWhiteSpace(request.OwnerPassword)) errors.Add("Owner Password is required.");
        if (request.OwnerPassword?.Length < 6) errors.Add("Password must be at least 6 characters.");
        if (request.PlanId == Guid.Empty) errors.Add("Plan is required.");
        if (request.DurationMonths < 1) errors.Add("Duration must be at least 1 month.");
        if (errors.Count > 0) throw new InvalidOperationException(string.Join(" ", errors));

        if (await _db.Tenants.AnyAsync(t => t.Slug == request.Slug, ct))
            throw new InvalidOperationException("Slug already exists.");

        var plan = await _db.Plans.FindAsync([request.PlanId], ct)
            ?? throw new KeyNotFoundException("Plan not found.");

        // 1. Tenant
        var tenant = new Tenant
        {
            Name = request.StoreName, Slug = request.Slug,
            FallbackSubdomain = request.Slug.Trim().ToLowerInvariant(),
            CustomDomain = string.IsNullOrWhiteSpace(request.CustomDomain) ? null : request.CustomDomain.Trim().ToLowerInvariant(),
            CustomDomainIsActive = request.CustomDomainIsActive && !string.IsNullOrWhiteSpace(request.CustomDomain),
            CustomDomainVerificationStatus = request.CustomDomainIsActive && !string.IsNullOrWhiteSpace(request.CustomDomain)
                ? DomainVerificationStatus.Verified
                : DomainVerificationStatus.Pending,
            CustomDomainVerifiedAt = request.CustomDomainIsActive && !string.IsNullOrWhiteSpace(request.CustomDomain)
                ? DateTime.UtcNow
                : null,
            PrimaryDomain = request.CustomDomainIsActive && !string.IsNullOrWhiteSpace(request.CustomDomain)
                ? request.CustomDomain.Trim().ToLowerInvariant()
                : $"{request.Slug.Trim().ToLowerInvariant()}.{PlatformRootDomain}",
            RedirectFallbackToPrimary = request.RedirectFallbackToPrimary,
            SupportPhone = request.StorePhone, SupportWhatsApp = request.StoreWhatsApp,
            Address = request.Address, MapUrl = request.MapUrl, IsActive = true
        };
        _db.Tenants.Add(tenant);

        // 2. Feature toggle
        _db.TenantFeatureToggles.Add(new TenantFeatureToggle { TenantId = tenant.Id });

        // 3. Store settings
        _db.StoreSettings.Add(new StoreSettings
        {
            TenantId = tenant.Id, StoreName = request.StoreName,
            LogoUrl = request.LogoUrl, WhatsAppNumber = request.StoreWhatsApp,
            PhoneNumber = request.StorePhone, SocialLinksJson = request.SocialLinksJson,
            MapUrl = request.MapUrl, FooterAddress = request.Address,
            ThemePresetId = request.ThemePresetId > 0 ? request.ThemePresetId : 1,
            SystemThemeId = request.SystemThemeId > 0 ? request.SystemThemeId : 4,
            CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? "EGP" : request.CurrencyCode,
            WorkingHours = request.WorkingHours
        });

        // 4. Owner employee
        _db.Employees.Add(new Employee
        {
            TenantId = tenant.Id, Name = request.OwnerName, Email = request.OwnerEmail,
            Phone = request.OwnerPhone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.OwnerPassword),
            Role = "Owner"
        });

        // 4.5 Registration parity audit record
        _db.StoreRegistrations.Add(new StoreRegistration
        {
            StoreName = request.StoreName,
            Category = request.Category,
            Location = request.Location,
            OwnerName = request.OwnerName,
            Email = request.OwnerEmail,
            Phone = request.OwnerPhone!,
            WhatsApp = request.OwnerWhatsApp,
            Address = request.Address,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.OwnerPassword),
            NumberOfStores = request.NumberOfStores,
            MonthlyRevenue = null,
            Source = "PlatformOnboarding",
            Status = RegistrationStatus.Approved,
            ApprovalNotes = "Created directly by platform onboarding",
            ApprovedAt = DateTime.UtcNow,
            ApprovedByUserId = null,
            SubmittedAt = DateTime.UtcNow
        });

        // 5. Subscription
        Subscription sub;
        if (request.IsTrial)
        {
            sub = new Subscription
            {
                TenantId = tenant.Id, PlanId = request.PlanId,
                Status = SubscriptionStatus.Trial,
                TrialStart = DateTime.UtcNow, TrialEnd = DateTime.UtcNow.AddDays(7)
            };
        }
        else
        {
            sub = new Subscription
            {
                TenantId = tenant.Id, PlanId = request.PlanId,
                Status = SubscriptionStatus.Active,
                StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddMonths(request.DurationMonths),
                GraceEnd = DateTime.UtcNow.AddMonths(request.DurationMonths).AddDays(3),
                LastPaymentAmount = request.ActivationFeePaid + request.SubscriptionAmountPaid - request.Discount,
                Notes = request.PaymentNotes
            };
        }
        _db.Subscriptions.Add(sub);

        // 6. Invoice (always create, even for trials with 0 amount)
        var invoiceTotal = request.ActivationFeePaid + request.SubscriptionAmountPaid - request.Discount;
        var invoice = new PlatformInvoice
        {
            InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
            TenantId = tenant.Id, PlanId = request.PlanId, SubscriptionId = sub.Id,
            InvoiceType = request.IsTrial ? "Trial" : "Activation",
            Months = request.DurationMonths,
            ActivationFee = request.ActivationFeePaid,
            SubscriptionAmount = request.SubscriptionAmountPaid,
            Discount = request.Discount,
            Total = invoiceTotal,
            PaymentMethod = request.PaymentMethod,
            // Trial with 0 total = Paid (nothing owed). Positive total = Paid (they paid it).
            // Only Unpaid if explicitly needed (future: partial payment support).
            PaymentStatus = PaymentStatus.Paid,
            Notes = request.PaymentNotes
        };
        _db.PlatformInvoices.Add(invoice);

        await _db.SaveChangesAsync(ct);

        // 7. Seed default data (brands, categories, item types, home sections)
        await Seeding.TenantDefaultDataSeeder.SeedAsync(_db, tenant.Id, request.StoreName, ct);

        var tenantDto = await GetTenantAsync(tenant.Id, ct);
        return new OnboardTenantResponse
        {
            Tenant = tenantDto,
            Invoice = MapInvoiceDto(invoice, tenant.Name, tenant.Slug, plan.Name)
        };
    }

    // ─── Plans ──────────────────────────────────────────

    public async Task<List<PlanDto>> GetPlansAsync(CancellationToken ct = default) =>
        await _db.Plans.Select(p => MapPlanDto(p)).ToListAsync(ct);

    public async Task<PlanDto> CreatePlanAsync(CreatePlanRequest request, CancellationToken ct = default)
    {
        var plan = new Plan
        {
            Name = request.Name, PriceMonthly = request.PriceMonthly,
            ActivationFee = request.ActivationFee, LimitsJson = request.LimitsJson, FeaturesJson = request.FeaturesJson
        };
        _db.Plans.Add(plan);
        await _db.SaveChangesAsync(ct);
        return MapPlanDto(plan);
    }

    public async Task<PlanDto> UpdatePlanAsync(Guid id, UpdatePlanRequest request, CancellationToken ct = default)
    {
        var plan = await _db.Plans.FindAsync([id], ct) ?? throw new KeyNotFoundException("Plan not found.");
        plan.Name = request.Name; plan.PriceMonthly = request.PriceMonthly;
        plan.ActivationFee = request.ActivationFee; plan.LimitsJson = request.LimitsJson;
        plan.FeaturesJson = request.FeaturesJson; plan.IsActive = request.IsActive;
        await _db.SaveChangesAsync(ct);
        return MapPlanDto(plan);
    }

    public async Task DeletePlanAsync(Guid id, CancellationToken ct = default)
    {
        var plan = await _db.Plans.FindAsync([id], ct) ?? throw new KeyNotFoundException("Plan not found.");
        _db.Plans.Remove(plan);
        await _db.SaveChangesAsync(ct);
    }

    // ─── Subscriptions ──────────────────────────────────

    public async Task StartTrialAsync(Guid tenantId, StartTrialRequest request, CancellationToken ct = default)
    {
        var sub = new Subscription
        {
            TenantId = tenantId, PlanId = request.PlanId,
            Status = SubscriptionStatus.Trial,
            TrialStart = DateTime.UtcNow, TrialEnd = DateTime.UtcNow.AddDays(7)
        };
        _db.Subscriptions.Add(sub);
        await _db.SaveChangesAsync(ct);
    }

    public async Task ActivateSubscriptionAsync(Guid tenantId, ActivateSubscriptionRequest request, CancellationToken ct = default)
    {
        var plan = await _db.Plans.FindAsync([request.PlanId], ct) ?? throw new KeyNotFoundException("Plan not found.");
        var sub = await _db.Subscriptions.Where(s => s.TenantId == tenantId).OrderByDescending(s => s.CreatedAt).FirstOrDefaultAsync(ct);

        var months = request.Months > 0 ? request.Months : 1;

        if (sub != null)
        {
            sub.Status = SubscriptionStatus.Active;
            sub.PlanId = request.PlanId;
            sub.StartDate = DateTime.UtcNow;
            sub.EndDate = DateTime.UtcNow.AddMonths(months);
            sub.GraceEnd = DateTime.UtcNow.AddMonths(months).AddDays(3);
            sub.LastPaymentAmount = request.PaymentAmount;
            sub.Notes = request.Notes;
        }
        else
        {
            _db.Subscriptions.Add(new Subscription
            {
                TenantId = tenantId, PlanId = request.PlanId,
                Status = SubscriptionStatus.Active,
                StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddMonths(months),
                GraceEnd = DateTime.UtcNow.AddMonths(months).AddDays(3),
                LastPaymentAmount = request.PaymentAmount, Notes = request.Notes
            });
        }

        // Ensure tenant is active
        var tenant = await _db.Tenants.FindAsync([tenantId], ct);
        if (tenant != null) tenant.IsActive = true;

        // Create invoice for the activation payment
        var activationSub = sub ?? _db.Subscriptions.Local.FirstOrDefault(s => s.TenantId == tenantId);
        _db.PlatformInvoices.Add(new PlatformInvoice
        {
            InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
            TenantId = tenantId,
            PlanId = request.PlanId,
            SubscriptionId = activationSub?.Id,
            InvoiceType = "Activation",
            Months = months,
            ActivationFee = plan.ActivationFee,
            SubscriptionAmount = request.PaymentAmount > plan.ActivationFee
                ? request.PaymentAmount - plan.ActivationFee
                : request.PaymentAmount,
            Discount = 0,
            Total = request.PaymentAmount,
            PaymentMethod = PaymentMethod.Cash,
            PaymentStatus = PaymentStatus.Paid,
            Notes = request.Notes
        });

        await _db.SaveChangesAsync(ct);
    }

    public async Task RenewSubscriptionAsync(Guid tenantId, RenewSubscriptionRequest request, CancellationToken ct = default)
    {
        var sub = await _db.Subscriptions.Where(s => s.TenantId == tenantId).OrderByDescending(s => s.CreatedAt).FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException("No subscription found.");
        sub.Status = SubscriptionStatus.Active;
        sub.StartDate = DateTime.UtcNow;
        sub.EndDate = DateTime.UtcNow.AddMonths(request.Months);
        sub.GraceEnd = DateTime.UtcNow.AddMonths(request.Months).AddDays(3);
        sub.LastPaymentAmount = request.PaymentAmount;
        sub.Notes = request.Notes;

        // Create invoice for the renewal payment
        _db.PlatformInvoices.Add(new PlatformInvoice
        {
            InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
            TenantId = tenantId,
            PlanId = sub.PlanId,
            SubscriptionId = sub.Id,
            InvoiceType = "Renewal",
            Months = request.Months,
            ActivationFee = 0,
            SubscriptionAmount = request.PaymentAmount,
            Discount = 0,
            Total = request.PaymentAmount,
            PaymentMethod = PaymentMethod.Cash,
            PaymentStatus = PaymentStatus.Paid,
            Notes = request.Notes
        });

        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<ExpiringSubscriptionDto>> GetExpiringSubscriptionsAsync(int days, CancellationToken ct = default)
    {
        var cutoff = DateTime.UtcNow.AddDays(days);
        return await _db.Subscriptions
            .Include(s => s.Plan).Include(s => s.Tenant)
            .Where(s => s.EndDate != null && s.EndDate <= cutoff && s.Status == SubscriptionStatus.Active)
            .Select(s => new ExpiringSubscriptionDto
            {
                TenantId = s.TenantId, TenantName = s.Tenant.Name, TenantSlug = s.Tenant.Slug,
                PlanName = s.Plan.Name, EndDate = s.EndDate!.Value,
                DaysRemaining = (int)(s.EndDate!.Value - DateTime.UtcNow).TotalDays
            }).ToListAsync(ct);
    }

    public async Task DeleteSubscriptionAsync(Guid tenantId, CancellationToken ct = default)
    {
        var subs = await _db.Subscriptions.Where(s => s.TenantId == tenantId).ToListAsync(ct);
        if (subs.Count == 0) throw new KeyNotFoundException("No subscription found.");
        _db.Subscriptions.RemoveRange(subs);

        // Also remove related platform invoices so revenue is recalculated
        var invoices = await _db.PlatformInvoices.Where(i => i.TenantId == tenantId).ToListAsync(ct);
        _db.PlatformInvoices.RemoveRange(invoices);

        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateSubscriptionAsync(Guid tenantId, UpdateSubscriptionRequest request, CancellationToken ct = default)
    {
        var sub = await _db.Subscriptions.Where(s => s.TenantId == tenantId).OrderByDescending(s => s.CreatedAt).FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException("No subscription found.");

        if (request.Months > 0 && sub.StartDate.HasValue)
        {
            sub.EndDate = sub.StartDate.Value.AddMonths(request.Months);
            sub.GraceEnd = sub.EndDate.Value.AddDays(3);
        }
        if (request.Notes != null) sub.Notes = request.Notes;

        await _db.SaveChangesAsync(ct);
    }

    // ─── Features ───────────────────────────────────────

    public async Task<FeatureToggleDto> GetFeaturesAsync(Guid tenantId, CancellationToken ct = default)
    {
        var ft = await _db.TenantFeatureToggles.FirstOrDefaultAsync(f => f.TenantId == tenantId, ct);
        return new FeatureToggleDto
        {
            CanRemovePoweredBy = ft?.CanRemovePoweredBy ?? false,
            AdvancedReports = ft?.AdvancedReports ?? false
        };
    }

    public async Task UpdateFeaturesAsync(Guid tenantId, UpdateFeatureToggleRequest request, CancellationToken ct = default)
    {
        var ft = await _db.TenantFeatureToggles.FirstOrDefaultAsync(f => f.TenantId == tenantId, ct);
        if (ft == null)
        {
            ft = new TenantFeatureToggle { TenantId = tenantId };
            _db.TenantFeatureToggles.Add(ft);
        }
        ft.CanRemovePoweredBy = request.CanRemovePoweredBy;
        ft.AdvancedReports = request.AdvancedReports;
        await _db.SaveChangesAsync(ct);
    }

    // ─── Invoices ───────────────────────────────────────

    public async Task<List<PlatformInvoiceDto>> GetInvoicesAsync(Guid? tenantId = null, CancellationToken ct = default)
    {
        var query = _db.PlatformInvoices.Include(i => i.Tenant).Include(i => i.Plan).AsQueryable();
        if (tenantId.HasValue) query = query.Where(i => i.TenantId == tenantId.Value);
        return await query.OrderByDescending(i => i.CreatedAt)
            .Select(i => MapInvoiceDto(i, i.Tenant.Name, i.Tenant.Slug, i.Plan != null ? i.Plan.Name : null))
            .ToListAsync(ct);
    }

    public async Task<PlatformInvoiceDto> GetInvoiceAsync(Guid id, CancellationToken ct = default)
    {
        var i = await _db.PlatformInvoices.Include(i => i.Tenant).Include(i => i.Plan)
            .FirstOrDefaultAsync(i => i.Id == id, ct) ?? throw new KeyNotFoundException("Invoice not found.");
        return MapInvoiceDto(i, i.Tenant.Name, i.Tenant.Slug, i.Plan?.Name);
    }

    public async Task DeleteInvoiceAsync(Guid id, CancellationToken ct = default)
    {
        var invoice = await _db.PlatformInvoices.FindAsync([id], ct)
            ?? throw new KeyNotFoundException("Invoice not found.");
        _db.PlatformInvoices.Remove(invoice);
        await _db.SaveChangesAsync(ct);
    }

    // ─── Dashboard ──────────────────────────────────────

    public async Task<PlatformDashboardDto> GetDashboardAsync(string range, CancellationToken ct = default)
    {
        var totalTenants = await _db.Tenants.CountAsync(ct);
        var active = await _db.Tenants.CountAsync(t => t.IsActive, ct);
        var trial = await _db.Subscriptions.CountAsync(s => s.Status == SubscriptionStatus.Trial, ct);
        var expired = await _db.Subscriptions.CountAsync(s => s.Status == SubscriptionStatus.Expired, ct);
        var suspended = await _db.Subscriptions.CountAsync(s => s.Status == SubscriptionStatus.Suspended, ct);
        var totalRevenue = await _db.PlatformInvoices
            .Where(i => i.PaymentStatus == PaymentStatus.Paid)
            .SumAsync(i => (decimal?)i.Total, ct) ?? 0;
        var monthlyRevenue = await _db.PlatformInvoices
            .Where(i => i.PaymentStatus == PaymentStatus.Paid && i.CreatedAt >= DateTime.UtcNow.AddDays(-30))
            .SumAsync(i => (decimal?)i.Total, ct) ?? 0;
        var expiringCutoff = DateTime.UtcNow.AddDays(7);
        var expiring = await _db.Subscriptions.CountAsync(s => s.EndDate != null && s.EndDate <= expiringCutoff && s.Status == SubscriptionStatus.Active, ct);
        var totalLeads = await _db.Leads.CountAsync(ct);

        // Recent tenants (top 5)
        var recentTenants = await _db.Tenants
            .Include(t => t.Subscriptions).ThenInclude(s => s.Plan)
            .Include(t => t.FeatureToggle)
            .OrderByDescending(t => t.CreatedAt)
            .Take(5)
            .ToListAsync(ct);

        var recentDtos = new List<TenantDto>();
        foreach (var t in recentTenants)
        {
            var owner = await _db.Employees.FirstOrDefaultAsync(e => e.TenantId == t.Id && e.Role == "Owner", ct);
            recentDtos.Add(MapTenantDto(t, owner));
        }

        // Revenue chart — last 6 months
        var revenueChart = new List<RevenueChartPoint>();
        for (int i = 5; i >= 0; i--)
        {
            var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).AddMonths(-i);
            var monthEnd = monthStart.AddMonths(1);
            var amount = await _db.PlatformInvoices
                .Where(inv => inv.PaymentStatus == PaymentStatus.Paid && inv.CreatedAt >= monthStart && inv.CreatedAt < monthEnd)
                .SumAsync(inv => (decimal?)inv.Total, ct) ?? 0;
            revenueChart.Add(new RevenueChartPoint { Label = monthStart.ToString("MMM yyyy"), Amount = amount });
        }

        // Recent invoices (top 5)
        var recentInvoices = await _db.PlatformInvoices
            .Include(i => i.Tenant).Include(i => i.Plan)
            .OrderByDescending(i => i.CreatedAt).Take(5)
            .Select(i => MapInvoiceDto(i, i.Tenant.Name, i.Tenant.Slug, i.Plan != null ? i.Plan.Name : null))
            .ToListAsync(ct);

        // Per-tenant revenue breakdown
        var tenantBreakdown = await _db.Tenants
            .Include(t => t.Subscriptions).ThenInclude(s => s.Plan)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                t.Id, t.Name, t.Slug,
                LatestSub = t.Subscriptions.OrderByDescending(s => s.CreatedAt).FirstOrDefault()
            })
            .ToListAsync(ct);

        var breakdownDtos = new List<TenantRevenueBreakdownDto>();
        foreach (var tb in tenantBreakdown)
        {
            var invoices = await _db.PlatformInvoices
                .Where(inv => inv.TenantId == tb.Id && inv.PaymentStatus == PaymentStatus.Paid)
                .ToListAsync(ct);

            breakdownDtos.Add(new TenantRevenueBreakdownDto
            {
                TenantId = tb.Id,
                TenantName = tb.Name,
                TenantSlug = tb.Slug,
                PlanName = tb.LatestSub?.Plan?.Name ?? "—",
                SubscriptionStatus = tb.LatestSub?.Status.ToString() ?? "None",
                TotalFees = invoices.Sum(i => i.ActivationFee),
                TotalSubscriptionRevenue = invoices.Sum(i => i.SubscriptionAmount),
                TotalDiscount = invoices.Sum(i => i.Discount),
                TotalPaid = invoices.Sum(i => i.Total),
                TotalMonths = invoices.Sum(i => i.Months),
                SubscriptionStart = tb.LatestSub?.StartDate,
                SubscriptionEnd = tb.LatestSub?.EndDate,
                InvoiceCount = invoices.Count
            });
        }

        return new PlatformDashboardDto
        {
            TotalTenants = totalTenants, ActiveTenants = active, TrialTenants = trial,
            ExpiredTenants = expired, SuspendedTenants = suspended,
            TotalRevenue = totalRevenue, MonthlyRevenue = monthlyRevenue,
            ExpiringSubscriptions = expiring, TotalLeads = totalLeads,
            RecentTenants = recentDtos,
            RevenueChart = revenueChart,
            RecentInvoices = recentInvoices,
            TenantRevenueBreakdown = breakdownDtos
        };
    }

    // ─── Store Settings (platform-managed) ──────────────

    public async Task<TenantStoreSettingsDto> GetStoreSettingsAsync(Guid tenantId, CancellationToken ct = default)
    {
        var s = await _db.StoreSettings.FirstOrDefaultAsync(x => x.TenantId == tenantId, ct)
            ?? throw new KeyNotFoundException("Store settings not found.");
        return new TenantStoreSettingsDto
        {
            StoreName = s.StoreName, LogoUrl = s.LogoUrl, BannerUrl = s.BannerUrl,
            WhatsAppNumber = s.WhatsAppNumber, PhoneNumber = s.PhoneNumber,
            ThemePresetId = s.ThemePresetId,
            SystemThemeId = s.SystemThemeId,
            CurrencyCode = s.CurrencyCode, FooterAddress = s.FooterAddress, WorkingHours = s.WorkingHours,
            SocialLinksJson = s.SocialLinksJson, PoliciesJson = s.PoliciesJson, MapUrl = s.MapUrl,
            HeaderNoticeText = s.HeaderNoticeText,
            OfferBannerText = s.OfferBannerText, OfferBannerUrl = s.OfferBannerUrl,
            AboutTitle = s.AboutTitle, AboutDescription = s.AboutDescription, AboutImageUrl = s.AboutImageUrl,
            HeroBannersJson = s.HeroBannersJson, TestimonialsJson = s.TestimonialsJson,
            FaqJson = s.FaqJson, TrustBadgesJson = s.TrustBadgesJson,
            WhatsAppTemplatesJson = s.WhatsAppTemplatesJson, PwaSettingsJson = s.PwaSettingsJson
        };
    }

    public async Task<TenantStoreSettingsDto> UpdateStoreSettingsAsync(Guid tenantId, UpdateStoreSettingsRequest request, CancellationToken ct = default)
    {
        var s = await _db.StoreSettings.FirstOrDefaultAsync(x => x.TenantId == tenantId, ct);
        if (s == null)
        {
            s = new StoreSettings { TenantId = tenantId };
            _db.StoreSettings.Add(s);
        }
        s.StoreName = request.StoreName; s.LogoUrl = request.LogoUrl; s.BannerUrl = request.BannerUrl;
        s.WhatsAppNumber = request.WhatsAppNumber; s.PhoneNumber = request.PhoneNumber;
        s.ThemePresetId = request.ThemePresetId;
        s.SystemThemeId = request.SystemThemeId;
        s.CurrencyCode = request.CurrencyCode; s.FooterAddress = request.FooterAddress;
        s.WorkingHours = request.WorkingHours; s.SocialLinksJson = request.SocialLinksJson;
        s.PoliciesJson = request.PoliciesJson; s.MapUrl = request.MapUrl;
        s.HeaderNoticeText = request.HeaderNoticeText;
        s.OfferBannerText = request.OfferBannerText; s.OfferBannerUrl = request.OfferBannerUrl;
        s.AboutTitle = request.AboutTitle; s.AboutDescription = request.AboutDescription; s.AboutImageUrl = request.AboutImageUrl;
        s.HeroBannersJson = request.HeroBannersJson; s.TestimonialsJson = request.TestimonialsJson;
        s.FaqJson = request.FaqJson; s.TrustBadgesJson = request.TrustBadgesJson;
        s.WhatsAppTemplatesJson = request.WhatsAppTemplatesJson;

        // Also update tenant name if changed
        var tenant = await _db.Tenants.FindAsync([tenantId], ct);
        if (tenant != null && !string.IsNullOrWhiteSpace(request.StoreName))
        {
            tenant.Name = request.StoreName;
            tenant.SupportPhone = request.PhoneNumber;
            tenant.SupportWhatsApp = request.WhatsAppNumber;
            tenant.MapUrl = request.MapUrl;
            if (!string.IsNullOrWhiteSpace(request.FooterAddress)) tenant.Address = request.FooterAddress;
        }

        await _db.SaveChangesAsync(ct);
        return await GetStoreSettingsAsync(tenantId, ct);
    }

    // ─── Store Requests (platform-managed) ──────────────

    public async Task<List<StoreRegistrationDto>> GetStoreRequestsAsync(string? status = null, CancellationToken ct = default)
    {
        var query = _db.StoreRegistrations.AsQueryable();
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<RegistrationStatus>(status, true, out var parsed))
            query = query.Where(r => r.Status == parsed);
        return await query.OrderByDescending(r => r.SubmittedAt)
            .Select(r => new StoreRegistrationDto
            {
                Id = r.Id, StoreName = r.StoreName, Category = r.Category, Location = r.Location,
                OwnerName = r.OwnerName, Email = r.Email, Phone = r.Phone,
                NumberOfStores = r.NumberOfStores, MonthlyRevenue = r.MonthlyRevenue,
                Source = r.Source, Status = r.Status.ToString(), ApprovalNotes = r.ApprovalNotes,
                SubmittedAt = r.SubmittedAt, ApprovedAt = r.ApprovedAt, RejectionReason = r.RejectionReason
            }).ToListAsync(ct);
    }

    public async Task<StoreRegistrationDto> UpdateStoreRequestStatusAsync(Guid id, string status, string? notes, Guid userId, CancellationToken ct = default)
    {
        var reg = await _db.StoreRegistrations.FindAsync([id], ct) ?? throw new KeyNotFoundException("Registration not found.");

        if (Enum.TryParse<RegistrationStatus>(status, true, out var parsed))
            reg.Status = parsed;
        else
            throw new InvalidOperationException($"Invalid status: {status}");

        if (parsed == RegistrationStatus.Approved)
        {
            reg.ApprovalNotes = notes;
            reg.ApprovedAt = DateTime.UtcNow;
            reg.ApprovedByUserId = userId;
        }
        else if (parsed == RegistrationStatus.Rejected)
        {
            reg.RejectionReason = notes;
            reg.ApprovedByUserId = userId;
        }
        else
        {
            reg.ApprovalNotes = notes;
            reg.ApprovedByUserId = userId;
        }

        await _db.SaveChangesAsync(ct);

        return new StoreRegistrationDto
        {
            Id = reg.Id, StoreName = reg.StoreName, Category = reg.Category, Location = reg.Location,
            OwnerName = reg.OwnerName, Email = reg.Email, Phone = reg.Phone,
            NumberOfStores = reg.NumberOfStores, MonthlyRevenue = reg.MonthlyRevenue,
            Source = reg.Source, Status = reg.Status.ToString(), ApprovalNotes = reg.ApprovalNotes,
            SubmittedAt = reg.SubmittedAt, ApprovedAt = reg.ApprovedAt, RejectionReason = reg.RejectionReason
        };
    }

    // ─── Mappers ────────────────────────────────────────

    private static TenantDto MapTenantDto(Tenant t, Employee? owner, StoreSettings? settings = null)
    {
        var sub = t.Subscriptions.OrderByDescending(s => s.CreatedAt).FirstOrDefault();
        var status = !t.IsActive ? "Suspended" : sub == null ? "Pending" : "Active";
        var storefrontUrl = $"https://{t.PrimaryDomain}";
        return new TenantDto
        {
            Id = t.Id, Name = t.Name, Slug = t.Slug,
            FallbackSubdomain = t.FallbackSubdomain,
            PrimaryDomain = t.PrimaryDomain,
            CustomDomain = t.CustomDomain,
            CustomDomainVerificationStatus = t.CustomDomainVerificationStatus.ToString(),
            CustomDomainIsActive = t.CustomDomainIsActive,
            CustomDomainVerifiedAt = t.CustomDomainVerifiedAt,
            RedirectFallbackToPrimary = t.RedirectFallbackToPrimary,
            StorefrontUrl = storefrontUrl,
            AdminUrl = $"{storefrontUrl}/admin",
            Status = status,
            SupportPhone = t.SupportPhone, SupportWhatsApp = t.SupportWhatsApp,
            Address = t.Address, MapUrl = t.MapUrl,
            CreatedAt = t.CreatedAt, UpdatedAt = t.UpdatedAt,
            Owner = owner == null ? null : new TenantOwnerDto
            {
                Id = owner.Id, Name = owner.Name, Email = owner.Email,
                Phone = owner.Phone, WhatsApp = owner.Phone // use phone as whatsapp fallback
            },
            Subscription = sub == null ? null : new SubscriptionSummaryDto
            {
                Id = sub.Id, PlanId = sub.PlanId, PlanName = sub.Plan?.Name,
                Status = sub.Status.ToString(),
                StartDate = sub.StartDate, EndDate = sub.EndDate,
                TrialEndsAt = sub.TrialEnd, GraceEndsAt = sub.GraceEnd
            },
            Features = t.FeatureToggle == null ? null : new FeatureToggleDto
            {
                CanRemovePoweredBy = t.FeatureToggle.CanRemovePoweredBy,
                AdvancedReports = t.FeatureToggle.AdvancedReports
            },
            StoreSettings = settings == null ? null : new TenantStoreSettingsDto
            {
                StoreName = settings.StoreName,
                LogoUrl = settings.LogoUrl, BannerUrl = settings.BannerUrl,
                WhatsAppNumber = settings.WhatsAppNumber, PhoneNumber = settings.PhoneNumber,
                ThemePresetId = settings.ThemePresetId,
                SystemThemeId = settings.SystemThemeId,
                CurrencyCode = settings.CurrencyCode, FooterAddress = settings.FooterAddress,
                WorkingHours = settings.WorkingHours, SocialLinksJson = settings.SocialLinksJson,
                PoliciesJson = settings.PoliciesJson, MapUrl = settings.MapUrl,
                HeaderNoticeText = settings.HeaderNoticeText,
                OfferBannerText = settings.OfferBannerText, OfferBannerUrl = settings.OfferBannerUrl,
                AboutTitle = settings.AboutTitle, AboutDescription = settings.AboutDescription, AboutImageUrl = settings.AboutImageUrl,
                HeroBannersJson = settings.HeroBannersJson, TestimonialsJson = settings.TestimonialsJson,
                FaqJson = settings.FaqJson, TrustBadgesJson = settings.TrustBadgesJson,
                WhatsAppTemplatesJson = settings.WhatsAppTemplatesJson, PwaSettingsJson = settings.PwaSettingsJson
            }
        };
    }

    private static PlanDto MapPlanDto(Plan p) => new()
    {
        Id = p.Id, Name = p.Name, PriceMonthly = p.PriceMonthly,
        ActivationFee = p.ActivationFee, LimitsJson = p.LimitsJson,
        FeaturesJson = p.FeaturesJson, IsActive = p.IsActive
    };

    private static PlatformInvoiceDto MapInvoiceDto(PlatformInvoice i, string? tenantName, string? tenantSlug, string? planName) => new()
    {
        Id = i.Id, InvoiceNumber = i.InvoiceNumber,
        TenantId = i.TenantId, TenantName = tenantName, TenantSlug = tenantSlug,
        PlanName = planName, InvoiceType = i.InvoiceType,
        Months = i.Months, ActivationFee = i.ActivationFee,
        SubscriptionAmount = i.SubscriptionAmount, Discount = i.Discount,
        Total = i.Total, PaymentMethod = i.PaymentMethod.ToString(),
        PaymentStatus = i.PaymentStatus.ToString(),
        Notes = i.Notes, CreatedAt = i.CreatedAt
    };
}
