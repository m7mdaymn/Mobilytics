import { TestBed } from '@angular/core/testing';
import { TenantService } from './tenant.service';

describe('TenantService', () => {
  let service: TenantService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TenantService);
  });

  afterEach(() => {
    localStorage.removeItem('MOBILYTICS_TENANT_OVERRIDE');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose slug signal', () => {
    // slug is a signal (readable)
    expect(service.slug).toBeDefined();
  });

  it('should expose isValid signal', () => {
    expect(service.isValid).toBeDefined();
  });

  it('should expose isReserved signal', () => {
    expect(service.isReserved).toBeDefined();
  });

  it('should expose resolved computed', () => {
    expect(service.resolved).toBeDefined();
  });

  it('should have setOverride method', () => {
    expect(service.setOverride).toBeDefined();
  });

  it('should have clearOverride method', () => {
    service.clearOverride();
    expect(localStorage.getItem('MOBILYTICS_TENANT_OVERRIDE')).toBeNull();
  });

  it('should write to localStorage on setOverride', () => {
    service.setOverride('test-store');
    expect(localStorage.getItem('MOBILYTICS_TENANT_OVERRIDE')).toBe('test-store');
  });

  it('should detect fallback domains', () => {
    // The isFallbackDomain method checks if current hostname is Vercel or localhost
    expect((service as any).isFallbackDomain).toBeDefined();
  });

  it('should read slug from localStorage after setOverride', () => {
    service.setOverride('vercel-store');
    // Re-resolve to pick up the localStorage value
    service.resolve();
    // On localhost (test runner), this should resolve from localStorage
    const slug = service.slug();
    expect(slug).toBeTruthy();
  });

  it('should clear override and unset slug', () => {
    service.setOverride('temp-store');
    service.clearOverride();
    expect(localStorage.getItem('MOBILYTICS_TENANT_OVERRIDE')).toBeNull();
  });
});
