import { TestBed } from '@angular/core/testing';
import { ToastService, Toast } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no toasts', () => {
    expect(service.toasts().length).toBe(0);
  });

  it('should add a success toast', () => {
    service.success('Operation completed');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[0].message).toBe('Operation completed');
  });

  it('should add an error toast', () => {
    service.error('Something went wrong');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('error');
  });

  it('should add an info toast', () => {
    service.info('FYI');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('info');
  });

  it('should add a warning toast', () => {
    service.warning('Be careful');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('warning');
  });

  it('should remove a toast', () => {
    service.success('Test');
    const toastId = service.toasts()[0].id;
    service.remove(toastId);
    expect(service.toasts().length).toBe(0);
  });

  it('should support multiple toasts', () => {
    service.success('First');
    service.error('Second');
    service.info('Third');
    expect(service.toasts().length).toBe(3);
  });
});
