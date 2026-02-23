import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { LoginRequest, LoginResponse, AuthUser, PermissionKey } from '../models/auth.models';

const TOKEN_KEY = 'mobilytics_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<AuthUser | null>(null);
  private readonly _loading = signal(false);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly isOwner = computed(() => this._user()?.role === 'Owner');
  readonly userPermissions = computed(() => this._user()?.permissions ?? []);

  constructor(
    private readonly api: ApiService,
    private readonly router: Router
  ) {
    this.restoreSession();
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    this._loading.set(true);
    return this.api.post<LoginResponse>('/Auth/login', request).pipe(
      tap(response => {
        this._token.set(response.token);
        this._user.set(this.decodeToken(response.token));
        sessionStorage.setItem(TOKEN_KEY, response.token);
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
    sessionStorage.removeItem(TOKEN_KEY);
    this.router.navigate(['/admin/login']);
  }

  hasPermission(permission: PermissionKey): boolean {
    const user = this._user();
    if (!user) return false;
    if (user.role === 'Owner') return true;
    return user.permissions.includes(permission);
  }

  hasAnyPermission(...permissions: PermissionKey[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  private restoreSession(): void {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        const user = this.decodeToken(token);
        const exp = this.getTokenExpiry(token);
        if (exp && exp > Date.now()) {
          this._token.set(token);
          this._user.set(user);
        } else {
          sessionStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        sessionStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  private decodeToken(token: string): AuthUser {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub || payload.nameid || '',
        email: payload.email || '',
        name: payload.unique_name || payload.name || '',
        role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role || 'Manager',
        permissions: payload.permissions ? (Array.isArray(payload.permissions) ? payload.permissions : [payload.permissions]) : [],
        tenantId: payload.tenant_id || '',
      };
    } catch {
      return { id: '', email: '', name: '', role: 'Manager', permissions: [], tenantId: '' };
    }
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
