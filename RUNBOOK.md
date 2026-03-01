# Mobilytics — Operations Runbook

## 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| .NET SDK | 9.0+ | Backend build & run |
| Node.js | 20 LTS+ | Frontend tooling |
| SQL Server | 2019+ or Azure SQL | Database |
| Git | 2.40+ | Source control |

## 2. Local Development Setup

### Backend

```bash
cd src/NovaNode.Api
# Restore NuGet packages
dotnet restore ../../NovaNode.sln
# Apply EF migrations
dotnet ef database update --project ../NovaNode.Infrastructure --startup-project .
# Run API (listens on http://localhost:5054)
dotnet run
```

### Frontend

```bash
cd frontend
npm install
npx ng serve
# Opens on http://localhost:4200
```

### Verify

- Backend health: `GET http://localhost:5054/api/v1/Public/tenants`
- Frontend: Navigate to `http://localhost:4200/store?tenant=elkhouly`

## 3. Database Migrations

```bash
cd src/NovaNode.Api

# Create new migration
dotnet ef migrations add MigrationName \
  --project ../NovaNode.Infrastructure \
  --startup-project .

# Apply pending migrations
dotnet ef database update \
  --project ../NovaNode.Infrastructure \
  --startup-project .
```

Latest migration: `AddDeviceFields` — adds Color, Storage, RAM, InstallmentAvailable, MonthlyPayment to Items table.

## 4. Production Deployment

### Backend (MonsterASP / runasp.net)

1. Build release:
   ```bash
   dotnet publish src/NovaNode.Api -c Release -o ./publish
   ```
2. Upload `publish/` folder contents via FTP or MonsterASP control panel.
3. Ensure `appsettings.json` has production connection string and JWT secrets.
4. The app auto-applies pending migrations at startup via `context.Database.Migrate()`.

### Frontend (Vercel)

1. Push to `main` branch — Vercel auto-deploys.
2. Manual deploy:
   ```bash
   cd frontend
   npx ng build --configuration=production
   npx vercel --prod
   ```
3. Routing handled by `vercel.json` (rewrites all paths to `index.html`).

### Environment Variables

**Backend** (`appsettings.json`):
- `ConnectionStrings:DefaultConnection` — SQL Server connection string
- `Jwt:TenantKey` — HMAC key for tenant JWTs
- `Jwt:PlatformKey` — HMAC key for platform JWTs
- `Jwt:Issuer` / `Jwt:Audience` — Token validation params
- `Cors:AllowedOrigins` — Array of allowed frontend origins

**Frontend** (`environments/environment.prod.ts`):
- `apiBaseUrl` — `https://mobilytics.runasp.net`
- `production` — `true`

## 5. Authentication

### JWT Token Structure

| Claim | Value |
|-------|-------|
| `ClaimTypes.NameIdentifier` | User GUID |
| `ClaimTypes.Email` | User email |
| `ClaimTypes.Role` | `Owner` / `Employee` |
| `tenantId` | Tenant GUID |
| `permission` | Comma-separated permissions |

Tokens expire after **8 hours**. Frontend stores tokens in localStorage and attaches via HTTP interceptor.

### Seeded Accounts

| Role | Email | Password |
|------|-------|----------|
| Platform Admin | `admin@mobilytics.com` | `Admin@123` |
| Tenant Owner (Elkhouly) | `owner@elkhouly.com` | `Owner@123` |

## 6. Multi-Tenancy

- Each API request requires `X-Tenant-Slug` header (except public/platform routes).
- `TenantResolutionMiddleware` resolves the tenant and sets `TenantContext.CurrentTenant`.
- All tenant-scoped queries filter by `TenantId` automatically.
- Paths exempt from tenant resolution: `/api/v1/Public/tenants`, `/api/v1/Platform/**`, Swagger.

## 7. Monitoring & Troubleshooting

### Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| 401 on invoice/expense CRUD | JWT claim mismatch | Fixed in Session 16 — controllers now use `ClaimTypes.NameIdentifier` |
| Broken images in storefront | Relative `/uploads/...` path | `resolveImageUrl()` prepends API base URL |
| Currency shows `$` instead of EGP | Bare `\| currency` pipe | Fixed — all pipes now use `settingsStore.currency()` |
| Catalog filters return all items | Slug vs GUID mismatch | Backend now accepts slug-based filters |
| Dashboard TotalPaid too high | Includes unpaid invoices | Fixed — filters by `PaymentStatus.Paid` |

### Logs

Backend logs are written to `src/NovaNode.Api/logs/` via Serilog.

```bash
# Tail recent logs
Get-Content src/NovaNode.Api/logs/log-*.txt -Tail 50
```

### Health Checks

```bash
# Backend alive
curl https://mobilytics.runasp.net/api/v1/Public/tenants

# Specific tenant
curl -H "X-Tenant-Slug: elkhouly" https://mobilytics.runasp.net/api/v1/Public/settings
```

## 8. Seeded Data

Default data is seeded on first startup via `DataSeeder`:
- Platform admin account
- Subscription plans (Free, Basic, Pro, Enterprise)
- Demo tenant "Elkhouly" with owner account
- Sample item types, categories, brands
- Feature flags

See [SEEDED_DATA_GUIDE.md](SEEDED_DATA_GUIDE.md) for full details.

## 9. Architecture Quick Reference

```
┌──────────────────────────────┐
│   Angular 19 (Vercel)        │
│  ┌────────┐ ┌─────────────┐ │
│  │Landing │ │ Storefront   │ │
│  │  Page  │ │ /store/...   │ │
│  └────────┘ └─────────────┘ │
│  ┌────────┐ ┌─────────────┐ │
│  │ Admin  │ │  Platform   │ │
│  │/admin/ │ │ /platform/  │ │
│  └────────┘ └─────────────┘ │
└──────────────┬───────────────┘
               │ HTTP + X-Tenant-Slug
┌──────────────▼───────────────┐
│   .NET 9 API (MonsterASP)    │
│  ┌──────────────────────┐    │
│  │ TenantResolution MW  │    │
│  ├──────────────────────┤    │
│  │ Controllers          │    │
│  │ (Public/Tenant/Admin)│    │
│  ├──────────────────────┤    │
│  │ Application Services │    │
│  ├──────────────────────┤    │
│  │ EF Core 9 + SQL Srv  │    │
│  └──────────────────────┘    │
└──────────────────────────────┘
```

## 10. Release Checklist

- [ ] Run `dotnet build NovaNode.sln` — 0 errors
- [ ] Run `npx ng build --configuration=production` — 0 TS errors
- [ ] Apply EF migrations on target DB
- [ ] Deploy backend publish output
- [ ] Push frontend to trigger Vercel deploy
- [ ] Verify: `https://mobilytics.vercel.app` loads landing page
- [ ] Verify: `https://mobilytics.vercel.app/store?tenant=elkhouly` loads storefront
- [ ] Verify: Admin login and CRUD operations work
- [ ] Verify: Platform dashboard shows correct TotalPaid
- [ ] Verify: Images render correctly in storefront
