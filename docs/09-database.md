# Nova Node — Database & Migrations

## Database Provider

Nova Node uses **SQL Server** via **Entity Framework Core 9.0.7**.

- Connection string is configured in `appsettings.json` under `ConnectionStrings:Default`
- In-memory provider is used for integration tests via `Microsoft.EntityFrameworkCore.InMemory`

## AppDbContext

Located at `src/NovaNode.Infrastructure/Persistence/AppDbContext.cs`.

### DbSet Properties

| DbSet | Entity |
|-------|--------|
| Tenants | Tenant |
| Subscriptions | Subscription |
| Plans | Plan |
| TenantFeatureToggles | TenantFeatureToggle |
| PlatformUsers | PlatformUser |
| Employees | Employee |
| Permissions | Permission |
| Brands | Brand |
| Categories | Category |
| ItemTypes | ItemType |
| CustomFields | CustomFieldDefinition |
| Items | Item |
| Invoices | Invoice |
| InvoiceItems | InvoiceItem |
| Expenses | Expense |
| ExpenseCategories | ExpenseCategory |
| Leads | Lead |
| HomeSections | HomeSection |
| HomeSectionItems | HomeSectionItem |
| StoreSettings | StoreSettings |
| AuditLogs | AuditLog |

### Global Query Filters

All `TenantEntity` subclasses have automatic query filters:

```csharp
entity.HasQueryFilter(e => e.TenantId == _tenantContext.TenantId);
```

This ensures data isolation between tenants at the ORM level.

### Audit Columns

The `SaveChangesAsync` override automatically sets:
- `CreatedAt = DateTime.UtcNow` for new `AuditableEntity` records
- `UpdatedAt = DateTime.UtcNow` for modified `AuditableEntity` records

## Migrations

### Existing Migrations

| Migration | Name | Date |
|-----------|------|------|
| 20260221223927 | Initial | 2026-02-21 |

### Creating a New Migration

```bash
dotnet ef migrations add <MigrationName> \
  --project src/NovaNode.Infrastructure \
  --startup-project src/NovaNode.Api
```

### Applying Migrations

```bash
dotnet ef database update \
  --project src/NovaNode.Infrastructure \
  --startup-project src/NovaNode.Api
```

### Auto-Migration on Startup

The `DatabaseSeeder` runs on application startup and calls:

```csharp
if (db.Database.IsRelational())
    await db.Database.MigrateAsync();
else
    await db.Database.EnsureCreatedAsync(); // for InMemory (tests)
```

This ensures the database schema is always up-to-date.

## Seeding

The `DatabaseSeeder` (at `src/NovaNode.Infrastructure/Seeding/DatabaseSeeder.cs`) runs on every startup and seeds:

1. **SuperAdmin user** if no `PlatformUser` exists:
   - Email: `admin@novanode.com`
   - Password: `Admin@123` (BCrypt hashed)
   - Role: `SuperAdmin`

2. **Standard plan** if no `Plan` exists:
   - Name: `Standard`
   - PriceMonthly: 500.00
   - ActivationFee: 1500.00

## Entity Configuration

Entity configurations are defined using `IEntityTypeConfiguration<T>` in the `Persistence/` directory, applied via `OnModelCreating`. Key configurations include:

- **Unique indexes**: `Tenant.Slug`, `Employee.Email` (per tenant), `Item.Slug` (per tenant), `Brand.Slug` (per tenant)
- **Cascade delete**: Tenant → Employees, Items, etc.
- **Self-referencing**: Category → ParentId (nullable FK)
- **Invoice self-reference**: Invoice → OriginalInvoiceId (for refunds)
