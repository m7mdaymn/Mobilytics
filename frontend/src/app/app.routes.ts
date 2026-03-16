import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { platformAuthGuard } from './core/guards/platform-auth.guard';
import { platformHostGuard } from './core/guards/platform-host.guard';
import { platformRoleGuard } from './core/guards/platform-role.guard';
import { tenantHostGuard } from './core/guards/tenant-host.guard';
import { tenantResolverGuard } from './core/guards/tenant-resolver.guard';

export const routes: Routes = [
  // Platform root host behavior
  { path: '', canMatch: [platformHostGuard], loadComponent: () => import('./public/pages/landing/landing.component').then(m => m.LandingComponent) },
  { path: 'landing', canMatch: [platformHostGuard], redirectTo: '' },
  { path: 'login', canMatch: [platformHostGuard], loadComponent: () => import('./public/pages/login/unified-login.component').then(m => m.UnifiedLoginComponent) },

  // Tenant host behavior (host-resolved tenant at route root)
  { path: 'admin/login', canMatch: [tenantHostGuard], canActivate: [tenantResolverGuard], loadComponent: () => import('./admin/pages/login/login.component').then(m => m.LoginComponent) },
  {
    path: 'admin',
    canMatch: [tenantHostGuard],
    canActivate: [tenantResolverGuard],
    loadComponent: () => import('./admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./admin/pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
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
      { path: 'audit', canActivate: [permissionGuard('settings.edit')], loadComponent: () => import('./admin/pages/audit/audit.component').then(m => m.AuditComponent) },
      { path: 'onboarding', loadComponent: () => import('./admin/pages/onboarding/onboarding.component').then(m => m.OnboardingComponent) },
    ],
  },

  {
    path: '',
    canMatch: [tenantHostGuard],
    canActivate: [tenantResolverGuard],
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
      { path: '**', redirectTo: '' },
    ],
  },

  // Legacy path redirect handling only (minimal).
  { path: 'store/:slug/admin/login', redirectTo: 'admin/login' },
  { path: 'store/:slug/admin', redirectTo: 'admin' },
  { path: 'store/:slug', redirectTo: '' },

  { path: 'inactive', loadComponent: () => import('./public/pages/inactive/inactive.component').then(m => m.InactiveComponent) },
  { path: 'tenant-not-found', loadComponent: () => import('./public/pages/tenant-not-found/tenant-not-found.component').then(m => m.TenantNotFoundComponent) },

  // Platform Super Admin (NO tenant context needed)
  { path: 'superadmin/login', canMatch: [platformHostGuard], loadComponent: () => import('./platform/pages/login/platform-login.component').then(m => m.PlatformLoginComponent) },
  {
    path: 'superadmin',
    canMatch: [platformHostGuard],
    loadComponent: () => import('./platform/layout/platform-layout.component').then(m => m.PlatformLayoutComponent),
    canActivate: [platformAuthGuard],
    children: [
      { path: '', canActivate: [platformRoleGuard('SuperAdmin')], loadComponent: () => import('./platform/pages/dashboard/platform-dashboard.component').then(m => m.PlatformDashboardComponent) },
      { path: 'tenants', loadComponent: () => import('./platform/pages/tenants/tenants-list.component').then(m => m.TenantsListComponent) },
      { path: 'tenants/create', loadComponent: () => import('./platform/pages/tenants/tenant-create.component').then(m => m.TenantCreateComponent) },
      { path: 'tenants/:id', loadComponent: () => import('./platform/pages/tenants/tenant-detail.component').then(m => m.TenantDetailComponent) },
      { path: 'plans', canActivate: [platformRoleGuard('SuperAdmin')], loadComponent: () => import('./platform/pages/plans/plans.component').then(m => m.PlansComponent) },
      { path: 'subscriptions', canActivate: [platformRoleGuard('SuperAdmin')], loadComponent: () => import('./platform/pages/subscriptions/subscriptions.component').then(m => m.SubscriptionsComponent) },
    ],
  },

  // Fallback
  { path: '**', redirectTo: '' }
];
