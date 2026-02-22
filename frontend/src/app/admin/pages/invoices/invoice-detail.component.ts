import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Invoice } from '../../../core/models/item.models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="max-w-3xl space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Invoice {{ invoice()?.invoiceNumber }}</h1>
        <a routerLink="/admin/invoices" class="btn-outline text-sm">← Back</a>
      </div>

      @if (invoice(); as inv) {
        <!-- Status & Date -->
        <div class="card p-6 flex flex-wrap gap-6 items-center">
          <div>
            <span class="text-xs text-gray-500">Status</span>
            <div class="mt-1">
              <span class="text-sm px-3 py-1 rounded-full font-medium"
                [class]="inv.status === 'Paid' ? 'bg-green-100 text-green-700' :
                         inv.status === 'Refunded' ? 'bg-red-100 text-red-700' :
                         'bg-yellow-100 text-yellow-700'">
                {{ inv.status }}
              </span>
            </div>
          </div>
          <div>
            <span class="text-xs text-gray-500">Date</span>
            <p class="font-medium">{{ inv.createdAt | date:'medium' }}</p>
          </div>
          <div>
            <span class="text-xs text-gray-500">Payment</span>
            <p class="font-medium">{{ inv.paymentMethod }}</p>
          </div>
          @if (inv.customerName) {
            <div>
              <span class="text-xs text-gray-500">Customer</span>
              <p class="font-medium">{{ inv.customerName }}</p>
            </div>
          }
          @if (inv.customerPhone) {
            <div>
              <span class="text-xs text-gray-500">Phone</span>
              <p class="font-medium">{{ inv.customerPhone }}</p>
            </div>
          }
        </div>

        <!-- Lines -->
        <div class="card overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium">Item</th>
                <th class="px-4 py-3 text-center font-medium">Qty</th>
                <th class="px-4 py-3 text-right font-medium">Unit Price</th>
                <th class="px-4 py-3 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              @for (line of inv.lines; track $index) {
                <tr>
                  <td class="px-4 py-3">{{ line.itemTitle || line.itemId }}</td>
                  <td class="px-4 py-3 text-center">{{ line.quantity }}</td>
                  <td class="px-4 py-3 text-right">{{ line.unitPrice | currency }}</td>
                  <td class="px-4 py-3 text-right font-medium">{{ line.quantity * line.unitPrice | currency }}</td>
                </tr>
              }
            </tbody>
            <tfoot class="bg-gray-50">
              <tr>
                <td colspan="3" class="px-4 py-2 text-right text-gray-500">Subtotal</td>
                <td class="px-4 py-2 text-right font-medium">{{ inv.subtotalAmount | currency }}</td>
              </tr>
              @if (inv.discountAmount) {
                <tr>
                  <td colspan="3" class="px-4 py-2 text-right text-gray-500">Discount</td>
                  <td class="px-4 py-2 text-right text-red-500">-{{ inv.discountAmount | currency }}</td>
                </tr>
              }
              @if (inv.taxAmount) {
                <tr>
                  <td colspan="3" class="px-4 py-2 text-right text-gray-500">Tax</td>
                  <td class="px-4 py-2 text-right">{{ inv.taxAmount | currency }}</td>
                </tr>
              }
              <tr class="font-bold text-base">
                <td colspan="3" class="px-4 py-3 text-right">Total</td>
                <td class="px-4 py-3 text-right">{{ inv.totalAmount | currency }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        @if (inv.notes) {
          <div class="card p-4">
            <span class="text-xs text-gray-500">Notes</span>
            <p class="mt-1 text-sm">{{ inv.notes }}</p>
          </div>
        }

        <!-- Refund -->
        @if (inv.status === 'Paid' && authService.hasPermission('invoices.refund')) {
          <div class="card p-6 space-y-4">
            <h2 class="font-semibold text-lg text-red-600">Issue Refund</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Refund Amount</label>
                <input [(ngModel)]="refundAmount" type="number" [max]="inv.totalAmount" min="0.01" class="input-field" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Reason</label>
                <input [(ngModel)]="refundReason" class="input-field" placeholder="Reason for refund" />
              </div>
            </div>
            <button (click)="processRefund()" class="btn-danger" [disabled]="refunding()">Process Refund</button>
          </div>
        }
      } @else {
        <div class="text-center py-12 text-gray-400">Loading...</div>
      }
    </div>
  `,
})
export class InvoiceDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toastService = inject(ToastService);
  readonly authService = inject(AuthService);

  readonly invoice = signal<Invoice | null>(null);
  readonly refunding = signal(false);

  refundAmount = 0;
  refundReason = '';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.api.get<Invoice>(`/Invoices/${params['id']}`).subscribe(d => {
          this.invoice.set(d);
          this.refundAmount = d?.totalAmount || 0;
        });
      }
    });
  }

  processRefund(): void {
    const inv = this.invoice();
    if (!inv) return;
    if (!this.refundAmount || this.refundAmount <= 0) {
      this.toastService.error('Enter a valid refund amount');
      return;
    }
    if (!confirm(`Refund ${this.refundAmount} for invoice ${inv.invoiceNumber}?`)) return;

    this.refunding.set(true);
    this.api.post(`/Invoices/${inv.id}/refund`, {
      amount: this.refundAmount,
      reason: this.refundReason,
    }).subscribe({
      next: () => {
        this.toastService.success('Refund processed');
        this.refunding.set(false);
        // Reload invoice
        this.api.get<Invoice>(`/Invoices/${inv.id}`).subscribe(d => this.invoice.set(d));
      },
      error: (err) => {
        this.toastService.error(err.message || 'Refund failed');
        this.refunding.set(false);
      },
    });
  }
}
