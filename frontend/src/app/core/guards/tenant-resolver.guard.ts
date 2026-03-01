import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TenantService } from '../services/tenant.service';

/**
 * PATH-BASED tenant resolver guard.
 * Extracts :slug from the route params and sets it on TenantService.
 * If :slug is missing or invalid, redirects to landing page.
 */
export const tenantResolverGuard: CanActivateFn = (route, state) => {
  const tenantService = inject(TenantService);
  const router = inject(Router);

  // Walk up the route tree to find the :slug param (it's on the parent for child routes)
  let slug = route.paramMap.get('slug');
  if (!slug) {
    let r = route.parent;
    while (r && !slug) {
      slug = r.paramMap.get('slug');
      r = r.parent;
    }
  }

  if (!slug) {
    return router.createUrlTree(['/']);
  }

  // Already resolved with this slug? Allow immediately.
  if (tenantService.resolved() && tenantService.slug() === slug.toLowerCase()) {
    return true;
  }

  // Try to set slug
  const valid = tenantService.setSlug(slug);
  if (!valid) {
    return router.createUrlTree(['/tenant-not-found']);
  }

  return true;
};
