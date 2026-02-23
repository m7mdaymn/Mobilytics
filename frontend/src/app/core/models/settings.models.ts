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
  pwaSettingsJson: string | null;
  whatsAppTemplatesJson: string | null;
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
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 1, name: 'Midnight Pro', primary: '#111827', secondary: '#374151', accent: '#f59e0b' },
  { id: 2, name: 'Ocean Blue', primary: '#1e40af', secondary: '#1e3a5f', accent: '#06b6d4' },
  { id: 3, name: 'Forest Green', primary: '#065f46', secondary: '#064e3b', accent: '#34d399' },
  { id: 4, name: 'Royal Purple', primary: '#5b21b6', secondary: '#4c1d95', accent: '#a78bfa' },
  { id: 5, name: 'Sunset Orange', primary: '#c2410c', secondary: '#9a3412', accent: '#fb923c' },
  { id: 6, name: 'Slate Minimal', primary: '#0f172a', secondary: '#334155', accent: '#94a3b8' },
];
