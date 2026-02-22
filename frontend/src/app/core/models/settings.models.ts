export interface StoreSettings {
  id: string;
  tenantId: string;
  storeName: string;
  slug: string;
  storeSlug: string;
  tagline: string;
  isActive: boolean;

  // Theme (flat — used by settings store)
  themeId: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;

  // Theme (nested — used by admin settings)
  theme: ThemeSettings;

  // Contact
  phone: string;
  contactPhone: string;
  contactEmail: string;
  whatsappNumber: string;
  address: string;
  googleMapsUrl: string;
  workingHours: string;

  // Footer (flat)
  footerText: string;
  mapUrl: string;
  socialLinks: SocialLinks;

  // Footer (nested)
  footer: FooterSettings;

  // WhatsApp templates (flat)
  whatsappInquiryTemplate: string;
  whatsappFollowUpTemplate: string;

  // WhatsApp (nested)
  whatsapp: WhatsAppSettings;

  // PWA (flat)
  pwaShortName: string;
  pwaDescription: string;

  // PWA (nested)
  pwa: PwaSettings;

  // Policies
  policies: Record<string, string>;

  // Branding
  canRemovePoweredBy: boolean;
  showPoweredBy: boolean;
  logoUrl: string;
  faviconUrl: string;

  // Currency
  currency: string;

  // Subscription
  subscriptionStatus: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
}

export interface ThemeSettings {
  themeId: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface FooterSettings {
  showPoweredBy: boolean;
  showMap: boolean;
  footerText: string;
  mapUrl: string;
  socialLinks: SocialLinks;
  address: string;
  workingHours: string;
}

export interface WhatsAppSettings {
  phoneNumber: string;
  defaultMessage: string;
  showOnItemCard: boolean;
  showFloatingButton: boolean;
  whatsappNumber: string;
  whatsappInquiryTemplate: string;
  whatsappFollowUpTemplate: string;
}

export interface PwaSettings {
  appName: string;
  shortName: string;
  themeColor: string;
  backgroundColor: string;
  pwaShortName: string;
  pwaDescription: string;
}
