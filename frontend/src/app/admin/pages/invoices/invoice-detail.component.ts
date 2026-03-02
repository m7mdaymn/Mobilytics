import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { I18nService } from '../../../core/services/i18n.service';
import { Invoice } from '../../../core/models/item.models';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsStore } from '../../../core/stores/settings.store';
import { TenantService } from '../../../core/services/tenant.service';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="max-w-3xl space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ i18n.t('invoices.invoiceHash') }} {{ invoice()?.invoiceNumber }}</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ i18n.t('invoices.detailSubtitle') }}</p>
        </div>
        <a [routerLink]="tenantService.adminUrl() + '/invoices'" class="text-sm text-gray-500 hover:text-gray-900 font-medium transition">{{ i18n.t('invoices.backToList') }}</a>
      </div>

      @if (invoice(); as inv) {
        <!-- Status Cards -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6">
          <div class="flex flex-wrap gap-6 items-start">
            <div>
              <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ i18n.t('common.status') }}</span>
              <div class="mt-1.5">
                <span class="inline-flex items-center text-sm px-3 py-1.5 rounded-full font-semibold"
                  [class]="inv.isRefund ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20' : 'bg-green-50 text-green-700 ring-1 ring-green-600/20'">
                  {{ inv.isRefund ? i18n.t('invoices.refunded') : i18n.t('invoices.paid') }}
                </span>
              </div>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ i18n.t('common.date') }}</span>
              <p class="font-medium text-gray-900 mt-1.5">{{ inv.createdAt | date:'medium' }}</p>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ i18n.t('invoices.paymentMethod') }}</span>
              <p class="mt-1.5"><span class="text-sm font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">{{ i18n.t('invoices.payment.' + inv.paymentMethod.toLowerCase()) }}</span></p>
            </div>
            @if (inv.customerName) {
              <div>
                <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ i18n.t('invoices.customer') }}</span>
                <p class="font-medium text-gray-900 mt-1.5">{{ inv.customerName }}</p>
              </div>
            } @else {
              <div>
                <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ i18n.t('invoices.customer') }}</span>
                <p class="text-gray-400 mt-1.5">—</p>
              </div>
            }
            @if (inv.customerPhone) {
              <div>
                <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ i18n.t('invoices.customerPhone') }}</span>
                <p class="font-medium text-gray-900 mt-1.5">{{ inv.customerPhone }}</p>
              </div>
            } @else {
              <div>
                <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ i18n.t('invoices.customerPhone') }}</span>
                <p class="text-gray-400 mt-1.5">—</p>
              </div>
            }
          </div>
        </div>

        <!-- Line Items -->
        <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="px-5 py-3.5 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('invoices.itemCol') }}</th>
                <th class="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('invoices.qtyCol') }}</th>
                <th class="px-5 py-3.5 text-end text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('invoices.unitPrice') }}</th>
                <th class="px-5 py-3.5 text-end text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('invoices.subtotal') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (line of inv.items; track $index) {
                <tr class="hover:bg-gray-50/50">
                  <td class="px-5 py-3.5 font-medium text-gray-900">{{ line.itemTitleSnapshot || line.itemId }}</td>
                  <td class="px-5 py-3.5 text-center text-gray-600">{{ line.quantity }}</td>
                  <td class="px-5 py-3.5 text-end text-gray-600">{{ line.unitPrice | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</td>
                  <td class="px-5 py-3.5 text-end font-semibold text-gray-900">{{ line.lineTotal | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Totals Footer -->
          <div class="border-t border-gray-200 bg-gray-50/50 px-5 py-4">
            <div class="flex justify-end">
              <div class="w-72 space-y-2 text-sm">
                <div class="flex justify-between text-gray-500">
                  <span>{{ i18n.t('invoices.subtotal') }}</span>
                  <span class="text-gray-900 font-medium">{{ inv.subtotal | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</span>
                </div>
                @if (inv.discount) {
                  <div class="flex justify-between text-gray-500">
                    <span>{{ i18n.t('invoices.discount') }}</span>
                    <span class="text-red-500 font-medium">-{{ inv.discount | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</span>
                  </div>
                }
                @if (inv.vatAmount) {
                  <div class="flex justify-between text-gray-500">
                    <span>{{ i18n.t('invoices.tax') }}</span>
                    <span class="text-gray-900 font-medium">{{ inv.vatAmount | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</span>
                  </div>
                }
                <div class="flex justify-between font-bold text-lg border-t border-gray-200 pt-2.5">
                  <span class="text-gray-900">{{ i18n.t('invoices.total') }}</span>
                  <span class="text-gray-900">{{ inv.total | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        @if (inv.notes) {
          <div class="bg-white rounded-2xl border border-gray-200 p-5">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ i18n.t('invoices.notes') }}</span>
            <p class="mt-1.5 text-sm text-gray-700">{{ inv.notes }}</p>
          </div>
        }

        <!-- Refund Section -->
        @if (!inv.isRefund && authService.hasPermission('invoices.refund')) {
          <div class="bg-white rounded-2xl border border-red-200 p-6 space-y-4">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/></svg>
              <h2 class="font-semibold text-lg text-red-700">{{ i18n.t('invoices.issueRefund') }}</h2>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('invoices.refundReason') }}</label>
              <input [(ngModel)]="refundReason" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500/10" [placeholder]="i18n.t('invoices.refundReasonPlaceholder')" />
            </div>
            <button (click)="processRefund()" [disabled]="refunding()"
              class="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
              {{ refunding() ? i18n.t('common.saving') : i18n.t('invoices.processRefund') }}
            </button>
          </div>
        }

        <!-- Delete Section -->
        @if (authService.hasPermission('invoices.delete')) {
          <div class="bg-white rounded-2xl border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
                <span class="text-sm text-gray-600">{{ i18n.t('invoices.delete') }}</span>
              </div>
              <button (click)="deleteInvoice()" [disabled]="deleting()"
                class="bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 border border-gray-200 hover:border-red-200">
                {{ deleting() ? i18n.t('common.saving') : i18n.t('invoices.delete') }}
              </button>
            </div>
          </div>
        }
      } @else {
        <div class="text-center py-16">
          <svg class="w-10 h-10 text-gray-300 mx-auto animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          <p class="text-gray-400 mt-3">{{ i18n.t('invoices.loadingInvoice') }}</p>
        </div>
      }
    </div>
  `,
})
export class InvoiceDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly tenantService = inject(TenantService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  readonly authService = inject(AuthService);
  readonly settingsStore = inject(SettingsStore);
  readonly i18n = inject(I18nService);

  readonly invoice = signal<Invoice | null>(null);
  readonly refunding = signal(false);
  readonly deleting = signal(false);

  refundReason = '';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.api.get<Invoice>(`/Invoices/${params['id']}`).subscribe(d => {
          this.invoice.set(d);
        });
      }
    });
  }

  processRefund(): void {
    const inv = this.invoice();
    if (!inv) return;
    if (!confirm(`Refund invoice ${inv.invoiceNumber}?`)) return;

    this.refunding.set(true);
    // Refund all items in the invoice
    const refundItems = inv.items.map(item => ({ invoiceItemId: item.id, quantity: item.quantity }));
    this.api.post(`/Invoices/${inv.id}/refund`, {
      items: refundItems,
      notes: this.refundReason || `Full refund for ${inv.invoiceNumber}`,
    }).subscribe({
      next: () => {
        this.toastService.success(this.i18n.t('invoices.refundSuccess'));
        this.refunding.set(false);
        // Reload invoice
        this.api.get<Invoice>(`/Invoices/${inv.id}`).subscribe(d => this.invoice.set(d));
      },
      error: (err) => {
        this.toastService.error(err.message || this.i18n.t('invoices.refundFailed'));
        this.refunding.set(false);
      },
    });
  }

  deleteInvoice(): void {
    const inv = this.invoice();
    if (!inv) return;
    if (!confirm(this.i18n.t('invoices.deleteConfirm'))) return;

    this.deleting.set(true);
    this.api.delete(`/Invoices/${inv.id}`).subscribe({
      next: () => {
        this.toastService.success(this.i18n.t('invoices.deleteSuccess'));
        this.deleting.set(false);
        this.router.navigateByUrl(this.tenantService.adminUrl() + '/invoices');
      },
      error: (err) => {
        this.toastService.error(err.message || this.i18n.t('invoices.deleteFailed'));
        this.deleting.set(false);
      },
    });
  }
}
