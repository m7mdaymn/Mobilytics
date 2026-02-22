import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/api/v1`;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not be authenticated initially', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.token()).toBeNull();
    expect(service.user()).toBeNull();
  });

  it('should login and store token', () => {
    // Create a fake JWT (header.payload.signature)
    const payload = btoa(JSON.stringify({
      sub: 'user-1',
      email: 'test@test.com',
      name: 'Test User',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Owner',
      permissions: 'items.create,items.edit',
      tenantId: 'tenant-1',
    }));
    const fakeToken = `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.${payload}.fakesignature`;

    service.login({ email: 'test@test.com', password: 'pass' }).subscribe(response => {
      expect(response).toBeTruthy();
      expect(response.token).toBe(fakeToken);
    });

    const req = httpMock.expectOne(`${baseUrl}/Auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: { token: fakeToken, expiresAt: '2099-01-01' }, message: '' });

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.token()).toBe(fakeToken);
    expect(service.user()?.email).toBe('test@test.com');
  });

  it('should logout and clear state', () => {
    service.logout();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.token()).toBeNull();
    expect(service.user()).toBeNull();
  });

  it('should check permissions for Owner role (always allowed)', () => {
    // Simulate Owner user
    const payload = btoa(JSON.stringify({
      sub: 'user-1',
      email: 'owner@test.com',
      name: 'Owner',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Owner',
      permissions: '',
      tenantId: 'tenant-1',
    }));
    const fakeToken = `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.${payload}.fakesignature`;

    service.login({ email: 'owner@test.com', password: 'pass' }).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/Auth/login`);
    req.flush({ success: true, data: { token: fakeToken, expiresAt: '2099-01-01' }, message: '' });

    expect(service.hasPermission('items.create')).toBeTrue();
    expect(service.hasPermission('settings.edit')).toBeTrue();
  });
});
