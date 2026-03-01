import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, UrlTree } from '@angular/router';
import { tenantResolverGuard } from './tenant-resolver.guard';
import { TenantService } from '../services/tenant.service';

describe('tenantResolverGuard', () => {
  let tenantService: TenantService;
  let router: Router;

  function makeRoute(slug: string | null, parentSlug?: string): ActivatedRouteSnapshot {
    const route = {
      paramMap: { get: (key: string) => (key === 'slug' ? slug : null) },
      parent: parentSlug
        ? { paramMap: { get: (key: string) => (key === 'slug' ? parentSlug : null) }, parent: null }
        : null,
    } as unknown as ActivatedRouteSnapshot;
    return route;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: class {} as any },
          { path: 'tenant-not-found', component: class {} as any },
        ]),
      ],
    });
    tenantService = TestBed.inject(TenantService);
    router = TestBed.inject(Router);
  });

  it('should redirect to / when no slug in route', () => {
    const result = TestBed.runInInjectionContext(() =>
      tenantResolverGuard(makeRoute(null), {} as any)
    );
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/');
  });

  it('should set slug and allow access for valid slug', () => {
    const result = TestBed.runInInjectionContext(() =>
      tenantResolverGuard(makeRoute('my-store'), {} as any)
    );
    expect(result).toBeTrue();
    expect(tenantService.slug()).toBe('my-store');
  });

  it('should redirect to /tenant-not-found for invalid slug', () => {
    const result = TestBed.runInInjectionContext(() =>
      tenantResolverGuard(makeRoute('invalid store!'), {} as any)
    );
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toContain('tenant-not-found');
  });

  it('should allow immediately if same slug already resolved', () => {
    tenantService.setSlug('existing');
    const result = TestBed.runInInjectionContext(() =>
      tenantResolverGuard(makeRoute('existing'), {} as any)
    );
    expect(result).toBeTrue();
  });

  it('should find slug from parent route', () => {
    const result = TestBed.runInInjectionContext(() =>
      tenantResolverGuard(makeRoute(null, 'parent-store'), {} as any)
    );
    expect(result).toBeTrue();
    expect(tenantService.slug()).toBe('parent-store');
  });

  it('should normalize slug to lowercase', () => {
    const result = TestBed.runInInjectionContext(() =>
      tenantResolverGuard(makeRoute('My-Store'), {} as any)
    );
    expect(result).toBeTrue();
    expect(tenantService.slug()).toBe('my-store');
  });
});
