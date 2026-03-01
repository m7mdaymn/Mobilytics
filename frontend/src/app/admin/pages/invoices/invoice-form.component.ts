import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { I18nService } from '../../../core/services/i18n.service';
import { InvoiceCreateDto, Item } from '../../../core/models/item.models';
import { SettingsStore } from '../../../core/stores/settings.store';
import { TenantService } from '../../../core/services/tenant.service';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe],
  template: `
    <div class="max-w-5xl space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ i18n.t('invoices.newInvoice') }}</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ i18n.t('invoices.formSubtitle') }}</p>
        </div>
        <a [routerLink]="tenantService.adminUrl() + '/invoices'" class="text-sm text-gray-500 hover:text-gray-900 font-medium transition">&larr; {{ i18n.t('invoices.backToList') }}</a>
      </div>

      <!-- Customer -->
      <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('invoices.customerInfo') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('invoices.customer') }}</label>
            <input [(ngModel)]="form.customerName" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/10" [placeholder]="i18n.t('invoices.fullNamePlaceholder')" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('invoices.customerPhone') }}</label>
            <input [(ngModel)]="form.customerPhone" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/10" [placeholder]="i18n.t('invoices.phonePlaceholder')" />
          </div>
        </div>
      </div>

      <!-- Items Selection & Line Items -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Available Items Panel -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('invoices.availableItems') || 'Available Items' }}</h2>
            <span class="text-xs text-gray-400 font-medium">{{ allItems().length }} {{ i18n.t('items.title') || 'items' }}</span>
          </div>

          <!-- Search & Filter -->
          <div class="flex gap-2">
            <div class="relative flex-1">
              <svg class="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input [(ngModel)]="itemSearch" (input)="filterItems()" class="w-full ps-9 pe-4 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/10" [placeholder]="i18n.t('invoices.searchItems')" />
            </div>
          </div>

          <!-- Items Grid -->
          <div class="max-h-[420px] overflow-y-auto -mx-2 px-2 space-y-1.5">
            @if (loadingItems()) {
              @for (s of [1,2,3,4]; track s) {
                <div class="animate-pulse flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div class="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div class="flex-1 space-y-1.5">
                    <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div class="h-2.5 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              }
            } @else if (!filteredItems().length) {
              <div class="text-center py-8">
                <svg class="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                <p class="text-sm text-gray-400">{{ itemSearch ? 'No matching items' : 'No available items' }}</p>
              </div>
            } @else {
              @for (item of filteredItems(); track item.id) {
                <button (click)="addLineItem(item)"
                  [class.opacity-40]="isItemAdded(item.id)"
                  [class.pointer-events-none]="isItemAdded(item.id) && !isStockItem(item)"
                  class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition group text-start">
                  <!-- Image or Icon -->
                  <div class="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    @if (item.mainImageUrl) {
                      <img [src]="item.mainImageUrl" class="w-full h-full object-cover" />
                    } @else {
                      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                    }
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ item.title }}</p>
                    <div class="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      @if (item.storage || item.color) {
                        <span>{{ item.storage }} {{ item.color }}</span>
                      }
                      @if (item.quantity != null && item.quantity > 1) {
                        <span class="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">Stock: {{ item.quantity }}</span>
                      }
                      @if (isItemAdded(item.id)) {
                        <span class="bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium">Added</span>
                      }
                    </div>
                  </div>
                  <div class="text-end flex-shrink-0">
                    <p class="text-sm font-semibold text-gray-900">{{ item.price | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</p>
                    @if (item.condition && item.condition !== 'New') {
                      <span class="text-[10px] text-amber-500 font-medium uppercase">{{ item.condition }}</span>
                    }
                  </div>
                  <svg class="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                </button>
              }
              @if (hasMore()) {
                <button (click)="loadMore()" [disabled]="loadingItems()" class="w-full py-2.5 text-sm text-gray-500 hover:text-gray-900 font-medium transition text-center">
                  Load more...
                </button>
              }
            }
          </div>
        </div>

        <!-- Line Items (Cart) -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('invoices.lineItems') || 'Invoice Items' }}</h2>
            @if (lines.length) {
              <span class="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full font-medium">{{ lines.length }}</span>
            }
          </div>

          @if (lines.length) {
            <div class="space-y-2 max-h-[420px] overflow-y-auto -mx-2 px-2">
              @for (line of lines; track $index; let i = $index) {
                <div class="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-gray-200 transition">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ line.itemTitle }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ line.unitPrice | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }} each</p>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <button (click)="changeQty(i, -1)" class="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition text-sm font-bold">−</button>
                    <input [(ngModel)]="line.quantity" type="number" min="1" (ngModelChange)="recalc()"
                      class="w-12 text-center px-1 py-1 border border-gray-300 rounded-lg text-sm outline-none font-medium" />
                    <button (click)="changeQty(i, 1)" class="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition text-sm font-bold">+</button>
                  </div>
                  <p class="text-sm font-semibold text-gray-900 w-20 text-end">{{ line.quantity * line.unitPrice | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</p>
                  <button (click)="removeLine(i)" class="text-red-400 hover:text-red-600 transition flex-shrink-0">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              }
            </div>
          } @else {
            <div class="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <svg class="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
              <p class="text-sm text-gray-400">{{ i18n.t('invoices.addItemsHint') }}</p>
              <p class="text-xs text-gray-300 mt-1">Click items from the left to add</p>
            </div>
          }
        </div>
      </div>

      <!-- Payment & Totals -->
      <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('invoices.discount') }}</label>
            <input [(ngModel)]="form.discount" type="number" min="0" (ngModelChange)="recalc()" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/10" placeholder="0" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('invoices.paymentMethod') }}</label>
            <select [(ngModel)]="form.paymentMethod" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/10">
              <option value="Cash">{{ i18n.t('invoices.payment.cash') }}</option>
              <option value="Card">{{ i18n.t('invoices.payment.card') }}</option>
              <option value="BankTransfer">{{ i18n.t('invoices.payment.bank') }}</option>
              <option value="MobileMoney">{{ i18n.t('invoices.payment.mobile') }}</option>
              <option value="Installment">{{ i18n.t('invoices.payment.installment') }}</option>
              <option value="Mixed">{{ i18n.t('invoices.payment.mixed') }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('invoices.notes') }}</label>
            <input [(ngModel)]="form.notes" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/10" [placeholder]="i18n.t('invoices.notesPlaceholder')" />
          </div>
        </div>

        @if (form.paymentMethod === 'Installment') {
          <div class="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <p class="text-sm text-indigo-700 font-medium">{{ i18n.t('invoices.installmentInfo') }}</p>
            <p class="text-xs text-indigo-600 mt-1">{{ i18n.t('invoices.installmentInfoDetail') }}</p>
          </div>
        }

        <!-- Totals Summary -->
        <div class="flex justify-end">
          <div class="w-72 space-y-2.5 text-sm">
            <div class="flex justify-between text-gray-500">
              <span>{{ i18n.t('invoices.subtotal') }}</span>
              <span class="text-gray-900 font-medium">{{ subtotal() | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</span>
            </div>
            @if (form.discount) {
              <div class="flex justify-between text-gray-500">
                <span>{{ i18n.t('invoices.discount') }}</span>
                <span class="text-red-500 font-medium">-{{ form.discount | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</span>
              </div>
            }
            @if (taxAmount() > 0) {
              <div class="flex justify-between text-gray-500">
                <span>{{ i18n.t('invoices.tax') }}</span>
                <span class="text-gray-900 font-medium">{{ taxAmount() | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</span>
              </div>
            }
            <div class="flex justify-between font-bold text-lg border-t border-gray-200 pt-3">
              <span class="text-gray-900">{{ i18n.t('invoices.total') }}</span>
              <span class="text-gray-900">{{ total() | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap items-center gap-3">
        <a [routerLink]="tenantService.adminUrl() + '/invoices'" class="text-gray-500 hover:text-gray-900 px-4 py-2 text-sm font-medium transition">&larr; {{ i18n.t('common.cancel') }}</a>
        <div class="flex-1"></div>
        <button (click)="submit()" [disabled]="saving() || !lines.length"
          class="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
          @if (saving()) {
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            {{ i18n.t('invoices.creating') }}
          } @else {
            {{ i18n.t('invoices.create') }}
          }
        </button>
      </div>
    </div>
  `,
})
export class InvoiceFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly tenantService = inject(TenantService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  readonly settingsStore = inject(SettingsStore);
  readonly i18n = inject(I18nService);

  readonly allItems = signal<Item[]>([]);
  readonly filteredItems = signal<Item[]>([]);
  readonly loadingItems = signal(true);
  readonly saving = signal(false);
  readonly subtotal = signal(0);
  readonly taxAmount = signal(0);
  readonly total = signal(0);
  readonly hasMore = signal(false);

  itemSearch = '';
  lines: { itemId: string; itemTitle: string; quantity: number; unitPrice: number; vatPercent: number }[] = [];
  private searchTimeout: any;
  private currentPage = 1;
  private readonly pageSize = 50;

  form = {
    customerName: '', customerPhone: '',
    discount: 0, paymentMethod: 'Cash', notes: '',
  };

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loadingItems.set(true);
    this.api.get<any>('/Items', { pageSize: this.pageSize, pageNumber: this.currentPage, status: 'Available' })
      .subscribe({
        next: (d) => {
          const items = d?.items || d || [];
          if (this.currentPage === 1) {
            this.allItems.set(items);
          } else {
            this.allItems.set([...this.allItems(), ...items]);
          }
          this.hasMore.set(items.length === this.pageSize);
          this.filterItems();
          this.loadingItems.set(false);
        },
        error: () => this.loadingItems.set(false),
      });
  }

  loadMore(): void {
    this.currentPage++;
    this.loadItems();
  }

  filterItems(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      const q = this.itemSearch.toLowerCase().trim();
      if (!q) {
        this.filteredItems.set(this.allItems());
      } else {
        this.filteredItems.set(
          this.allItems().filter(i =>
            i.title.toLowerCase().includes(q) ||
            (i.color && i.color.toLowerCase().includes(q)) ||
            (i.storage && i.storage.toLowerCase().includes(q)) ||
            (i.brandName && i.brandName.toLowerCase().includes(q))
          )
        );
      }
    }, 150);
  }

  isItemAdded(itemId: string): boolean {
    return this.lines.some(l => l.itemId === itemId);
  }

  isStockItem(item: Item): boolean {
    return (item.quantity ?? 0) > 1;
  }

  addLineItem(item: Item): void {
    const existing = this.lines.find(l => l.itemId === item.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.lines.push({
        itemId: item.id,
        itemTitle: item.title,
        quantity: 1,
        unitPrice: item.price,
        vatPercent: item.taxStatus === 'Taxable' ? (item.vatPercent || 0) : 0,
      });
    }
    this.recalc();
  }

  changeQty(index: number, delta: number): void {
    const line = this.lines[index];
    const newQty = line.quantity + delta;
    if (newQty <= 0) {
      this.removeLine(index);
    } else {
      line.quantity = newQty;
      this.recalc();
    }
  }

  removeLine(index: number): void {
    this.lines.splice(index, 1);
    this.recalc();
  }

  recalc(): void {
    const sub = this.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const tax = this.lines.reduce((s, l) => s + (l.quantity * l.unitPrice * l.vatPercent / 100), 0);
    this.subtotal.set(sub);
    this.taxAmount.set(Math.round(tax * 100) / 100);
    this.total.set(Math.max(0, sub + tax - (this.form.discount || 0)));
  }

  submit(): void {
    if (!this.lines.length) { this.toastService.error(this.i18n.t('invoices.minOneItem')); return; }
    this.saving.set(true);
    const body: InvoiceCreateDto = {
      customerName: this.form.customerName,
      customerPhone: this.form.customerPhone,
      discount: this.form.discount,
      paymentMethod: this.form.paymentMethod,
      notes: this.form.notes,
      items: this.lines.map(l => ({ itemId: l.itemId, unitPrice: l.unitPrice, quantity: l.quantity })),
    };
    this.api.post<any>('/Invoices', body).subscribe({
      next: (result) => {
        this.toastService.success(this.i18n.t('invoices.created'));
        this.saving.set(false);
        this.router.navigate([this.tenantService.adminUrl() + '/invoices', result?.id || '']);
      },
      error: (err) => {
        this.toastService.error(err.message || this.i18n.t('invoices.createFailed'));
        this.saving.set(false);
      },
    });
  }
}
