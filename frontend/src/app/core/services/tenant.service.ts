import { Injectable, signal, computed } from '@angular/core';

const SLUG_PATTERN = /^[a-z0-9-]+$/;

/**
 * PATH-BASED tenant resolution.
 * Slug is extracted from the URL path: /store/{slug}/...
 * The tenantResolverGuard calls setSlug() after extracting from route params.
 */
@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly _slug = signal<string | null>(null);
  private readonly _isValid = signal(false);

  readonly slug = this._slug.asReadonly();
  readonly isValid = this._isValid.asReadonly();
  readonly resolved = computed(() => this._isValid() && this._slug() !== null);

  /** Computed store base path for this tenant: /store/{slug} */
  readonly storeUrl = computed(() => this._slug() ? `/store/${this._slug()}` : '/');

  /** Computed admin base path: /store/{slug}/admin */
  readonly adminUrl = computed(() => this._slug() ? `/store/${this._slug()}/admin` : '/');

  /**
   * Set the tenant slug (called by tenantResolverGuard from route params).
   * Returns true if slug is valid.
   */
  setSlug(slug: string | null): boolean {
    if (!slug || !SLUG_PATTERN.test(slug.toLowerCase())) {
      this._slug.set(null);
      this._isValid.set(false);
      return false;
    }

    const normalized = slug.toLowerCase();
    this._slug.set(normalized);
    this._isValid.set(true);
    return true;
  }

  /** Clear tenant context */
  clear(): void {
    this._slug.set(null);
    this._isValid.set(false);
  }
}
