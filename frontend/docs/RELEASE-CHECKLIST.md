# Release Checklist

Pre-deployment checklist for the Mobilytics storefront frontend.

## ✅ API Contract Compliance

All endpoints match the backend Swagger exactly:

### Items
- [x] `GET /Items` — List items with pagination
- [x] `GET /Items/{id}` — Get single item
- [x] `POST /Items` — Create item
- [x] `PUT /Items/{id}` — Update item
- [x] `PATCH /Items/{id}/status` — Update status only
- [x] `DELETE /Items/{id}` — Delete item
- [x] `POST /Items/{id}/images?isMain=true|false` — Upload image
- [x] `DELETE /Items/{id}/images?imageKey=...` — Delete image

### Brands
- [x] `GET /Brands` — List brands
- [x] `POST /Brands` — Create brand (with logoUrl in body)
- [x] `PUT /Brands/{id}` — Update brand (with logoUrl in body)
- [x] `DELETE /Brands/{id}` — Delete brand
- [x] ~~`POST /Brands/{id}/logo`~~ — **Removed** (doesn't exist)

### Settings
- [x] `GET /Settings` — Get tenant settings
- [x] `PUT /Settings` — Update settings (with logoUrl in body)
- [x] ~~`POST /Settings/logo`~~ — **Removed** (doesn't exist)

### Leads
- [x] `GET /Leads` — List leads with pagination
- [x] `PATCH /Leads/{id}/status` — Update lead status
- [x] `GET /Leads/{id}/follow-up-link` — Get WhatsApp follow-up URL
- [x] `GET /Leads/export` — Export leads
- [x] ~~`PUT /Leads/{id}`~~ — **Fixed** to use PATCH
- [x] ~~`DELETE /Leads/{id}`~~ — **Removed** (doesn't exist)

### Public Endpoints
- [x] `GET /Public/settings` — Storefront settings
- [x] `GET /Public/items` — Public item catalog
- [x] `GET /Public/items/{slug}` — Public item detail
- [x] `GET /Public/sections` — Home page sections
- [x] `POST /Public/whatsapp-click` — Track WhatsApp clicks
- [x] `POST /Public/follow-up` — Submit follow-up form

### Other Admin Endpoints
- [x] `GET/POST/PUT/DELETE /Categories`
- [x] `GET/POST/PUT/DELETE /ItemTypes`
- [x] `GET/POST/PUT/DELETE /Employees`
- [x] `GET/POST/PUT/DELETE /HomeSections`
- [x] `GET/POST/PUT/DELETE /CustomFields`
- [x] `GET/POST/PUT/DELETE /Invoices`
- [x] `GET/PATCH /Invoices/{id}/status`
- [x] `GET/POST/PUT/DELETE /Expenses`
- [x] `GET /Reports/dashboard`

## ✅ HTTP Methods

| Endpoint | Correct Method | Notes |
|----------|----------------|-------|
| `/Items/{id}/status` | `PATCH` | Not PUT |
| `/Leads/{id}/status` | `PATCH` | Not PUT |
| `/Invoices/{id}/status` | `PATCH` | Not PUT |
| `/Items/{id}/images` | `POST` with `?isMain=bool` | Not `/images/main` |

## ✅ Environment Configuration

**Production** (`environment.ts`):
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://mobilytics.runasp.net'
};
```

## ✅ Multi-Tenancy

The `TenantService` extracts the tenant slug via:

1. **Subdomain mode**: `{slug}.mobilytics.vercel.app` → slug = subdomain
2. **Path mode**: `mobilytics.vercel.app/{slug}` → slug from first path segment
3. **Vercel preview**: Uses `x-vercel-deployment-url` header fallback
4. **Localhost**: Defaults to `demo` for development

All API calls include the `X-Tenant-Slug` header automatically via `TenantInterceptor`.

## ✅ Pre-Deployment Checks

```bash
# 1. Run tests
cd frontend
npm test -- --browsers=ChromeHeadless --watch=false
# Expected: 67 tests pass

# 2. Build production
npm run build
# Expected: ~365 kB initial bundle

# 3. Check for TypeScript errors
npx ng build --configuration production
# Expected: Build succeeds with only warnings
```

## ✅ Vercel Deployment

1. **Root Directory**: `frontend`
2. **Build Command**: `npx ng build --configuration production`
3. **Output Directory**: `dist/frontend`
4. **Framework**: Other

**`vercel.json`** handles SPA routing:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## ✅ Post-Deployment Verification

### 1. Public Storefront
- [ ] Navigate to `https://{tenant}.mobilytics.vercel.app`
- [ ] Verify store name and logo appear
- [ ] Browse catalog, verify items load
- [ ] Click an item, verify detail page works
- [ ] Click WhatsApp button, verify message template works

### 2. Admin Dashboard
- [ ] Navigate to `/admin`
- [ ] Login with tenant credentials
- [ ] Verify dashboard data loads
- [ ] Create/edit an item, verify save works
- [ ] Change item status, verify PATCH call succeeds
- [ ] View leads, update status, verify PATCH works

### 3. Theme Verification
- [ ] In admin Settings > Theme, select each theme (1, 2, 3)
- [ ] Verify theme changes apply to storefront
- [ ] Verify custom colors work with each theme

### 4. PWA
- [ ] On mobile, verify "Add to Home Screen" prompt
- [ ] Verify app installs with correct name/icon
- [ ] Verify offline mode shows cached content

## ✅ Known Limitations

1. **Logo Upload**: Brands and Settings require a URL, not file upload. Use an external image hosting service (e.g., Cloudinary, AWS S3) and paste the URL.

2. **Lead Delete**: Leads cannot be deleted via UI (backend doesn't support it). Archive by changing status to "Lost".

3. **Follow-up Link**: Uses backend `GET /Leads/{id}/follow-up-link` endpoint which returns the WhatsApp URL with tracking.

## Version

- **Angular**: 19.2
- **Build Date**: 2025
- **Bundle Size**: 365.72 kB initial
- **Tests**: 67 passing
