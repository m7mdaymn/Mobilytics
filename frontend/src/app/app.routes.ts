import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { platformAuthGuard } from './core/guards/platform-auth.guard';
import { tenantResolverGuard } from './core/guards/tenant-resolver.guard';

export const routes: Routes = [
  // Landing page - DEFAULT
  { path: '', loadComponent: () => import('./public/pages/landing/landing.component').then(m => m.LandingComponent) },
  { path: 'landing', redirectTo: '' },

  // Unified login (no tenant context needed)
  { path: 'login', loadComponent: () => import('./public/pages/login/unified-login.component').then(m => m.UnifiedLoginComponent) },

  // ── PATH-BASED TENANCY: /store/:slug/* ──
  {
    path: 'store/:slug',
    canActivate: [tenantResolverGuard],
    children: [
      // Public storefront
      {
        path: '',
        loadComponent: () => import('./public/layouts/storefront-shell.component').then(m => m.StorefrontShellComponent),
        children: [
          { path: '', loadComponent: () => import('./public/pages/home/home.component').then(m => m.HomeComponent) },
          { path: 'catalog', loadComponent: () => import('./public/pages/catalog/catalog.component').then(m => m.CatalogComponent) },
          { path: 'type/:typeSlug', loadComponent: () => import('./public/pages/catalog/catalog.component').then(m => m.CatalogComponent) },
          { path: 'category/:catSlug', loadComponent: () => import('./public/pages/category/category.component').then(m => m.CategoryComponent) },
          { path: 'brands', loadComponent: () => import('./public/pages/brands/brands.component').then(m => m.BrandsComponent) },
          { path: 'brand/:brandSlug', loadComponent: () => import('./public/pages/brands/brand-detail.component').then(m => m.BrandDetailComponent) },
          { path: 'item/:itemSlug', loadComponent: () => import('./public/pages/item-detail/item-detail.component').then(m => m.ItemDetailComponent) },
          { path: 'compare', loadComponent: () => import('./public/pages/compare/compare.component').then(m => m.CompareComponent) },
          { path: 'policies/:key', loadComponent: () => import('./public/pages/policies/policies.component').then(m => m.PoliciesComponent) },
          { path: 'about', loadComponent: () => import('./public/pages/about/about.component').then(m => m.AboutComponent) },
        ],
      },

      // Tenant Admin (nested under /store/:slug/admin)
      { path: 'admin/login', loadComponent: () => import('./admin/pages/login/login.component').then(m => m.LoginComponent) },
      {
        path: 'admin',
        loadComponent: () => import('./admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        canActivate: [authGuard],
        children: [
          { path: '', loadComponent: () => import('./admin/pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
          { path: 'items', canActivate: [permissionGuard('items.create', 'items.edit')], loadComponent: () => import('./admin/pages/items/items-list.component').then(m => m.ItemsListComponent) },
          { path: 'items/new', canActivate: [permissionGuard('items.create')], loadComponent: () => import('./admin/pages/items/item-form.component').then(m => m.ItemFormComponent) },
          { path: 'items/:id/edit', canActivate: [permissionGuard('items.edit')], loadComponent: () => import('./admin/pages/items/item-form.component').then(m => m.ItemFormComponent) },
          { path: 'item-types', canActivate: [permissionGuard('itemtypes.manage')], loadComponent: () => import('./admin/pages/item-types/item-types.component').then(m => m.ItemTypesComponent) },
          { path: 'brands', canActivate: [permissionGuard('brands.manage')], loadComponent: () => import('./admin/pages/brands/admin-brands.component').then(m => m.AdminBrandsComponent) },
          { path: 'categories', canActivate: [permissionGuard('categories.manage')], loadComponent: () => import('./admin/pages/categories/admin-categories.component').then(m => m.AdminCategoriesComponent) },
          { path: 'invoices', canActivate: [permissionGuard('invoices.create')], loadComponent: () => import('./admin/pages/invoices/invoices-list.component').then(m => m.InvoicesListComponent) },
          { path: 'invoices/new', canActivate: [permissionGuard('invoices.create')], loadComponent: () => import('./admin/pages/invoices/invoice-form.component').then(m => m.InvoiceFormComponent) },
          { path: 'invoices/:id', canActivate: [permissionGuard('invoices.create')], loadComponent: () => import('./admin/pages/invoices/invoice-detail.component').then(m => m.InvoiceDetailComponent) },
          { path: 'expenses', canActivate: [permissionGuard('expenses.manage')], loadComponent: () => import('./admin/pages/expenses/expenses.component').then(m => m.ExpensesComponent) },
          { path: 'employees', canActivate: [permissionGuard('employees.manage')], loadComponent: () => import('./admin/pages/employees/employees.component').then(m => m.EmployeesComponent) },
          { path: 'leads', canActivate: [permissionGuard('leads.manage')], loadComponent: () => import('./admin/pages/leads/leads.component').then(m => m.LeadsComponent) },
          { path: 'settings', canActivate: [permissionGuard('settings.edit')], loadComponent: () => import('./admin/pages/settings/admin-settings.component').then(m => m.AdminSettingsComponent) },
          { path: 'installments', canActivate: [permissionGuard('settings.edit')], loadComponent: () => import('./admin/pages/installments/installments.component').then(m => m.InstallmentsComponent) },
          { path: 'approvals', loadComponent: () => import('./admin/pages/store-approvals/store-approvals.component').then(m => m.StoreApprovalsComponent) },
          { path: 'blocked', loadComponent: () => import('./admin/pages/blocked/blocked.component').then(m => m.BlockedComponent) },
          { path: 'onboarding', loadComponent: () => import('./admin/pages/onboarding/onboarding.component').then(m => m.OnboardingComponent) },
        ],
      },
    ],
  },

  { path: 'inactive', loadComponent: () => import('./public/pages/inactive/inactive.component').then(m => m.InactiveComponent) },
  { path: 'tenant-not-found', loadComponent: () => import('./public/pages/tenant-not-found/tenant-not-found.component').then(m => m.TenantNotFoundComponent) },

  // Platform Super Admin (NO tenant context needed)
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
    ],
  },

  // Fallback
  { path: '**', redirectTo: '' },
];
