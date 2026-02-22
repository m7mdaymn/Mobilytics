# Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Browser (PWA)                       │
│  ┌───────────────────────────────────────────────┐  │
│  │         Angular 19 SPA Application            │  │
│  │                                               │  │
│  │  ┌──────────┐ ┌───────────┐ ┌─────────────┐   │  │
│  │  │  Public   │ │   Admin   │ │  Platform   │   │  │
│  │  │Storefront │ │ Dashboard │ │ Super Admin │   │  │
│  │  └─────┬─────┘ └─────┬─────┘ └──────┬──────┘   │  │
│  │        │             │              │          │  │
│  │  ┌─────┴─────────────┴──────────────┴───────┐  │  │
│  │  │         Core Services Layer              │  │  │
│  │  │  TenantService  │ AuthService            │  │  │
│  │  │  ApiService     │ PlatformAuthService    │  │  │
│  │  │  ToastService   │ PlatformApiService     │  │  │
│  │  └─────────────────┬────────────────────────┘  │  │
│  │                    │  HTTP + Interceptor       │  │
│  │  ┌─────────────────┴────────────────────────┐  │  │
│  │  │  apiInterceptor                          │  │  │
│  │  │  (X-Tenant-Slug for tenant requests)     │  │  │
│  │  │  (No X-Tenant-Slug for platform requests)│  │  │
│  │  └─────────────────┬────────────────────────┘  │  │
│  └────────────────────┼────────────────────────┘  │  │
│                       │                           │
└───────────────────────┼───────────────────────────┘
                        │ HTTPS
