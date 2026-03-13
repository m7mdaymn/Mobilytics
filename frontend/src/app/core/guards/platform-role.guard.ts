import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PlatformAuthService } from '../services/platform-auth.service';

export const platformRoleGuard = (role: 'SuperAdmin' | 'PlatformEmployee'): CanActivateFn => {
  return () => {
    const platformAuth = inject(PlatformAuthService);
    const router = inject(Router);

    if (!platformAuth.isAuthenticated()) {
      router.navigate(['/superadmin/login']);
      return false;
    }

    if (platformAuth.hasRole(role)) {
      return true;
    }

    router.navigate(['/superadmin/tenants']);
    return false;
  };
};
