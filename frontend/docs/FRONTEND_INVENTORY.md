# Mobilytics Angular 19 Frontend — Comprehensive Source Inventory

> **Generated:** 2025-01-XX  
> **Scope:** Every `.ts` source file under `frontend/src/`  
> **Angular:** v19 — Standalone components, signal-based state, lazy-loaded routes  
> **Styling:** TailwindCSS + CSS custom properties  
> **i18n:** EN / AR bilingual with RTL  
> **Multi-tenancy:** Path-based (`/store/:slug/*`) with `X-Tenant-Slug` header

---

## Table of Contents

1. [Bootstrap & Configuration](#1-bootstrap--configuration)
2. [Core — Models](#2-core--models)
3. [Core — Services](#3-core--services)
4. [Core — Stores (Signal State)](#4-core--stores-signal-state)
5. [Core — Guards](#5-core--guards)
6. [Core — Interceptors](#6-core--interceptors)
7. [Core — Utilities](#7-core--utilities)
8. [Core — Environments](#8-core--environments)
9. [Public / Storefront Components](#9-public--storefront-components)
10. [Shared Components](#10-shared-components)
11. [Admin Components](#11-admin-components)
12. [Platform (Superadmin) Components](#12-platform-superadmin-components)
13. [Complete API Endpoint Map](#13-complete-api-endpoint-map)
14. [Statistics Summary](#14-statistics-summary)

---

## 1. Bootstrap & Configuration

### `main.ts` (7 lines)
Entry point. `bootstrapApplication(AppComponent, appConfig)`.

### `app.config.ts` (20 lines)
Providers:
- `provideZoneChangeDetection({ eventCoalescing: true })`
- `provideRouter(routes, withComponentInputBinding())`
- `provideHttpClient(withInterceptors([apiInterceptor]))`
- `provideServiceWorker('ngsw-worker.js')`

### `app.component.ts` (53 lines)
| | |
|---|---|
| **Selector** | `app-root` |
| **Template** | `<router-outlet/><app-toast-container/>` |
| **Injects** | `TenantService`, `SettingsStore`, `I18nService`, `Router` |
| **OnInit** | Initializes i18n; on `NavigationEnd` loads settings when tenant resolved; redirects to `/inactive` if store not active |

### `app.routes.ts` (~100 lines)
Full lazy-loaded route tree:

| Path | Guard(s) | Component |
|------|----------|-----------|
| `:slug` | `tenantResolver` | → child routes below |
| `:slug/` (default) | | `StorefrontShellComponent` → `HomeComponent` |
| `:slug/catalog` | | `CatalogComponent` |
| `:slug/item/:slug` | | `ItemDetailComponent` |
| `:slug/brands` | | `BrandsComponent` |
| `:slug/brand/:slug` | | `BrandDetailComponent` |
| `:slug/category/:slug` | | `CategoryComponent` |
| `:slug/compare` | | `CompareComponent` |
| `:slug/about` | | `AboutComponent` |
| `:slug/policies/:key` | | `PoliciesComponent` |
| `:slug/inactive` | | `InactiveComponent` |
| `:slug/admin/login` | | `LoginComponent` |
| `:slug/admin/**` | `authGuard` | `AdminLayoutComponent` → dashboard, items, invoices, expenses, employees, leads, settings, installments, approvals, brands, categories, item-types, blocked |
| `superadmin/login` | | `PlatformLoginComponent` |
| `superadmin/**` | `platformAuthGuard` | `PlatformLayoutComponent` → dashboard, tenants, tenants/create, tenants/:id, plans, subscriptions, store-requests, features |
| `` (empty) | | `LandingComponent` |
| `**` | | `TenantNotFoundComponent` |

---

## 2. Core — Models

### `api.models.ts` (53 lines)
| Type | Fields |
|------|--------|
| `ApiResponse<T>` | `success`, `data`, `message`, `errors` |
| `PaginatedList<T>` | `items`, `totalCount`, `pageNumber`, `pageSize`, `totalPages` |
| `PaginationParams` | `pageNumber`, `pageSize` |
| `ApiError` | `message`, `errors`, `statusCode` |

### `auth.models.ts` (44 lines)
| Type | Fields |
|------|--------|
| `LoginRequest` | `email`, `password` |
| `LoginResponse` | `token`, `user` |
| `AuthUser` | `id`, `name`, `email`, `role`, `tenantId`, `permissions` |
| `PermissionKey` | Union of 13 keys: `items.*`, `invoices.*`, `employees.*`, `expenses.*`, `leads.*`, `settings.*`, `reports.view` |
| `ALL_PERMISSIONS` | Array of all 13 permission keys |

### `item.models.ts` (333 lines)
60+ types including:

| Type | Purpose |
|------|---------|
| `Item` | 60+ fields: id, title, slug, price, status, type, brand, category, images, specs, installment plans, custom fields |
| `ItemCreateDto` / `ItemUpdateDto` | Create/update DTOs |
| `ItemQueryParams` | Search, filters, pagination, sort |
| `ItemType` | name, slug, isDevice, isStockItem, isVisibleInNav |
| `Brand` | name, slug, logoUrl, isVisibleInNav |
| `Category` | name, slug, parentId, sortOrder, isVisibleInNav |
| `Invoice` / `InvoiceLine` / `InvoiceCreateDto` | Invoice system types |
| `RefundDto` | amount, reason, lines |
| `ExpenseCategory` / `Expense` | Expense tracking |
| `Employee` | name, email, role, salary, permissions |
| `Lead` | name, phone, item, source, status, message |
| `DashboardData` | KPIs, charts, recent activity |
| `InstallmentProvider` / `InstallmentPlan` | Installment system |
| `CustomField` / `CustomFieldDefinition` | Dynamic field system |

### `navigation.models.ts` (39 lines)
| Type | Fields |
|------|--------|
| `Navigation` | `categories`, `brands`, `flags` |
| `NavItemType` | `name`, `slug`, `isVisibleInNav` |
| `NavCategory` | `name`, `slug`, `itemCount` |
| `NavBrand` | `name`, `slug`, `logoUrl` |
| `NavigationFlags` | `showBrands`, `showCategories` |

### `platform.models.ts` (297 lines)
| Type | Purpose |
|------|---------|
| `PlatformLoginRequest/Response` | Superadmin auth |
| `Tenant` | id, name, slug, status, owner, subscription, storeSettings, supportPhone, supportWhatsApp, address, mapUrl |
| `TenantOwner` | name, email, phone, whatsApp |
| `TenantSubscription` | planName, status, startDate, endDate, trialEndsAt, graceEndsAt |
| `TenantStoreSettings` | storeName, logoUrl, bannerUrl, whatsAppNumber, themePresetId, currencyCode, etc. |
| `Plan` | id, name, priceMonthly, activationFee, isActive, limits, features |
| `PlanLimits` | maxItems, maxEmployees, maxImages, maxStorageMB |
| `PlanFeatures` / `TenantFeatures` | canRemovePoweredBy, advancedReports, customDomain, apiAccess, prioritySupport |
| `PlatformDashboard` | totalTenants, activeTenants, trialTenants, suspendedTenants, expiredTenants, expiringCount, monthlyRevenue, totalRevenue, revenueByMonth, recentTenants, recentInvoices, tenantRevenueBreakdown |
| `OnboardTenantRequest` | storeName, slug, ownerName/Email/Password, planId, durationMonths, isTrial, payment fields |
| `OnboardTenantResponse` | tenant, invoice |
| `PlatformInvoice` | invoiceNumber, invoiceType, months, total, activationFee, subscriptionAmount, discount, paymentMethod, paymentStatus |
| `StoreRequest` | storeName, ownerName, email, phone, category, location, numberOfStores, monthlyRevenue, source, status, submittedAt |
| `ExpiringSubscription` | tenantId, tenantName, tenantSlug, planName, endDate, daysRemaining |
| Various request DTOs | `StartTrialRequest`, `ActivateSubscriptionRequest`, `RenewSubscriptionRequest`, `UpdateStoreSettingsRequest`, `CreatePlanFormData` |

### `settings.models.ts` (100 lines)
| Type | Purpose |
|------|---------|
| `StoreSettings` | storeName, logoUrl, whatsAppNumber, themePresetId, currencyCode, footerAddress, workingHours, socialLinksJson, policiesJson, heroSlides, storeActive, etc. |
| `AdminStoreSettings` | Extended settings for admin editing |
| `SocialLinks` | facebook, instagram, tiktok, twitter |
| `PwaSettings` | name, shortName, themeColor, bgColor |
| `WhatsAppTemplates` | greeting, followUp, itemInquiry |
| `ThemePreset` | id, name, primary, secondary, accent, hero, headerBg |
| `THEME_PRESETS` | 6 presets: Midnight Pro, Ocean Blue, Forest Green, Royal Purple, Sunset Orange, Slate Minimal |

---

## 3. Core — Services

### `api.service.ts` (75 lines)
Generic HTTP wrapper. All methods unwrap `ApiResponse<T>` envelope.

| Method | Signature |
|--------|-----------|
| `get<T>` | `GET {baseUrl}/api/v1/{path}` → `T` |
| `post<T>` | `POST {baseUrl}/api/v1/{path}` → `T` |
| `put<T>` | `PUT {baseUrl}/api/v1/{path}` → `T` |
| `patch<T>` | `PATCH {baseUrl}/api/v1/{path}` → `T` |
| `delete<T>` | `DELETE {baseUrl}/api/v1/{path}` → `T` |
| `upload<T>` | `POST {baseUrl}/api/v1/{path}` (FormData) → `T` |

**Base URLs:**
- Dev: `http://localhost:5054/api/v1`
- Prod: `https://mobilytics.runasp.net/api/v1`

### `auth.service.ts` (113 lines)
| Method | API Call | Details |
|--------|----------|---------|
| `login(req)` | `POST /Auth/login` | Stores token in `sessionStorage['mobilytics_token']`, decodes JWT |
| `logout()` | — | Clears token, navigates to admin login |
| `hasPermission(...keys)` | — | Checks decoded user permissions |
| `restoreSession()` | — | Restores from sessionStorage |
| `isAuthenticated()` | — | Boolean signal |

### `platform-auth.service.ts` (100 lines)
| Method | API Call | Details |
|--------|----------|---------|
| `login(req)` | `POST /platform/auth/login` | Token in `sessionStorage['mobilytics_platform_token']` |
| `logout()` | — | Clears token, navigates to `/superadmin/login` |
| `isAuthenticated()` | — | Boolean signal |

### `tenant.service.ts` (50 lines)
| Signal/Method | Purpose |
|---------------|---------|
| `_slug` | Writable signal for current tenant slug |
| `_isValid` | Writable signal for validity |
| `resolved` | Computed: `!!slug && isValid` |
| `storeUrl` | Computed: `/{slug}` |
| `adminUrl` | Computed: `/{slug}/admin` |
| `setSlug(slug)` | Sets slug + validates |

### `i18n.service.ts` (321 lines)
| Method | Purpose |
|--------|---------|
| `t(key)` | Translate key to current locale string |
| `toggle()` | Switch EN ↔ AR, sets `dir` attribute + `document.dir` |
| `currentLang` | Signal: `'en'` or `'ar'` |
| `isRTL` | Computed boolean |

~200+ translation keys covering: nav, home, catalog, item detail, about, footer, admin, dashboard, leads, invoices, settings, installments, policies, etc.

### `toast.service.ts` (47 lines)
| Method | Purpose |
|--------|---------|
| `success(msg)` | Green toast |
| `error(msg)` | Red toast |
| `warning(msg)` | Amber toast |
| `info(msg)` | Blue toast |
| Auto-remove after 4s | |

### `whatsapp.service.ts` (68 lines)
| Method | API Call |
|--------|----------|
| `sendClick(itemId)` | `POST /Public/whatsapp-click` |
| `sendFollowUp(data)` | `POST /Public/follow-up` |
| Opens `wa.me` link with pre-filled message | |

### `pwa-install.service.ts` (55 lines)
| Method | Purpose |
|--------|---------|
| `canInstall` | Signal boolean |
| `promptInstall()` | Triggers `beforeinstallprompt` event |

### `platform-api.service.ts` (190 lines)
Direct HttpClient (bypasses `ApiService`). Bearer token from `mobilytics_platform_token`.

| Method | HTTP | Path |
|--------|------|------|
| `getDashboard(range?)` | GET | `/platform/dashboard?range={range}` |
| `getTenants()` | GET | `/platform/tenants` |
| `getTenant(id)` | GET | `/platform/tenants/{id}` |
| `onboardTenant(req)` | POST | `/platform/tenants` |
| `suspendTenant(id)` | POST | `/platform/tenants/{id}/suspend` |
| `activateTenant(id)` | POST | `/platform/tenants/{id}/activate` |
| `deleteTenant(id)` | DELETE | `/platform/tenants/{id}` |
| `getPlans()` | GET | `/platform/plans` |
| `createPlan(data)` | POST | `/platform/plans` |
| `updatePlan(id, data)` | PUT | `/platform/plans/{id}` |
| `deletePlan(id)` | DELETE | `/platform/plans/{id}` |
| `startTrial(tenantId, req)` | POST | `/platform/tenants/{id}/subscriptions/trial` |
| `activateSubscription(tenantId, req)` | POST | `/platform/tenants/{id}/subscriptions/activate` |
| `renewSubscription(tenantId, req)` | POST | `/platform/tenants/{id}/subscriptions/renew` |
| `updateSubscription(tenantId, req)` | PUT | `/platform/tenants/{id}/subscriptions` |
| `deleteSubscription(tenantId)` | DELETE | `/platform/tenants/{id}/subscriptions` |
| `getInvoices(tenantId)` | GET | `/platform/tenants/{id}/invoices` |
| `deleteInvoice(invoiceId)` | DELETE | `/platform/invoices/{id}` |
| `getExpiringSubscriptions(days)` | GET | `/platform/subscriptions/expiring?days={days}` |
| `getStoreRequests()` | GET | `/platform/store-requests` |
| `updateStoreRequestStatus(id, req)` | PUT | `/platform/store-requests/{id}/status` |
| `updateStoreSettings(tenantId, req)` | PUT | `/platform/tenants/{id}/store-settings` |
| `getTenantFeatures(tenantId)` | GET | `/platform/tenants/{id}/features` |
| `updateTenantFeatures(tenantId, req)` | PUT | `/platform/tenants/{id}/features` |

---

## 4. Core — Stores (Signal State)

### `compare.store.ts` (42 lines)
| Signal/Method | Purpose |
|---------------|---------|
| `items` | Signal: `Item[]` (max 2) |
| `count` | Computed: `items.length` |
| `isFull` | Computed: `count >= 2` |
| `has(id)` | Check if item in compare list |
| `toggle(item)` | Add or remove item |
| `clear()` | Empty the list |

### `settings.store.ts` (170 lines)
| Signal/Method | API Call | Purpose |
|---------------|----------|---------|
| `settings` | `GET /Public/settings` | Raw settings object |
| `loaded` | — | Boolean signal |
| `storeName` | — | Computed from settings |
| `logoUrl` | — | Computed |
| `whatsAppNumber` | — | Computed |
| `currencyCode` | — | Computed (default `'EGP'`) |
| `heroSlides` | — | Computed array |
| `socialLinks` | — | Parsed from JSON |
| `pwaSettings` | — | Parsed from JSON |
| `whatsAppTemplates` | — | Parsed from JSON |
| `storeActive` | — | Computed boolean |
| `policiesJson` | — | Computed |
| `footerAddress` | — | Computed |
| `workingHours` | — | Computed |
| `mapUrl` | — | Computed |
| `themePreset` | — | Computed from `THEME_PRESETS` |
| `applyTheme()` | — | Sets `--color-primary/secondary/accent` CSS vars + updates PWA manifest |
| `load()` | GET | Fetches settings, applies theme |

---

## 5. Core — Guards

### `auth.guard.ts`
Checks `authService.isAuthenticated()`. Redirect → `/{slug}/admin/login`.

### `permission.guard.ts`
Factory: `permissionGuard(...keys: PermissionKey[])`. Checks auth + specific permissions. Redirect → admin login.

### `platform-auth.guard.ts`
Checks `platformAuthService.isAuthenticated()`. Redirect → `/superadmin/login`.

### `tenant-resolver.guard.ts`
Extracts `:slug` from URL, calls `tenantService.setSlug(slug)`. If slug invalid → redirect to `/not-found`.

---

## 6. Core — Interceptors

### `api.interceptor.ts` (107 lines)
Functional interceptor (`HttpInterceptorFn`).

| URL Pattern | Headers Added |
|-------------|---------------|
| `/platform/` | `Authorization: Bearer {platform_token}` (no `X-Tenant-Slug`) |
| Everything else | `X-Tenant-Slug: {slug}` + `Authorization: Bearer {token}` (if present) |

| Status Code | Behavior |
|-------------|----------|
| 400 | Throw `ApiError` with validation errors |
| 401 | Logout + redirect to login |
| 403 | Navigate to `/{slug}/admin/blocked` |
| 404 | Throw `ApiError` |
| 500 | Toast error |

---

## 7. Core — Utilities

### `image.utils.ts` (25 lines)
| Function | Purpose |
|----------|---------|
| `resolveImageUrl(url)` | Returns placeholder for null; prepends `apiBaseUrl` for `/uploads/*` paths |

---

## 8. Core — Environments

### `environment.ts` (dev)
```ts
apiBaseUrl: 'http://localhost:5054'
appDomain: 'localhost:4200'
production: false
```

### `environment.prod.ts`
```ts
apiBaseUrl: 'https://mobilytics.runasp.net'
appDomain: 'mobilytics.vercel.app'
production: true
```

---

## 9. Public / Storefront Components

### `storefront-shell.component.ts` (~455 lines)
| | |
|---|---|
| **Selector** | `app-storefront-shell` |
| **Layout** | 3-row header (top bar, logo/search, mega menu) + `<router-outlet/>` + footer + WhatsApp floating CTA |
| **Injects** | `ApiService`, `TenantService`, `SettingsStore`, `CompareStore`, `I18nService`, `Router` |
| **Signals** | `navigation`, `menuOpen`, `mobileMenuOpen`, `searchQuery`, `searchResults`, `searching` |
| **API** | `GET /Public/navigation` |
| **Key features** | Mega menu (categories + brands), mobile drawer menu, live search with debounce, compare badge, language toggle, PWA install button |

### `landing.component.ts` (~137 lines)
| | |
|---|---|
| **Selector** | `app-landing` |
| **Template** | External HTML file (`landing.component.html`) |
| **Injects** | `ApiService`, `Router` |
| **API** | `GET /Public/tenants` (lists all tenants), `POST /platform/tenants` (registration form) |
| **Purpose** | Platform landing page showing existing stores + new store registration form |

### `home.component.ts` (~500 lines)
| | |
|---|---|
| **Selector** | `app-home` |
| **Injects** | `ApiService`, `SettingsStore`, `TenantService`, `I18nService`, `PwaInstallService` |
| **Signals** | `featuredItems`, `bestSellers`, `installmentItems`, `categories`, `brands`, `loading` |
| **API** | `GET /Public/items?isFeatured=true`, `GET /Public/items/best-sellers`, `GET /Public/items?installmentAvailable=true`, `GET /Public/categories`, `GET /Public/brands` |
| **Sections** | Hero slider (swipe-enabled), categories grid, featured items carousel, best sellers, installments section, brands grid, testimonials, PWA install banner |

### `catalog.component.ts` (~500 lines)
| | |
|---|---|
| **Selector** | `app-catalog` |
| **Injects** | `ApiService`, `TenantService`, `SettingsStore`, `I18nService`, `ActivatedRoute` |
| **API** | `GET /Public/items` with full `ItemQueryParams` |
| **Features** | Filter sidebar (categories, brands, item types, price range, status), search with debounce (300ms), sort options (newest/price-asc/price-desc/name), pagination, grid/list view toggle |

### `item-detail.component.ts` (~500 lines)
| | |
|---|---|
| **Selector** | `app-item-detail` |
| **Injects** | `ApiService`, `SettingsStore`, `CompareStore`, `TenantService`, `WhatsAppService`, `I18nService`, `ActivatedRoute` |
| **API** | `GET /Public/items/{slug}` |
| **Sections** | Image gallery with thumbnails + lightbox, specs table, checklist items, custom fields display, WhatsApp inquiry CTA, compare toggle, installment plans accordion/modal, related items |

### `brands.component.ts` (55 lines)
| | |
|---|---|
| **Selector** | `app-brands` |
| **API** | `GET /Brands` |
| **Template** | Grid of brand cards with logo + name, links to brand detail |

### `brand-detail.component.ts` (65 lines)
| | |
|---|---|
| **Selector** | `app-brand-detail` |
| **API** | `GET /Public/items?brandSlug={slug}` |
| **Template** | Brand header + item cards grid |

### `category.component.ts` (60 lines)
| | |
|---|---|
| **Selector** | `app-category` |
| **API** | `GET /Public/items?categorySlug={slug}` |
| **Template** | Category header + item cards grid |

### `compare.component.ts` (120 lines)
| | |
|---|---|
| **Selector** | `app-compare` |
| **Injects** | `CompareStore`, `I18nService` |
| **Template** | Side-by-side comparison (max 2 items), desktop=grid layout / mobile=stacked cards, spec-by-spec rows |

### `about.component.ts` (100 lines)
| | |
|---|---|
| **Selector** | `app-about` |
| **Injects** | `SettingsStore`, `I18nService` |
| **Template** | Store info, working hours, address, social links, map embed — all from SettingsStore |

### `policies.component.ts` (35 lines)
| | |
|---|---|
| **Selector** | `app-policies` |
| **Injects** | `SettingsStore`, `ActivatedRoute` |
| **Template** | Renders policy content by `:key` route param from `settings.policiesJson` |

### `inactive.component.ts` (25 lines)
| | |
|---|---|
| **Selector** | `app-inactive` |
| **Template** | "Store Currently Inactive" static page |

### `tenant-not-found.component.ts` (20 lines)
| | |
|---|---|
| **Selector** | `app-tenant-not-found` |
| **Template** | "Store Not Found" static page |

---

## 10. Shared Components

### `item-card.component.ts` (200 lines)
| | |
|---|---|
| **Selector** | `app-item-card` |
| **Inputs** | `item: Item` |
| **Injects** | `CompareStore`, `SettingsStore`, `TenantService`, `WhatsAppService`, `I18nService` |
| **Features** | Product card with: image + status/featured badges, title, brand/type, specs preview, price (with original price strike-through), WhatsApp inquiry button, compare toggle button |

### `item-gallery.component.ts` (115 lines)
| | |
|---|---|
| **Selector** | `app-item-gallery` |
| **Inputs** | `images: string[]` |
| **Features** | Thumbnail strip, main image display, lightbox overlay with prev/next navigation |

### `follow-up-modal.component.ts` (100 lines)
| | |
|---|---|
| **Selector** | `app-follow-up-modal` |
| **Inputs** | `item: Item` |
| **Outputs** | `closed: EventEmitter` |
| **Injects** | `WhatsAppService` |
| **Features** | Phone + name + message form → calls `whatsappService.sendFollowUp()` |

### `pagination.component.ts` (80 lines)
| | |
|---|---|
| **Selector** | `app-pagination` |
| **Inputs** | `currentPage`, `totalPages` |
| **Outputs** | `pageChange: EventEmitter<number>` |
| **Features** | Smart page range with ellipsis, prev/next buttons |

### `toast-container.component.ts` (45 lines)
| | |
|---|---|
| **Selector** | `app-toast-container` |
| **Injects** | `ToastService` |
| **Features** | Fixed-position overlay, slide-in toasts by type (success/error/warning/info) |

### `theme-switcher.component.ts` (105 lines)
| | |
|---|---|
| **Selector** | `app-theme-switcher` |
| **Injects** | `SettingsStore`, `ApiService` |
| **API** | `PUT /Settings/theme` |
| **Features** | Grid of 6 theme preset cards with color preview, click to apply + save |

---

## 11. Admin Components

### `admin-layout.component.ts` (160 lines)
| | |
|---|---|
| **Selector** | `app-admin-layout` |
| **Template** | Sidebar + top bar + `<router-outlet/>` |
| **Injects** | `AuthService`, `SettingsStore`, `TenantService`, `I18nService` |
| **Nav items** (permission-gated) | Dashboard (`reports.view`), Items (`items.view`), Item Types (`items.view`), Brands (`items.view`), Categories (`items.view`), Invoices (`invoices.view`), Expenses (`expenses.view`), Employees (`employees.view`), Leads (`leads.view`), Installments (`settings.edit`), Settings (`settings.edit`), Store Approvals (no guard — hidden unless needed) |

### `login.component.ts` (103 lines)
| | |
|---|---|
| **Selector** | `app-login` |
| **API** | `POST /Auth/login` → redirect to admin dashboard |
| **Injects** | `AuthService`, `TenantService`, `Router`, `I18nService` |

### `dashboard.component.ts` (~310 lines)
| | |
|---|---|
| **Selector** | `app-dashboard` |
| **API** | `GET /Reports/dashboard?from={date}&to={date}` |
| **Injects** | `ApiService`, `SettingsStore`, `I18nService` |
| **Sections** | 8 KPI cards (total sales, revenue, items, leads, pending invoices, expenses, employees, brands), sales/leads bar charts (last 6 months), recent invoices table, top item types, operational alerts panel |
| **Signals** | `data`, `loading`, `range`, `dateFrom`, `dateTo` |

### `items-list.component.ts` (~175 lines)
| | |
|---|---|
| **Selector** | `app-items-list` |
| **API** | `GET /Items?pageSize=50&search=...&status=...`, `PATCH /Items/{id}/status`, `DELETE /Items/{id}` |
| **Injects** | `ApiService`, `AuthService`, `TenantService`, `I18nService` |
| **Features** | Table with image/title/type/price/status dropdown/qty/date, search+status filters, permission-gated create/edit/delete |

### `item-form.component.ts` (~465 lines)
| | |
|---|---|
| **Selector** | `app-item-form` |
| **API** | `GET /ItemTypes`, `GET /Brands`, `GET /Categories`, `GET /CustomFields`, `GET /Items/{id}` (edit), `POST /Items`, `PUT /Items/{id}`, `POST /Items/{id}/images` |
| **Injects** | `ApiService`, `TenantService`, `ActivatedRoute`, `Router`, `I18nService` |
| **Features** | 3-step wizard (Basic → Pricing → Details), create + edit mode, device-aware fields (IMEI, battery, storage, RAM, warranty), custom fields support (Text/Number/Boolean/Select), image upload (main + gallery up to 5), auto-slug generation |

### `item-types.component.ts` (~135 lines)
| | |
|---|---|
| **Selector** | `app-item-types` |
| **API** | `GET /ItemTypes`, `POST /ItemTypes`, `PUT /ItemTypes/{id}`, `DELETE /ItemTypes/{id}` |
| **Features** | CRUD table with inline modal form. Fields: name, slug, isDevice, isStockItem, isVisibleInNav |

### `admin-brands.component.ts` (~130 lines)
| | |
|---|---|
| **Selector** | `app-admin-brands` |
| **API** | `GET /Brands`, `POST /Brands`, `PUT /Brands/{id}`, `DELETE /Brands/{id}` |
| **Features** | Grid of brand cards with logo. Fields: name, slug, logoUrl, isVisibleInNav |

### `admin-categories.component.ts` (~175 lines)
| | |
|---|---|
| **Selector** | `app-admin-categories` |
| **API** | `GET /Categories`, `POST /Categories`, `PUT /Categories/{id}`, `DELETE /Categories/{id}` |
| **Features** | Hierarchical table (parent-child with `└` prefix). Fields: name, slug, parentId, sortOrder, isVisibleInNav. `sortedCategories()` computed for parent-child ordering |

### `invoices-list.component.ts` (~150 lines)
| | |
|---|---|
| **Selector** | `app-invoices-list` |
| **API** | `GET /Invoices?pageNumber=...&pageSize=...&dateFrom=...&dateTo=...&status=...` |
| **Features** | Table (number, date, customer, total, status badge, payment method), date range + status filters, summary cards (count, total revenue), pagination |

### `invoice-form.component.ts` (~190 lines)
| | |
|---|---|
| **Selector** | `app-invoice-form` |
| **API** | `GET /Items?search=...&status=Available` (item search), `POST /Invoices` |
| **Features** | Customer info + debounced item search + line items table + discount + totals. Payment methods: Cash, Card, BankTransfer, MobileMoney, Mixed |

### `invoice-detail.component.ts` (~190 lines)
| | |
|---|---|
| **Selector** | `app-invoice-detail` |
| **API** | `GET /Invoices/{id}`, `POST /Invoices/{id}/refund` |
| **Features** | Display: status badge, date, payment, customer, line items table with subtotal/discount/tax/total. Refund section (permission-gated: `invoices.refund`) |

### `expenses.component.ts` (~305 lines)
| | |
|---|---|
| **Selector** | `app-expenses` |
| **API** | `GET /Expenses/categories`, `POST /Expenses/categories`, `DELETE /Expenses/categories/{id}`, `GET /Expenses?page=...&from=...&to=...&categoryId=...`, `POST /Expenses`, `PUT /Expenses/{id}`, `DELETE /Expenses/{id}`, `POST /Employees/generate-salary-expenses` |
| **Features** | Category manager (add/delete inline), expense form (category, amount, date, title, notes), salary generation (month picker), date+category filters, summary card, paginated table |

### `employees.component.ts` (~260 lines)
| | |
|---|---|
| **Selector** | `app-employees` |
| **API** | `GET /Employees`, `POST /Employees`, `PUT /Employees/{id}`, `DELETE /Employees/{id}`, `PUT /Employees/{id}/permissions` |
| **Features** | Table (name, email, role badge, salary, permission count), form (name, email, phone, role Manager/Employee, salary, password for create), full 13-key permissions grid, two-step save: employee data + permissions |

### `leads.component.ts` (~165 lines)
| | |
|---|---|
| **Selector** | `app-leads` |
| **API** | `GET /Leads?pageNumber=...&status=...&source=...`, `PATCH /Leads/{id}/status`, `GET /Leads/{id}/follow-up-link` |
| **Features** | Table (name, phone, item, message, source badge, status dropdown, date), WhatsApp follow-up button, filters (search, status, source), pagination |

### `admin-settings.component.ts` (~370 lines)
| | |
|---|---|
| **Selector** | `app-admin-settings` |
| **API** | `GET /Settings`, `PUT /Settings`, `PUT /Settings/theme`, `PUT /Settings/footer`, `PUT /Settings/whatsapp`, `PUT /Settings/pwa` |
| **Features** | 5-tab interface: Store Info (name, logo, banner, phone, WhatsApp, currency, working hours, hero slides JSON), Theme (preset selector + custom color overrides), Footer (address, map, social links JSON), WhatsApp (templates JSON), PWA (name, shortName, themeColor, bgColor). Reloads SettingsStore after each save |

### `installments.component.ts` (~380 lines)
| | |
|---|---|
| **Selector** | `app-installments` |
| **API** | `GET /Installments/providers`, `POST /Installments/providers`, `PUT /Installments/providers/{id}`, `DELETE /Installments/providers/{id}`, `GET /Installments/plans`, `POST /Installments/plans`, `PUT /Installments/plans/{id}`, `DELETE /Installments/plans/{id}` |
| **Features** | Provider management (name, type Banks/BNPL, logo, active, displayOrder) in modal form. Plan management (provider, months, monthlyPayment, downPayment, adminFees, totalAmount, notes, active) in modal form. Both with full CRUD |

### `store-approvals.component.ts` (445 lines)
| | |
|---|---|
| **Selector** | `app-store-approvals` |
| **API** | `GET /api/v1.0/stores`, `GET /api/v1.0/stores/pending`, `POST /api/v1.0/stores/{id}/approve`, `POST /api/v1.0/stores/{id}/reject`, `POST /api/v1.0/stores/{id}/hold` |
| **Features** | Tabbed view (Pending/Approved/Rejected), registration cards with store details + owner info + metrics, approve/reject/hold modals with notes |
| **Note** | Uses different API path pattern (`/api/v1.0/stores` vs standard `/api/v1`) — possible version discrepancy |

### `blocked.component.ts` (~40 lines)
| | |
|---|---|
| **Selector** | `app-blocked` |
| **Template** | Static "Access Denied — Your account doesn't have permission" page with back-to-dashboard + sign-out links |

### `home-sections.component.ts` (~15 lines)
**DEPRECATED** stub. Comment: "home page now uses a fixed premium layout."

---

## 12. Platform (Superadmin) Components

### `platform-layout.component.ts` (~145 lines)
| | |
|---|---|
| **Selector** | `app-platform-layout` |
| **Template** | Black sidebar + white content area + `<router-outlet/>` |
| **Injects** | `PlatformAuthService`, `I18nService` |
| **Nav items** | Dashboard (📊), Tenants (🏢), Plans (💎), Subscriptions (📋), Store Requests, Features |
| **Features** | Mobile-responsive with overlay, user section (name/email/logout), top bar with language toggle + "Create Tenant" quick action |

### `platform-login.component.ts` (~110 lines)
| | |
|---|---|
| **Selector** | `app-platform-login` |
| **API** | `POST /platform/auth/login` |
| **Injects** | `PlatformAuthService`, `Router`, `I18nService` |
| **Features** | Black background, centered card, email/password form, error display, language toggle |

### `platform-dashboard.component.ts` (~700 lines)
| | |
|---|---|
| **Selector** | `app-platform-dashboard` |
| **API** | `GET /platform/dashboard?range={7d|30d|1y}` |
| **Injects** | `PlatformApiService`, `I18nService` |
| **Signals** | `data`, `loading`, `range` |
| **Computed** | `maxRevenue`, `avgRevenuePerTenant`, `activePct`, `peakMonth`, `donutGradient`, `statCards`, `breakdownTotalFees/Subscription/Discount/GrandTotal/Months/Invoices` |
| **Sections** | Revenue hero banner (monthly + total + avg/tenant), tenant donut chart (conic-gradient: active/trial/suspended/expired), 5 KPI stat cards, revenue bar chart (6 months + peak highlight), quick actions panel (4 buttons), expiring-soon alert, recent invoices table, tenant revenue breakdown table (per-tenant with totals row), recent tenants list, footer stats bar |

### `tenants-list.component.ts` (~190 lines)
| | |
|---|---|
| **Selector** | `app-tenants-list` |
| **API** | `getTenants()` → `GET /platform/tenants`, `suspendTenant(id)` → `POST /platform/tenants/{id}/suspend`, `activateTenant(id)` → `POST /platform/tenants/{id}/activate` |
| **Injects** | `PlatformApiService`, `ToastService` |
| **Signals** | `tenants`, `loading` |
| **Features** | Table (tenant name+email, slug, status badge, subscription status+plan, created date, view/suspend/activate actions), search by name/slug, status filter (Active/Suspended/Pending), "Create Tenant" link |

### `tenant-create.component.ts` (~758 lines)
| | |
|---|---|
| **Selector** | `app-tenant-create` |
| **API** | `getPlans()` → `GET /platform/plans`, `onboardTenant(req)` → `POST /platform/tenants` |
| **Injects** | `PlatformApiService`, `ToastService`, `Router` |
| **Signals** | `step` (1-4), `saving`, `error`, `result`, `plans`, `loadingPlans` |
| **Features** | 4-step wizard: **Step 1** Store Info (name, slug, phone, WhatsApp, address, logoUrl, mapUrl, social links), **Step 2** Owner Info (name, email, phone, WhatsApp, password + confirm), **Step 3** Plan & Payment (plan card selection, duration months, trial toggle, activation fee, subscription amount with auto-calc, discount, payment method Cash/Instapay/BankTransfer/Other, notes, total summary), **Step 4** Review & Confirm. Post-creation summary: store/owner/subscription/invoice detail cards, access URLs, action buttons (print invoice PDF, send invoice WhatsApp, send credentials WhatsApp, onboard another, view all tenants). Includes `printInvoice()` generating full HTML invoice for browser print and WhatsApp sharing methods |

### `tenant-detail.component.ts` (~692 lines)
| | |
|---|---|
| **Selector** | `app-tenant-detail` |
| **API** | `getTenant(id)`, `getInvoices(tenantId)`, `updateStoreSettings(id, req)`, `suspendTenant(id)`, `activateTenant(id)`, `deleteTenant(id)`, `updateSubscription(id, req)`, `deleteSubscription(id)`, `deleteInvoice(id)` |
| **Injects** | `PlatformApiService`, `ToastService`, `ActivatedRoute`, `Router` |
| **Signals** | `tenant`, `loading`, `editingSettings`, `savingSettings`, `settingsError`, `invoices`, `loadingInvoices`, `editingSubscription` |
| **Sections** | Header card (logo/name/slug/status + suspend/activate), basic info card, owner info card, subscription card (view + edit months + delete), **store settings editor** (full editable form: storeName, logo, banner, WhatsApp, phone, currency, theme preset, working hours, footerAddress, mapUrl, socialLinksJson, policiesJson), access URLs (store front + admin panel + future subdomain), invoices section (expandable with print PDF + WhatsApp + delete per invoice), quick actions (send credentials WhatsApp), danger zone (delete tenant with double-confirm) |

### `plans.component.ts` (~340 lines)
| | |
|---|---|
| **Selector** | `app-plans` |
| **API** | `getPlans()`, `createPlan(data)`, `updatePlan(id, data)`, `deletePlan(id)` |
| **Injects** | `PlatformApiService`, `ToastService` |
| **Signals** | `plans`, `loading`, `showForm`, `saving`, `editId` |
| **Features** | Plan grid cards (name, active/inactive badge, free badge, price, activation fee, annual price calc, limits display, features checkmarks). Modal form: name, monthly price, activation fee, limits (maxItems, maxEmployees, maxImages, maxStorageMB), features (canRemovePoweredBy, advancedReports, customDomain, apiAccess, prioritySupport). Sort: active first, then by price |

### `subscriptions.component.ts` (~500 lines)
| | |
|---|---|
| **Selector** | `app-subscriptions` |
| **API** | `getTenants()`, `getPlans()`, `getExpiringSubscriptions(days)`, `getTenant(id)`, `startTrial(tenantId, req)`, `activateSubscription(tenantId, req)`, `renewSubscription(tenantId, req)` |
| **Injects** | `PlatformApiService`, `ToastService`, `ActivatedRoute` |
| **Signals** | `tenants`, `plans`, `expiring`, `selectedTenant`, `processing`, `activeTab` |
| **Features** | Tenant selector dropdown (with query param pre-selection), expiring subscriptions alert panel (configurable days, clickable cards), current subscription status display (plan/status/dates). 3 action tabs: **Trial** (plan selector → start trial), **Activate** (plan card grid, duration months, payment amount with auto-calc + override, notes, summary → activate), **Renew** (months, payment amount auto-calc, notes → renew). Auto-detects best tab based on subscription status |

### `store-requests.component.ts` (~400 lines)
| | |
|---|---|
| **Selector** | `app-store-requests` |
| **API** | `getStoreRequests()`, `updateStoreRequestStatus(id, req)` |
| **Injects** | `PlatformApiService`, `ToastService` |
| **Signals** | `allRequests`, `filteredRequests`, `loading`, `selected`, `actionReq` |
| **Features** | Stats bar (total/pending/approved/rejected — clickable to filter), table (store name+category+location, owner+email, phone+stores+source, status badge, submitted date, approve/reject/hold actions), action modal (notes/rejection reason), detail drawer (slide-in from right: store info, owner info, timeline, notes, approve/reject actions, WhatsApp/call buttons), search by name/email/phone, status filter |

### `features.component.ts` (~220 lines)
| | |
|---|---|
| **Selector** | `app-features` |
| **API** | `getTenants()`, `getPlans()`, `getTenant(id)`, `getTenantFeatures(tenantId)`, `updateTenantFeatures(tenantId, req)` |
| **Injects** | `PlatformApiService`, `ToastService` |
| **Signals** | `tenants`, `selectedTenant`, `features`, `originalFeatures`, `planFeatures`, `plans`, `loading`, `saving` |
| **Features** | Tenant selector, current plan display, 5 feature toggles with custom toggle buttons (canRemovePoweredBy, advancedReports, customDomain, apiAccess, prioritySupport), "OVERRIDDEN" badge when differs from plan default, plan default indicator, reset to plan defaults button, dirty detection, save |

---

## 13. Complete API Endpoint Map

### Public (Storefront) — via `ApiService`
| Verb | Path | Used By |
|------|------|---------|
| GET | `/Public/navigation` | StorefrontShell |
| GET | `/Public/settings` | SettingsStore |
| GET | `/Public/items` (+query params) | Home, Catalog, BrandDetail, Category |
| GET | `/Public/items/best-sellers` | Home |
| GET | `/Public/items/{slug}` | ItemDetail |
| GET | `/Public/categories` | Home |
| GET | `/Public/brands` | Home |
| GET | `/Public/tenants` | Landing |
| GET | `/Brands` | Brands page |
| POST | `/Public/whatsapp-click` | WhatsAppService |
| POST | `/Public/follow-up` | WhatsAppService |

### Auth — via `ApiService`
| Verb | Path | Used By |
|------|------|---------|
| POST | `/Auth/login` | AuthService |

### Admin — via `ApiService`
| Verb | Path | Used By |
|------|------|---------|
| GET | `/Reports/dashboard` | Dashboard |
| GET | `/Items` | ItemsList, InvoiceForm |
| GET | `/Items/{id}` | ItemForm (edit) |
| POST | `/Items` | ItemForm |
| PUT | `/Items/{id}` | ItemForm |
| PATCH | `/Items/{id}/status` | ItemsList |
| DELETE | `/Items/{id}` | ItemsList |
| POST | `/Items/{id}/images` | ItemForm |
| GET | `/ItemTypes` | ItemTypes, ItemForm |
| POST | `/ItemTypes` | ItemTypes |
| PUT | `/ItemTypes/{id}` | ItemTypes |
| DELETE | `/ItemTypes/{id}` | ItemTypes |
| GET | `/Brands` | AdminBrands, ItemForm |
| POST | `/Brands` | AdminBrands |
| PUT | `/Brands/{id}` | AdminBrands |
| DELETE | `/Brands/{id}` | AdminBrands |
| GET | `/Categories` | AdminCategories, ItemForm |
| POST | `/Categories` | AdminCategories |
| PUT | `/Categories/{id}` | AdminCategories |
| DELETE | `/Categories/{id}` | AdminCategories |
| GET | `/CustomFields` | ItemForm |
| GET | `/Invoices` | InvoicesList |
| GET | `/Invoices/{id}` | InvoiceDetail |
| POST | `/Invoices` | InvoiceForm |
| POST | `/Invoices/{id}/refund` | InvoiceDetail |
| GET | `/Expenses` | Expenses |
| POST | `/Expenses` | Expenses |
| PUT | `/Expenses/{id}` | Expenses |
| DELETE | `/Expenses/{id}` | Expenses |
| GET | `/Expenses/categories` | Expenses |
| POST | `/Expenses/categories` | Expenses |
| DELETE | `/Expenses/categories/{id}` | Expenses |
| POST | `/Employees/generate-salary-expenses` | Expenses |
| GET | `/Employees` | Employees |
| POST | `/Employees` | Employees |
| PUT | `/Employees/{id}` | Employees |
| DELETE | `/Employees/{id}` | Employees |
| PUT | `/Employees/{id}/permissions` | Employees |
| GET | `/Leads` | Leads |
| PATCH | `/Leads/{id}/status` | Leads |
| GET | `/Leads/{id}/follow-up-link` | Leads |
| GET | `/Settings` | AdminSettings |
| PUT | `/Settings` | AdminSettings |
| PUT | `/Settings/theme` | AdminSettings, ThemeSwitcher |
| PUT | `/Settings/footer` | AdminSettings |
| PUT | `/Settings/whatsapp` | AdminSettings |
| PUT | `/Settings/pwa` | AdminSettings |
| GET | `/Installments/providers` | Installments |
| POST | `/Installments/providers` | Installments |
| PUT | `/Installments/providers/{id}` | Installments |
| DELETE | `/Installments/providers/{id}` | Installments |
| GET | `/Installments/plans` | Installments |
| POST | `/Installments/plans` | Installments |
| PUT | `/Installments/plans/{id}` | Installments |
| DELETE | `/Installments/plans/{id}` | Installments |

### Admin — Store Approvals (different base path)
| Verb | Path | Used By |
|------|------|---------|
| GET | `/api/v1.0/stores` | StoreApprovals |
| GET | `/api/v1.0/stores/pending` | StoreApprovals |
| POST | `/api/v1.0/stores/{id}/approve` | StoreApprovals |
| POST | `/api/v1.0/stores/{id}/reject` | StoreApprovals |
| POST | `/api/v1.0/stores/{id}/hold` | StoreApprovals |

### Platform (Superadmin) — via `PlatformApiService`
| Verb | Path | Used By |
|------|------|---------|
| POST | `/platform/auth/login` | PlatformAuthService |
| GET | `/platform/dashboard` | PlatformDashboard |
| GET | `/platform/tenants` | TenantsList, Subscriptions, Features |
| GET | `/platform/tenants/{id}` | TenantDetail, Subscriptions, Features |
| POST | `/platform/tenants` | TenantCreate, Landing |
| POST | `/platform/tenants/{id}/suspend` | TenantsList, TenantDetail |
| POST | `/platform/tenants/{id}/activate` | TenantsList, TenantDetail |
| DELETE | `/platform/tenants/{id}` | TenantDetail |
| PUT | `/platform/tenants/{id}/store-settings` | TenantDetail |
| GET | `/platform/tenants/{id}/features` | Features |
| PUT | `/platform/tenants/{id}/features` | Features |
| GET | `/platform/tenants/{id}/invoices` | TenantDetail |
| POST | `/platform/tenants/{id}/subscriptions/trial` | Subscriptions |
| POST | `/platform/tenants/{id}/subscriptions/activate` | Subscriptions |
| POST | `/platform/tenants/{id}/subscriptions/renew` | Subscriptions |
| PUT | `/platform/tenants/{id}/subscriptions` | TenantDetail |
| DELETE | `/platform/tenants/{id}/subscriptions` | TenantDetail |
| GET | `/platform/plans` | Plans, TenantCreate, Subscriptions, Features |
| POST | `/platform/plans` | Plans |
| PUT | `/platform/plans/{id}` | Plans |
| DELETE | `/platform/plans/{id}` | Plans |
| DELETE | `/platform/invoices/{id}` | TenantDetail |
| GET | `/platform/subscriptions/expiring` | Subscriptions |
| GET | `/platform/store-requests` | StoreRequests |
| PUT | `/platform/store-requests/{id}/status` | StoreRequests |

---

## 14. Statistics Summary

| Category | Count |
|----------|-------|
| **Model files** | 6 |
| **Service files** | 9 (including `PlatformApiService`) |
| **Store files** | 2 |
| **Guard files** | 4 |
| **Interceptor files** | 1 |
| **Utility files** | 1 |
| **Environment files** | 2 |
| **Public/Storefront components** | 13 + 1 shell layout |
| **Shared components** | 6 |
| **Admin components** | 17 + 1 layout + 1 deprecated stub |
| **Platform components** | 7 + 1 layout + 1 login |
| **Total source files** | ~71 |
| **Total API endpoints (unique)** | ~95 |
| **Total lines of code (approx.)** | ~10,500 |

### Key Architectural Patterns
- **All components are standalone** — no NgModules
- **Signal-based state** — no NgRx, no BehaviorSubjects for component state
- **Lazy loading** — every route uses `loadComponent()`
- **Envelope unwrapping** — `ApiService` strips `ApiResponse<T>` wrapper
- **Dual auth flows** — tenant JWT (`mobilytics_token`) vs platform JWT (`mobilytics_platform_token`)
- **Theme system** — 6 presets applied via CSS custom properties at runtime
- **i18n** — custom service-based, not Angular's built-in i18n; 200+ keys
- **PWA** — service worker + dynamic manifest generation
- **WhatsApp integration** — deep links for item inquiry, follow-up, invoice sharing, credential sharing
- **Invoice PDF** — client-side HTML generation → `window.print()`
