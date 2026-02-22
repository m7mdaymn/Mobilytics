# API Integration

## Base URL

```
https://mobilytics.runasp.net/api/v1
```

All requests include:
- `X-Tenant-Slug` header (from `TenantService.slug()`)
- `Authorization: Bearer <token>` header (when authenticated)

## Response Envelope

Every API response is wrapped:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed",
  "errors": null
}
```

`ApiService` automatically unwraps to return only `data`.

## Paginated Responses

```json
{
  "success": true,
  "data": {
    "items": [...],
    "totalCount": 150,
    "pageNumber": 1,
    "pageSize": 12
  }
}
```

Mapped to `PaginatedList<T>` interface.

## Error Handling

| Status | Action |
|--------|--------|
| 400 | Parse validation errors → throw `ApiError` |
| 401 | Logout + redirect to `/admin/login` |
| 403 | Redirect to `/admin/blocked` or `/inactive` |
| 404 | Throw `ApiError` |
| 500 | Show toast notification |

## Endpoint Map

> **Convention**: All controller names are **PascalCase** (e.g. `/Items`, `/Auth/login`, `/Public/settings`).

### Public (No Auth Required)

| Method | Path | Component | Purpose |
|--------|------|-----------|---------|
| GET | `/Public/settings` | `SettingsStore` | Load store settings, theme, footer |
| GET | `/Public/sections` | `HomeComponent` | Homepage sections with items |
| GET | `/Public/items` | `CatalogComponent` | Search, filter, paginate items |
| GET | `/Public/items/:slug` | `ItemDetailComponent` | Single item by slug |
| POST | `/Public/whatsapp-click` | `WhatsAppService` | Track WhatsApp click |
| POST | `/Public/follow-up` | `WhatsAppService` | Request follow-up |

### Authentication

| Method | Path | Component | Purpose |
|--------|------|-----------|---------|
| POST | `/Auth/login` | `LoginComponent` | Authenticate, returns JWT |

### Items

| Method | Path | Component | Permission |
|--------|------|-----------|------------|
| GET | `/Items` | `ItemsListComponent` | `items.view` |
| GET | `/Items/:id` | `ItemFormComponent` | `items.view` |
| POST | `/Items` | `ItemFormComponent` | `items.create` |
| PUT | `/Items/:id` | `ItemFormComponent` | `items.edit` |
| PATCH | `/Items/:id/status` | `ItemsListComponent` | `items.edit` |
| DELETE | `/Items/:id` | `ItemsListComponent` | `items.delete` |
| POST | `/Items/:id/images?isMain=true` | `ItemFormComponent` | `items.edit` |
| POST | `/Items/:id/images` | `ItemFormComponent` | `items.edit` |
| DELETE | `/Items/:id/images?imageKey=...` | `ItemFormComponent` | `items.edit` |

### Item Types

| Method | Path | Component | Permission |
|--------|------|-----------|------------|
| GET | `/ItemTypes` | `ItemTypesComponent` | (any auth) |
| POST | `/ItemTypes` | `ItemTypesComponent` | `items.create` |
| PUT | `/ItemTypes/:id` | `ItemTypesComponent` | `items.edit` |
| DELETE | `/ItemTypes/:id` | `ItemTypesComponent` | `items.delete` |

### Brands

| Method | Path | Component | Permission |
|--------|------|-----------|------------|
| GET | `/Brands` | `AdminBrandsComponent` / `BrandsComponent` | (any auth or public) |
| POST | `/Brands` | `AdminBrandsComponent` | `items.create` |
| PUT | `/Brands/:id` | `AdminBrandsComponent` | `items.edit` |
| DELETE | `/Brands/:id` | `AdminBrandsComponent` | `items.delete` |

> **Note**: Brand logo is set via the `logoUrl` field in POST/PUT body, not a separate upload endpoint.

### Categories

| Method | Path | Component | Permission |
|--------|------|-----------|------------|
| GET | `/Categories` | `AdminCategoriesComponent` | (any auth) |
| POST | `/Categories` | `AdminCategoriesComponent` | `items.create` |
| PUT | `/Categories/:id` | `AdminCategoriesComponent` | `items.edit` |
| DELETE | `/Categories/:id` | `AdminCategoriesComponent` | `items.delete` |

### Custom Fields

| Method | Path | Component | Permission |
|--------|------|-----------|------------|
| GET | `/CustomFields` | `ItemFormComponent` | (any auth) |

### Home Sections

| Method | Path | Component | Permission |
|--------|------|-----------|------------|
| GET | `/HomeSections` | `HomeSectionsComponent` | `settings.edit` |
| POST | `/HomeSections` | `HomeSectionsComponent` | `settings.edit` |
| PUT | `/HomeSections/:id` | `HomeSectionsComponent` | `settings.edit` |
| DELETE | `/HomeSections/:id` | `HomeSectionsComponent` | `settings.edit` |
| PUT | `/HomeSections/reorder` | `HomeSectionsComponent` | `settings.edit` |
| PUT | `/HomeSections/:id/items` | `HomeSectionsComponent` | `settings.edit` |

### Invoices

| Method | Path | Component | Permission |
|--------|------|-----------|------------|
| GET | `/Invoices` | `InvoicesListComponent` | `invoices.view` |
| GET | `/Invoices/:id` | `InvoiceDetailComponent` | `invoices.view` |
| POST | `/Invoices` | `InvoiceFormComponent` | `invoices.create` |
| POST | `/Invoices/:id/refund` | `InvoiceDetailComponent` | `invoices.refund` |

### Expenses

| Method | Path | Component | Permission |
|--------|------|-----------|------------|
| GET | `/Expenses` | `ExpensesComponent` | `expenses.manage` |
| POST | `/Expenses` | `ExpensesComponent` | `expenses.manage` |
| PUT | `/Expenses/:id` | `ExpensesComponent` | `expenses.manage` |
| DELETE | `/Expenses/:id` | `ExpensesComponent` | `expenses.manage` |
| GET | `/Expenses/categories` | `ExpensesComponent` | `expenses.manage` |
| POST | `/Expenses/categories` | `ExpensesComponent` | `expenses.manage` |
| POST | `/Expenses/generate-salaries` | `ExpensesComponent` | `expenses.manage` |

### Employees

| Method | Path | Component | Permission |
|--------|------|-----------|------------|
| GET | `/Employees` | `EmployeesComponent` | `employees.manage` |
| POST | `/Employees` | `EmployeesComponent` | `employees.manage` |
| PUT | `/Employees/:id` | `EmployeesComponent` | `employees.manage` |
| DELETE | `/Employees/:id` | `EmployeesComponent` | `employees.manage` |

### Leads

| Method | Path | Component | Permission |
|--------|------|-----------|------------|
| GET | `/Leads` | `LeadsComponent` | `leads.manage` |
| PATCH | `/Leads/:id/status` | `LeadsComponent` | `leads.manage` |
| GET | `/Leads/:id/follow-up-link` | `LeadsComponent` | `leads.manage` |
| GET | `/Leads/export` | `LeadsComponent` | `leads.manage` |

> **Note**: Leads cannot be deleted. Use status "Lost" to archive.

### Reports & Settings

| Method | Path | Component | Permission |
|--------|------|-----------|------------|
| GET | `/Reports/dashboard` | `DashboardComponent` | (any auth) |
| GET | `/Settings` | `AdminSettingsComponent` | `settings.edit` |
| PUT | `/Settings` | `AdminSettingsComponent` | `settings.edit` |

> **Note**: Store logo is set via the `logoUrl` field in PUT body, not a separate upload endpoint.

## ApiService Usage

```typescript
// GET with params
this.api.get<PaginatedList<Item>>('/Items', { page: 1, pageSize: 12 })

