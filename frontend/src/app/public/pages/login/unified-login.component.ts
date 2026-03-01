import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-unified-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex flex-col bg-neutral-50 relative overflow-hidden">
      <!-- Dot grid background -->
      <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle, #000 1px, transparent 1px); background-size: 24px 24px;"></div>
      <!-- Gradient orbs -->
      <div class="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.03]" style="background: radial-gradient(circle, #000 0%, transparent 70%);"></div>
      <div class="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.02]" style="background: radial-gradient(circle, #333 0%, transparent 70%);"></div>

      <!-- Top Nav -->
      <nav class="relative z-10 flex items-center justify-between h-[72px] px-6 max-w-7xl mx-auto w-full">
        <a routerLink="/" class="flex items-center gap-2.5 group">
          <div class="w-8 h-8 bg-black rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 20V10L7 4L12 10V20" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 20V10L17 4L22 10V20" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <rect x="16" y="14" width="2" height="6" rx="1" fill="white" opacity="0.5"/>
              <rect x="19" y="11" width="2" height="9" rx="1" fill="white" opacity="0.7"/>
            </svg>
          </div>
          <span class="text-xl font-black tracking-tight text-black">{{ i18n.t('app.name') }}</span>
        </a>
        <div class="flex items-center gap-3">
          <button (click)="i18n.toggle()" class="px-3 py-1.5 text-xs font-bold border border-neutral-200 rounded-full hover:bg-neutral-50 transition">
            {{ i18n.t('lang.switch') }}
          </button>
          <a routerLink="/" class="text-sm text-neutral-500 hover:text-black transition font-medium">
            {{ i18n.lang() === 'ar' ? 'الرئيسية' : 'Home' }}
          </a>
        </div>
      </nav>

      <!-- Login Card -->
      <div class="relative z-10 flex-1 flex items-center justify-center px-4 pb-16">
        <div class="w-full max-w-[440px]">
          <!-- Header -->
          <div class="text-center mb-10">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200 mb-6">
              <div class="w-2 h-2 bg-black rounded-full animate-pulse"></div>
              <span class="text-xs font-semibold text-neutral-600 tracking-wide uppercase">{{ i18n.lang() === 'ar' ? 'تسجيل دخول آمن' : 'Secure Login' }}</span>
            </div>
            <h1 class="text-3xl sm:text-4xl font-black text-black tracking-tight leading-tight">
              {{ i18n.lang() === 'ar' ? 'مرحباً بعودتك' : 'Welcome Back' }}
            </h1>
            <p class="text-neutral-500 mt-3 text-sm">
              {{ i18n.lang() === 'ar' ? 'سجل دخولك للوصول إلى لوحة التحكم' : 'Sign in to access your store dashboard' }}
            </p>
          </div>

          <!-- Card -->
          <div class="bg-white rounded-3xl shadow-xl shadow-black/[0.04] border border-neutral-100 p-8 sm:p-10">
            @if (errorMsg()) {
              <div class="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-2xl p-4 mb-6">
                <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></svg>
                <span>{{ errorMsg() }}</span>
              </div>
            }

            @if (tenantInfo()) {
              <div class="flex items-center gap-3 bg-neutral-50 border border-neutral-100 rounded-2xl p-4 mb-6">
                <div class="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  {{ tenantInfo()!.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p class="text-sm font-bold text-black">{{ tenantInfo() }}</p>
                  <p class="text-xs text-neutral-400">{{ i18n.lang() === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing you in...' }}</p>
                </div>
              </div>
            }

            <form (ngSubmit)="onLogin()">
              <div class="space-y-5">
                <div>
                  <label class="block text-sm font-semibold text-neutral-700 mb-2">{{ i18n.t('auth.email') }}</label>
                  <div class="relative">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-neutral-400">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/></svg>
                    </div>
                    <input
                      [(ngModel)]="email"
                      name="email"
                      type="email"
                      placeholder="admin&#64;store.com"
                      autocomplete="email"
                      class="w-full ps-12 pe-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400 transition placeholder:text-neutral-400"
                      [class.border-red-300]="submitted && !email"
                      required />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-neutral-700 mb-2">{{ i18n.t('auth.password') }}</label>
                  <div class="relative">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-neutral-400">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/></svg>
                    </div>
                    <input
                      [(ngModel)]="password"
                      name="password"
                      [type]="showPassword() ? 'text' : 'password'"
                      placeholder="••••••••"
                      autocomplete="current-password"
                      class="w-full ps-12 pe-12 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400 transition placeholder:text-neutral-400"
                      [class.border-red-300]="submitted && !password"
                      required />
                    <button type="button" (click)="showPassword.set(!showPassword())" class="absolute inset-y-0 end-0 flex items-center pe-4 text-neutral-400 hover:text-neutral-600 transition">
                      @if (showPassword()) {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
                      } @else {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>
                      }
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  class="w-full py-4 bg-black text-white rounded-2xl text-sm font-bold hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  [disabled]="authService.loading()">
                  @if (authService.loading()) {
                    <span class="flex items-center justify-center gap-2">
                      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                      {{ i18n.lang() === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing in...' }}
                    </span>
                  } @else {
                    {{ i18n.t('auth.loginBtn') }}
                  }
                </button>
              </div>
            </form>

            <!-- Divider -->
            <div class="my-8 flex items-center gap-4">
              <div class="flex-1 h-px bg-neutral-100"></div>
              <span class="text-xs text-neutral-400 font-medium">{{ i18n.lang() === 'ar' ? 'أو' : 'or' }}</span>
              <div class="flex-1 h-px bg-neutral-100"></div>
            </div>

            <!-- Register CTA -->
            <div class="text-center">
              <a routerLink="/" fragment="pricing" class="inline-flex items-center gap-2 px-6 py-3 border-2 border-neutral-200 rounded-2xl text-sm font-bold text-neutral-700 hover:border-black hover:text-black transition-all group">
                <svg class="w-4 h-4 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l4.189-4.189A1.5 1.5 0 0 1 8.128 0h7.745a1.5 1.5 0 0 1 1.06.44l4.19 4.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"/></svg>
                {{ i18n.lang() === 'ar' ? 'سجل متجرك الآن' : 'Register Your Store' }}
              </a>
            </div>
          </div>

          <!-- Trust signals -->
          <div class="mt-8 flex items-center justify-center gap-6 text-xs text-neutral-400">
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/></svg>
              <span>{{ i18n.lang() === 'ar' ? 'بيانات مشفرة' : 'Encrypted' }}</span>
            </div>
            <div class="w-1 h-1 bg-neutral-300 rounded-full"></div>
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/></svg>
              <span>{{ i18n.lang() === 'ar' ? 'آمن 100%' : '100% Secure' }}</span>
            </div>
            <div class="w-1 h-1 bg-neutral-300 rounded-full"></div>
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
              <span>{{ i18n.lang() === 'ar' ? 'دعم 24/7' : '24/7 Support' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="relative z-10 py-6 text-center text-xs text-neutral-400">
        <span>{{ i18n.lang() === 'ar' ? 'منتج بواسطة' : 'A product by' }}</span>
        <a href="https://novanodee.vercel.app" target="_blank" class="font-bold text-neutral-600 hover:text-black transition ms-1">Nova Node</a>
      </div>
    </div>
  `,
})
export class UnifiedLoginComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly i18n = inject(I18nService);
  private readonly tenantService = inject(TenantService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  submitted = false;
  readonly errorMsg = signal('');
  readonly tenantInfo = signal<string | null>(null);
  readonly showPassword = signal(false);

  ngOnInit(): void {
    // If already authenticated, redirect to owner's own store dashboard
    if (this.authService.isAuthenticated()) {
      const slug = this.authService.getStoredSlug();
      if (slug) {
        this.router.navigate(['/store', slug, 'admin']);
      }
    }
  }

  onLogin(): void {
    this.submitted = true;
    this.errorMsg.set('');
    this.tenantInfo.set(null);

    if (!this.email || !this.password) return;

    this.authService.unifiedLogin({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.tenantInfo.set(res.tenantName);
        // Set tenant slug so interceptor can attach it
        this.tenantService.setSlug(res.tenantSlug);

        if (!res.tenantActive) {
          this.router.navigate(['/store', res.tenantSlug, 'admin', 'blocked']);
          return;
        }

        // Small delay for UX — shows the tenant name card
        setTimeout(() => {
          this.router.navigate(['/store', res.tenantSlug, 'admin']);
        }, 400);
      },
      error: (err: any) => {
        this.errorMsg.set(
          err.message || (this.i18n.lang() === 'ar' ? 'بريد إلكتروني أو كلمة مرور غير صحيحة' : 'Invalid email or password')
        );
      },
    });
  }
}
