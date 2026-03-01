export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
}

export interface UnifiedLoginResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  tenantSlug: string;
  tenantName: string;
  tenantActive: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'Owner' | 'Manager' | 'Employee';
  permissions: string[];
  tenantId: string;
}

export type PermissionKey =
  | 'items.create'
  | 'items.edit'
  | 'items.delete'
  | 'itemtypes.manage'
  | 'brands.manage'
  | 'categories.manage'
  | 'home.manage'
  | 'invoices.create'
  | 'invoices.refund'
  | 'expenses.manage'
  | 'employees.manage'
  | 'leads.manage'
  | 'reports.view'
  | 'settings.edit';

export const ALL_PERMISSIONS: PermissionKey[] = [
  'items.create', 'items.edit', 'items.delete',
  'itemtypes.manage', 'brands.manage', 'categories.manage',
  'home.manage', 'invoices.create', 'invoices.refund',
  'expenses.manage', 'employees.manage', 'leads.manage',
  'reports.view', 'settings.edit',
];
