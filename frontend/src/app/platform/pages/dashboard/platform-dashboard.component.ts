import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { PlatformApiService } from '../../../core/services/platform-api.service';
import { PlatformDashboard, Tenant } from '../../../core/models/platform.models';

@Component({
  selector: 'app-platform-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-slate-800">Platform Dashboard</h1>
        <div class="flex gap-2">
          <select [(value)]="range" (change)="load()" class="text-sm border border-slate-300 rounded-lg px-3 py-2">
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="year">Last year</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
      } @else if (dashboard()) {
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-2xl">🏢</div>
              <div>
                <p class="text-2xl font-bold text-slate-800">{{ dashboard()!.activeTenants }}</p>
                <p class="text-sm text-slate-500">Active Tenants</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-2xl">⚠️</div>
              <div>
                <p class="text-2xl font-bold text-slate-800">{{ dashboard()!.suspendedTenants }}</p>
                <p class="text-sm text-slate-500">Suspended</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">⏳</div>
              <div>
                <p class="text-2xl font-bold text-slate-800">{{ dashboard()!.trialTenants }}</p>
                <p class="text-sm text-slate-500">Trial</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">📅</div>
              <div>
                <p class="text-2xl font-bold text-slate-800">{{ dashboard()!.expiringSubscriptions }}</p>
                <p class="text-sm text-slate-500">Expiring Soon</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Revenue & Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
            <p class="text-indigo-200 text-sm font-medium">Monthly Revenue</p>
            <p class="text-3xl font-bold mt-1">{{ dashboard()!.monthlyRevenue | number:'1.0-0' }} EGP</p>
          </div>

          <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p class="text-slate-500 text-sm font-medium">Total Tenants</p>
            <p class="text-3xl font-bold text-slate-800 mt-1">{{ dashboard()!.totalTenants }}</p>
          </div>

          <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p class="text-slate-500 text-sm font-medium">Total Leads (All Tenants)</p>
            <p class="text-3xl font-bold text-slate-800 mt-1">{{ dashboard()!.totalLeads }}</p>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 class="font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div class="flex flex-wrap gap-3">
            <a routerLink="/superadmin/tenants/create" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              + Create Tenant
            </a>
            <a routerLink="/superadmin/subscriptions" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Manage Subscriptions
            </a>
            <a routerLink="/superadmin/plans" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Edit Plans
            </a>
          </div>
        </div>

        <!-- Recent Tenants -->
        @if (dashboard()!.recentTenants?.length) {
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-200">
              <h2 class="font-semibold text-slate-800">Recent Tenants</h2>
            </div>
            <div class="divide-y divide-slate-100">
              @for (tenant of dashboard()!.recentTenants; track tenant.id) {
                <div class="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-600">
                      {{ tenant.name.charAt(0) }}
                    </div>
                    <div>
                      <p class="font-medium text-slate-800">{{ tenant.name }}</p>
                      <p class="text-sm text-slate-500">{{ tenant.slug }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    <span class="text-xs px-2 py-1 rounded-full"
                      [class]="tenant.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                               tenant.status === 'Suspended' ? 'bg-red-100 text-red-700' :
                               'bg-amber-100 text-amber-700'">
                      {{ tenant.status }}
                    </span>
                    <span class="text-sm text-slate-400">{{ tenant.createdAt | date:'shortDate' }}</span>
                    <a [routerLink]="['/superadmin/tenants', tenant.id]" class="text-indigo-600 hover:text-indigo-800 text-sm">View</a>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class PlatformDashboardComponent implements OnInit {
  private readonly api = inject(PlatformApiService);

  readonly dashboard = signal<PlatformDashboard | null>(null);
  readonly loading = signal(true);
  range = 'month';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getDashboard(this.range).subscribe({
      next: data => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: () => {
        // Mock data for development
        this.dashboard.set({
          totalTenants: 0,
          activeTenants: 0,
          suspendedTenants: 0,
          trialTenants: 0,
          expiringSubscriptions: 0,
          monthlyRevenue: 0,
          totalLeads: 0,
          recentTenants: [],
        });
        this.loading.set(false);
      },
    });
  }
}
