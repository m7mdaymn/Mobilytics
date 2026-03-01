import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  Tenant, Plan, PlatformDashboard, ExpiringSubscription,
  CreateTenantRequest, UpdateTenantRequest, CreatePlanFormData,
  TenantFeatures, StartTrialRequest, ActivateSubscriptionRequest, RenewSubscriptionRequest,
  OnboardTenantRequest, OnboardTenantResponse, PlatformInvoice,
  StoreRequest, UpdateStoreRequestStatusRequest,
  TenantStoreSettings, UpdateStoreSettingsRequest
} from '../models/platform.models';

@Injectable({ providedIn: 'root' })
export class PlatformApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/platform`;

  // Dashboard
  getDashboard(range: string = 'month'): Observable<PlatformDashboard> {
    return this.http.get<ApiResponse<PlatformDashboard>>(`${this.baseUrl}/dashboard`, {
      params: { range }
    }).pipe(map(res => this.unwrap(res)));
  }

  // Tenants
  getTenants(): Observable<Tenant[]> {
    return this.http.get<ApiResponse<Tenant[]>>(`${this.baseUrl}/tenants`)
      .pipe(map(res => this.unwrap(res)));
  }

  getTenant(id: string): Observable<Tenant> {
    return this.http.get<ApiResponse<Tenant>>(`${this.baseUrl}/tenants/${id}`)
      .pipe(map(res => this.unwrap(res)));
  }

  createTenant(data: CreateTenantRequest): Observable<Tenant> {
    return this.http.post<ApiResponse<Tenant>>(`${this.baseUrl}/tenants`, data)
      .pipe(map(res => this.unwrap(res)));
  }

  onboardTenant(data: OnboardTenantRequest): Observable<OnboardTenantResponse> {
    return this.http.post<ApiResponse<OnboardTenantResponse>>(`${this.baseUrl}/tenants/onboard`, data)
      .pipe(map(res => this.unwrap(res)));
  }

  updateTenant(id: string, data: UpdateTenantRequest): Observable<Tenant> {
    return this.http.put<ApiResponse<Tenant>>(`${this.baseUrl}/tenants/${id}`, data)
      .pipe(map(res => this.unwrap(res)));
  }

  deleteTenant(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/tenants/${id}`)
      .pipe(map(res => this.unwrap(res)));
  }

  suspendTenant(id: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/tenants/${id}/suspend`, {})
      .pipe(map(res => this.unwrap(res)));
  }

  activateTenant(id: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/tenants/${id}/activate`, {})
      .pipe(map(res => this.unwrap(res)));
  }

  // Tenant Features
  getTenantFeatures(tenantId: string): Observable<TenantFeatures> {
    return this.http.get<ApiResponse<TenantFeatures>>(`${this.baseUrl}/tenants/${tenantId}/features`)
      .pipe(map(res => this.unwrap(res)));
  }

  updateTenantFeatures(tenantId: string, features: TenantFeatures): Observable<void> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/tenants/${tenantId}/features`, features)
      .pipe(map(res => this.unwrap(res)));
  }

  // Tenant Store Settings
  getStoreSettings(tenantId: string): Observable<TenantStoreSettings> {
    return this.http.get<ApiResponse<TenantStoreSettings>>(`${this.baseUrl}/tenants/${tenantId}/store-settings`)
      .pipe(map(res => this.unwrap(res)));
  }

  updateStoreSettings(tenantId: string, data: UpdateStoreSettingsRequest): Observable<TenantStoreSettings> {
    return this.http.put<ApiResponse<TenantStoreSettings>>(`${this.baseUrl}/tenants/${tenantId}/store-settings`, data)
      .pipe(map(res => this.unwrap(res)));
  }

  // Plans
  getPlans(): Observable<Plan[]> {
    return this.http.get<ApiResponse<Plan[]>>(`${this.baseUrl}/plans`)
      .pipe(map(res => this.unwrap(res)));
  }

  createPlan(data: CreatePlanFormData): Observable<Plan> {
    const body = {
      name: data.name,
      priceMonthly: data.priceMonthly,
      activationFee: data.activationFee,
      limitsJson: '{}',
      featuresJson: '{}',
    };
    return this.http.post<ApiResponse<Plan>>(`${this.baseUrl}/plans`, body)
      .pipe(map(res => this.unwrap(res)));
  }

  updatePlan(id: string, data: CreatePlanFormData): Observable<Plan> {
    const body = {
      name: data.name,
      priceMonthly: data.priceMonthly,
      activationFee: data.activationFee,
      limitsJson: '{}',
      featuresJson: '{}',
    };
    return this.http.put<ApiResponse<Plan>>(`${this.baseUrl}/plans/${id}`, body)
      .pipe(map(res => this.unwrap(res)));
  }

  deletePlan(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/plans/${id}`)
      .pipe(map(res => this.unwrap(res)));
  }

  // Subscriptions
  startTrial(tenantId: string, data: StartTrialRequest): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/subscriptions/${tenantId}/trial`, data)
      .pipe(map(res => this.unwrap(res)));
  }

  activateSubscription(tenantId: string, data: ActivateSubscriptionRequest): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/subscriptions/${tenantId}/activate`, data)
      .pipe(map(res => this.unwrap(res)));
  }

  renewSubscription(tenantId: string, data: RenewSubscriptionRequest): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/subscriptions/${tenantId}/renew`, data)
      .pipe(map(res => this.unwrap(res)));
  }

  deleteSubscription(tenantId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/subscriptions/${tenantId}`)
      .pipe(map(res => this.unwrap(res)));
  }

  updateSubscription(tenantId: string, data: { months: number; notes?: string }): Observable<void> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/subscriptions/${tenantId}`, data)
      .pipe(map(res => this.unwrap(res)));
  }

  getExpiringSubscriptions(days: number = 7): Observable<ExpiringSubscription[]> {
    return this.http.get<ApiResponse<ExpiringSubscription[]>>(`${this.baseUrl}/subscriptions/expiring`, {
      params: { days: days.toString() }
    }).pipe(map(res => this.unwrap(res)));
  }

  // Invoices
  getInvoices(tenantId?: string): Observable<PlatformInvoice[]> {
    let params = new HttpParams();
    if (tenantId) params = params.set('tenantId', tenantId);
    return this.http.get<ApiResponse<PlatformInvoice[]>>(`${this.baseUrl}/invoices`, { params })
      .pipe(map(res => this.unwrap(res)));
  }

  getInvoice(id: string): Observable<PlatformInvoice> {
    return this.http.get<ApiResponse<PlatformInvoice>>(`${this.baseUrl}/invoices/${id}`)
      .pipe(map(res => this.unwrap(res)));
  }

  deleteInvoice(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/invoices/${id}`)
      .pipe(map(res => this.unwrap(res)));
  }

  // Store Requests (Leads)
  getStoreRequests(status?: string): Observable<StoreRequest[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<StoreRequest[]>>(`${this.baseUrl}/store-requests`, { params })
      .pipe(map(res => this.unwrap(res)));
  }

  updateStoreRequestStatus(id: string, data: UpdateStoreRequestStatusRequest): Observable<StoreRequest> {
    return this.http.patch<ApiResponse<StoreRequest>>(`${this.baseUrl}/store-requests/${id}/status`, data)
      .pipe(map(res => this.unwrap(res)));
  }

  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw response;
    }
    return response.data;
  }
}
