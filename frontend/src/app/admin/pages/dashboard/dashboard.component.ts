import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SettingsStore } from '../../../core/stores/settings.store';
import { DashboardData } from '../../../core/models/item.models';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ i18n.t('dashboard.title') }}</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ settingsStore.storeName() }}</p>
        </div>
        <div class="flex items-center gap-2">
          <select [(ngModel)]="dateRange" (ngModelChange)="loadData()"
            class="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-black/5 focus:border-gray-300 outline-none">
            <option value="7d">{{ i18n.t('common.last7days') }}</option>
            <option value="30d">{{ i18n.t('common.last30days') }}</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <div class="h-28 rounded-2xl bg-gray-100 animate-pulse"></div>
          }
        </div>
      } @else {

        <!-- KPI Hero Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Total Sales -->
          <div class="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl p-5 text-white">
            <div class="absolute top-0 right-0 opacity-10 text-7xl font-black pr-2 pt-1">$</div>
            <p class="text-xs font-medium text-gray-300 uppercase tracking-wider">{{ i18n.t('dashboard.salesToday') }}</p>
            <p class="text-2xl font-bold mt-1">{{ data()?.totalSales | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</p>
          </div>

          <!-- Net Profit -->
          <div class="relative overflow-hidden rounded-2xl p-5 border border-gray-200 bg-white">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ i18n.t('dashboard.netProfit') }}</p>
            <p class="text-2xl font-bold mt-1" [class]="(data()?.netAfterExpenses || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'">
              {{ data()?.netAfterExpenses | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
            </p>
          </div>

          <!-- Invoices -->
          <div class="relative overflow-hidden rounded-2xl p-5 border border-gray-200 bg-white">
            <div class="absolute top-3 right-4 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ i18n.t('dashboard.invoices') }}</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ data()?.invoicesCount || 0 }}</p>
          </div>

          <!-- Expenses -->
          <div class="relative overflow-hidden rounded-2xl p-5 border border-gray-200 bg-white">
            <div class="absolute top-3 right-4 w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>
            </div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ i18n.t('dashboard.expenses') }}</p>
            <p class="text-2xl font-bold text-red-600 mt-1">{{ data()?.totalExpenses | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</p>
          </div>

          <!-- Devices Sold -->
          <div class="rounded-2xl p-5 border border-gray-200 bg-white">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ i18n.t('dashboard.devicesSold') }}</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ data()?.devicesSoldCount || 0 }}</p>
          </div>

          <!-- Accessories Sold -->
          <div class="rounded-2xl p-5 border border-gray-200 bg-white">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ i18n.t('dashboard.accessoriesSold') }}</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ data()?.accessoriesSoldQty || 0 }}</p>
          </div>

          <!-- Leads -->
          <div class="rounded-2xl p-5 border border-gray-200 bg-white">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ i18n.t('dashboard.leadsToday') }}</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ data()?.leadsCount || 0 }}</p>
          </div>

          <!-- Items In Stock -->
          <div class="rounded-2xl p-5 border border-gray-200 bg-white">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ i18n.t('dashboard.itemsInStock') }}</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ data()?.itemsInStock || 0 }}</p>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Sales Trend -->
          <div class="bg-white rounded-2xl p-5 border border-gray-200">
            <h3 class="font-semibold text-gray-900 mb-4">{{ i18n.t('dashboard.salesTrend') }}</h3>
            <div class="h-48 flex items-end gap-1">
              @if (data()?.salesTrend?.length) {
                @for (point of data()!.salesTrend; track point.date) {
                  <div class="flex-1 flex flex-col items-center gap-1 group relative">
                    <div class="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                      {{ point.value | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
                    </div>
                    <div
                      class="w-full bg-gradient-to-t from-gray-900 to-gray-600 rounded-t transition-all hover:from-black hover:to-gray-500"
                      [style.height.%]="getBarHeight(point.value, maxSales())">
                    </div>
                    <span class="text-[10px] text-gray-400">{{ formatDate(point.date) }}</span>
                  </div>
                }
              } @else {
                <p class="text-sm text-gray-400 w-full text-center py-16">{{ i18n.t('common.noData') }}</p>
              }
            </div>
          </div>

          <!-- Leads Trend -->
          <div class="bg-white rounded-2xl p-5 border border-gray-200">
            <h3 class="font-semibold text-gray-900 mb-4">{{ i18n.t('dashboard.leadsTrend') }}</h3>
            <div class="h-48 flex items-end gap-1">
              @if (data()?.leadsTrend?.length) {
                @for (point of data()!.leadsTrend; track point.date) {
                  <div class="flex-1 flex flex-col items-center gap-1 group relative">
                    <div class="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                      {{ point.value }}
                    </div>
                    <div
                      class="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t transition-all hover:from-blue-600 hover:to-blue-400"
                      [style.height.%]="getBarHeight(point.value, maxLeads())">
                    </div>
                    <span class="text-[10px] text-gray-400">{{ formatDate(point.date) }}</span>
                  </div>
                }
              } @else {
                <p class="text-sm text-gray-400 w-full text-center py-16">{{ i18n.t('common.noData') }}</p>
              }
            </div>
          </div>
        </div>

        <!-- Recent Invoices -->
        @if (data()?.recentInvoices?.length) {
          <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 class="font-semibold text-gray-900">{{ i18n.t('dashboard.recentInvoices') }}</h3>
              <a routerLink="/admin/invoices" class="text-sm text-gray-500 hover:text-gray-900 font-medium transition">{{ i18n.t('dashboard.viewAll') }} &rarr;</a>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('dashboard.customer') }}</th>
                    <th class="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('dashboard.total') }}</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('dashboard.payment') }}</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('dashboard.date') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @for (inv of data()!.recentInvoices; track inv.id) {
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-5 py-3 font-mono text-gray-600">{{ inv.invoiceNumber }}</td>
                      <td class="px-5 py-3 text-gray-900">{{ inv.customerName || '—' }}</td>
                      <td class="px-5 py-3 text-right font-semibold" [class]="inv.isRefund ? 'text-red-600' : 'text-gray-900'">
                        @if (inv.isRefund) { <span class="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded mr-1">{{ i18n.t('dashboard.refund') }}</span> }
                        {{ inv.total | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
                      </td>
                      <td class="px-5 py-3">
                        <span class="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{{ inv.paymentMethod }}</span>
                      </td>
                      <td class="px-5 py-3 text-gray-500">{{ inv.createdAt | date: 'MMM d, h:mm a' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Bottom Row: Top Types + Alerts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Top Item Types -->
          @if (data()?.topItemTypes?.length) {
            <div class="bg-white rounded-2xl p-5 border border-gray-200">
              <h3 class="font-semibold text-gray-900 mb-4">{{ i18n.t('dashboard.topTypes') }}</h3>
              <div class="space-y-3">
                @for (type of data()!.topItemTypes; track type.name) {
                  <div class="flex items-center gap-3">
                    <span class="text-sm w-28 truncate text-gray-700">{{ type.name }}</span>
                    <div class="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div class="h-full bg-gray-900 rounded-full transition-all"
                        [style.width.%]="getBarHeight(type.soldCount, maxTypeCount())">
                      </div>
                    </div>
                    <span class="text-sm font-semibold text-gray-900 w-10 text-right">{{ type.soldCount }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Operational Alerts -->
          <div class="bg-white rounded-2xl p-5 border border-gray-200">
            <h3 class="font-semibold text-gray-900 mb-4">{{ i18n.t('dashboard.operationalAlerts') }}</h3>
            <div class="space-y-3">
              @if (data()?.lowStockItems?.length) {
                <div>
                  <p class="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">{{ i18n.t('dashboard.lowStock') }} ({{ data()!.lowStockItems.length }})</p>
                  @for (item of data()!.lowStockItems.slice(0, 5); track item.id) {
                    <a [routerLink]="['/admin/items', item.id]" class="flex items-center justify-between py-1.5 hover:bg-gray-50 -mx-2 px-2 rounded transition">
                      <span class="text-sm text-gray-700 truncate">{{ item.title }}</span>
                      <span class="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{{ item.quantity }}</span>
                    </a>
                  }
                </div>
              }
              @if (data()?.missingImagesItems?.length) {
                <div>
                  <p class="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-2">{{ i18n.t('dashboard.missingImages') }} ({{ data()!.missingImagesItems.length }})</p>
                  @for (item of data()!.missingImagesItems.slice(0, 3); track item.id) {
                    <a [routerLink]="['/admin/items', item.id]" class="block text-sm text-gray-600 hover:text-gray-900 py-1 transition">{{ item.title }}</a>
                  }
                </div>
              }
              @if (!data()?.lowStockItems?.length && !data()?.missingImagesItems?.length && !data()?.missingPriceItems?.length) {
                <p class="text-sm text-gray-400 text-center py-6">All clear — no alerts</p>
              }
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="flex flex-wrap gap-3">
          <a routerLink="/admin/items/new" class="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            {{ i18n.t('dashboard.newItem') }}
          </a>
          <a routerLink="/admin/invoices/new" class="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 transition-colors">
            {{ i18n.t('dashboard.createInvoice') }}
          </a>
          <a routerLink="/admin/expenses" class="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 transition-colors">
            {{ i18n.t('dashboard.addExpense') }}
          </a>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly settingsStore = inject(SettingsStore);
  readonly i18n = inject(I18nService);

  readonly data = signal<DashboardData | null>(null);
  readonly loading = signal(true);
  dateRange = '7d';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const days = this.dateRange === '30d' ? 30 : 7;
    const from = new Date();
    from.setDate(from.getDate() - days);
    const to = new Date();

    this.api.get<DashboardData>('/Reports/dashboard', {
      from: from.toISOString(),
      to: to.toISOString(),
    }).subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  maxSales(): number {
    return Math.max(1, ...(this.data()?.salesTrend?.map(p => p.value) || [1]));
  }

  maxLeads(): number {
    return Math.max(1, ...(this.data()?.leadsTrend?.map(p => p.value) || [1]));
  }

  maxTypeCount(): number {
    return Math.max(1, ...(this.data()?.topItemTypes?.map(t => t.soldCount) || [1]));
  }

  getBarHeight(value: number, max: number): number {
    return Math.max(5, (value / max) * 100);
  }

  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en', { day: '2-digit', month: 'short' });
    } catch {
      return dateStr;
    }
  }
}
