import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { TenantService } from '../services/tenant.service';

export const tenantHostGuard: CanMatchFn = () => {
  const tenantService = inject(TenantService);
  return tenantService.isTenantHost();
};
