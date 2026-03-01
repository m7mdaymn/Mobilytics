# Path-Based Multi-Tenancy — Architecture Guide

## Overview

Mobilytics uses **path-based routing** for multi-tenancy. Each tenant (store) is identified by a unique `slug` embedded in the URL path — no subdomains, no query parameters.

```
/store/{slug}          → Storefront (public)
/store/{slug}/admin    → Tenant Admin (authenticated)
/superadmin            → Platform Admin (platform role)
```

---

## URL Structure

| Area | URL Pattern | Example | Auth |
|------|-------------|---------|------|
| Landing | `/` | `mobilytics.vercel.app/` | None |
| Storefront Home | `/store/{slug}` | `/store/dubai-phone` | None |
| Catalog | `/store/{slug}/catalog` | `/store/dubai-phone/catalog` | None |
| Category | `/store/{slug}/category/{catSlug}` | `/store/dubai-phone/category/smartphones` | None |
| Brand | `/store/{slug}/brand/{brandSlug}` | `/store/dubai-phone/brand/apple` | None |
| Item Detail | `/store/{slug}/item/{itemSlug}` | `/store/dubai-phone/item/iphone-15-pro` | None |
| Compare | `/store/{slug}/compare` | `/store/dubai-phone/compare` | None |
| About | `/store/{slug}/about` | `/store/dubai-phone/about` | None |
| Policies | `/store/{slug}/policies/{key}` | `/store/dubai-phone/policies/returns` | None |
| Admin Login | `/store/{slug}/admin/login` | `/store/dubai-phone/admin/login` | None |
| Admin Dashboard | `/store/{slug}/admin` | `/store/dubai-phone/admin` | JWT |
| Admin Items | `/store/{slug}/admin/items` | `/store/dubai-phone/admin/items` | JWT |
| Admin Invoices | `/store/{slug}/admin/invoices` | `/store/dubai-phone/admin/invoices` | JWT |
| Admin Settings | `/store/{slug}/admin/settings` | `/store/dubai-phone/admin/settings` | JWT + Owner |
| Admin Installments | `/store/{slug}/admin/installments` | `/store/dubai-phone/admin/installments` | JWT |
| SuperAdmin | `/superadmin` | `/superadmin` | JWT + Platform |

---

## Frontend Architecture

### TenantService (`tenant.service.ts`)

Central singleton that manages the current tenant slug:

```typescript
// Signals
slug(): string | null          // Current tenant slug
resolved(): boolean            // Whether slug has been set
storeUrl(): string             // '/store/{slug}' — computed
adminUrl(): string             // '/store/{slug}/admin' — computed

// Methods
setSlug(slug: string): void    // Set slug + emit
clear(): void                  // Clear slug
```

### Route Guard: `tenantResolverGuard`

- Runs on every `/store/:slug/**` route activation
- Extracts `:slug` from route params (walks parent chain)
- Validates slug format via `SLUG_PATTERN` regex
- Calls `tenantService.setSlug(slug)`
- Redirects to `/` on missing slug, `/tenant-not-found` on invalid

### Route Parameter Names

To avoid collision with the parent `:slug` param:

| Param | Used For | Example Route |
|-------|----------|---------------|
| `:slug` | Tenant slug (parent) | `/store/:slug` |
| `:catSlug` | Category slug | `/store/:slug/category/:catSlug` |
| `:brandSlug` | Brand slug | `/store/:slug/brand/:brandSlug` |
| `:itemSlug` | Item slug | `/store/:slug/item/:itemSlug` |
| `:typeSlug` | Item type slug | `/store/:slug/type/:typeSlug` |
| `:key` | Policy key | `/store/:slug/policies/:key` |

### RouterLink Pattern

All components use `TenantService` computed signals for links:

