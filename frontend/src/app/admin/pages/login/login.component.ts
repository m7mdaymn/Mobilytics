import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
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
            <a routerLink="/" class="text-sm text-neutral-500 hover:text-black">← {{ i18n.t('common.back') }}</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  readonly authService = inject(AuthService);
  readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  email = '';
  password = '';
  submitted = false;
  readonly errorMsg = signal('');

  onLogin(): void {
    this.submitted = true;
    this.errorMsg.set('');

    if (!this.email || !this.password) return;

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.toastService.success('Welcome back!');
        this.router.navigate(['/admin']);
      },
      error: (err: any) => {
        this.errorMsg.set(err.message || 'Invalid email or password');
      },
    });
  }
}
