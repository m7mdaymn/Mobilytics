# Nova Node — API Reference

All endpoints are versioned under `/api/v1/`. Responses use a standard envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": null,
  "errors": null
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detail 1", "Detail 2"]
}
```

---

## Authentication

### Platform Login
```
POST /api/v1/platform/auth/login
```

**Request:**
```json
{
  "email": "admin@novanode.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2025-01-01T01:00:00Z"
  }
}
```

### Tenant Login
```
POST /api/v1/auth/login
Headers: X-Tenant-Slug: my-shop
```

**Request:**
```json
{
  "email": "owner@myshop.com",
  "password": "Owner@123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "...",
    "expiresAt": "2025-01-01T01:00:00Z",
    "employee": {
      "id": "guid",
      "name": "Shop Owner",
      "email": "owner@myshop.com",
      "role": "Owner"
    }
  }
}
```

### Refresh Token
```
POST /api/v1/auth/refresh
Headers: X-Tenant-Slug: my-shop
```

---

## Platform Endpoints (SuperAdmin)

All platform endpoints require `Authorization: Bearer <platform-token>`.

### Dashboard
```
GET /api/v1/platform/dashboard?range=month
```

### Tenants
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/platform/tenants` | List all tenants |
| GET | `/api/v1/platform/tenants/{id}` | Get tenant detail |
| POST | `/api/v1/platform/tenants` | Create tenant + owner |
| PUT | `/api/v1/platform/tenants/{id}` | Update tenant |
| DELETE | `/api/v1/platform/tenants/{id}` | Delete tenant |
| POST | `/api/v1/platform/tenants/{id}/suspend` | Suspend tenant |
| POST | `/api/v1/platform/tenants/{id}/activate` | Activate tenant |
| GET | `/api/v1/platform/tenants/{id}/features` | Get feature toggles |
| PUT | `/api/v1/platform/tenants/{id}/features` | Update feature toggles |

**Create Tenant Request:**
```json
{
  "name": "My Phone Shop",
  "slug": "my-phone-shop",
  "ownerEmail": "owner@myshop.com",
  "ownerPassword": "Owner@123",
  "ownerName": "Shop Owner"
}
```

### Plans
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/platform/plans` | List all plans |
| POST | `/api/v1/platform/plans` | Create plan |
| PUT | `/api/v1/platform/plans/{id}` | Update plan |
| DELETE | `/api/v1/platform/plans/{id}` | Delete plan |

### Subscriptions
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/platform/subscriptions/{tenantId}/trial` | Start trial |
| POST | `/api/v1/platform/subscriptions/{tenantId}/activate` | Activate subscription |
| POST | `/api/v1/platform/subscriptions/{tenantId}/renew` | Renew subscription |
| GET | `/api/v1/platform/subscriptions/expiring?days=7` | List expiring subscriptions |

---

## Tenant Endpoints

All tenant endpoints require:
- `X-Tenant-Slug: <slug>` header (or subdomain)
- `Authorization: Bearer <tenant-token>`

### Brands
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/brands` | List all brands |
| GET | `/api/v1/brands/{id}` | Get brand |
| POST | `/api/v1/brands` | Create brand |
| PUT | `/api/v1/brands/{id}` | Update brand |
| DELETE | `/api/v1/brands/{id}` | Delete brand |

### Categories
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/categories` | List all categories |
| GET | `/api/v1/categories/tree` | Get category tree |
| GET | `/api/v1/categories/{id}` | Get category |
| POST | `/api/v1/categories` | Create category |
| PUT | `/api/v1/categories/{id}` | Update category |
| DELETE | `/api/v1/categories/{id}` | Delete category |
| PUT | `/api/v1/categories/reorder` | Reorder categories |

