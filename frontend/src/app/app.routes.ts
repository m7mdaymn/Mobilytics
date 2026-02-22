import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { platformAuthGuard } from './core/guards/platform-auth.guard';

export const routes: Routes = [
  // Public storefront
  {
    path: '',
    loadComponent: () => import('./public/layouts/storefront-shell.component').then(m => m.StorefrontShellComponent),
    children: [
      { path: '', loadComponent: () => import('./public/pages/home/home.component').then(m => m.HomeComponent) },
      { path: 'catalog', loadComponent: () => import('./public/pages/catalog/catalog.component').then(m => m.CatalogComponent) },
      { path: 'type/:typeSlug', loadComponent: () => import('./public/pages/catalog/catalog.component').then(m => m.CatalogComponent) },
      { path: 'category/:slug', loadComponent: () => import('./public/pages/category/category.component').then(m => m.CategoryComponent) },
      { path: 'brands', loadComponent: () => import('./public/pages/brands/brands.component').then(m => m.BrandsComponent) },
      { path: 'brand/:slug', loadComponent: () => import('./public/pages/brands/brand-detail.component').then(m => m.BrandDetailComponent) },
      { path: 'item/:slug', loadComponent: () => import('./public/pages/item-detail/item-detail.component').then(m => m.ItemDetailComponent) },
      { path: 'compare', loadComponent: () => import('./public/pages/compare/compare.component').then(m => m.CompareComponent) },
      { path: 'policies/:key', loadComponent: () => import('./public/pages/policies/policies.component').then(m => m.PoliciesComponent) },
    ],
  },
  { path: 'inactive', loadComponent: () => import('./public/pages/inactive/inactive.component').then(m => m.InactiveComponent) },
  { path: 'tenant-not-found', loadComponent: () => import('./public/pages/tenant-not-found/tenant-not-found.component').then(m => m.TenantNotFoundComponent) },

  // Tenant Admin
  { path: 'admin/login', loadComponent: () => import('./admin/pages/login/login.component').then(m => m.LoginComponent) },
  {
    path: 'admin',
    loadComponent: () => import('./admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./admin/pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'items', loadComponent: () => import('./admin/pages/items/items-list.component').then(m => m.ItemsListComponent) },
      { path: 'items/new', loadComponent: () => import('./admin/pages/items/item-form.component').then(m => m.ItemFormComponent) },
      { path: 'items/:id/edit', loadComponent: () => import('./admin/pages/items/item-form.component').then(m => m.ItemFormComponent) },
      { path: 'item-types', loadComponent: () => import('./admin/pages/item-types/item-types.component').then(m => m.ItemTypesComponent) },
      { path: 'brands', loadComponent: () => import('./admin/pages/brands/admin-brands.component').then(m => m.AdminBrandsComponent) },
      { path: 'categories', loadComponent: () => import('./admin/pages/categories/admin-categories.component').then(m => m.AdminCategoriesComponent) },
      { path: 'home', loadComponent: () => import('./admin/pages/home-sections/home-sections.component').then(m => m.HomeSectionsComponent) },
      { path: 'invoices', loadComponent: () => import('./admin/pages/invoices/invoices-list.component').then(m => m.InvoicesListComponent) },
      { path: 'invoices/new', loadComponent: () => import('./admin/pages/invoices/invoice-form.component').then(m => m.InvoiceFormComponent) },
      { path: 'invoices/:id', loadComponent: () => import('./admin/pages/invoices/invoice-detail.component').then(m => m.InvoiceDetailComponent) },
      { path: 'expenses', loadComponent: () => import('./admin/pages/expenses/expenses.component').then(m => m.ExpensesComponent) },
      { path: 'employees', loadComponent: () => import('./admin/pages/employees/employees.component').then(m => m.EmployeesComponent) },
      { path: 'leads', loadComponent: () => import('./admin/pages/leads/leads.component').then(m => m.LeadsComponent) },
      { path: 'settings', loadComponent: () => import('./admin/pages/settings/admin-settings.component').then(m => m.AdminSettingsComponent) },
      { path: 'blocked', loadComponent: () => import('./admin/pages/blocked/blocked.component').then(m => m.BlockedComponent) },
    ],
  },

  // Platform Super Admin
  { path: 'superadmin/login', loadComponent: () => import('./platform/pages/login/platform-login.component').then(m => m.PlatformLoginComponent) },
  {
    path: 'superadmin',
    loadComponent: () => import('./platform/layout/platform-layout.component').then(m => m.PlatformLayoutComponent),
    canActivate: [platformAuthGuard],
    children: [
      { path: '', loadComponent: () => import('./platform/pages/dashboard/platform-dashboard.component').then(m => m.PlatformDashboardComponent) },
      { path: 'tenants', loadComponent: () => import('./platform/pages/tenants/tenants-list.component').then(m => m.TenantsListComponent) },
      { path: 'tenants/create', loadComponent: () => import('./platform/pages/tenants/tenant-create.component').then(m => m.TenantCreateComponent) },
      { path: 'tenants/:id', loadComponent: () => import('./platform/pages/tenants/tenant-detail.component').then(m => m.TenantDetailComponent) },
      { path: 'plans', loadComponent: () => import('./platform/pages/plans/plans.component').then(m => m.PlansComponent) },
      { path: 'subscriptions', loadComponent: () => import('./platform/pages/subscriptions/subscriptions.component').then(m => m.SubscriptionsComponent) },
      { path: 'features', loadComponent: () => import('./platform/pages/features/features.component').then(m => m.FeaturesComponent) },
    ],
  },

  // Fallback
  { path: '**', redirectTo: '' },
];
