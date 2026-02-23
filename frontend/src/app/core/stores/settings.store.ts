import { Injectable, signal, computed, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Inject } from '@angular/core';
import { Observable, tap, catchError, of } from 'rxjs';
import { ApiService } from '../services/api.service';
import { StoreSettings, THEME_PRESETS } from '../models/settings.models';

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  private readonly _settings = signal<StoreSettings | null>(null);
  private readonly _loading = signal(true);
  private readonly _error = signal<string | null>(null);

  readonly settings = this._settings.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isActive = computed(() => this._settings()?.isActive ?? false);
  readonly storeName = computed(() => this._settings()?.storeName ?? 'Store');
  readonly currency = computed(() => this._settings()?.currencyCode ?? 'EGP');
  readonly themePresetId = computed(() => this._settings()?.themePresetId ?? 1);
  readonly whatsappNumber = computed(() => this._settings()?.whatsAppNumber ?? '');
  readonly showPoweredBy = computed(() => this._settings()?.poweredByEnabled ?? true);
  readonly phone = computed(() => this._settings()?.phoneNumber ?? '');
  readonly address = computed(() => this._settings()?.footerAddress ?? '');
  readonly workingHours = computed(() => this._settings()?.workingHours ?? '');
  readonly mapUrl = computed(() => this._settings()?.mapUrl ?? '');
  readonly socialLinks = computed<Record<string, string>>(() => {
    const json = this._settings()?.socialLinksJson;
    try { return json ? JSON.parse(json) : {}; } catch { return {}; }
  });

  constructor(
    private readonly api: ApiService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  loadSettings(): Observable<StoreSettings | null> {
    this._loading.set(true);
    return this.api.get<StoreSettings>('/Public/settings').pipe(
      tap(settings => {
        this._settings.set(settings);
        this._loading.set(false);
        this._error.set(null);
        this.applyTheme(settings);
      }),
      catchError(err => {
        this._loading.set(false);
        this._error.set(err.message || 'Failed to load store settings');
        return of(null);
      })
    );
  }

  private applyTheme(settings: StoreSettings): void {
    const root = this.document.documentElement;

    // Backend resolves colors from preset — use them directly
    const primary = settings.primaryColor || '#111827';
    const secondary = settings.secondaryColor || '#374151';
    const accent = settings.accentColor || '#f59e0b';

    root.style.setProperty('--color-primary', primary);
    root.style.setProperty('--color-primary-hover', this.darken(primary, 15));
    root.style.setProperty('--color-primary-light', this.lighten(primary, 85));
    root.style.setProperty('--color-secondary', secondary);
    root.style.setProperty('--color-secondary-hover', this.darken(secondary, 15));
    root.style.setProperty('--color-accent', accent);
    root.style.setProperty('--color-accent-hover', this.darken(accent, 15));

    // Theme wrapper class
    this.document.body.classList.remove('theme-1', 'theme-2', 'theme-3', 'theme-4', 'theme-5', 'theme-6');
    this.document.body.classList.add(`theme-${settings.themePresetId || 1}`);

    // Document title
    this.document.title = `${settings.storeName} | Mobilytics`;

    // Meta theme-color (PWA)
    let meta = this.document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!meta) {
      meta = this.document.createElement('meta');
      meta.name = 'theme-color';
      this.document.head.appendChild(meta);
    }
    meta.content = primary;

    // Dynamic manifest for PWA
    this.updateManifest(settings, primary);
  }

  private updateManifest(settings: StoreSettings, primary: string): void {
    let pwa: { shortName?: string; description?: string } = {};
    try { pwa = settings.pwaSettingsJson ? JSON.parse(settings.pwaSettingsJson) : {}; } catch {}

    const manifest = {
      name: settings.storeName || 'Mobilytics Store',
      short_name: pwa.shortName || settings.storeName || 'Store',
      description: pwa.description || `${settings.storeName} - Mobile Store`,
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: primary,
      icons: [
        { src: 'icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
        { src: 'icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
        { src: 'icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
        { src: 'icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
        { src: 'icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
        { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
        { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    };

    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    let link = this.document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (link) {
      URL.revokeObjectURL(link.href);
      link.href = url;
    } else {
      link = this.document.createElement('link');
      link.rel = 'manifest';
      link.href = url;
      this.document.head.appendChild(link);
    }
  }

  private darken(hex: string, percent: number): string {
    return this.adjustColor(hex, -percent);
  }

  private lighten(hex: string, percent: number): string {
    return this.adjustColor(hex, percent);
  }

  private adjustColor(hex: string, percent: number): string {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const num = parseInt(hex, 16);
    let r = (num >> 16) + Math.round(2.55 * percent);
    let g = ((num >> 8) & 0x00ff) + Math.round(2.55 * percent);
    let b = (num & 0x0000ff) + Math.round(2.55 * percent);
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
}
