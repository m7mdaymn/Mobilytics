# Nova Node — Swagger Testing Guide

## Accessing Swagger UI

Open: [https://localhost:5001/swagger](https://localhost:5001/swagger) (or your configured host)

---

## Testing Platform Endpoints (No Tenant Header Needed)

Platform endpoints (`/api/v1/platform/*`) do **not** require the `X-Tenant-Slug` header.

### Step 1: Login as SuperAdmin

1. Expand `POST /api/v1/platform/auth/login`
2. Click **Try it out**
3. Enter:
   ```json
   {
     "email": "admin@novanode.com",
     "password": "Admin@123"
   }
   ```
4. Click **Execute**
5. Copy the `token` from the response `data` object

### Step 2: Authorize

1. Click the **Authorize 🔒** button (top right)
2. Paste your token (without "Bearer " prefix — Swagger adds it)
3. Click **Authorize**

### Step 3: Test Platform Endpoints

You can now test:
- `GET /api/v1/platform/dashboard`
- `GET /api/v1/platform/tenants`
- `POST /api/v1/platform/tenants`
- `GET /api/v1/platform/plans`
- etc.

---

## Testing Tenant-Scoped Endpoints (X-Tenant-Slug Required)

All tenant-scoped endpoints **require** the `X-Tenant-Slug` header.

> ⚠️ **Without this header, you will get `400 Bad Request`.**

### Option A: Using Swagger UI (Limited)

Swagger UI v3 does not natively support custom headers per-request.

**Workaround with curl:**
```bash
# Login to tenant
curl -X POST https://api.mobilytics.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Slug: my-phone-shop" \
  -d '{"email": "owner@myshop.com", "password": "Owner@123"}'

# Get brands
curl https://api.mobilytics.com/api/v1/brands \
  -H "X-Tenant-Slug: my-phone-shop" \
  -H "Authorization: Bearer <token>"
```

### Option B: Using Postman / Insomnia

1. Set **Base URL**: `https://api.mobilytics.com` (or `https://localhost:5001`)
2. Add header: `X-Tenant-Slug: {your-tenant-slug}`
3. Add header: `Authorization: Bearer {your-token}`
4. Make requests to tenant endpoints

### Option C: Adding Header in Swagger Configuration

To test tenant endpoints directly in Swagger, you can add the `X-Tenant-Slug` header as a Swagger parameter. This is configured as a custom operation filter (optional enhancement).

---

## Endpoint Categories

| Category | Header Required | Auth Required | Example |
|----------|:--------------:|:-------------:|---------|
| Platform Auth | — | — | `POST /api/v1/platform/auth/login` |
| Platform Admin | — | JWT (SuperAdmin) | `GET /api/v1/platform/tenants` |
| Tenant Auth | `X-Tenant-Slug` | — | `POST /api/v1/auth/login` |
| Tenant Admin | `X-Tenant-Slug` | JWT (Owner/Manager) | `GET /api/v1/brands` |
| Public | `X-Tenant-Slug` | — | `GET /api/v1/public/items` |
| Health | — | — | `GET /health` |
| Swagger | — | — | `GET /swagger` |

---

## Common Errors

### 400 — Missing Tenant Slug
```json
{
  "success": false,
  "message": "X-Tenant-Slug header is required for tenant-scoped endpoints."
}
```
**Fix:** Add `X-Tenant-Slug: {slug}` header to your request.

### 401 — Unauthorized
```json
{
  "error": "Invalid credentials."
}
```
**Fix:** Check your JWT token or login credentials.

### 403 — Subscription Issue
```json
{
  "error": "Subscription expired."
}
```
**Fix:** Contact platform admin to renew subscription.
