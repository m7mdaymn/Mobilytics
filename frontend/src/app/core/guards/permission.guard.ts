import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { PermissionKey } from '../models/auth.models';

export function permissionGuard(...requiredPermissions: PermissionKey[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const toastService = inject(ToastService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/admin/login']);
      return false;
    }

    if (authService.hasAnyPermission(...requiredPermissions)) {
      return true;
    }

    toastService.warning('Insufficient permissions to access this page.');
    router.navigate(['/admin']);
    return false;
  };
}