// POST
this.api.post<Item>('/Items', createDto)

// PUT (full update)
this.api.put<Item>('/Items/' + id, updateDto)

// PATCH (partial update)
this.api.patch('/Items/' + id + '/status', { status: 'Available' })

// DELETE
this.api.delete('/Items/' + id)

// File upload
this.api.upload<ItemImage>('/Items/' + id + '/images?isMain=true', formData)
```

---

## Platform Super Admin API

The Platform API is separate from Tenant API and is used by the **Super Admin UI** at `/superadmin`.

### Base URL

```
https://mobilytics.runasp.net/api/v1/platform
```

### Key Differences from Tenant API

| Aspect | Tenant API | Platform API |
|--------|------------|--------------|
| Base path | `/api/v1/*` | `/api/v1/platform/*` |
| Auth header | `Authorization: Bearer <tenant_token>` | `Authorization: Bearer <platform_token>` |
| Tenant header | `X-Tenant-Slug: <slug>` | **NOT sent** |
| Token storage | `sessionStorage['mobilytics_token']` | `sessionStorage['mobilytics_platform_token']` |
| Guard | `authGuard` | `platformAuthGuard` |
| Route base | `/admin/*` | `/superadmin/*` |

### HTTP Interceptor Logic

The `apiInterceptor` automatically detects platform vs tenant requests:

```typescript
const isPlatformRequest = req.url.includes('/api/v1/platform/');

if (isPlatformRequest) {
  // Use platform token, NO X-Tenant-Slug
  const platformToken = sessionStorage.getItem('mobilytics_platform_token');
  if (platformToken) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${platformToken}` } });
  }
} else {
  // Use tenant token + X-Tenant-Slug header
}
```

### Platform Endpoints

#### Authentication

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/platform/auth/login` | Authenticate platform admin |

#### Dashboard

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/platform/dashboard` | Platform stats, revenue, recent tenants |

#### Tenants

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/platform/tenants` | List all tenants (paginated) |
| GET | `/platform/tenants/:id` | Get tenant details |
| POST | `/platform/tenants` | Create new tenant |
| PUT | `/platform/tenants/:id` | Update tenant |
| POST | `/platform/tenants/:id/suspend` | Suspend tenant |
| POST | `/platform/tenants/:id/activate` | Reactivate tenant |
| DELETE | `/platform/tenants/:id` | Delete tenant |

#### Plans

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/platform/plans` | List all plans |
| GET | `/platform/plans/:id` | Get plan details |
| POST | `/platform/plans` | Create new plan |
| PUT | `/platform/plans/:id` | Update plan |
| DELETE | `/platform/plans/:id` | Delete plan |

#### Subscriptions

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/platform/subscriptions/expiring` | Get expiring subscriptions |
| POST | `/platform/tenants/:id/start-trial` | Start trial for tenant |
| POST | `/platform/tenants/:id/activate` | Activate subscription |
| POST | `/platform/tenants/:id/renew` | Renew subscription |
| POST | `/platform/tenants/:id/cancel` | Cancel subscription |

#### Features

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/platform/tenants/:id/features` | Get tenant feature toggles |
| PUT | `/platform/tenants/:id/features` | Update tenant features |

### PlatformApiService Usage

```typescript
// Dashboard
this.platformApi.getDashboard().subscribe(dashboard => ...)

// Tenants
this.platformApi.getTenants({ page: 1, pageSize: 20, status: 'Active' })
this.platformApi.createTenant({ name, slug, adminEmail, adminPassword, planId })
this.platformApi.suspendTenant(id, 'Payment overdue')
this.platformApi.activateTenant(id)

// Plans
this.platformApi.getPlans().subscribe(plans => ...)
this.platformApi.createPlan({ name, priceEgp, maxItems, ... })

// Subscriptions
this.platformApi.getExpiringSubscriptions(30).subscribe(subs => ...)
this.platformApi.startTrial(tenantId, planId, 14)
this.platformApi.activateSubscription(tenantId, planId, 12)
this.platformApi.renewSubscription(tenantId, 12)

// Features
this.platformApi.getTenantFeatures(tenantId)
this.platformApi.updateTenantFeatures(tenantId, { leadsEnabled: true, ... })
```
