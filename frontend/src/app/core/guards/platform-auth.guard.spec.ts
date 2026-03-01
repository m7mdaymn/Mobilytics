import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { platformAuthGuard } from './platform-auth.guard';
import { PlatformAuthService } from '../services/platform-auth.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('platformAuthGuard', () => {
  let platformAuthService: PlatformAuthService;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'superadmin/login', component: class {} as any },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    platformAuthService = TestBed.inject(PlatformAuthService);
    router = TestBed.inject(Router);
  });

  it('should allow authenticated platform admin', () => {
    spyOn(platformAuthService, 'isAuthenticated').and.returnValue(true);
    const result = TestBed.runInInjectionContext(() =>
      platformAuthGuard({} as any, {} as any)
    );
    expect(result).toBeTrue();
  });

  it('should redirect unauthenticated user to /superadmin/login', () => {
    const spy = spyOn(router, 'navigate');
    spyOn(platformAuthService, 'isAuthenticated').and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      platformAuthGuard({} as any, {} as any)
    );
    expect(result).toBeFalse();
    expect(spy).toHaveBeenCalledWith(['/superadmin/login']);
  });

  it('should block when no token present', () => {
    const result = TestBed.runInInjectionContext(() =>
      platformAuthGuard({} as any, {} as any)
    );
    expect(result).toBeFalse();
  });
});
