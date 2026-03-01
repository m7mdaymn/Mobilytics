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
  supportPhone?: string;
  supportWhatsApp?: string;
  address?: string;
  mapUrl?: string;
  createdAt: string;
  updatedAt: string;
  subscription?: TenantSubscription;
  owner?: TenantOwner;
  features?: TenantFeatures;
  storeSettings?: TenantStoreSettings;
}

export interface TenantOwner {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsApp?: string;
}

export interface TenantStoreSettings {
  storeName: string;
  logoUrl?: string;
  bannerUrl?: string;
  whatsAppNumber?: string;
  phoneNumber?: string;
  themePresetId: number;
  currencyCode: string;
  footerAddress?: string;
  workingHours?: string;
  socialLinksJson?: string;
  policiesJson?: string;
  mapUrl?: string;
  headerNoticeText?: string;
  aboutTitle?: string;
  aboutDescription?: string;
  aboutImageUrl?: string;
  heroBannersJson?: string;
  testimonialsJson?: string;
  faqJson?: string;
  trustBadgesJson?: string;
  whatsAppTemplatesJson?: string;
  pwaSettingsJson?: string;
}

export interface UpdateStoreSettingsRequest {
  storeName: string;
  logoUrl?: string;
  bannerUrl?: string;
  whatsAppNumber?: string;
  phoneNumber?: string;
  themePresetId: number;
  currencyCode: string;
  footerAddress?: string;
  workingHours?: string;
  socialLinksJson?: string;
  policiesJson?: string;
  mapUrl?: string;
  headerNoticeText?: string;
  aboutTitle?: string;
  aboutDescription?: string;
  aboutImageUrl?: string;
  heroBannersJson?: string;
  testimonialsJson?: string;
  faqJson?: string;
  trustBadgesJson?: string;
  whatsAppTemplatesJson?: string;
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
  supportPhone?: string;
  supportWhatsApp?: string;
  address?: string;
  mapUrl?: string;
}

export interface UpdateTenantRequest {
  name: string;
  slug?: string;
  supportPhone?: string;
  supportWhatsApp?: string;
  address?: string;
  mapUrl?: string;
}

export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  activationFee: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Computed helper — annual = monthly * 12 * 0.8 (20% discount) */
export function planAnnualPrice(monthly: number): number {
  return Math.round(monthly * 12 * 0.8);
}

/** Form-facing model for plan create/edit */
export interface CreatePlanFormData {
  name: string;
  priceMonthly: number;
  activationFee: number;
}

export interface TenantFeatures {
  [key: string]: boolean;
}

export interface StartTrialRequest {
  planId: string;
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
  expiredTenants: number;
  expiringSubscriptions: number;
  monthlyRevenue: number;
  totalRevenue: number;
  totalLeads: number;
  recentTenants: Tenant[];
  revenueChart: RevenueChartPoint[];
  recentInvoices: PlatformInvoice[];
  tenantRevenueBreakdown: TenantRevenueBreakdown[];
}

export interface RevenueChartPoint {
  label: string;
  amount: number;
}

export interface TenantRevenueBreakdown {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  planName: string;
  subscriptionStatus: string;
  totalFees: number;
  totalSubscriptionRevenue: number;
  totalDiscount: number;
  totalPaid: number;
  totalMonths: number;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  invoiceCount: number;
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
export type SubscriptionStatus = 'Trial' | 'Active' | 'Grace' | 'Expired' | 'Suspended';

// ── Onboarding ──────────────────────────────────────────────

export interface OnboardTenantRequest {
  storeName: string;
  slug: string;
  storePhone?: string;
  storeWhatsApp?: string;
  address?: string;
  logoUrl?: string;
  socialLinksJson?: string;
  mapUrl?: string;
  themePresetId: number;
  currencyCode: string;
  workingHours?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  ownerWhatsApp?: string;
  ownerPassword: string;
  planId: string;
  durationMonths: number;
  isTrial: boolean;
  activationFeePaid: number;
  subscriptionAmountPaid: number;
  discount: number;
  paymentMethod: PaymentMethod;
  paymentNotes?: string;
}

export interface OnboardTenantResponse {
  tenant: Tenant;
  invoice?: PlatformInvoice;
}

// ── Invoices ────────────────────────────────────────────────

export interface PlatformInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  tenantSlug?: string;
  planName: string;
  invoiceType: string;
  months: number;
  activationFee: number;
  subscriptionAmount: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  createdAt: string;
}

// ── Store Requests (Leads) ──────────────────────────────────

export interface StoreRequest {
  id: string;
  storeName: string;
  category: string;
  location: string;
  ownerName: string;
  email: string;
  phone: string;
  numberOfStores: string;
  monthlyRevenue?: string;
  source?: string;
  status: RegistrationStatus;
  approvalNotes?: string;
  approvedAt?: string;
  submittedAt: string;
  rejectionReason?: string;
}

export interface UpdateStoreRequestStatusRequest {
  status: string;
  notes?: string;
}

export type PaymentMethod = 'Cash' | 'Instapay' | 'BankTransfer' | 'Other';
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Partial';
export type RegistrationStatus = 'PendingApproval' | 'Approved' | 'Rejected' | 'OnHold';
