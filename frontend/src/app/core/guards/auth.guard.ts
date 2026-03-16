import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TenantService } from '../services/tenant.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const tenantService = inject(TenantService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    // Redirect to unified login page
    router.navigate(['/admin/login']);
    return false;
  }

  // Store isolation: verify the authenticated user belongs to this store
  const storedSlug = authService.getStoredSlug();
  const currentSlug = tenantService.slug();

  if (storedSlug && currentSlug && storedSlug !== currentSlug) {
    // Host resolved to a different tenant than token/session slug.
    router.navigate(['/tenant-not-found']);
    return false;
  }

  return true;
};
