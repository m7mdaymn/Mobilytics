# Nova Node — Authentication & Authorization

## JWT Bearer Authentication

Nova Node uses **JWT Bearer tokens** with **HS256** (HMAC-SHA256) signing.

### Token Structure

Tokens contain the following claims:

| Claim | Source | Description |
|-------|--------|-------------|
| `sub` | Employee.Id / PlatformUser.Id | Subject identifier |
| `email` | Employee.Email / PlatformUser.Email | User email |
| `role` | Employee.Role / PlatformUser.Role | User role |
| `tenantId` | Employee.TenantId | Tenant scope (employees only) |
| `exp` | Config: `Jwt:ExpiryMinutes` | Expiration timestamp |
| `iss` | Config: `Jwt:Issuer` | Token issuer ("NovaNode") |
| `aud` | Config: `Jwt:Audience` | Token audience ("NovaNodeClients") |

### Token Lifetimes

| Setting | Default |
|---------|---------|
| Access Token | 60 minutes |
| Refresh Token | Stored in-memory (per-session) |

## Two Auth Domains

### 1. Platform Authentication (SuperAdmin)

```
POST /api/v1/platform/auth/login
```

- Used by the platform management console
- Returns a JWT with `role: SuperAdmin`
- Grants access to all `/api/v1/platform/*` endpoints

### 2. Tenant Authentication (Employees)

```
POST /api/v1/auth/login
Headers: X-Tenant-Slug: <slug>
```

- Used by individual phone shop dashboards
- Returns a JWT with `role: Owner` or `role: Manager`
- Grants access to tenant-scoped endpoints only
- Token includes `tenantId` claim for additional validation

## Role-Based Authorization

| Role | Scope | Access Level |
|------|-------|-------------|
| `SuperAdmin` | Platform | Full platform management (tenants, plans, subscriptions) |
| `Owner` | Tenant | Full tenant management (all CRUD, employees, settings) |
| `Manager` | Tenant | Tenant operations (controlled by Permission entity) |

### Permission System

For the `Manager` role, granular permissions are stored in the `Permission` table:

| Permission Key | Controls |
|----------------|----------|
| `items.create` | Create items |
| `items.edit` | Edit items |
| `items.delete` | Delete items |
| `invoices.create` | Create invoices |
| `invoices.refund` | Refund invoices |
| `expenses.manage` | Manage expenses |
| `leads.manage` | Manage leads |
| `settings.edit` | Edit store settings |
| `employees.manage` | Manage employees |

## Making Authenticated Requests

### Platform Request
```http
POST /api/v1/platform/tenants HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
```

### Tenant Request
```http
GET /api/v1/brands HTTP/1.1
X-Tenant-Slug: my-phone-shop
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Invalid credentials."
}
```

Returned when:
- No token provided
- Token is expired or invalid
- Credentials are wrong (login endpoints)

### 403 Forbidden
Returned when:
- Token role doesn't match required role (e.g., `Owner` accessing platform endpoints)
