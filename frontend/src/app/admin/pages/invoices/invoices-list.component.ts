import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { Invoice } from '../../../core/models/item.models';
import { PaginatedList } from '../../../core/models/api.models';
import { SettingsStore } from '../../../core/stores/settings.store';
import { TenantService } from '../../../core/services/tenant.service';
import { I18nService } from '../../../core/services/i18n.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-invoices-list',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe, DatePipe, PaginationComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ i18n.t('invoices.title') }}</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ i18n.t('invoices.subtitle') }}</p>
        </div>
        <a [routerLink]="tenantService.adminUrl() + '/invoices/new'"
          class="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          {{ i18n.t('invoices.newInvoice') }}
        </a>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl border border-gray-200 p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>
            </div>
            <div>
              <p class="text-xs text-gray-500">{{ i18n.t('invoices.total') }}</p>
              <p class="text-xl font-bold text-gray-900">{{ paginated()?.totalCount || 0 }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-2xl border border-gray-200 p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/></svg>
            </div>
            <div>
              <p class="text-xs text-gray-500">{{ i18n.t('invoices.revenue') }}</p>
              <p class="text-xl font-bold text-green-600">{{ totalRevenue() | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-2xl border border-gray-200 p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <p class="text-xs text-gray-500">{{ i18n.t('invoices.pending') }}</p>
              <p class="text-xl font-bold text-yellow-600">{{ pendingCount() }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-2xl border border-gray-200 p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/></svg>
            </div>
            <div>
              <p class="text-xs text-gray-500">{{ i18n.t('invoices.refunded') }}</p>
              <p class="text-xl font-bold text-red-600">{{ refundedCount() }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-2xl border border-gray-200 p-4">
        <div class="flex flex-wrap gap-3 items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-xs font-medium text-gray-500 mb-1">{{ i18n.t('common.search') }}</label>
            <div class="relative">
              <svg class="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input [(ngModel)]="searchQuery" (keyup.enter)="load()" class="w-full ps-9 pe-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/10" [placeholder]="i18n.t('invoices.searchPlaceholder')" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">{{ i18n.t('common.from') }}</label>
            <input [(ngModel)]="dateFrom" type="date" class="px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/10" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">{{ i18n.t('common.to') }}</label>
            <input [(ngModel)]="dateTo" type="date" class="px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/10" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">{{ i18n.t('common.status') }}</label>
            <select [(ngModel)]="statusFilter" class="px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/10">
              <option value="">{{ i18n.t('common.all') }}</option>
              <option value="Paid">{{ i18n.t('invoices.paid') }}</option>
              <option value="Refunded">{{ i18n.t('invoices.refunded') }}</option>
            </select>
          </div>
          <button (click)="currentPage = 1; load()" class="bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition">
            {{ i18n.t('common.apply') }}
          </button>
          @if (searchQuery || dateFrom || dateTo || statusFilter) {
            <button (click)="clearFilters()" class="text-gray-500 hover:text-gray-900 px-3 py-2.5 text-sm font-medium transition">{{ i18n.t('common.clear') }}</button>
          }
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="px-5 py-3.5 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('invoices.invoiceCol') }}</th>
              <th class="px-5 py-3.5 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('invoices.date') }}</th>
              <th class="px-5 py-3.5 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('invoices.customer') }}</th>
              <th class="px-5 py-3.5 text-end text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('invoices.total') }}</th>
              <th class="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('common.status') }}</th>
              <th class="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('invoices.payment') }}</th>
              <th class="px-5 py-3.5 text-end text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            @for (inv of invoices(); track inv.id) {
              <tr class="hover:bg-gray-50/50 transition">
                <td class="px-5 py-3.5">
                  <span class="font-mono text-xs font-semibold text-gray-900">{{ inv.invoiceNumber }}</span>
                </td>
                <td class="px-5 py-3.5 text-gray-600">{{ inv.createdAt | date:'mediumDate' }}</td>
                <td class="px-5 py-3.5">
                  <div>
                    <span class="font-medium text-gray-900">{{ inv.customerName || '—' }}</span>
                    @if (inv.customerPhone) {
                      <span class="block text-xs text-gray-400">{{ inv.customerPhone }}</span>
                    }
                  </div>
                </td>
                <td class="px-5 py-3.5 text-end font-semibold text-gray-900">{{ inv.total | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</td>
                <td class="px-5 py-3.5 text-center">
                  <span class="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium"
                    [class]="inv.isRefund ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20' : 'bg-green-50 text-green-700 ring-1 ring-green-600/20'">
                    {{ inv.isRefund ? i18n.t('invoices.refunded') : i18n.t('invoices.paid') }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-center">
                  <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{{ inv.paymentMethod }}</span>
                </td>
                <td class="px-5 py-3.5 text-end">
                  <a [routerLink]="tenantService.adminUrl() + '/invoices/' + inv.id"
                    class="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition">
                    {{ i18n.t('invoices.view') }}
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  </a>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="px-5 py-16 text-center">
                  <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>
                  <p class="text-gray-400 font-medium">{{ i18n.t('invoices.noData') }}</p>
                  <p class="text-xs text-gray-300 mt-1">{{ i18n.t('invoices.emptyHint') }}</p>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (paginated(); as p) {
        <app-pagination [currentPage]="currentPage" [totalPages]="p.totalPages" [totalCount]="p.totalCount"
          [pageSize]="pageSize" (pageChange)="onPage($event)" />
      }
    </div>
  `,
})
export class InvoicesListComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly settingsStore = inject(SettingsStore);
  readonly tenantService = inject(TenantService);
  readonly i18n = inject(I18nService);

  readonly invoices = signal<Invoice[]>([]);
  readonly paginated = signal<PaginatedList<Invoice> | null>(null);
  readonly totalRevenue = signal(0);
  readonly pendingCount = signal(0);
  readonly refundedCount = signal(0);

  searchQuery = '';
  dateFrom = '';
  dateTo = '';
  statusFilter = '';
  currentPage = 1;
  pageSize = 20;

  ngOnInit(): void { this.load(); }

  clearFilters(): void {
    this.searchQuery = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.statusFilter = '';
    this.currentPage = 1;
    this.load();
  }

  load(): void {
    const params: any = { page: this.currentPage, pageSize: this.pageSize };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.dateFrom) params.from = this.dateFrom;
    if (this.dateTo) params.to = this.dateTo;
    if (this.statusFilter) params.status = this.statusFilter;

    this.api.get<PaginatedList<Invoice>>('/Invoices', params).subscribe(d => {
      if (d) {
        this.paginated.set(d);
        this.invoices.set(d.items);
        this.totalRevenue.set(d.items.filter(inv => !inv.isRefund).reduce((sum, inv) => sum + inv.total, 0));
        this.pendingCount.set(0);
        this.refundedCount.set(d.items.filter(inv => inv.isRefund).length);
      }
    });
  }

  onPage(page: number): void {
    this.currentPage = page;
    this.load();
  }
}
