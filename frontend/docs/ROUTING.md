# Routing

## Route Map

All routes use **lazy loading** (`loadComponent`) for optimal code splitting.

### Public Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `StorefrontShellComponent` → `HomeComponent` | Dynamic homepage |
| `/catalog` | `CatalogComponent` | Full catalog with search/filter/sort |
| `/type/:typeSlug` | `CatalogComponent` | Catalog filtered by item type |
| `/category/:slug` | `CategoryComponent` | Items in a category |
| `/brands` | `BrandsComponent` | Brand directory grid |
| `/brand/:slug` | `BrandDetailComponent` | Brand page with items |
| `/item/:slug` | `ItemDetailComponent` | Product detail page |
| `/compare` | `CompareComponent` | Side-by-side comparison (max 2) |
| `/policies/:key` | `PoliciesComponent` | Store policies (returns, warranty) |
| `/inactive` | `InactiveComponent` | Inactive tenant message |
| `/tenant-not-found` | `TenantNotFoundComponent` | Invalid slug |

### Admin Routes

All admin child routes (under `/admin`) are protected by `authGuard`.

| Path | Component | Guard | Permission |
|------|-----------|-------|------------|
| `/admin/login` | `LoginComponent` | None | — |
| `/admin` | `DashboardComponent` | `authGuard` | — |
| `/admin/items` | `ItemsListComponent` | `authGuard` | `items.view` |
| `/admin/items/new` | `ItemFormComponent` | `authGuard` | `items.create` |
| `/admin/items/:id/edit` | `ItemFormComponent` | `authGuard` | `items.edit` |
| `/admin/item-types` | `ItemTypesComponent` | `authGuard` | — |
| `/admin/brands` | `AdminBrandsComponent` | `authGuard` | — |
| `/admin/categories` | `AdminCategoriesComponent` | `authGuard` | — |
| `/admin/home` | `HomeSectionsComponent` | `authGuard` | `settings.edit` |
| `/admin/invoices` | `InvoicesListComponent` | `authGuard` | `invoices.view` |
| `/admin/invoices/new` | `InvoiceFormComponent` | `authGuard` | `invoices.create` |
| `/admin/invoices/:id` | `InvoiceDetailComponent` | `authGuard` | `invoices.view` |
| `/admin/expenses` | `ExpensesComponent` | `authGuard` | `expenses.manage` |
| `/admin/employees` | `EmployeesComponent` | `authGuard` | `employees.manage` |
| `/admin/leads` | `LeadsComponent` | `authGuard` | `leads.manage` |
| `/admin/settings` | `AdminSettingsComponent` | `authGuard` | `settings.edit` |
| `/admin/blocked` | `BlockedComponent` | `authGuard` | — |

### Wildcard

| Path | Action |
|------|--------|
| `**` | Redirect to `/` |

## Guards

### `authGuard` (CanActivateFn)

```typescript
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/admin/login']);
};
```

### `permissionGuard` (Factory)

```typescript
export function permissionGuard(...permissions: PermissionKey[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return auth.hasAnyPermission(permissions)
      ? true
      : router.createUrlTree(['/admin/blocked']);
  };
}
```

Usage in routes:
```typescript
{
  path: 'invoices',
  canActivate: [permissionGuard('invoices.view')],
  loadComponent: () => import('./invoices-list.component')
}
```

## Navigation Flow

```
User visits slug.mobilytics.com
  → AppComponent.ngOnInit()
    → TenantService.resolve() extracts slug from hostname
    → If invalid slug → redirect /tenant-not-found
    → SettingsStore.loadSettings()
      → If tenant inactive → redirect /inactive
      → If active → apply theme, render <router-outlet>

Admin clicks sidebar link
  → authGuard checks AuthService.isAuthenticated()
    → If false → redirect /admin/login
    → If true → load lazy component
```

## Route Configuration

Routes are defined in `src/app/app.routes.ts` and provided via `provideRouter(routes, withComponentInputBinding())` in `app.config.ts`. The `withComponentInputBinding()` enables route params as `@Input()` on components.
