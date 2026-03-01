using Microsoft.EntityFrameworkCore;
using NovaNode.Domain.Entities;
using NovaNode.Domain.Interfaces;

namespace NovaNode.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    // Platform
    public DbSet<Domain.Entities.Tenant> Tenants => Set<Domain.Entities.Tenant>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<TenantFeatureToggle> TenantFeatureToggles => Set<TenantFeatureToggle>();
    public DbSet<PlatformUser> PlatformUsers => Set<PlatformUser>();
    public DbSet<StoreRegistration> StoreRegistrations => Set<StoreRegistration>();
    public DbSet<PlatformInvoice> PlatformInvoices => Set<PlatformInvoice>();

    // Tenant-scoped
    public DbSet<StoreSettings> StoreSettings => Set<StoreSettings>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<ItemType> ItemTypes => Set<ItemType>();
    public DbSet<CustomFieldDefinition> CustomFieldDefinitions => Set<CustomFieldDefinition>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<HomeSection> HomeSections => Set<HomeSection>();
    public DbSet<HomeSectionItem> HomeSectionItems => Set<HomeSectionItem>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<ExpenseCategory> ExpenseCategories => Set<ExpenseCategory>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<InstallmentProvider> InstallmentProviders => Set<InstallmentProvider>();
    public DbSet<InstallmentPlan> InstallmentPlans => Set<InstallmentPlan>();
    public DbSet<TenantSlugHistory> TenantSlugHistories => Set<TenantSlugHistory>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Tenant
        modelBuilder.Entity<Domain.Entities.Tenant>(b =>
        {
            b.HasIndex(t => t.Slug).IsUnique();
            b.Property(t => t.Name).HasMaxLength(200);
            b.Property(t => t.Slug).HasMaxLength(100);
        });

        // Plan
        modelBuilder.Entity<Plan>(b =>
        {
            b.Property(p => p.PriceMonthly).HasPrecision(18, 2);
            b.Property(p => p.ActivationFee).HasPrecision(18, 2);
        });

        // Subscription
        modelBuilder.Entity<Subscription>(b =>
        {
            b.HasOne(s => s.Tenant).WithMany(t => t.Subscriptions).HasForeignKey(s => s.TenantId);
            b.HasOne(s => s.Plan).WithMany(p => p.Subscriptions).HasForeignKey(s => s.PlanId);
            b.Property(s => s.LastPaymentAmount).HasPrecision(18, 2);
        });

        // TenantFeatureToggle
        modelBuilder.Entity<TenantFeatureToggle>(b =>
        {
            b.HasOne(f => f.Tenant).WithOne(t => t.FeatureToggle).HasForeignKey<TenantFeatureToggle>(f => f.TenantId);
        });

        // StoreSettings
        modelBuilder.Entity<StoreSettings>(b =>
        {
            b.HasOne(s => s.Tenant).WithOne(t => t.StoreSettings).HasForeignKey<StoreSettings>(s => s.TenantId);
        });

        // PlatformInvoice
        modelBuilder.Entity<PlatformInvoice>(b =>
        {
            b.HasIndex(i => i.InvoiceNumber).IsUnique();
            b.Property(i => i.ActivationFee).HasPrecision(18, 2);
            b.Property(i => i.SubscriptionAmount).HasPrecision(18, 2);
            b.Property(i => i.Discount).HasPrecision(18, 2);
            b.Property(i => i.Total).HasPrecision(18, 2);
            b.HasOne(i => i.Tenant).WithMany().HasForeignKey(i => i.TenantId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(i => i.Plan).WithMany().HasForeignKey(i => i.PlanId).OnDelete(DeleteBehavior.NoAction);
            b.HasOne(i => i.Subscription).WithMany().HasForeignKey(i => i.SubscriptionId).OnDelete(DeleteBehavior.NoAction);
        });

        // Brand - Global Query Filter
        modelBuilder.Entity<Brand>(b =>
        {
            b.HasIndex(br => new { br.TenantId, br.Slug }).IsUnique();
            b.HasQueryFilter(br => _tenantContext.TenantId == null || br.TenantId == _tenantContext.TenantId);
        });

        // Category - Global Query Filter
        modelBuilder.Entity<Category>(b =>
        {
            b.HasIndex(c => new { c.TenantId, c.Slug }).IsUnique();
            b.HasOne(c => c.Parent).WithMany(c => c.Children).HasForeignKey(c => c.ParentId).OnDelete(DeleteBehavior.Restrict);
            b.HasQueryFilter(c => _tenantContext.TenantId == null || c.TenantId == _tenantContext.TenantId);
        });

        // ItemType - Global Query Filter
        modelBuilder.Entity<ItemType>(b =>
        {
            b.HasIndex(it => new { it.TenantId, it.Slug }).IsUnique();
            b.HasQueryFilter(it => _tenantContext.TenantId == null || it.TenantId == _tenantContext.TenantId);
        });

        // CustomFieldDefinition - Global Query Filter
        modelBuilder.Entity<CustomFieldDefinition>(b =>
        {
            b.HasOne(cf => cf.Category).WithMany(c => c.CustomFieldDefinitions).HasForeignKey(cf => cf.CategoryId).OnDelete(DeleteBehavior.SetNull);
            b.HasQueryFilter(cf => _tenantContext.TenantId == null || cf.TenantId == _tenantContext.TenantId);
        });

        // Item - Global Query Filter
        modelBuilder.Entity<Item>(b =>
        {
            b.HasIndex(i => new { i.TenantId, i.Slug }).IsUnique();
            b.HasIndex(i => new { i.TenantId, i.Status });
            b.HasIndex(i => new { i.TenantId, i.ItemTypeId });
            b.HasIndex(i => new { i.TenantId, i.BrandId });
            b.HasIndex(i => new { i.TenantId, i.CategoryId });
            b.Property(i => i.Price).HasPrecision(18, 2);
            b.Property(i => i.OldPrice).HasPrecision(18, 2);
            b.Property(i => i.VatPercent).HasPrecision(5, 2);
            b.HasOne(i => i.ItemType).WithMany(it => it.Items).HasForeignKey(i => i.ItemTypeId).OnDelete(DeleteBehavior.SetNull);
            b.HasOne(i => i.Brand).WithMany(br => br.Items).HasForeignKey(i => i.BrandId).OnDelete(DeleteBehavior.SetNull);
            b.HasOne(i => i.Category).WithMany(c => c.Items).HasForeignKey(i => i.CategoryId).OnDelete(DeleteBehavior.Restrict);
            b.HasQueryFilter(i => _tenantContext.TenantId == null || i.TenantId == _tenantContext.TenantId);
        });

        // HomeSection - Global Query Filter
        modelBuilder.Entity<HomeSection>(b =>
        {
            b.HasQueryFilter(hs => _tenantContext.TenantId == null || hs.TenantId == _tenantContext.TenantId);
        });

        // HomeSectionItem
        modelBuilder.Entity<HomeSectionItem>(b =>
        {
            b.HasOne(hsi => hsi.HomeSection).WithMany(hs => hs.Items).HasForeignKey(hsi => hsi.HomeSectionId).OnDelete(DeleteBehavior.Cascade).IsRequired(false);
        });

        // Lead - Global Query Filter
        modelBuilder.Entity<Lead>(b =>
        {
            b.HasIndex(l => new { l.TenantId, l.CreatedAt });
            b.Property(l => l.TargetPriceSnapshot).HasPrecision(18, 2);
            b.HasOne(l => l.TargetItem).WithMany(i => i.Leads).HasForeignKey(l => l.TargetItemId).OnDelete(DeleteBehavior.SetNull);
            b.HasQueryFilter(l => _tenantContext.TenantId == null || l.TenantId == _tenantContext.TenantId);
        });

        // Invoice - Global Query Filter
        modelBuilder.Entity<Invoice>(b =>
        {
            b.HasIndex(inv => new { inv.TenantId, inv.CreatedAt });
            b.Property(inv => inv.Subtotal).HasPrecision(18, 2);
            b.Property(inv => inv.Discount).HasPrecision(18, 2);
            b.Property(inv => inv.VatAmount).HasPrecision(18, 2);
            b.Property(inv => inv.Total).HasPrecision(18, 2);
            b.HasOne(inv => inv.OriginalInvoice).WithMany().HasForeignKey(inv => inv.OriginalInvoiceId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(inv => inv.CreatedBy).WithMany().HasForeignKey(inv => inv.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
            b.HasQueryFilter(inv => _tenantContext.TenantId == null || inv.TenantId == _tenantContext.TenantId);
        });

        // InvoiceItem
        modelBuilder.Entity<InvoiceItem>(b =>
        {
            b.Property(ii => ii.UnitPrice).HasPrecision(18, 2);
            b.Property(ii => ii.LineTotal).HasPrecision(18, 2);
            b.Property(ii => ii.VatPercentSnapshot).HasPrecision(5, 2);
            b.HasOne(ii => ii.Invoice).WithMany(inv => inv.Items).HasForeignKey(ii => ii.InvoiceId).OnDelete(DeleteBehavior.Cascade).IsRequired(false);
            b.HasOne(ii => ii.Item).WithMany(i => i.InvoiceItems).HasForeignKey(ii => ii.ItemId).OnDelete(DeleteBehavior.SetNull);
        });

        // ExpenseCategory - Global Query Filter
        modelBuilder.Entity<ExpenseCategory>(b =>
        {
            b.HasQueryFilter(ec => _tenantContext.TenantId == null || ec.TenantId == _tenantContext.TenantId);
        });

        // Expense - Global Query Filter
        modelBuilder.Entity<Expense>(b =>
        {
            b.Property(e => e.Amount).HasPrecision(18, 2);
            b.HasOne(e => e.Category).WithMany(ec => ec.Expenses).HasForeignKey(e => e.CategoryId).OnDelete(DeleteBehavior.Restrict);
            b.HasQueryFilter(e => _tenantContext.TenantId == null || e.TenantId == _tenantContext.TenantId);
        });

        // Employee - Global Query Filter
        modelBuilder.Entity<Employee>(b =>
        {
            b.Property(emp => emp.SalaryMonthly).HasPrecision(18, 2);
            b.HasQueryFilter(emp => _tenantContext.TenantId == null || emp.TenantId == _tenantContext.TenantId);
        });

        // Permission - Global Query Filter
        modelBuilder.Entity<Permission>(b =>
        {
            b.HasOne(p => p.Employee).WithMany(emp => emp.Permissions).HasForeignKey(p => p.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            b.HasQueryFilter(p => _tenantContext.TenantId == null || p.TenantId == _tenantContext.TenantId);
        });

        // AuditLog
        modelBuilder.Entity<AuditLog>(b =>
        {
            b.HasIndex(a => new { a.TenantId, a.CreatedAt });
        });

        // InstallmentProvider - Global Query Filter
        modelBuilder.Entity<InstallmentProvider>(b =>
        {
            b.HasQueryFilter(ip => _tenantContext.TenantId == null || ip.TenantId == _tenantContext.TenantId);
        });

        // InstallmentPlan - Global Query Filter
        modelBuilder.Entity<InstallmentPlan>(b =>
        {
            b.Property(p => p.MonthlyPayment).HasPrecision(18, 2);
            b.Property(p => p.DownPayment).HasPrecision(18, 2);
            b.Property(p => p.AdminFees).HasPrecision(18, 2);
            b.Property(p => p.TotalAmount).HasPrecision(18, 2);
            b.Property(p => p.DownPaymentPercent).HasPrecision(5, 2);
            b.Property(p => p.AdminFeesPercent).HasPrecision(5, 2);
            b.Property(p => p.InterestRate).HasPrecision(5, 2);
            b.HasOne(p => p.Provider).WithMany(ip => ip.Plans).HasForeignKey(p => p.ProviderId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(p => p.Item).WithMany(i => i.InstallmentPlans).HasForeignKey(p => p.ItemId).OnDelete(DeleteBehavior.SetNull);
            b.HasQueryFilter(p => _tenantContext.TenantId == null || p.TenantId == _tenantContext.TenantId);
        });

        // TenantSlugHistory
        modelBuilder.Entity<TenantSlugHistory>(b =>
        {
            b.HasIndex(h => h.OldSlug).IsUnique();
            b.HasOne(h => h.Tenant).WithMany(t => t.SlugHistory).HasForeignKey(h => h.TenantId).OnDelete(DeleteBehavior.Cascade);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<Domain.Common.AuditableEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }

        // Auto-set TenantId for new tenant-scoped entities
        if (_tenantContext.IsResolved)
        {
            foreach (var entry in ChangeTracker.Entries<Domain.Common.TenantEntity>())
            {
                if (entry.State == EntityState.Added && entry.Entity.TenantId == Guid.Empty)
                    entry.Entity.TenantId = _tenantContext.TenantId!.Value;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
