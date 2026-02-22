import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  Tenant, Plan, PlatformDashboard, ExpiringSubscription,
  CreateTenantRequest, UpdateTenantRequest, CreatePlanRequest,
  TenantFeatures, StartTrialRequest, ActivateSubscriptionRequest, RenewSubscriptionRequest
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

  // Plans
  getPlans(): Observable<Plan[]> {
    return this.http.get<ApiResponse<Plan[]>>(`${this.baseUrl}/plans`)
      .pipe(map(res => this.unwrap(res)));
  }

  createPlan(data: CreatePlanRequest): Observable<Plan> {
    return this.http.post<ApiResponse<Plan>>(`${this.baseUrl}/plans`, data)
      .pipe(map(res => this.unwrap(res)));
  }

  updatePlan(id: string, data: CreatePlanRequest): Observable<Plan> {
    return this.http.put<ApiResponse<Plan>>(`${this.baseUrl}/plans/${id}`, data)
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

  getExpiringSubscriptions(days: number = 7): Observable<ExpiringSubscription[]> {
    return this.http.get<ApiResponse<ExpiringSubscription[]>>(`${this.baseUrl}/subscriptions/expiring`, {
      params: { days: days.toString() }
    }).pipe(map(res => this.unwrap(res)));
  }

  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw response;
    }
    return response.data;
  }
}
