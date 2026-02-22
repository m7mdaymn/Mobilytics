# Nova Node — Middleware Pipeline

## Pipeline Order

Middleware is registered in `Program.cs` and executes in the following order:

```
Request →
  1. Swagger (if /swagger)
  2. Serilog Request Logging
  3. CORS
  4. Static Files (/uploads)
  5. TenantResolutionMiddleware
  6. SubscriptionEnforcementMiddleware
  7. GlobalExceptionMiddleware
  8. Authentication (JWT Bearer)
  9. Authorization
 10. Controller Action
← Response
```

## Middleware Details

### 1. TenantResolutionMiddleware

**Purpose:** Resolves the current tenant from the request and sets `ITenantContext`.

**Logic:**
1. Skip if path starts with `/api/v1/platform`, `/swagger`, or `/uploads`
2. Check `X-Tenant-Slug` header → use as slug
3. Else check subdomain (e.g., `demo.novanode.com` → slug = `demo`)
4. If no slug found → return `400 Bad Request`
5. Look up tenant by slug in database
6. If found → set `ITenantContext(TenantId, Slug)`
7. Continue to next middleware

### 2. SubscriptionEnforcementMiddleware

**Purpose:** Blocks requests to tenant-scoped endpoints when the subscription is expired or suspended.

**Logic:**
1. Skip for platform, auth, public, swagger, uploads paths
2. Skip if tenant not resolved
3. Load latest subscription for tenant
4. If no subscription → allow (new tenants)
5. If `Expired` or `Suspended` → return `403 Forbidden`
6. If `Grace` and non-GET request → return `403 Forbidden` (read-only mode)
7. Otherwise → continue

### 3. GlobalExceptionMiddleware

**Purpose:** Catches unhandled exceptions and maps them to appropriate HTTP status codes.

**Mapping:**

| Exception Type | Status Code | Response Format |
|----------------|-------------|-----------------|
| `ValidationException` (FluentValidation) | 400 | `{ errors: [{ propertyName, errorMessage }] }` |
| `KeyNotFoundException` | 404 | `{ error: "..." }` |
| `UnauthorizedAccessException` | 401 | `{ error: "..." }` |
| `InvalidOperationException` | 409 | `{ error: "..." }` |
| `Exception` (unhandled) | 500 | `{ error: "An unexpected error occurred." }` |

## CORS Configuration

CORS is configured to allow any origin, method, and header:

```csharp
builder.Services.AddCors(o =>
    o.AddDefaultPolicy(p =>
        p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));
```

> **Note:** Restrict origins in production by replacing `AllowAnyOrigin()` with specific allowed domains.

## Static Files

Files are served from `wwwroot/uploads/` at the `/uploads` path prefix. This is used for item images uploaded via `POST /api/v1/items/{id}/images`.
