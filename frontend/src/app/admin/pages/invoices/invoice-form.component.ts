import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { InvoiceCreateDto, Item } from '../../../core/models/item.models';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe],
  template: `
    <div class="max-w-4xl space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">New Invoice</h1>
        <a routerLink="/admin/invoices" class="btn-outline text-sm">← Back</a>
      </div>

      <!-- Customer -->
      <div class="card p-6 space-y-4">
        <h2 class="font-semibold text-lg">Customer Info</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Customer Name</label>
            <input [(ngModel)]="form.customerName" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Customer Phone</label>
            <input [(ngModel)]="form.customerPhone" class="input-field" />
          </div>
        </div>
      </div>

      <!-- Line Items -->
      <div class="card p-6 space-y-4">
        <h2 class="font-semibold text-lg">Items</h2>

        <!-- Search -->
        <div class="relative">
          <input [(ngModel)]="itemSearch" (input)="searchItems()" class="input-field" placeholder="Search items to add..." />
          @if (searchResults().length) {
            <div class="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              @for (item of searchResults(); track item.id) {
                <button (click)="addLineItem(item)"
                  class="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between items-center text-sm">
                  <span>{{ item.title }}</span>
                  <span class="text-gray-500">{{ item.price | currency }}</span>
                </button>
              }
            </div>
          }
        </div>

        <!-- Lines -->
        @if (lines.length) {
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-2 text-left font-medium">Item</th>
                <th class="px-3 py-2 text-center font-medium w-24">Qty</th>
                <th class="px-3 py-2 text-right font-medium w-28">Unit Price</th>
                <th class="px-3 py-2 text-right font-medium w-28">Subtotal</th>
                <th class="px-3 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody class="divide-y">
              @for (line of lines; track $index; let i = $index) {
                <tr>
                  <td class="px-3 py-2">{{ line.itemTitle }}</td>
                  <td class="px-3 py-2 text-center">
                    <input [(ngModel)]="line.quantity" type="number" min="1" (ngModelChange)="recalc()"
                      class="w-16 text-center input-field py-1" />
                  </td>
                  <td class="px-3 py-2 text-right">{{ line.unitPrice | currency }}</td>
                  <td class="px-3 py-2 text-right font-medium">{{ line.quantity * line.unitPrice | currency }}</td>
                  <td class="px-3 py-2 text-center">
                    <button (click)="removeLine(i)" class="text-red-500 hover:text-red-700">✕</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Totals -->
      <div class="card p-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Discount</label>
            <input [(ngModel)]="form.discountAmount" type="number" min="0" (ngModelChange)="recalc()" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Payment Method</label>
            <select [(ngModel)]="form.paymentMethod" class="input-field">
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="BankTransfer">Bank Transfer</option>
              <option value="MobileMoney">Mobile Money</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Notes</label>
            <input [(ngModel)]="form.notes" class="input-field" />
          </div>
        </div>

        <div class="flex justify-end">
          <div class="w-64 space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">Subtotal</span><span>{{ subtotal() | currency }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Discount</span><span class="text-red-500">-{{ form.discountAmount | currency }}</span></div>
            <div class="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span><span>{{ total() | currency }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <button (click)="submit()" class="btn-primary" [disabled]="saving() || !lines.length">Create Invoice</button>
        <a routerLink="/admin/invoices" class="btn-outline">Cancel</a>
      </div>
    </div>
  `,
})
export class InvoiceFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly searchResults = signal<Item[]>([]);
  readonly saving = signal(false);
  readonly subtotal = signal(0);
  readonly total = signal(0);

  itemSearch = '';
  lines: { itemId: string; itemTitle: string; quantity: number; unitPrice: number }[] = [];
  private searchTimeout: any;

  form: InvoiceCreateDto = {
    customerName: '', customerPhone: '',
    discountAmount: 0, paymentMethod: 'Cash', notes: '',
    lines: [],
  };

  ngOnInit(): void {}

  searchItems(): void {
    clearTimeout(this.searchTimeout);
    if (this.itemSearch.length < 2) { this.searchResults.set([]); return; }
    this.searchTimeout = setTimeout(() => {
      this.api.get<any>('/Items', { search: this.itemSearch, pageSize: 10, status: 'Available' })
        .subscribe(d => this.searchResults.set(d?.items || d || []));
    }, 300);
  }

  addLineItem(item: Item): void {
    const existing = this.lines.find(l => l.itemId === item.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.lines.push({ itemId: item.id, itemTitle: item.title, quantity: 1, unitPrice: item.price });
    }
    this.itemSearch = '';
    this.searchResults.set([]);
    this.recalc();
  }

  removeLine(index: number): void {
    this.lines.splice(index, 1);
    this.recalc();
  }

  recalc(): void {
    const sub = this.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    this.subtotal.set(sub);
    this.total.set(Math.max(0, sub - (this.form.discountAmount || 0)));
  }

  submit(): void {
    if (!this.lines.length) { this.toastService.error('Add at least one item'); return; }
    this.saving.set(true);
    const body: InvoiceCreateDto = {
      ...this.form,
      lines: this.lines.map(l => ({ itemId: l.itemId, quantity: l.quantity, unitPrice: l.unitPrice })),
    };
    this.api.post<any>('/Invoices', body).subscribe({
      next: (result) => {
        this.toastService.success('Invoice created');
        this.saving.set(false);
        this.router.navigate(['/admin/invoices', result?.id || '']);
      },
      error: (err) => {
        this.toastService.error(err.message || 'Failed to create invoice');
        this.saving.set(false);
      },
    });
  }
}
