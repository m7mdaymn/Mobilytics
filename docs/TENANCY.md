# Nova Node — Tenancy Model

## Architecture

Nova Node uses a **header-based multi-tenancy** model:

| Component | Host / URL |
|-----------|-----------|
| **Backend API** | `https://api.mobilytics.com` (single host) |
| **Tenant Frontend** | `https://{slug}.mobilytics.com` (subdomain per tenant) |
| **Platform Admin** | `https://admin.mobilytics.com` |

The backend runs on **one fixed host**. Tenant identity is never derived from the backend's hostname — it is always provided by the frontend via a request header.

---

## Tenant Resolution

### Required Header

All tenant-scoped endpoints require:

```
X-Tenant-Slug: {tenantSlug}
```

- **Case-insensitive** header name (`x-tenant-slug`, `X-TENANT-SLUG`, etc. are all accepted)
- The value must match a `Slug` in the `Tenants` table
- Leading/trailing whitespace is trimmed automatically

### Example Request

```http
GET /api/v1/brands HTTP/1.1
Host: api.mobilytics.com
X-Tenant-Slug: my-phone-shop
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Missing Header → 400

If a tenant-scoped endpoint is called without the `X-Tenant-Slug` header:

```http
GET /api/v1/brands HTTP/1.1
Host: api.mobilytics.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Response:
```
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "message": "X-Tenant-Slug header is required for tenant-scoped endpoints."
}
```

### Invalid Slug

If the slug is provided but doesn't match any tenant, the request continues (the `ITenantContext` is not resolved). Individual controllers/services then handle unresolved tenants as needed:
- Admin (authenticated) endpoints will fail authorization
- Public endpoints return `404 - Tenant not resolved`

---

## Exempt Paths

These paths are **exempt** from tenant resolution (no `X-Tenant-Slug` needed):

| Path Prefix | Purpose |
|-------------|---------|
| `/api/v1/platform/*` | Platform SuperAdmin endpoints |
| `/swagger/*` | API documentation UI |
| `/uploads/*` | Static file serving (images) |
| `/health` | Health check endpoint |

---

## Endpoint Scoping

### Platform Endpoints (no tenant header)
```http
POST /api/v1/platform/auth/login HTTP/1.1
Host: api.mobilytics.com
Content-Type: application/json

{"email": "admin@novanode.com", "password": "Admin@123"}
```

### Tenant Auth Endpoints (tenant header required)
```http
POST /api/v1/auth/login HTTP/1.1
Host: api.mobilytics.com
X-Tenant-Slug: my-phone-shop
Content-Type: application/json

{"email": "owner@myshop.com", "password": "Owner@123"}
```

### Tenant Admin Endpoints (tenant header + JWT)
```http
GET /api/v1/brands HTTP/1.1
Host: api.mobilytics.com
X-Tenant-Slug: my-phone-shop
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Public Endpoints (tenant header, no JWT)
```http
GET /api/v1/public/items HTTP/1.1
Host: api.mobilytics.com
X-Tenant-Slug: my-phone-shop
```

---

## CORS Configuration

The backend allows requests from:

| Origin Pattern | Purpose |
|----------------|---------|
| `https://*.mobilytics.com` | All tenant subdomains |
| `https://mobilytics.com` | Root domain |
| `http://localhost:3000` | React/Next.js dev server |
| `http://localhost:5173` | Vite dev server |
| `http://localhost:4200` | Angular dev server |

Credentials are allowed (`AllowCredentials`).

> **Production Note:** To add additional origins, update the `WithOrigins(...)` call in `Program.cs`.

---

## Subscription Enforcement

| Subscription Status | Admin Endpoints | Public Endpoints |
|--------------------|-----------------|------------------|
| `Active` / `Trial` | Full access | Full access |
| `Grace` | Read-only (GET only) | Full access |
| `Expired` / `Suspended` | 403 Forbidden | Full access |

Public endpoints (`/api/v1/public/*`) are always accessible regardless of subscription status.

---

## Frontend Integration Guide

### Setting the Header in JavaScript

```javascript
// Example: Axios interceptor
const tenantSlug = window.location.hostname.split('.')[0]; // e.g. "my-shop"

axios.defaults.baseURL = 'https://api.mobilytics.com';
axios.defaults.headers.common['X-Tenant-Slug'] = tenantSlug;
```

### Setting the Header in Fetch

```javascript
const slug = window.location.hostname.split('.')[0];

fetch('https://api.mobilytics.com/api/v1/brands', {
  headers: {
    'X-Tenant-Slug': slug,
    'Authorization': `Bearer ${token}`,
  },
});
```
