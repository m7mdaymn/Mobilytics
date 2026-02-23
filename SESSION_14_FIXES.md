# Session 14 — Bug Fix Sprint Summary

## Fixes Delivered

### 1. Default Data Backfill (CRITICAL)
**Problem:** `TenantDefaultDataSeeder` was NOT idempotent — running it twice would create duplicate brands, categories, item types, and home sections. Also, no backfill mechanism existed for existing tenants created before the seeder was introduced.

**Fix:**
- Rewrote `TenantDefaultDataSeeder.SeedAsync()` to check `!db.<Entity>.AnyAsync(e => e.TenantId == tenantId)` before inserting each category of data
- Added `EnsureStoreSettings` block that creates default `StoreSettings` if missing
- Added `BackfillAllTenantsAsync(IServiceProvider)` static method that iterates all tenants and calls `SeedAsync` for each
- Added call in `Program.cs` after `DatabaseSeeder.SeedAsync()` to run the backfill on every startup (safe because idempotent)

**Files changed:**
- `src/NovaNode.Infrastructure/Seeding/TenantDefaultDataSeeder.cs` — Full rewrite
- `src/NovaNode.Api/Program.cs` — Added backfill call

---

### 2. Settings "Cannot read properties of null (reading 'success')"
**Problem:** Sub-endpoints (`PUT /Settings/theme`, `PUT /Settings/footer`, `PUT /Settings/whatsapp`, `PUT /Settings/pwa`) returned `NoContent()` (HTTP 204) which has no response body. The frontend `ApiService.unwrap()` tried to access `response.success` on `null`, crashing.

**Fix:**
- Backend: Changed all `NoContent()` returns to `Ok(true)` which wraps in the API envelope `{success: true, data: true}`
- Backend: Also fixed `DELETE` endpoints on EmployeesController and ExpensesController
- Frontend: Added null guard in `ApiService.unwrap()` — returns `null as T` when response is null/undefined

**Files changed:**
- `src/NovaNode.Api/Controllers/SettingsController.cs` — 4 endpoints fixed
- `src/NovaNode.Api/Controllers/EmployeesController.cs` — 2 endpoints fixed
- `src/NovaNode.Api/Controllers/ExpensesController.cs` — 2 endpoints fixed
- `frontend/src/app/core/services/api.service.ts` — null guard in unwrap

---

### 3. Employee Permissions Broken
**Problem:** Frontend-backend field name mismatch:
- Frontend sent `fullName`/`salary`/`permissions[]` (string array)
- Backend expected `Name`/`SalaryMonthly`/`Permissions[{key, isEnabled}]`

**Fix:**
- Rewrote `Employee` interface in `item.models.ts` to match backend: `name`, `salaryMonthly`, `permissions: PermissionEntry[]`
- Added `PermissionEntry` interface (`{key, isEnabled}`)
- Rewrote `employees.component.ts`:
  - Form uses `name`/`salaryMonthly` matching backend DTOs
  - Permissions stored as `Set<PermissionKey>` for toggle UX
  - Save flow: Create/Update employee first → then call `PUT /Employees/{id}/permissions` with `{permissions: [{key, isEnabled}]}` entries
  - Display shows `countEnabledPerms()` helper (Arrow functions not allowed in Angular templates)

**Files changed:**
- `frontend/src/app/core/models/item.models.ts` — Employee + PermissionEntry interfaces
- `frontend/src/app/admin/pages/employees/employees.component.ts` — Full rewrite

---

### 4. Expenses Page Bad UX + Not Working
**Problem:** Multiple field name mismatches and wrong endpoint:
- Frontend sent `description`/`date`/`reference` — backend expected `Title`/`OccurredAt`/`Notes`
- Frontend expected flat array from GET — backend returns `PagedResult<ExpenseDto>` with `.items`/`.totalCount`
- Generate salaries called `POST /Expenses/generate-salaries` — actual endpoint is `POST /Employees/generate-salary-expenses`

**Fix:**
- Rewrote `Expense`/`ExpenseCategory` interfaces to match backend DTOs exactly
- Rewrote `expenses.component.ts`:
  - `load()` now correctly handles `PagedResult` response (`.items`, `.totalCount`)
  - Form fields: `title`, `occurredAt`, `notes` matching backend
  - Generate salaries calls correct endpoint: `POST /Employees/generate-salary-expenses`
  - Added pagination UI (Prev/Next with page count)

**Files changed:**
- `frontend/src/app/core/models/item.models.ts` — Expense + ExpenseCategory interfaces
- `frontend/src/app/admin/pages/expenses/expenses.component.ts` — Full rewrite

---

### 5. PWA Install Prompt Missing
**Problem:** No `beforeinstallprompt` event handling existed anywhere in the codebase. Users had no way to install the PWA.

**Fix:**
- Created `PwaInstallService` (`pwa-install.service.ts`):
  - Listens for `beforeinstallprompt` event
  - Exposes `canInstall` signal (true when browser supports install)
  - Exposes `installed` signal (true after install or if in standalone mode)
  - `promptInstall()` method triggers native install dialog
- Added "Install App" button to storefront header (desktop + mobile nav)
- Added i18n translations: `store.installApp` (EN: "Install App", AR: "تثبيت التطبيق")
- Fixed static `manifest.webmanifest`: changed `"name": "frontend"` → `"name": "Mobilytics"`

**Files changed:**
- `frontend/src/app/core/services/pwa-install.service.ts` — NEW
- `frontend/src/app/public/layouts/storefront-shell.component.ts` — Install button added
- `frontend/src/app/core/services/i18n.service.ts` — Translation added
- `frontend/public/manifest.webmanifest` — Name fixed

---

### 6. Store Link URLs Wrong
**Problem:** Multiple places hardcoded `https://mobilytics.vercel.app` instead of using `environment.appDomain`. This broke local development and any future domain changes.

**Fix:**
- `tenant-create.component.ts`: Imports `environment`, uses `environment.appDomain` for store/admin URLs in both template display and WhatsApp message
- `tenant-detail.component.ts`: Same treatment
- Both components expose `appDomain` as a class property for template interpolation

**Files changed:**
- `frontend/src/app/platform/pages/tenants/tenant-create.component.ts`
- `frontend/src/app/platform/pages/tenants/tenant-detail.component.ts`

---

## Build Status
- **Backend (.NET 9):** ✅ 0 errors, 0 warnings (compile warnings only)
- **Frontend (Angular 19):** ✅ 0 TypeScript/Angular errors (Tailwind CSS selector warnings only)
- **No new database migration needed** — all changes are code-level