### Item Types
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/itemtypes` | List all item types |
| GET | `/api/v1/itemtypes/{id}` | Get item type |
| POST | `/api/v1/itemtypes` | Create item type |
| PUT | `/api/v1/itemtypes/{id}` | Update item type |
| DELETE | `/api/v1/itemtypes/{id}` | Delete item type |

### Custom Fields
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/customfields?itemTypeId=` | List custom fields |
| POST | `/api/v1/customfields` | Create custom field |
| PUT | `/api/v1/customfields/{id}` | Update custom field |
| DELETE | `/api/v1/customfields/{id}` | Delete custom field |

### Items
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/items` | List items (with filter) |
| GET | `/api/v1/items/{id}` | Get item by ID |
| GET | `/api/v1/items/slug/{slug}` | Get item by slug |
| POST | `/api/v1/items` | Create item |
| PUT | `/api/v1/items/{id}` | Update item |
| PATCH | `/api/v1/items/{id}/status` | Update item status |
| DELETE | `/api/v1/items/{id}` | Delete item |
| POST | `/api/v1/items/{id}/images` | Upload image |
| DELETE | `/api/v1/items/{id}/images?imageKey=` | Delete image |

### Invoices
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/invoices` | List invoices (with filter) |
| GET | `/api/v1/invoices/{id}` | Get invoice |
| POST | `/api/v1/invoices` | Create invoice |
| POST | `/api/v1/invoices/{id}/refund` | Refund invoice |

### Expenses
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/expenses/categories` | List expense categories |
| POST | `/api/v1/expenses/categories` | Create expense category |
| PUT | `/api/v1/expenses/categories/{id}` | Update expense category |
| DELETE | `/api/v1/expenses/categories/{id}` | Delete expense category |
| GET | `/api/v1/expenses` | List expenses (with filter) |
| POST | `/api/v1/expenses` | Create expense |
| PUT | `/api/v1/expenses/{id}` | Update expense |
| DELETE | `/api/v1/expenses/{id}` | Delete expense |

### Employees
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/employees` | List all employees |
| GET | `/api/v1/employees/{id}` | Get employee |
| POST | `/api/v1/employees` | Create employee |
| PUT | `/api/v1/employees/{id}` | Update employee |
| DELETE | `/api/v1/employees/{id}` | Delete employee |
| PUT | `/api/v1/employees/{id}/permissions` | Update permissions |
| POST | `/api/v1/employees/generate-salary-expenses` | Generate salary expenses |

### Home Sections
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/homesections?activeOnly=` | List home sections |
| POST | `/api/v1/homesections` | Create home section |
| PUT | `/api/v1/homesections/{id}` | Update home section |
| DELETE | `/api/v1/homesections/{id}` | Delete home section |
| PUT | `/api/v1/homesections/reorder` | Reorder sections |

### Leads
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/leads` | List leads (with filter) |
| PATCH | `/api/v1/leads/{id}/status` | Update lead status |
| GET | `/api/v1/leads/{id}/follow-up-link` | Get follow-up link |
| GET | `/api/v1/leads/export` | Export leads as CSV |

### Reports
```
GET /api/v1/reports/dashboard?from=2025-01-01&to=2025-01-31
```

### Settings
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/settings` | Get store settings |
| PUT | `/api/v1/settings` | Update store settings |
| PUT | `/api/v1/settings/theme` | Update theme |
| PUT | `/api/v1/settings/footer` | Update footer |
| PUT | `/api/v1/settings/whatsapp` | Update WhatsApp templates |
| PUT | `/api/v1/settings/pwa` | Update PWA settings |

---

## Public Endpoints (No Auth)

These endpoints require `X-Tenant-Slug` header but no JWT token.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/public/settings` | Public store settings |
| GET | `/api/v1/public/items` | Public items listing |
| GET | `/api/v1/public/items/{slug}` | Public item by slug |
| GET | `/api/v1/public/sections` | Active home sections |
| POST | `/api/v1/public/whatsapp-click` | Track WhatsApp click |
| POST | `/api/v1/public/follow-up` | Submit follow-up request |
| GET | `/api/v1/public/follow-up-link/{id}` | Get follow-up link |

**Total: 73 endpoints**
