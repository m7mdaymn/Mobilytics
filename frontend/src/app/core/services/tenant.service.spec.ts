import { TestBed } from '@angular/core/testing';
import { TenantService } from './tenant.service';

describe('TenantService', () => {
  let service: TenantService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TenantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with null slug', () => {
    expect(service.slug()).toBeNull();
  });

  it('should start as not valid', () => {
    expect(service.isValid()).toBeFalse();
  });

  it('should start as not resolved', () => {
    expect(service.resolved()).toBeFalse();
  });

  it('should set slug correctly', () => {
    const result = service.setSlug('my-store');
    expect(result).toBeTrue();
    expect(service.slug()).toBe('my-store');
    expect(service.isValid()).toBeTrue();
    expect(service.resolved()).toBeTrue();
  });

  it('should normalize slug to lowercase', () => {
    service.setSlug('My-Store');
    expect(service.slug()).toBe('my-store');
  });

  it('should reject null slug', () => {
    const result = service.setSlug(null);
    expect(result).toBeFalse();
    expect(service.slug()).toBeNull();
  });

  it('should reject empty slug', () => {
    const result = service.setSlug('');
    expect(result).toBeFalse();
    expect(service.slug()).toBeNull();
  });

  it('should accept slugs with hyphens and numbers', () => {
    const result = service.setSlug('store-123');
    expect(result).toBeTrue();
    expect(service.slug()).toBe('store-123');
  });

  it('should compute storeUrl correctly', () => {
    service.setSlug('test-shop');
    expect(service.storeUrl()).toBe('/store/test-shop');
  });

  it('should compute adminUrl correctly', () => {
    service.setSlug('test-shop');
    expect(service.adminUrl()).toBe('/store/test-shop/admin');
  });

  it('should return / for storeUrl when no slug', () => {
    expect(service.storeUrl()).toBe('/');
  });

  it('should return / for adminUrl when no slug', () => {
    expect(service.adminUrl()).toBe('/');
  });

  it('should clear tenant context', () => {
    service.setSlug('test');
    service.clear();
    expect(service.slug()).toBeNull();
    expect(service.isValid()).toBeFalse();
    expect(service.resolved()).toBeFalse();
  });

  it('should allow overwriting slug', () => {
    service.setSlug('first');
    service.setSlug('second');
    expect(service.slug()).toBe('second');
  });

  it('should skip resolution if same slug already set', () => {
    service.setSlug('same');
    const result = service.setSlug('same');
    expect(result).toBeTrue();
    expect(service.slug()).toBe('same');
  });
});
