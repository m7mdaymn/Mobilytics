import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { permissionGuard } from './permission.guard';
import { AuthService } from '../services/auth.service';
import { TenantService } from '../services/tenant.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('permissionGuard', () => {
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

  it('should redirect unauthenticated user to /login', () => {
    const spy = spyOn(router, 'navigate');
    const guard = permissionGuard('ManageProducts');
    TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(spy).toHaveBeenCalledWith(['/login']);
  });

  it('should allow user with required permission', () => {
    spyOn(authService, 'isAuthenticated').and.returnValue(true);
    spyOn(authService, 'hasAnyPermission').and.returnValue(true);

    const guard = permissionGuard('ManageProducts');
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(result).toBeTrue();
  });

  it('should block user without required permission', () => {
    spyOn(authService, 'isAuthenticated').and.returnValue(true);
    spyOn(authService, 'hasAnyPermission').and.returnValue(false);
    tenantService.setSlug('my-store');
    const spy = spyOn(router, 'navigate');

    const guard = permissionGuard('ManageProducts');
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(result).toBeFalse();
    expect(spy).toHaveBeenCalledWith(['/store', 'my-store', 'admin']);
  });

  it('should redirect to root when no slug and permission denied', () => {
    spyOn(authService, 'isAuthenticated').and.returnValue(true);
    spyOn(authService, 'hasAnyPermission').and.returnValue(false);
    const spy = spyOn(router, 'navigate');

    const guard = permissionGuard('ManageProducts');
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(result).toBeFalse();
    expect(spy).toHaveBeenCalledWith(['/']);
  });

  it('should check multiple permissions (any match)', () => {
    spyOn(authService, 'isAuthenticated').and.returnValue(true);
    const hasAnySpy = spyOn(authService, 'hasAnyPermission').and.returnValue(true);

    const guard = permissionGuard('ManageProducts', 'ManageCategories');
    TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(hasAnySpy).toHaveBeenCalledWith('ManageProducts', 'ManageCategories');
  });
});
