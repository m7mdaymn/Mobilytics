// ── Public Settings (from /Public/settings) ──
export interface StoreSettings {
  storeName: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  whatsAppNumber: string | null;
  phoneNumber: string | null;
  themePresetId: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  currencyCode: string;
  footerAddress: string | null;
  workingHours: string | null;
  socialLinksJson: string | null;
  policiesJson: string | null;
  mapUrl: string | null;
  pwaSettingsJson: string | null;
  whatsAppTemplatesJson: string | null;
  isActive: boolean;
  poweredByEnabled: boolean;
  headerNoticeText: string | null;
  aboutTitle: string | null;
  aboutDescription: string | null;
  aboutImageUrl: string | null;
  heroBannersJson: string | null;
  testimonialsJson: string | null;
  faqJson: string | null;
  trustBadgesJson: string | null;
}

// ── Admin Settings (from /Settings) ──
export interface AdminStoreSettings {
  storeName: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  whatsAppNumber: string | null;
  phoneNumber: string | null;
  themePresetId: number;
  currencyCode: string;
  footerAddress: string | null;
  workingHours: string | null;
  socialLinksJson: string | null;
  policiesJson: string | null;
  mapUrl: string | null;
  headerNoticeText: string | null;
  pwaSettingsJson: string | null;
  whatsAppTemplatesJson: string | null;
  aboutTitle: string | null;
  aboutDescription: string | null;
  aboutImageUrl: string | null;
  heroBannersJson: string | null;
  testimonialsJson: string | null;
  faqJson: string | null;
  trustBadgesJson: string | null;
}

// ── Parsed helper interfaces for admin editing ──
export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
}

export interface PwaSettings {
  appName: string;
  shortName: string;
  themeColor: string;
  backgroundColor: string;
}

export interface WhatsAppTemplates {
  inquiryTemplate: string;
  followUpTemplate: string;
}

// ── Theme Presets (must match backend StoreSettings.Presets) ──
export interface ThemePreset {
  id: number;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  description: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 1, name: 'Midnight Pro',   primary: '#111827', secondary: '#374151', accent: '#f59e0b', description: 'Sharp, editorial, luxury feel' },
  { id: 2, name: 'Ocean Blue',     primary: '#1e40af', secondary: '#1e3a5f', accent: '#06b6d4', description: 'Tech-forward, organized, dense' },
  { id: 3, name: 'Forest Green',   primary: '#065f46', secondary: '#064e3b', accent: '#34d399', description: 'Bold deals, promotions first' },
  { id: 4, name: 'Royal Purple',   primary: '#5b21b6', secondary: '#4c1d95', accent: '#a78bfa', description: 'Rich, elegant gradients' },
  { id: 5, name: 'Sunset Orange',  primary: '#c2410c', secondary: '#9a3412', accent: '#fb923c', description: 'Warm, energetic, punchy CTAs' },
  { id: 6, name: 'Slate Minimal',  primary: '#0f172a', secondary: '#334155', accent: '#94a3b8', description: 'Ultra-clean, Apple-inspired' },
  { id: 7, name: 'Rose Gold',      primary: '#9f1239', secondary: '#881337', accent: '#fda4af', description: 'Luxurious, feminine, premium' },
  { id: 8, name: 'Arctic Blue',    primary: '#0369a1', secondary: '#075985', accent: '#7dd3fc', description: 'Crisp, fresh, modern' },
];
