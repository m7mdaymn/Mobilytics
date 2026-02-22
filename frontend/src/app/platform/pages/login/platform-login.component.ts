import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlatformAuthService } from '../../../core/services/platform-auth.service';

@Component({
  selector: 'app-platform-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 px-4">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl font-bold shadow-2xl mb-4">
            M
          </div>
          <h1 class="text-2xl font-bold text-white">Mobilytics</h1>
          <p class="text-slate-400 mt-1">Platform Administration</p>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-2xl p-8">
          <h2 class="text-xl font-bold text-slate-800 mb-6">Super Admin Login</h2>

          <form (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                [(ngModel)]="credentials.email"
                name="email"
                required
                class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="admin@mobilytics.com"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                [(ngModel)]="credentials.password"
                name="password"
                required
                class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            @if (error()) {
              <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {{ error() }}
              </div>
            }

            <button
              type="submit"
              [disabled]="loading()"
              class="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              @if (loading()) {
                <span class="inline-flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              } @else {
                Sign In
              }
            </button>
          </form>

          <div class="mt-6 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
            <p>This area is for platform administrators only.</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PlatformLoginComponent {
  private readonly platformAuth = inject(PlatformAuthService);
  private readonly router = inject(Router);

  credentials = { email: '', password: '' };
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  onSubmit(): void {
    this.loading.set(true);
    this.error.set(null);

    this.platformAuth.login(this.credentials).subscribe({
      next: () => {
        this.router.navigate(['/superadmin']);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(err?.message || 'Invalid credentials');
      },
    });
  }
}
