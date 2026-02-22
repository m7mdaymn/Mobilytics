# Nova Node — Multi-Tenancy

## Overview

Nova Node uses a **single-database, shared-schema** multi-tenancy model. All tenants share the same database and tables, with data isolation enforced through:

1. **TenantId column** on every tenant-scoped entity
2. **EF Core Global Query Filters** applied automatically
3. **Middleware-based tenant resolution** on every request

## Tenant Resolution

### How It Works

The `TenantResolutionMiddleware` runs on every request and resolves the tenant **exclusively** from the `X-Tenant-Slug` request header:

1. **Header**: Reads the `X-Tenant-Slug` header (case-insensitive). This is the **only** resolution method.
2. **Database lookup**: Resolves the slug to `TenantId` via the `Tenants` table
3. **Context injection**: Sets `ITenantContext.TenantId` and `ITenantContext.Slug`

> **Note:** Subdomain-based resolution has been removed. The backend API runs on a single fixed host (e.g. `https://api.mobilytics.com`). Tenant subdomains exist only on the frontend side.

For full details, see [TENANCY.md](TENANCY.md).

### Exempt Paths

The following paths skip tenant resolution entirely:

| Path Pattern | Reason |
|--------------|--------|
| `/api/v1/platform/*` | Platform (SuperAdmin) endpoints |
| `/swagger/*` | API documentation |
| `/uploads/*` | Static file serving |
| `/health` | Health check endpoint |

### Missing Tenant Slug

If a tenant-scoped endpoint is called without the `X-Tenant-Slug` header, the middleware returns:

```
HTTP 400 Bad Request
{"success": false, "message": "X-Tenant-Slug header is required for tenant-scoped endpoints."}
```

## Data Isolation

### Entity Hierarchy

```
BaseEntity (Id: Guid)
└── AuditableEntity (+CreatedAt, UpdatedAt)
    └── TenantEntity (+TenantId: Guid)
```

Every tenant-scoped entity inherits from `TenantEntity`, which includes a `TenantId` foreign key to the `Tenants` table.

### Global Query Filters

The `AppDbContext` applies global query filters to every `TenantEntity`:

```csharp
modelBuilder.Entity<Brand>().HasQueryFilter(e => e.TenantId == _tenantContext.TenantId);
modelBuilder.Entity<Category>().HasQueryFilter(e => e.TenantId == _tenantContext.TenantId);
// ... applied to all tenant-scoped entities
```

This ensures that:
- `SELECT` queries never return data from other tenants
- Joins and navigation properties are automatically filtered
- No manual `WHERE TenantId = @id` needed in service code

### Tenant-Scoped Entities

| Entity | Tenant-Scoped |
|--------|:------------:|
| Brand | ✅ |
| Category | ✅ |
| ItemType | ✅ |
| CustomFieldDefinition | ✅ |
| Item | ✅ |
| Invoice | ✅ |
| Expense | ✅ |
| ExpenseCategory | ✅ |
| Employee | ✅ |
| Permission | ✅ |
| Lead | ✅ |
| HomeSection | ✅ |
| StoreSettings | — (linked by TenantId FK) |
| AuditLog | — (has TenantId but platform-scoped) |
| Tenant | — (platform entity) |
| Subscription | — (platform entity) |
| Plan | — (platform entity) |
| PlatformUser | — (platform entity) |

## Subscription Enforcement

The `SubscriptionEnforcementMiddleware` checks the tenant's subscription status on every request:

| Status | Behavior |
|--------|----------|
| `Active` / `Trial` | Full access |
| `Grace` | Read-only (GET requests only) |
| `Expired` / `Suspended` | Blocked (403 Forbidden) |

### Exempt Paths

| Path Pattern | Reason |
|--------------|--------|
| `/api/v1/platform/*` | Platform management |
| `/api/v1/auth/*` | Login/refresh |
| `/api/v1/public/*` | Public storefront |
| `/swagger/*` | Documentation |
| `/uploads/*` | Static files |

## Creating a New Tenant

When a SuperAdmin creates a tenant via `POST /api/v1/platform/tenants`:

1. A `Tenant` record is created with the given name, slug, and status
2. An `Employee` record is created with the `Owner` role
3. Default `StoreSettings` are initialized
4. A `TenantFeatureToggle` record is created with defaults
5. The tenant is immediately usable (no subscription required initially)
