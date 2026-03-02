// ── Public Settings (from /Public/settings) ──
export interface StoreSettings {
  storeName: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  whatsAppNumber: string | null;
  phoneNumber: string | null;
  themePresetId: number;
  systemThemeId: number;
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
  offerBannerText: string | null;
  offerBannerUrl: string | null;
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
  systemThemeId: number;
  currencyCode: string;
  footerAddress: string | null;
  workingHours: string | null;
  socialLinksJson: string | null;
  policiesJson: string | null;
  mapUrl: string | null;
  headerNoticeText: string | null;
  offerBannerText: string | null;
  offerBannerUrl: string | null;
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

// ── Theme Presets (must match backend StoreSettings.ColorPresets / SystemPresets) ──
export interface ThemePreset {
  id: number;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  description: string;
}

export interface SystemTheme {
  id: number;
  name: string;
  description: string;
  icon: string; // emoji
}

// Color themes (black & white only)
export const COLOR_THEMES: ThemePreset[] = [
  { id: 1, name: 'Classic',       primary: '#000000', secondary: '#111111', accent: '#000000', description: 'Pure black on white' },
  { id: 2, name: 'Soft Black',    primary: '#1a1a1a', secondary: '#333333', accent: '#1a1a1a', description: 'Soft black, clean look' },
];

// System themes (UI style)
export const SYSTEM_THEMES: SystemTheme[] = [
  { id: 2, name: 'Neumorphism',    description: 'Soft extruded surfaces on matte background',            icon: '🫧' },
  { id: 4, name: 'Slate Minimal',  description: 'Ultra-clean Apple-inspired, frosted header',             icon: '🍎' },
];

// Backward compat alias
export const THEME_PRESETS: ThemePreset[] = COLOR_THEMES;

export const DEFAULT_SYSTEM_THEME_ID = 4;