```html
<!-- Storefront links -->
<a [routerLink]="tenantService.storeUrl() + '/catalog'">Catalog</a>
<a [routerLink]="tenantService.storeUrl() + '/item/' + item.slug">View</a>

<!-- Admin links -->
<a [routerLink]="tenantService.adminUrl() + '/items'">Items</a>
<a [routerLink]="tenantService.adminUrl() + '/invoices'">Invoices</a>

<!-- Programmatic navigation -->
this.router.navigate([this.tenantService.adminUrl() + '/items']);
```

**Rule:** Never hardcode `/admin/...` or `/store/...` paths. Always use `tenantService.storeUrl()` or `tenantService.adminUrl()`.

### API Interceptor (`api.interceptor.ts`)

- Detects admin routes via regex: `/^\/store\/[^/]+\/admin/`
- Injects `Authorization: Bearer {token}` for admin routes
- Injects `X-Tenant-Slug: {slug}` header for all tenant-scoped API calls
- On 401 → redirect to `/store/{slug}/admin/login`
- On 403 → redirect to `/store/{slug}/admin/blocked`

---

## Backend Architecture

### Tenant Resolution Middleware

`TenantResolutionMiddleware` reads the `X-Tenant-Slug` HTTP header to resolve the current tenant.

**Exempt paths** (no tenant header required):
- `/api/v1/platform/*`
- `/api/v1/stores/*`
- `/api/v1/public/*` (uses slug from route/query)
- `/swagger/*`
- `/uploads/*`
- `/health`

### Public Slug Resolution Endpoint

```
GET /api/v1/public/resolve-slug/{slug}
```

Returns tenant info for a slug, supports `TenantSlugHistory` for renamed stores.

### API Endpoints by Area

| Area | Base Path | Tenant Header |
|------|-----------|---------------|
| Public | `/api/v1/public/{slug}/*` | Not required |
| Tenant Admin | `/api/v1/*` | `X-Tenant-Slug` required |
| Platform | `/api/v1/platform/*` | Not required |

---

## New Entities (This Release)

### InstallmentProvider
- Per-tenant installment financing providers (e.g., Tamara, Tabby)
- Fields: `Name`, `LogoUrl`, `Description`, `MinAmount`, `MaxAmount`, `IsActive`

### InstallmentPlan
- Plans under a provider for a specific item
- Fields: `Months`, `MonthlyAmount`, `DownPayment`, `InterestRate`, `IsActive`
- FK: `InstallmentProviderId`, `ItemId`

### TenantSlugHistory
- Tracks previous slugs when a tenant renames
- Fields: `OldSlug` (unique index), `ChangedAt`
- Used by `/resolve-slug/{slug}` to redirect old bookmarks

### Item Extensions
- `Specs` (JSON) — key-value specifications
- `WhatsInTheBox` (JSON) — box contents list

### StoreSettings Extensions
- `AboutTitle`, `AboutDescription`, `AboutImageUrl` — About page content

---

## Deployment Notes

### Vercel (Frontend)

The `vercel.json` rewrites must send all paths to `index.html` for Angular routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Backend (RunASP / Any Host)

No backend URL changes required. The frontend handles all path-based routing. The backend only sees the `X-Tenant-Slug` header.

### Environment URLs

| Environment | Frontend | Backend |
|-------------|----------|---------|
| Production | `https://mobilytics.vercel.app` | `https://mobilytics.runasp.net` |
| Development | `http://localhost:4200` | `http://localhost:5054` |

---

## Migration Checklist

When adding a new admin page:

1. Add route in `app.routes.ts` under the admin children
2. Import `TenantService` in your component
3. Inject: `readonly tenantService = inject(TenantService)`
4. Use `tenantService.adminUrl() + '/your-page'` for all routerLinks
5. Use `tenantService.storeUrl()` for links back to the storefront

When adding a new storefront page:

1. Add route in `app.routes.ts` under the storefront shell children
2. Import `TenantService` in your component
3. Use `tenantService.storeUrl() + '/your-page'` for all routerLinks
4. Route params use unique names (not `:slug`) to avoid collision
