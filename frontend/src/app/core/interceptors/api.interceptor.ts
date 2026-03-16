import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { PlatformAuthService } from '../services/platform-auth.service';
import { ToastService } from '../services/toast.service';
import { ApiError } from '../models/api.models';

/**
 * API Interceptor - handles auth headers for both platform and tenant requests
 * 
 * Platform requests (/api/v1/platform/*):
 *   - Attach platform Authorization token
 * 
 * Tenant requests (all other /api/v1/*):
 *   - Attach tenant Authorization token
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const platformAuthService = inject(PlatformAuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);

  let headers = req.headers;

  // Check if this is a platform endpoint
  const isPlatformRequest = req.url.includes('/api/v1/platform/');

  if (isPlatformRequest) {
    // Platform request: attach platform token, NO tenant slug
    const platformToken = platformAuthService.token();
    if (platformToken) {
      headers = headers.set('Authorization', `Bearer ${platformToken}`);
    }
  } else {
    // Tenant request: host/domain resolves tenant server-side.
    if (typeof window !== 'undefined' && window.location?.host) {
      headers = headers.set('X-App-Host', window.location.host);
    }

    const token = authService.token();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const cloned = req.clone({ headers });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // Final route detection: /admin/* is tenant admin, /superadmin/* is platform admin.
      const url = router.url;
      const isAdminRoute = url.startsWith('/admin');
      const isSuperAdminRoute = url.startsWith('/superadmin');
      const body = error.error;

      if (error.status === 400) {
        let message = body?.message || body?.title || 'Validation error';
        let errors = body?.errors || null;
        if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
          const flat = Object.entries(errors as Record<string, string[]>)
            .flatMap(([, msgs]) => msgs);
          if (flat.length && message === 'Validation error') {
            message = flat.join(' ');
          }
        }
        return throwError(() => new ApiError(400, message, errors, body));
      }

      if (error.status === 401) {
        if (isSuperAdminRoute) {
          platformAuthService.logout();
          router.navigate(['/superadmin/login']);
        } else if (isAdminRoute) {
          authService.logout();
        }
        return throwError(() => new ApiError(401, 'Unauthorized', null, body));
      }

      if (error.status === 403) {
        if (isSuperAdminRoute) {
          toastService.error('Access denied');
          router.navigate(['/superadmin/login']);
        } else if (isAdminRoute) {
          toastService.error('Access blocked / subscription required');
          router.navigate(['/admin/blocked']);
        } else {
          router.navigate(['/inactive']);
        }
        return throwError(() => new ApiError(403, 'Forbidden', null, body));
      }

      if (error.status === 404) {
        return throwError(() => new ApiError(404, body?.message || 'Not found', null, body));
      }

      if (error.status >= 500) {
        toastService.error('Server error. Please try again later.');
        return throwError(() => new ApiError(error.status, 'Server error', null, body));
      }

      const fallbackMessage = body?.message || error.message || 'Unknown error';
      return throwError(() => new ApiError(error.status, fallbackMessage, null, body));
    })
  );
};
