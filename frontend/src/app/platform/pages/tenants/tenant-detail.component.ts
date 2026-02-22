import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PlatformApiService } from '../../../core/services/platform-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Tenant, Plan } from '../../../core/models/platform.models';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe],
  template: `
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="flex items-center gap-4">
        <a routerLink="/superadmin/tenants" class="text-slate-500 hover:text-slate-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <h1 class="text-2xl font-bold text-slate-800">Tenant Detail</h1>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
      } @else if (tenant()) {
        <!-- Header Card -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div class="flex flex-col md:flex-row md:items-center gap-4">
            <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
              {{ tenant()!.name.charAt(0) }}
            </div>
            <div class="flex-1">
              <h2 class="text-xl font-bold text-slate-800">{{ tenant()!.name }}</h2>
              <p class="text-slate-500"><code>{{ tenant()!.slug }}</code></p>
            </div>
            <div class="flex gap-2">
              <span class="text-sm px-3 py-1 rounded-full font-medium"
                [class]="tenant()!.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                         tenant()!.status === 'Suspended' ? 'bg-red-100 text-red-700' :
                         'bg-amber-100 text-amber-700'">
                {{ tenant()!.status }}
              </span>
              @if (tenant()!.status === 'Active') {
                <button (click)="suspend()" class="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 border border-red-300 rounded-full hover:bg-red-50">
                  Suspend
                </button>
              } @else {
                <button (click)="activate()" class="text-emerald-600 hover:text-emerald-800 text-sm font-medium px-3 py-1 border border-emerald-300 rounded-full hover:bg-emerald-50">
                  Activate
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Basic Info -->
          <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 class="font-semibold text-slate-800 border-b border-slate-200 pb-2">Basic Info</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-500">Slug</span>
                <span class="font-mono text-slate-800">{{ tenant()!.slug }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Created</span>
                <span class="text-slate-800">{{ tenant()!.createdAt | date:'medium' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Last Updated</span>
                <span class="text-slate-800">{{ tenant()!.updatedAt | date:'medium' }}</span>
              </div>
            </div>
          </div>

          <!-- Owner Info -->
          <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 class="font-semibold text-slate-800 border-b border-slate-200 pb-2">Owner</h3>
            @if (tenant()!.owner) {
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-slate-500">Name</span>
                  <span class="text-slate-800">{{ tenant()!.owner!.name }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Email</span>
                  <span class="text-slate-800">{{ tenant()!.owner!.email }}</span>
                </div>
              </div>
            } @else {
              <p class="text-slate-400 text-sm">No owner assigned</p>
            }
          </div>
        </div>

        <!-- Subscription Card -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 class="font-semibold text-slate-800">Subscription</h3>
            <a routerLink="/superadmin/subscriptions"
               [queryParams]="{ tenantId: tenant()!.id }"
               class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              Manage
            </a>
          </div>
          @if (tenant()!.subscription) {
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p class="text-slate-500 text-xs uppercase">Plan</p>
                <p class="font-medium text-slate-800">{{ tenant()!.subscription!.planName }}</p>
              </div>
              <div>
                <p class="text-slate-500 text-xs uppercase">Status</p>
                <span class="text-xs px-2 py-1 rounded-full"
                  [class]="tenant()!.subscription!.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                           tenant()!.subscription!.status === 'Trial' ? 'bg-blue-100 text-blue-700' :
                           tenant()!.subscription!.status === 'Grace' ? 'bg-orange-100 text-orange-700' :
                           'bg-slate-100 text-slate-600'">
                  {{ tenant()!.subscription!.status }}
                </span>
              </div>
              <div>
                <p class="text-slate-500 text-xs uppercase">Start Date</p>
                <p class="text-slate-800">{{ tenant()!.subscription!.startDate | date:'mediumDate' }}</p>
              </div>
              <div>
                <p class="text-slate-500 text-xs uppercase">End Date</p>
                <p class="text-slate-800">{{ tenant()!.subscription!.endDate | date:'mediumDate' }}</p>
              </div>
            </div>
          } @else {
            <div class="text-center py-6">
              <p class="text-slate-400 mb-4">No active subscription</p>
              <a routerLink="/superadmin/subscriptions"
                 [queryParams]="{ tenantId: tenant()!.id }"
                 class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Start Subscription
              </a>
            </div>
          }
        </div>

        <!-- Access URLs -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 class="font-semibold text-slate-800 border-b border-slate-200 pb-2">Access URLs</h3>
          <div class="space-y-3 text-sm">
            <div class="bg-slate-50 rounded-lg p-3">
              <p class="text-xs text-slate-500 uppercase font-medium mb-1">Subdomain (Future)</p>
              <code class="text-indigo-600">https://{{ tenant()!.slug }}.mobilytics.com</code>
            </div>
            <div class="bg-slate-50 rounded-lg p-3">
              <p class="text-xs text-slate-500 uppercase font-medium mb-1">Vercel (Current)</p>
              <code class="text-indigo-600">https://mobilytics.vercel.app?tenant={{ tenant()!.slug }}</code>
            </div>
            <div class="bg-slate-50 rounded-lg p-3">
              <p class="text-xs text-slate-500 uppercase font-medium mb-1">Admin Panel</p>
              <code class="text-indigo-600">https://mobilytics.vercel.app/admin?tenant={{ tenant()!.slug }}</code>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="bg-red-50 rounded-xl p-6 border border-red-200 space-y-4">
          <h3 class="font-semibold text-red-800">Danger Zone</h3>
          <p class="text-red-600 text-sm">Deleting a tenant will permanently remove all associated data.</p>
          <button (click)="deleteTenant()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Delete Tenant
          </button>
        </div>
      } @else {
        <div class="text-center py-12 text-slate-400">
          Tenant not found
        </div>
      }
    </div>
  `,
})
export class TenantDetailComponent implements OnInit {
  private readonly api = inject(PlatformApiService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly tenant = signal<Tenant | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.load(id);
    }
  }

  load(id: string): void {
    this.loading.set(true);
    this.api.getTenant(id).subscribe({
      next: data => {
        this.tenant.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.tenant.set(null);
        this.loading.set(false);
      },
    });
  }

  suspend(): void {
    if (!this.tenant()) return;
    if (!confirm(`Suspend "${this.tenant()!.name}"?`)) return;
    this.api.suspendTenant(this.tenant()!.id).subscribe({
      next: () => {
        this.toast.success('Tenant suspended');
        this.load(this.tenant()!.id);
      },
      error: () => this.toast.error('Failed to suspend'),
    });
  }

  activate(): void {
    if (!this.tenant()) return;
    this.api.activateTenant(this.tenant()!.id).subscribe({
      next: () => {
        this.toast.success('Tenant activated');
        this.load(this.tenant()!.id);
      },
      error: () => this.toast.error('Failed to activate'),
    });
  }

  deleteTenant(): void {
    if (!this.tenant()) return;
    if (!confirm(`DELETE "${this.tenant()!.name}"? This cannot be undone!`)) return;
    if (!confirm('Are you absolutely sure? All data will be lost.')) return;

    this.api.deleteTenant(this.tenant()!.id).subscribe({
      next: () => {
        this.toast.success('Tenant deleted');
        this.router.navigate(['/superadmin/tenants']);
      },
      error: () => this.toast.error('Failed to delete'),
    });
  }
}
