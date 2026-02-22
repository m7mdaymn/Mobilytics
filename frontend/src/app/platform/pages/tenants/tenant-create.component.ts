import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlatformApiService } from '../../../core/services/platform-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { CreateTenantRequest, Tenant } from '../../../core/models/platform.models';

@Component({
  selector: 'app-tenant-create',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="max-w-2xl mx-auto space-y-6">
      <div class="flex items-center gap-4">
        <button (click)="goBack()" class="text-slate-500 hover:text-slate-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold text-slate-800">Create New Tenant</h1>
      </div>

      @if (created()) {
        <!-- Success State -->
        <div class="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-slate-800">Tenant Created!</h2>
          <p class="text-slate-600">
            <strong>{{ created()!.name }}</strong> has been created successfully.
          </p>
          <div class="bg-slate-50 rounded-lg p-4 text-left space-y-3">
            <div>
              <p class="text-xs text-slate-500 uppercase font-medium">Tenant Slug</p>
              <code class="text-indigo-600 font-mono">{{ created()!.slug }}</code>
            </div>
            <div>
              <p class="text-xs text-slate-500 uppercase font-medium">Access URLs</p>
              <div class="space-y-1 text-sm">
                <p><strong>Future:</strong> <code>https://{{ created()!.slug }}.mobilytics.com</code></p>
                <p><strong>Vercel (now):</strong> <code>https://mobilytics.vercel.app?tenant={{ created()!.slug }}</code></p>
              </div>
            </div>
          </div>
          <div class="flex gap-3 justify-center pt-4">
            <button (click)="reset()" class="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-medium">
              Create Another
            </button>
            <button (click)="goToList()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              View All Tenants
            </button>
          </div>
        </div>
      } @else {
        <!-- Form -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Store Name <span class="text-red-500">*</span></label>
              <input
                [(ngModel)]="form.name"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="My Phone Shop"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Slug <span class="text-red-500">*</span></label>
              <div class="flex items-center gap-2">
                <code class="text-sm text-slate-400">https://</code>
                <input
                  [(ngModel)]="form.slug"
                  class="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="my-phone-shop"
                  (ngModelChange)="normalizeSlug()"
                />
                <code class="text-sm text-slate-400">.mobilytics.com</code>
              </div>
              <p class="text-xs text-slate-500 mt-1">Lowercase, no spaces. Used in URLs and tenant identification.</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Owner Name <span class="text-red-500">*</span></label>
              <input
                [(ngModel)]="form.ownerName"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Owner Email <span class="text-red-500">*</span></label>
              <input
                type="email"
                [(ngModel)]="form.ownerEmail"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="owner@shop.com"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Owner Password <span class="text-red-500">*</span></label>
              <input
                type="password"
                [(ngModel)]="form.ownerPassword"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
              <p class="text-xs text-slate-500 mt-1">Min 8 characters with uppercase, lowercase, and number.</p>
            </div>
          </div>

          @if (error()) {
            <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {{ error() }}
            </div>
          }

          <div class="flex gap-3 pt-4 border-t border-slate-200">
            <button (click)="goBack()" class="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-medium">
              Cancel
            </button>
            <button
              (click)="submit()"
              [disabled]="saving()"
              class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {{ saving() ? 'Creating...' : 'Create Tenant' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class TenantCreateComponent {
  private readonly api = inject(PlatformApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  form: CreateTenantRequest = {
    name: '',
    slug: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
  };

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly created = signal<Tenant | null>(null);

  normalizeSlug(): void {
    this.form.slug = this.form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  }

  submit(): void {
    if (!this.form.name || !this.form.slug || !this.form.ownerName || !this.form.ownerEmail || !this.form.ownerPassword) {
      this.error.set('All fields are required');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.api.createTenant(this.form).subscribe({
      next: tenant => {
        this.saving.set(false);
        this.created.set(tenant);
        this.toast.success('Tenant created successfully!');
      },
      error: (err: any) => {
        this.saving.set(false);
        this.error.set(err?.message || 'Failed to create tenant');
      },
    });
  }

  reset(): void {
    this.form = { name: '', slug: '', ownerName: '', ownerEmail: '', ownerPassword: '' };
    this.created.set(null);
    this.error.set(null);
  }

  goBack(): void {
    this.router.navigate(['/superadmin/tenants']);
  }

  goToList(): void {
    this.router.navigate(['/superadmin/tenants']);
  }
}
