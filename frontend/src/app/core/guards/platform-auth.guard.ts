import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PlatformAuthService } from '../services/platform-auth.service';

export const platformAuthGuard: CanActivateFn = () => {
  const platformAuthService = inject(PlatformAuthService);
  const router = inject(Router);

  if (platformAuthService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/superadmin/login']);
  return false;
};
