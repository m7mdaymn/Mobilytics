import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TenantService } from '../services/tenant.service';

export const tenantResolverGuard: CanActivateFn = (route, state) => {
  const tenantService = inject(TenantService);
  const router = inject(Router);

  if (!tenantService.isTenantHost()) {
    return router.createUrlTree(['/']);
  }

  if (tenantService.resolved()) {
    return true;
  }

  return tenantService.resolveFromHost().then(ok => ok ? true : router.createUrlTree(['/tenant-not-found']));
};
