# UI Checklist

Verification checklist for every route and button in the Mobilytics frontend.

## Public Storefront

| Route | Component | API Calls | Status |
|-------|-----------|-----------|--------|
| `/` | `HomeComponent` | `GET /Public/sections`, `GET /Public/items?isFeatured=true`, `GET /Public/items?sortBy=createdAt` | ✅ |
| `/catalog` | `CatalogComponent` | `GET /Public/items` | ✅ |
| `/item/:slug` | `ItemDetailComponent` | `GET /Public/items/:slug` | ✅ |
| `/brands` | `BrandsComponent` | `GET /Brands` | ✅ |
| `/brand/:slug` | `BrandDetailComponent` | `GET /Public/items?brandSlug=` | ✅ |
| `/category/:slug` | `CategoryComponent` | `GET /Public/items?categorySlug=` | ✅ |
| `/compare` | `CompareComponent` | (local state only) | ✅ |

## Auth

| Route | Component | API Calls | Status |
|-------|-----------|-----------|--------|
| `/admin/login` | `LoginComponent` | `POST /Auth/login` | ✅ |

## Admin Pages

| Route | Component | API Calls | Status |
|-------|-----------|-----------|--------|
| `/admin` | `DashboardComponent` | `GET /Reports/dashboard` | ✅ |
| `/admin/items` | `ItemsListComponent` | `GET /Items`, `DELETE /Items/:id` | ✅ |
| `/admin/items/new` | `ItemFormComponent` | `GET /ItemTypes`, `GET /Brands`, `GET /Categories`, `GET /CustomFields`, `POST /Items` | ✅ |
| `/admin/items/:id` | `ItemFormComponent` | Same lookups + `GET /Items/:id`, `PUT /Items/:id`, `POST /Items/:id/images/main`, `POST /Items/:id/images` | ✅ |
| `/admin/item-types` | `ItemTypesComponent` | `GET /ItemTypes`, `POST /ItemTypes`, `PUT /ItemTypes/:id`, `DELETE /ItemTypes/:id` | ✅ |
| `/admin/brands` | `AdminBrandsComponent` | `GET /Brands`, `POST /Brands`, `PUT /Brands/:id`, `DELETE /Brands/:id`, `POST /Brands/:id/logo` | ✅ |
| `/admin/categories` | `AdminCategoriesComponent` | `GET /Categories`, `POST /Categories`, `PUT /Categories/:id`, `DELETE /Categories/:id` | ✅ |
| `/admin/home-sections` | `HomeSectionsComponent` | `GET /HomeSections`, `POST /HomeSections`, `PUT /HomeSections/:id`, `DELETE /HomeSections/:id`, `PUT /HomeSections/reorder`, `PUT /HomeSections/:id/items` | ✅ |
| `/admin/invoices` | `InvoicesListComponent` | `GET /Invoices` | ✅ |
| `/admin/invoices/new` | `InvoiceFormComponent` | `GET /Items` (search), `POST /Invoices` | ✅ |
| `/admin/invoices/:id` | `InvoiceDetailComponent` | `GET /Invoices/:id`, `POST /Invoices/:id/refund` | ✅ |
| `/admin/expenses` | `ExpensesComponent` | `GET /Expenses`, `GET /Expenses/categories`, `POST /Expenses`, `PUT /Expenses/:id`, `DELETE /Expenses/:id`, `POST /Expenses/categories`, `POST /Expenses/generate-salaries` | ✅ |
| `/admin/employees` | `EmployeesComponent` | `GET /Employees`, `POST /Employees`, `PUT /Employees/:id`, `DELETE /Employees/:id` | ✅ |
| `/admin/leads` | `LeadsComponent` | `GET /Leads`, `PUT /Leads/:id/status`, `POST /Leads/:id/follow-up` | ✅ |
| `/admin/settings` | `AdminSettingsComponent` | `GET /Settings`, `PUT /Settings`, `POST /Settings/logo` | ✅ |

## Cross-Cutting

| Feature | Service | Endpoint | Status |
|---------|---------|----------|--------|
| WhatsApp click tracking | `WhatsAppService` | `POST /Public/whatsapp-click` | ✅ |
| WhatsApp follow-up | `WhatsAppService` | `POST /Public/follow-up` | ✅ |
| Tenant header injection | `apiInterceptor` | Every request gets `X-Tenant-Slug` | ✅ |
| JWT auth header | `apiInterceptor` | Authenticated requests get `Authorization: Bearer` | ✅ |
| Settings/theme load | `SettingsStore` | `GET /Public/settings` | ✅ |

## Theme Verification

| Theme | Header | Cards | Footer | Sticky WhatsApp |
|-------|--------|-------|--------|-----------------|
| 1 — Minimal Luxury | Clean white, uppercase thin store name | No border, 4:5 ratio, hidden actions | Light bg with top border | No |
| 2 — Tech Store Pro | Gradient primary→secondary, white text | Bordered, primary hover ring, brand accent | Dark secondary bg | No |
| 3 — Deals & Bold | Accent-colored bg, bold white text | Rounded, discount tags, big prices | Dark secondary bg | Yes (fixed bottom-right) |
