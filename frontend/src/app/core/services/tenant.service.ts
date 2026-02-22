import { Injectable, signal, computed, isDevMode } from '@angular/core';

const RESERVED_SUBDOMAINS = ['www', 'api', 'admin', 'static'];
const SLUG_PATTERN = /^[a-z0-9-]+$/;
const OVERRIDE_KEY = 'MOBILYTICS_TENANT_OVERRIDE';

/**
 * Known root/preview domains where tenant slug cannot be extracted from subdomain.
 * On these hosts, tenant slug is resolved via ?tenant= query param or localStorage.
 */
const FALLBACK_DOMAINS = [
  'mobilytics.vercel.app',
  'localhost',
];

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly _slug = signal<string | null>(null);
  private readonly _isValid = signal(false);
  private readonly _isReserved = signal(false);

  readonly slug = this._slug.asReadonly();
  readonly isValid = this._isValid.asReadonly();
  readonly isReserved = this._isReserved.asReadonly();
  readonly resolved = computed(() => this._isValid() && this._slug() !== null);

  constructor() {
    this.resolve();
  }

  resolve(): void {
    let slug = this.extractFromHostname();

    // On fallback domains (Vercel root, localhost, etc.) or in dev mode,
    // allow query param and localStorage overrides for tenant slug.
    if (this.isFallbackDomain() || isDevMode()) {
      const queryOverride = new URLSearchParams(window.location.search).get('tenant');
      if (queryOverride) {
        slug = queryOverride.toLowerCase();
        // Persist so subsequent navigations keep the slug
        localStorage.setItem(OVERRIDE_KEY, slug);
      }
      const storageOverride = localStorage.getItem(OVERRIDE_KEY);
      if (storageOverride) {
        slug = storageOverride.toLowerCase();
      }
    }

    if (!slug) {
      this._slug.set(null);
      this._isValid.set(false);
      this._isReserved.set(false);
      return;
    }

    if (RESERVED_SUBDOMAINS.includes(slug)) {
      this._slug.set(slug);
      this._isValid.set(false);
      this._isReserved.set(true);
      return;
    }

    if (!SLUG_PATTERN.test(slug)) {
      this._slug.set(null);
      this._isValid.set(false);
      this._isReserved.set(false);
      return;
    }

    this._slug.set(slug);
    this._isValid.set(true);
    this._isReserved.set(false);
  }

  private extractFromHostname(): string | null {
    const hostname = window.location.hostname;

    // localhost or IP => no subdomain (use fallback overrides)
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return null;
    }

    // Fallback domain (e.g. mobilytics.vercel.app) => no subdomain extraction
    if (this.isFallbackDomain()) {
      return null;
    }

    const parts = hostname.split('.');
    // Expect: slug.mobilytics.com  (3+ parts)
    if (parts.length >= 3) {
      return parts[0].toLowerCase();
    }

    // mobilytics.com (2 parts) => no tenant
    return null;
  }

  /** Check if current hostname is a root/preview domain that uses fallback resolution */
  private isFallbackDomain(): boolean {
    const hostname = window.location.hostname;
    return FALLBACK_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`));
  }

  /** Set override for dev/testing */
  setOverride(slug: string): void {
    localStorage.setItem(OVERRIDE_KEY, slug);
    this.resolve();
  }

  clearOverride(): void {
    localStorage.removeItem(OVERRIDE_KEY);
    this.resolve();
  }
}
