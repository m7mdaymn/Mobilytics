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
    router.navigate(['/login']);
    return false;
  }

  // Store isolation: verify the authenticated user belongs to this store
  const storedSlug = authService.getStoredSlug();
  const currentSlug = tenantService.slug();

  if (storedSlug && currentSlug && storedSlug !== currentSlug) {
    // Owner is trying to access a store they don't own — redirect to their own
    router.navigate(['/store', storedSlug, 'admin']);
    return false;
  }

  return true;
};
