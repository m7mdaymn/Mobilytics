# Mobilytics — Store URL Reference

## Public Storefront URLs

| Route | Description |
|-------|-------------|
| `/store?tenant={slug}` | Storefront home (resolves tenant from query param) |
| `/store/catalog` | Full catalog with filters, search, pagination |
| `/store/catalog/{typeSlug}` | Catalog filtered by item type (e.g., `smartphones`) |
| `/store/item/{slug}` | Item detail page |
| `/store/brands` | All brands list |
| `/store/brand/{slug}` | Brand detail + items |
| `/store/category/{slug}` | Category items |
| `/store/compare` | Compare up to 3 items side-by-side |

## Tenant Resolution

Tenant is resolved in this priority order:
1. **Query parameter**: `?tenant=elkhouly`
2. **Subdomain**: `elkhouly.mobilytics.vercel.app` (if configured)
3. **localStorage**: Persisted from last visit (`MOBILYTICS_TENANT_OVERRIDE`)

The resolved slug is sent as `X-Tenant-Slug` header on every API request via the Angular HTTP interceptor.

## Admin URLs

| Route | Description |
|-------|-------------|
| `/admin/login` | Tenant admin login |
| `/admin/dashboard` | Dashboard (revenue, invoices, chart) |
| `/admin/items` | Items list |
| `/admin/items/new` | Create item |
| `/admin/items/:id/edit` | Edit item |
| `/admin/invoices` | Invoices list |
| `/admin/invoices/new` | Create invoice |
| `/admin/invoices/:id` | Invoice detail |
| `/admin/expenses` | Expenses management |
| `/admin/employees` | Employee & permission management |
| `/admin/settings` | Store settings, theme, branding |

## SuperAdmin / Platform URLs

| Route | Description |
|-------|-------------|
| `/platform/login` | Platform admin login |
| `/platform/dashboard` | Platform dashboard (aggregate revenue, tenants) |
| `/platform/tenants` | Tenant management |
| `/platform/tenants/create` | Create new tenant |
| `/platform/tenants/:id` | Tenant detail |
| `/platform/plans` | Subscription plans |
| `/platform/subscriptions` | Active subscriptions |
| `/platform/store-approvals` | Pending store signup approvals |
| `/platform/features` | Feature flag management |

## Landing Page

| Route | Description |
|-------|-------------|
| `/` | Landing page with pricing, FAQ, signup modal, featured stores |

## API Endpoints (Public)

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/Public/tenants` | List active tenants (name, slug, logoUrl) |
| `GET /api/v1/Public/settings` | Store settings (requires `X-Tenant-Slug`) |
| `GET /api/v1/Public/items` | Paginated items with filters |
| `GET /api/v1/Public/items/{slug}` | Single item by slug |
| `GET /api/v1/Public/sections` | Home page dynamic sections |
| `POST /api/v1/Public/follow-ups` | Submit follow-up request |
| `POST /api/v1/Public/whatsapp-clicks` | Track WhatsApp click |

## Image URL Resolution

Images stored as `/uploads/{tenantId}/items/{guid}.ext` on the backend.
Frontend resolves them using `resolveImageUrl()` which prepends the API base URL:

- **Development**: `http://localhost:5054/uploads/...`
- **Production**: `https://mobilytics.runasp.net/uploads/...`

## Environment Hosts

| Environment | Frontend | Backend |
|-------------|----------|---------|
| Development | `http://localhost:4200` | `http://localhost:5054` |
| Production | `https://mobilytics.vercel.app` | `https://mobilytics.runasp.net` |
