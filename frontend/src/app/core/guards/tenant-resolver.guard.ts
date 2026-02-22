import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TenantService } from '../services/tenant.service';

/**
 * Guard that ensures a tenant has been resolved.
 * If no valid tenant is found, redirects to landing page.
 */
export const tenantResolverGuard: CanActivateFn = (route, state) => {
  const tenantService = inject(TenantService);
  const router = inject(Router);

  // If tenant is resolved and valid, allow access
  if (tenantService.resolved()) {
    return true;
  }

  // If tenant is a reserved subdomain (www, api, admin, static), redirect to landing
  if (tenantService.isReserved()) {
    return router.createUrlTree(['/landing']);
  }

  // If no valid tenant, redirect to landing page
  return router.createUrlTree(['/landing']);
};
