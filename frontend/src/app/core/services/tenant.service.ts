import { Injectable, signal, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

const SLUG_PATTERN = /^[a-z0-9-]+$/;

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly api = inject(ApiService);

  private readonly _slug = signal<string | null>(null);
  private readonly _primaryDomain = signal<string | null>(null);
  private readonly _storefrontUrl = signal<string>('');
  private readonly _adminUrl = signal('/admin');
  private readonly _isValid = signal(false);
  private readonly _isResolving = signal(false);

  readonly slug = this._slug.asReadonly();
  readonly primaryDomain = this._primaryDomain.asReadonly();
  readonly storefrontUrl = this._storefrontUrl.asReadonly();
  readonly adminAbsoluteUrl = this._adminUrl.asReadonly();
  readonly isValid = this._isValid.asReadonly();
  readonly isResolving = this._isResolving.asReadonly();
  readonly resolved = computed(() => this._isValid() && this._slug() !== null);

  // Storefront routes now live at tenant host root.
  readonly storeUrl = computed(() => '');

  // Tenant admin routes now live at /admin on tenant host.
  readonly adminUrl = computed(() => '/admin');

  isPlatformHost(): boolean {
    const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
    const root = (environment.appDomain || 'mobilytics.app').toLowerCase();
    if (!host) return true;
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (host === root || host === `www.${root}` || host === `admin.${root}`) return true;
    return false;
  }

  isTenantHost(): boolean {
    return !this.isPlatformHost();
  }

  setSlug(slug: string | null): boolean {
    if (!slug || !SLUG_PATTERN.test(slug.toLowerCase())) {
      this._slug.set(null);
      this._primaryDomain.set(null);
      this._storefrontUrl.set('');
      this._adminUrl.set('/admin');
      this._isValid.set(false);
      return false;
    }

    const normalized = slug.toLowerCase();
    this._slug.set(normalized);
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      this._storefrontUrl.set(origin);
      this._adminUrl.set(`${origin}/admin`);
      this._primaryDomain.set(window.location.hostname.toLowerCase());
    }
    this._isValid.set(true);
    return true;
  }

  async resolveFromHost(): Promise<boolean> {
    if (!this.isTenantHost()) {
      this.clear();
      return false;
    }

    this._isResolving.set(true);
    try {
      const res = await firstValueFrom(this.api.get<any>('/Public/tenant-context'));
      const slugOk = this.setSlug(res?.slug ?? null);
      if (!slugOk) return false;

      if (res?.primaryDomain) {
        this._primaryDomain.set(String(res.primaryDomain).toLowerCase());
      }
      if (res?.storefrontUrl) {
        this._storefrontUrl.set(String(res.storefrontUrl));
      }
      if (res?.adminUrl) {
        this._adminUrl.set(String(res.adminUrl));
      }

      return true;
    } catch {
      this.clear();
      return false;
    } finally {
      this._isResolving.set(false);
    }
  }

  /** Clear tenant context */
  clear(): void {
    this._slug.set(null);
    this._primaryDomain.set(null);
    this._storefrontUrl.set('');
    this._adminUrl.set('/admin');
    this._isValid.set(false);
  }
}
