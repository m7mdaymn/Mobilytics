import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlatformLoginRequest, PlatformLoginResponse, PlatformUser } from '../models/platform.models';
import { ApiResponse } from '../models/api.models';

const PLATFORM_TOKEN_KEY = 'mobilytics_platform_token';

@Injectable({ providedIn: 'root' })
export class PlatformAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/platform`;

  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<PlatformUser | null>(null);
  private readonly _loading = signal(false);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());

  constructor() {
    this.restoreSession();
  }

  login(request: PlatformLoginRequest): Observable<PlatformLoginResponse> {
    this._loading.set(true);
    return this.http.post<ApiResponse<PlatformLoginResponse>>(`${this.baseUrl}/auth/login`, request).pipe(
      map(res => {
        if (!res.success) throw res;
        return res.data;
      }),
      tap(response => {
        this._token.set(response.token);
        this._user.set(this.decodeToken(response.token));
        sessionStorage.setItem(PLATFORM_TOKEN_KEY, response.token);
        this._loading.set(false);
      }),
      catchError(err => {
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    sessionStorage.removeItem(PLATFORM_TOKEN_KEY);
    this.router.navigate(['/superadmin/login']);
  }

  private restoreSession(): void {
    const token = sessionStorage.getItem(PLATFORM_TOKEN_KEY);
    if (token) {
      try {
        const user = this.decodeToken(token);
        const exp = this.getTokenExpiry(token);
        if (exp && exp > Date.now()) {
          this._token.set(token);
          this._user.set(user);
        } else {
          sessionStorage.removeItem(PLATFORM_TOKEN_KEY);
        }
      } catch {
        sessionStorage.removeItem(PLATFORM_TOKEN_KEY);
      }
    }
  }

  private decodeToken(token: string): PlatformUser {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub || payload.nameid,
      email: payload.email,
      name: payload.name || payload.unique_name || 'SuperAdmin',
      role: 'SuperAdmin',
    };
  }

  private getTokenExpiry(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }
}
