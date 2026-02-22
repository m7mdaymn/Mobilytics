import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/api/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should unwrap successful GET response', () => {
    const mockData = { id: '1', name: 'Test' };
    service.get<any>('/items/1').subscribe(data => {
      expect(data).toEqual(mockData);
    });
    const req = httpMock.expectOne(`${baseUrl}/items/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockData, message: '' });
  });

  it('should pass query params on GET', () => {
    service.get<any>('/items', { search: 'phone', pageSize: 10 }).subscribe();
    const req = httpMock.expectOne(r => r.url === `${baseUrl}/items`);
    expect(req.request.params.get('search')).toBe('phone');
    expect(req.request.params.get('pageSize')).toBe('10');
    req.flush({ success: true, data: [], message: '' });
  });

  it('should unwrap successful POST response', () => {
    const body = { title: 'Test' };
    const mockResponse = { id: '123' };
    service.post<any>('/items', body).subscribe(data => {
      expect(data).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(`${baseUrl}/items`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ success: true, data: mockResponse, message: '' });
  });

  it('should unwrap PUT response', () => {
    service.put<any>('/items/1', { title: 'Updated' }).subscribe(data => {
      expect(data).toEqual({ id: '1' });
    });
    const req = httpMock.expectOne(`${baseUrl}/items/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ success: true, data: { id: '1' }, message: '' });
  });

  it('should call DELETE', () => {
    service.delete<any>('/items/1').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/items/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, data: null, message: '' });
  });

  it('should handle upload via POST with FormData', () => {
    const fd = new FormData();
    fd.append('file', new Blob(['test']), 'test.png');
    service.upload<any>('/items/1/images', fd).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/items/1/images`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(fd);
    req.flush({ success: true, data: { url: '/img.png' }, message: '' });
  });

  it('should skip undefined params', () => {
    service.get<any>('/items', { search: undefined, pageSize: 10 }).subscribe();
    const req = httpMock.expectOne(r => r.url === `${baseUrl}/items`);
    expect(req.request.params.has('search')).toBeFalse();
    expect(req.request.params.get('pageSize')).toBe('10');
    req.flush({ success: true, data: [], message: '' });
  });
});
