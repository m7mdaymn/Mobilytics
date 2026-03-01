import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';
import { ToastService } from '../../../core/services/toast.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-black">{{ i18n.t('app.name') }}</h1>
          <p class="text-neutral-500 mt-2">{{ i18n.t('auth.loginTitle') }}</p>
        </div>

        <div class="bg-white rounded-xl shadow-lg p-8 border border-neutral-200">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold">{{ i18n.t('auth.loginBtn') }}</h2>
            <button (click)="i18n.toggle()" class="text-sm text-neutral-500 hover:text-black">{{ i18n.t('lang.switch') }}</button>
          </div>

          @if (errorMsg()) {
            <div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {{ errorMsg() }}
            </div>
          }

          <form (ngSubmit)="onLogin()">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">{{ i18n.t('auth.email') }}</label>
                <input
                  [(ngModel)]="email"
                  name="email"
                  type="email"
                  placeholder="admin&#64;store.com"
                  class="input-field"
                  [class.input-error]="submitted && !email"
                  required />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">{{ i18n.t('auth.password') }}</label>
                <input
                  [(ngModel)]="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  class="input-field"
                  [class.input-error]="submitted && !password"
                  required />
              </div>
              <button
                type="submit"
                class="w-full justify-center py-3 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
                [disabled]="authService.loading()">
                {{ authService.loading() ? i18n.t('common.loading') : i18n.t('auth.loginBtn') }}
              </button>
            </div>
          </form>

          <div class="mt-6 text-center">
            <a [routerLink]="tenantService.storeUrl()" class="text-sm text-neutral-500 hover:text-black">← {{ i18n.t('common.back') }}</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly i18n = inject(I18nService);
  readonly tenantService = inject(TenantService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  email = '';
  password = '';
  submitted = false;
  readonly errorMsg = signal('');

  ngOnInit(): void {
    // If already authenticated, redirect to the owner's own store dashboard
    if (this.authService.isAuthenticated()) {
      const storedSlug = this.authService.getStoredSlug();
      const currentSlug = this.tenantService.slug();

      if (storedSlug && currentSlug && storedSlug !== currentSlug) {
        // Trying to login to a different store — redirect to own store
        this.router.navigate(['/store', storedSlug, 'admin']);
      } else if (currentSlug) {
        // Already authenticated for this store — go to dashboard
        this.router.navigate(['/store', currentSlug, 'admin']);
      }
    }
  }

  onLogin(): void {
    this.submitted = true;
    this.errorMsg.set('');

    if (!this.email || !this.password) return;

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        // Store the slug so the guard can enforce store isolation
        const slug = this.tenantService.slug();
        if (slug) {
          sessionStorage.setItem('mobilytics_slug', slug);
        }
        this.toastService.success('Welcome back!');
        this.router.navigate([this.tenantService.adminUrl()]);
      },
      error: (err: any) => {
        this.errorMsg.set(err.message || 'Invalid email or password');
      },
    });
  }
}
