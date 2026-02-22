// Platform (Super Admin) Models

export interface PlatformLoginRequest {
  email: string;
  password: string;
}

export interface PlatformLoginResponse {
  token: string;
  expiresAt: string;
}

export interface PlatformUser {
  id: string;
  email: string;
  name: string;
  role: 'SuperAdmin';
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  subscription?: TenantSubscription;
  owner?: TenantOwner;
}

export interface TenantOwner {
  id: string;
  name: string;
  email: string;
}

export interface TenantSubscription {
  id: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  trialEndsAt?: string;
  graceEndsAt?: string;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerName: string;
}

export interface UpdateTenantRequest {
  name: string;
  slug?: string;
}

export interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  activationFee: number;
  isActive: boolean;
  limits: PlanLimits;
  features: PlanFeatures;
  createdAt: string;
  updatedAt: string;
}

export interface PlanLimits {
  maxItems: number;
  maxEmployees: number;
  maxImages: number;
  maxStorageMB: number;
}

export interface PlanFeatures {
  canRemovePoweredBy: boolean;
  advancedReports: boolean;
  customDomain: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export interface CreatePlanRequest {
  name: string;
  monthlyPrice: number;
  activationFee: number;
  limits: PlanLimits;
  features: PlanFeatures;
}

export interface TenantFeatures {
  canRemovePoweredBy: boolean;
  advancedReports: boolean;
  customDomain: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export interface StartTrialRequest {
  durationDays: number;
  notes?: string;
}

export interface ActivateSubscriptionRequest {
  planId: string;
  months: number;
  paymentAmount: number;
  notes?: string;
}

export interface RenewSubscriptionRequest {
  months: number;
  paymentAmount: number;
  notes?: string;
}

export interface PlatformDashboard {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  trialTenants: number;
  expiringSubscriptions: number;
  monthlyRevenue: number;
  totalLeads: number;
  recentTenants: Tenant[];
}

export interface ExpiringSubscription {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  planName: string;
  endDate: string;
  daysRemaining: number;
}

export type TenantStatus = 'Active' | 'Suspended' | 'Pending';
export type SubscriptionStatus = 'Trial' | 'Active' | 'Grace' | 'Expired' | 'Cancelled';
