import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { apiInterceptor } from './api.interceptor';
import { HttpClient, provideHttpClient as provideHttp, withInterceptors } from '@angular/common/http';
import { TenantService } from '../services/tenant.service';

describe('apiInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttp(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add X-Tenant-Slug header when slug exists', () => {
    const tenantService = TestBed.inject(TenantService);
    // Set an override so slug is not null on localhost
    tenantService.setOverride('test-store');

    http.get('/test').subscribe();
    const req = httpMock.expectOne('/test');
    expect(req.request.headers.has('X-Tenant-Slug')).toBeTrue();
    expect(req.request.headers.get('X-Tenant-Slug')).toBe('test-store');
    req.flush({});

    tenantService.clearOverride();
  });

  it('should not add X-Tenant-Slug header when slug is null', () => {
    http.get('/test').subscribe();
    const req = httpMock.expectOne('/test');
    // On localhost with no override, slug is null
    expect(req.request.headers.has('X-Tenant-Slug')).toBeFalse();
    req.flush({});
  });
});