┌───────────────────────┴───────────────────────────┐
│     ASP.NET Core .NET 9  (Nova Node API)          │
│     /api/v1/* (tenant)  │  /api/v1/platform/*     │
│     https://mobilytics.runasp.net                 │
└───────────────────────────────────────────────────┘
```

## Module Organization

The application follows a **feature-based** folder structure with three top-level modules:

### Core (`src/app/core/`)
Singleton services, models, guards, interceptors, and stores used across the entire app.

```
core/
├── models/         # TypeScript interfaces & DTOs
│   ├── api.models.ts       # ApiResponse<T>, PaginatedList<T>, ApiError
│   ├── auth.models.ts      # LoginRequest/Response, AuthUser, PermissionKey
│   ├── item.models.ts      # Item, Invoice, Brand, Category, Lead, etc.
│   ├── settings.models.ts  # StoreSettings, ThemeSettings, SocialLinks
│   └── platform.models.ts  # Tenant, Plan, Subscription, TenantFeatures
├── services/       # Injectable singleton services
│   ├── tenant.service.ts   # Subdomain resolution → slug signal
│   ├── api.service.ts      # HTTP wrapper with envelope unwrapping
│   ├── auth.service.ts     # JWT authentication (tenant), permission checking
│   ├── platform-auth.service.ts  # JWT authentication (platform super admin)
│   ├── platform-api.service.ts   # Platform API calls (tenants, plans, subs)
│   ├── toast.service.ts    # Notification queue (signals)
│   └── whatsapp.service.ts # WhatsApp deep links & follow-up
├── guards/         # Functional route guards
│   ├── auth.guard.ts       # Redirect unauthenticated to /admin/login
│   ├── platform-auth.guard.ts  # Redirect unauthenticated to /superadmin/login
│   └── permission.guard.ts # Factory for permission-based access
├── interceptors/
│   └── api.interceptor.ts  # X-Tenant-Slug, Bearer token, error handling
│                           # (Detects platform vs tenant requests)
└── stores/         # Signal-based state stores
    ├── settings.store.ts   # Loads & applies store settings + CSS vars
    └── compare.store.ts    # Compare list (max 2 items)
```

### Public (`src/app/public/`)
Customer-facing storefront pages and the shell layout.

```
public/
├── layouts/
│   └── storefront-shell.component.ts  # Header + footer + router-outlet
└── pages/
    ├── home/           # Dynamic homepage sections
    ├── catalog/        # Search, filter, sort, paginate items
    ├── category/       # Category items
    ├── brands/         # Brand grid + Brand detail
    ├── item-detail/    # Full item page with gallery + specs
    ├── compare/        # Side-by-side comparison (max 2)
    ├── policies/       # Store policies (returns, warranty, etc.)
    ├── inactive/       # Inactive tenant page
    └── tenant-not-found/  # Invalid tenant page
```

### Admin (`src/app/admin/`)
Owner/Manager/Employee dashboard with permission-gated access.

```
admin/
├── layout/
│   └── admin-layout.component.ts  # Sidebar + topbar + router-outlet
└── pages/
    ├── login/          # Email + password authentication
    ├── dashboard/      # KPI cards + charts
    ├── items/          # Items list + create/edit form
    ├── item-types/     # Item type CRUD
    ├── brands/         # Brand CRUD with logo upload
    ├── categories/     # Category hierarchy CRUD
    ├── home-sections/  # Homepage section builder
    ├── invoices/       # Invoice list + create + detail/refund
    ├── expenses/       # Expense + category CRUD + salary gen
    ├── employees/      # Employee CRUD + permission editor
    ├── leads/          # Lead list + status + WhatsApp follow-up
    ├── settings/       # Store settings (5 tabs)
    └── blocked/        # Access denied page
```

### Platform (`src/app/platform/`)
Super Admin dashboard for managing all tenants, plans, subscriptions, and features.

```
platform/
├── layout/
│   └── platform-layout.component.ts  # Dark sidebar + router-outlet
└── pages/
    ├── login/          # Platform admin authentication
    ├── dashboard/      # Platform-wide KPIs, revenue, recent tenants
    ├── tenants/        # Tenant list + create + detail (suspend/activate/delete)
    ├── plans/          # Plan CRUD with limits and features
    ├── subscriptions/  # Expiring subs, trial start, activation, renewal
    └── features/       # Per-tenant feature toggles
```

**Platform vs Admin Authentication:**

| Aspect | Admin (Tenant) | Platform (Super Admin) |
|--------|----------------|------------------------|
| Route base | `/admin/*` | `/superadmin/*` |
| Auth service | `AuthService` | `PlatformAuthService` |
| API base | `/api/v1/*` | `/api/v1/platform/*` |
| Token key | `mobilytics_token` | `mobilytics_platform_token` |
| Guard | `authGuard` | `platformAuthGuard` |
| Tenant header | `X-Tenant-Slug: <slug>` | Not sent |

### Shared (`src/app/shared/`)
Reusable UI components consumed by both public and admin areas.

```
shared/components/
├── item-card/          # Product card (image, price, badges, WhatsApp CTA)
├── item-gallery/       # Image gallery with lightbox
├── pagination/         # Paginator with page info
├── toast-container/    # Toast notification renderer
└── follow-up-modal/    # WhatsApp follow-up form modal
```

## Design Patterns

### Standalone Components
Every component is `standalone: true` — no NgModules. Dependencies are declared directly via `imports` array on each component.

### Functional Guards & Interceptors
Angular 19 functional APIs used throughout:
- `authGuard: CanActivateFn` — Checks `AuthService.isAuthenticated()`
- `permissionGuard('items.create'): CanActivateFn` — Factory function
- `apiInterceptor: HttpInterceptorFn` — Header injection + error routing

### Signal-Based State
All reactive state uses Angular Signals (`signal()`, `computed()`):
- `TenantService.slug` — Current tenant slug
- `AuthService.user` / `isAuthenticated` / `token` — Auth state
- `CompareStore.items` / `count` / `isFull` — Compare list
- `SettingsStore.settings` — Store settings
- `ToastService.toasts` — Notification queue

### Envelope Unwrapping
`ApiService` automatically unwraps the backend envelope `{ success, data, message, errors }`, returning only the `data` payload to consumers.

### Lazy Loading
Every route uses `loadComponent` for code splitting. The initial bundle is **~359 kB** with all feature pages loaded on demand.
