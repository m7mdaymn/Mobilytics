import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { TenantService } from '../services/tenant.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('authGuard', () => {
  let authService: AuthService;
  let tenantService: TenantService;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', component: class {} as any },
          { path: 'store/:slug/admin', component: class {} as any },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    authService = TestBed.inject(AuthService);
    tenantService = TestBed.inject(TenantService);
    router = TestBed.inject(Router);
  });

  it('should block unauthenticated access', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );
    expect(result).toBeFalse();
  });

  it('should redirect unauthenticated user to /login', () => {
    const spy = spyOn(router, 'navigate');
    TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );
    expect(spy).toHaveBeenCalledWith(['/login']);
  });

  it('should allow authenticated user with matching slug', () => {
    // Simulate authenticated state
    spyOn(authService, 'isAuthenticated').and.returnValue(true);
    spyOn(authService, 'getStoredSlug').and.returnValue('my-store');
    tenantService.setSlug('my-store');

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );
    expect(result).toBeTrue();
  });

  it('should redirect to own store when slug mismatch', () => {
    const spy = spyOn(router, 'navigate');
    spyOn(authService, 'isAuthenticated').and.returnValue(true);
    spyOn(authService, 'getStoredSlug').and.returnValue('store-a');
    tenantService.setSlug('store-b');

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );
    expect(result).toBeFalse();
    expect(spy).toHaveBeenCalledWith(['/store', 'store-a', 'admin']);
  });

  it('should allow if no stored slug (no ownership check)', () => {
    spyOn(authService, 'isAuthenticated').and.returnValue(true);
    spyOn(authService, 'getStoredSlug').and.returnValue(null);
    tenantService.setSlug('any-store');

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );
    expect(result).toBeTrue();
  });

  it('should allow if no current slug (no ownership check)', () => {
    spyOn(authService, 'isAuthenticated').and.returnValue(true);
    spyOn(authService, 'getStoredSlug').and.returnValue('my-store');
    // tenantService slug is null by default

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );
    expect(result).toBeTrue();
  });
});
