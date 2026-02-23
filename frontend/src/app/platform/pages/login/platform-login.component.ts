import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlatformAuthService } from '../../../core/services/platform-auth.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-platform-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-black px-4">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white text-black text-2xl font-bold shadow-2xl mb-4">
            M
          </div>
          <h1 class="text-2xl font-bold text-white">{{ i18n.t('app.name') }}</h1>
          <p class="text-neutral-400 mt-1">{{ i18n.t('auth.platformLoginTitle') }}</p>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-2xl p-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-black">{{ i18n.t('auth.loginBtn') }}</h2>
            <button (click)="i18n.toggle()" class="text-sm text-neutral-500 hover:text-black">{{ i18n.t('lang.switch') }}</button>
          </div>

          <form (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-1.5">{{ i18n.t('auth.email') }}</label>
              <input
                type="email"
                [(ngModel)]="credentials.email"
                name="email"
                required
                class="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                placeholder="admin@mobilytics.com"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-1.5">{{ i18n.t('auth.password') }}</label>
              <input
                type="password"
                [(ngModel)]="credentials.password"
                name="password"
                required
                class="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
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
              class="w-full py-3 px-4 bg-black hover:bg-neutral-800 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (loading()) {
                <span class="inline-flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ i18n.t('common.loading') }}
                </span>
              } @else {
                {{ i18n.t('auth.loginBtn') }}
              }
            </button>
          </form>

          <div class="mt-6 pt-6 border-t border-neutral-200 text-center text-sm text-neutral-500">
            <a href="/" class="hover:text-black transition-colors">← {{ i18n.t('common.back') }}</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PlatformLoginComponent {
  private readonly platformAuth = inject(PlatformAuthService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

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
