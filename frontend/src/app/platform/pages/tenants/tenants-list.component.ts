import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PlatformApiService } from '../../../core/services/platform-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Tenant } from '../../../core/models/platform.models';

@Component({
  selector: 'app-tenants-list',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-slate-800">Tenants</h1>
        <a routerLink="/superadmin/tenants/create"
           class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2">
          <span>+ Create Tenant</span>
        </a>
      </div>

      <!-- Search & Filters -->
      <div class="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div class="flex flex-wrap gap-3">
          <input
            [(ngModel)]="search"
            placeholder="Search name or slug..."
            class="flex-1 min-w-[200px] px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <select [(ngModel)]="statusFilter" class="px-4 py-2 border border-slate-300 rounded-lg">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Pending">Pending</option>
          </select>
          <button (click)="load()" class="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-medium">
            Filter
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        @if (loading()) {
          <div class="flex justify-center py-12">
            <div class="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-6 py-3 text-left font-semibold text-slate-700">Tenant</th>
                  <th class="px-6 py-3 text-left font-semibold text-slate-700">Slug</th>
                  <th class="px-6 py-3 text-center font-semibold text-slate-700">Status</th>
                  <th class="px-6 py-3 text-center font-semibold text-slate-700">Subscription</th>
                  <th class="px-6 py-3 text-left font-semibold text-slate-700">Created</th>
                  <th class="px-6 py-3 text-right font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (tenant of filteredTenants(); track tenant.id) {
                  <tr class="hover:bg-slate-50">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-lg font-bold text-slate-600">
                          {{ tenant.name.charAt(0) }}
                        </div>
                        <div>
                          <p class="font-medium text-slate-800">{{ tenant.name }}</p>
                          @if (tenant.owner) {
                            <p class="text-xs text-slate-500">{{ tenant.owner.email }}</p>
                          }
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <code class="text-xs bg-slate-100 px-2 py-1 rounded">{{ tenant.slug }}</code>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <span class="text-xs px-2 py-1 rounded-full font-medium"
                        [class]="tenant.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                                 tenant.status === 'Suspended' ? 'bg-red-100 text-red-700' :
                                 'bg-amber-100 text-amber-700'">
                        {{ tenant.status }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                      @if (tenant.subscription) {
                        <span class="text-xs px-2 py-1 rounded-full"
                          [class]="tenant.subscription.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                                   tenant.subscription.status === 'Trial' ? 'bg-blue-100 text-blue-700' :
                                   tenant.subscription.status === 'Grace' ? 'bg-orange-100 text-orange-700' :
                                   'bg-slate-100 text-slate-600'">
                          {{ tenant.subscription.status }} - {{ tenant.subscription.planName }}
                        </span>
                      } @else {
                        <span class="text-xs text-slate-400">No subscription</span>
                      }
                    </td>
                    <td class="px-6 py-4 text-slate-500 text-sm">
                      {{ tenant.createdAt | date:'mediumDate' }}
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <a [routerLink]="['/superadmin/tenants', tenant.id]"
                           class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                          View
                        </a>
                        @if (tenant.status === 'Active') {
                          <button (click)="suspendTenant(tenant)"
                                  class="text-red-600 hover:text-red-800 text-sm font-medium">
                            Suspend
                          </button>
                        } @else {
                          <button (click)="activateTenant(tenant)"
                                  class="text-emerald-600 hover:text-emerald-800 text-sm font-medium">
                            Activate
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                      No tenants found
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
})
export class TenantsListComponent implements OnInit {
  private readonly api = inject(PlatformApiService);
  private readonly toast = inject(ToastService);

  readonly tenants = signal<Tenant[]>([]);
  readonly loading = signal(true);

  search = '';
  statusFilter = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getTenants().subscribe({
      next: data => {
        this.tenants.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.tenants.set([]);
        this.loading.set(false);
      },
    });
  }

  filteredTenants(): Tenant[] {
    let result = this.tenants();
    if (this.search) {
      const q = this.search.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q));
    }
    if (this.statusFilter) {
      result = result.filter(t => t.status === this.statusFilter);
    }
    return result;
  }

  suspendTenant(tenant: Tenant): void {
    if (!confirm(`Suspend "${tenant.name}"? Users won't be able to access their store.`)) return;
    this.api.suspendTenant(tenant.id).subscribe({
      next: () => {
        this.toast.success('Tenant suspended');
        this.load();
      },
      error: () => this.toast.error('Failed to suspend'),
    });
  }

  activateTenant(tenant: Tenant): void {
    this.api.activateTenant(tenant.id).subscribe({
      next: () => {
        this.toast.success('Tenant activated');
        this.load();
      },
      error: () => this.toast.error('Failed to activate'),
    });
  }
}
