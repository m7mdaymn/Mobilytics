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
    <div class="max-w-3xl space-y-6 page-enter">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ i18n.t('invoices.invoiceHash') }} {{ invoice()?.invoiceNumber }}</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ i18n.t('invoices.detailSubtitle') }}</p>
        </div>
        <div class="flex items-center gap-2">
          @if (invoice()) {
            <button (click)="printReceipt()" class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              {{ i18n.t('invoices.print') || 'Print' }}
            </button>
            <button (click)="sendWhatsApp()" class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.555 4.122 1.523 5.855L.058 23.489a.5.5 0 00.613.613l5.634-1.465A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.99 0-3.877-.556-5.508-1.528l-.384-.228-3.344.87.87-3.344-.228-.384A9.935 9.935 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              WhatsApp
            </button>
          }
          <a [routerLink]="tenantService.adminUrl() + '/invoices'" class="text-sm text-gray-500 hover:text-gray-900 font-medium transition">{{ i18n.t('invoices.backToList') }}</a>
        </div>
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
            @if (inv.paymentMethod === 'Installment') {
              <div>
                <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Installment</span>
                <div class="mt-1.5 space-y-1.5">
                  <span class="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                    {{ inv.installmentProviderName || i18n.t('invoices.payment.installment') }}
                    @if (inv.installmentMonths) {
                      <span class="text-indigo-500">· {{ inv.installmentMonths }} {{ i18n.t('invoices.months') }}</span>
                    }
                  </span>
                </div>
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
                  <div class="flex justify-between items-center text-gray-500">
                    <span>{{ i18n.t('invoices.tax') }} <span class="text-xs" [class]="inv.includeTax ? 'text-green-600' : 'text-gray-400'">({{ inv.includeTax ? i18n.t('invoices.taxIncluded') : 'Not included' }})</span></span>
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

  printReceipt(): void {
    const inv = this.invoice();
    if (!inv) return;
    const storeName = this.settingsStore.storeName();
    const currency = this.settingsStore.currency();
    const logoUrl = this.settingsStore.settings()?.logoUrl || '';
    const phone = this.settingsStore.settings()?.phoneNumber || '';
    const address = this.settingsStore.settings()?.footerAddress || '';

    const lineRows = inv.items.map(line =>
      `<tr><td style="padding:4px 0;border-bottom:1px dashed #e5e7eb">${line.itemTitleSnapshot || line.itemId}</td><td style="text-align:center;padding:4px 0;border-bottom:1px dashed #e5e7eb">${line.quantity}</td><td style="text-align:right;padding:4px 0;border-bottom:1px dashed #e5e7eb">${line.unitPrice.toLocaleString()} ${currency}</td><td style="text-align:right;padding:4px 0;border-bottom:1px dashed #e5e7eb">${line.lineTotal.toLocaleString()} ${currency}</td></tr>`
    ).join('');

    const w = window.open('', '_blank', 'width=360,height=600');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt #${inv.invoiceNumber}</title><style>body{font-family:-apple-system,sans-serif;font-size:12px;margin:0;padding:16px;max-width:320px;margin:auto}table{width:100%;border-collapse:collapse}.header{text-align:center;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:12px}.logo{max-height:48px;margin-bottom:8px}.totals{margin-top:8px;border-top:2px solid #000;padding-top:8px}.total-row{display:flex;justify-content:space-between;padding:2px 0}.grand-total{font-weight:bold;font-size:14px;border-top:1px solid #000;padding-top:4px;margin-top:4px}.footer{text-align:center;margin-top:16px;font-size:10px;color:#666}@media print{body{margin:0;padding:8px}}</style></head><body>
      <div class="header">
        ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="${storeName}" />` : ''}
        <div style="font-size:16px;font-weight:bold">${storeName}</div>
        ${phone ? `<div>${phone}</div>` : ''}
        ${address ? `<div>${address}</div>` : ''}
      </div>
      <div style="margin-bottom:12px">
        <div><strong>Invoice #${inv.invoiceNumber}</strong></div>
        <div>${new Date(inv.createdAt).toLocaleString()}</div>
        ${inv.customerName ? `<div>Customer: ${inv.customerName}</div>` : ''}
        ${inv.customerPhone ? `<div>Phone: ${inv.customerPhone}</div>` : ''}
        <div>Payment: ${inv.paymentMethod}${inv.paymentMethod === 'Installment' ? ' (Installment Plan)' : ''}</div>
      </div>
      <table><thead><tr><th style="text-align:left;padding:4px 0;border-bottom:2px solid #000">Item</th><th style="text-align:center;padding:4px 0;border-bottom:2px solid #000">Qty</th><th style="text-align:right;padding:4px 0;border-bottom:2px solid #000">Price</th><th style="text-align:right;padding:4px 0;border-bottom:2px solid #000">Total</th></tr></thead><tbody>${lineRows}</tbody></table>
      <div class="totals">
        <div class="total-row"><span>Subtotal</span><span>${inv.subtotal.toLocaleString()} ${currency}</span></div>
        ${inv.discount ? `<div class="total-row"><span>Discount</span><span>-${inv.discount.toLocaleString()} ${currency}</span></div>` : ''}
        ${inv.vatAmount ? `<div class="total-row"><span>Tax</span><span>${inv.vatAmount.toLocaleString()} ${currency}</span></div>` : ''}
        <div class="total-row grand-total"><span>Total</span><span>${inv.total.toLocaleString()} ${currency}</span></div>
      </div>
      <div class="footer"><p>Thank you for your purchase!</p></div>
      <script>setTimeout(()=>window.print(),300)</script></body></html>`);
    w.document.close();
  }

  sendWhatsApp(): void {
    const inv = this.invoice();
    if (!inv) return;

    const phone = inv.customerPhone?.replace(/\D/g, '') || '';
    if (!phone) {
      this.toastService.error('No customer phone number');
      return;
    }
    const storeName = this.settingsStore.storeName();
    const currency = this.settingsStore.currency();
    const itemsList = inv.items.map(l => `• ${l.itemTitleSnapshot} x${l.quantity} = ${l.lineTotal.toLocaleString()} ${currency}`).join('\n');
    const msg = `*${storeName} - Invoice #${inv.invoiceNumber}*\n\n${itemsList}\n\n*Total: ${inv.total.toLocaleString()} ${currency}*\nPayment: ${inv.paymentMethod}\n\nThank you for your purchase! 🙏`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }
}
