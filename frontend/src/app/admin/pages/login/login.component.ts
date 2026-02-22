import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[color:var(--color-bg-alt)] p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-[color:var(--color-primary)]">Mobilytics</h1>
          <p class="text-[color:var(--color-text-muted)] mt-2">Admin Dashboard Login</p>
        </div>

        <div class="bg-white rounded-xl shadow-lg p-8">
          <h2 class="text-xl font-bold mb-6">Sign In</h2>

          @if (errorMsg()) {
            <div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {{ errorMsg() }}
            </div>
          }

          <form (ngSubmit)="onLogin()">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">Email</label>
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
                <label class="block text-sm font-medium mb-1">Password</label>
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
                class="btn-primary w-full justify-center py-3"
                [disabled]="authService.loading()">
                {{ authService.loading() ? 'Signing in...' : 'Sign In' }}
              </button>
            </div>
          </form>

          <div class="mt-6 text-center">
            <a routerLink="/" class="text-sm text-[color:var(--color-primary)] hover:underline">← Back to Store</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  readonly authService = inject(AuthService);
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
