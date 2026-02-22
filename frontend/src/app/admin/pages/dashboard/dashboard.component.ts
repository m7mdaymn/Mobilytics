import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SettingsStore } from '../../../core/stores/settings.store';
import { DashboardData } from '../../../core/models/item.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Dashboard</h1>
        <div class="flex items-center gap-2">
          <select [(ngModel)]="dateRange" (change)="loadData()" class="input-field w-auto text-sm">
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      <!-- KPI Cards -->
      @if (loading()) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          @for (i of [1,2,3,4,5,6,7]; track i) {
            <div class="skeleton h-24 rounded-xl"></div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="card p-4">
            <p class="text-sm text-[color:var(--color-text-muted)]">Sales Today</p>
            <p class="text-2xl font-bold text-[color:var(--color-primary)]">
              {{ data()?.salesToday | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
            </p>
          </div>
          <div class="card p-4">
            <p class="text-sm text-[color:var(--color-text-muted)]">Invoices</p>
            <p class="text-2xl font-bold">{{ data()?.invoicesCount || 0 }}</p>
          </div>
          <div class="card p-4">
            <p class="text-sm text-[color:var(--color-text-muted)]">Devices Sold</p>
            <p class="text-2xl font-bold">{{ data()?.devicesSold || 0 }}</p>
          </div>
          <div class="card p-4">
            <p class="text-sm text-[color:var(--color-text-muted)]">Accessories Sold</p>
            <p class="text-2xl font-bold">{{ data()?.accessoriesSoldQty || 0 }}</p>
          </div>
          <div class="card p-4">
            <p class="text-sm text-[color:var(--color-text-muted)]">Leads Today</p>
            <p class="text-2xl font-bold text-[color:var(--color-accent)]">{{ data()?.leadsToday || 0 }}</p>
          </div>
          <div class="card p-4">
            <p class="text-sm text-[color:var(--color-text-muted)]">Expenses Today</p>
            <p class="text-2xl font-bold text-[color:var(--color-danger)]">
              {{ data()?.expensesToday | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
            </p>
          </div>
          <div class="card p-4 col-span-2 md:col-span-1">
            <p class="text-sm text-[color:var(--color-text-muted)]">Net After Expenses</p>
            <p class="text-2xl font-bold" [class]="(data()?.netAfterExpenses || 0) >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ data()?.netAfterExpenses | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
            </p>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Sales Trend -->
          <div class="card p-4">
            <h3 class="font-semibold mb-3">Sales Trend</h3>
            <div class="h-48 flex items-end gap-1">
              @if (data()?.salesTrend?.length) {
                @for (point of data()!.salesTrend; track point.date) {
                  <div class="flex-1 flex flex-col items-center gap-1">
                    <div
                      class="w-full bg-[color:var(--color-primary)] rounded-t opacity-80"
                      [style.height.%]="getBarHeight(point.value, maxSales())">
                    </div>
                    <span class="text-[10px] text-[color:var(--color-text-muted)]">{{ point.date | date: 'dd' }}</span>
                  </div>
                }
              } @else {
                <p class="text-sm text-[color:var(--color-text-muted)] w-full text-center">No data</p>
              }
            </div>
          </div>

          <!-- Leads Trend -->
          <div class="card p-4">
            <h3 class="font-semibold mb-3">Leads Trend</h3>
            <div class="h-48 flex items-end gap-1">
              @if (data()?.leadsTrend?.length) {
                @for (point of data()!.leadsTrend; track point.date) {
                  <div class="flex-1 flex flex-col items-center gap-1">
                    <div
                      class="w-full bg-[color:var(--color-accent)] rounded-t opacity-80"
                      [style.height.%]="getBarHeight(point.value, maxLeads())">
                    </div>
                    <span class="text-[10px] text-[color:var(--color-text-muted)]">{{ point.date | date: 'dd' }}</span>
                  </div>
                }
              } @else {
                <p class="text-sm text-[color:var(--color-text-muted)] w-full text-center">No data</p>
              }
            </div>
          </div>
        </div>

        <!-- Top Item Types -->
        @if (data()?.topItemTypes?.length) {
          <div class="card p-4">
            <h3 class="font-semibold mb-3">Top Item Types</h3>
            <div class="space-y-2">
              @for (type of data()!.topItemTypes; track type.name) {
                <div class="flex items-center gap-3">
                  <span class="text-sm w-28 truncate">{{ type.name }}</span>
                  <div class="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      class="h-full bg-[color:var(--color-primary)] rounded-full"
                      [style.width.%]="getBarHeight(type.count, maxTypeCount())">
                    </div>
                  </div>
                  <span class="text-sm font-medium w-10 text-right">{{ type.count }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Quick Actions -->
        <div class="flex flex-wrap gap-3">
          <a routerLink="/admin/items/new" class="btn-primary">+ New Item</a>
          <a routerLink="/admin/invoices/new" class="btn-accent">+ Create Invoice</a>
          <a routerLink="/admin/expenses" class="btn-secondary">+ Add Expense</a>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly settingsStore = inject(SettingsStore);

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
    return Math.max(1, ...(this.data()?.topItemTypes?.map(t => t.count) || [1]));
  }

  getBarHeight(value: number, max: number): number {
    return Math.max(5, (value / max) * 100);
  }
}
