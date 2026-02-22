import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { Invoice } from '../../../core/models/item.models';
import { PaginatedList } from '../../../core/models/api.models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-invoices-list',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe, DatePipe, PaginationComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Invoices</h1>
        <a routerLink="/admin/invoices/new" class="btn-primary">+ New Invoice</a>
      </div>

      <div class="flex flex-wrap gap-3 items-end">
        <div>
          <label class="block text-xs text-gray-500 mb-1">From</label>
          <input [(ngModel)]="dateFrom" type="date" class="input-field" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">To</label>
          <input [(ngModel)]="dateTo" type="date" class="input-field" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Status</label>
          <select [(ngModel)]="statusFilter" class="input-field">
            <option value="">All</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Refunded">Refunded</option>
            <option value="PartialRefund">Partial Refund</option>
          </select>
        </div>
        <button (click)="load()" class="btn-primary">Filter</button>
      </div>

      <!-- Summary -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="card p-4 text-center">
          <p class="text-sm text-gray-500">Total Invoices</p>
          <p class="text-xl font-bold">{{ paginated()?.totalCount || 0 }}</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-sm text-gray-500">Total Revenue</p>
          <p class="text-xl font-bold text-green-600">{{ totalRevenue() | currency }}</p>
        </div>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium">#</th>
              <th class="px-4 py-3 text-left font-medium">Date</th>
              <th class="px-4 py-3 text-left font-medium">Customer</th>
              <th class="px-4 py-3 text-right font-medium">Total</th>
              <th class="px-4 py-3 text-center font-medium">Status</th>
              <th class="px-4 py-3 text-center font-medium">Payment</th>
              <th class="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            @for (inv of invoices(); track inv.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-mono text-xs">{{ inv.invoiceNumber }}</td>
                <td class="px-4 py-3">{{ inv.createdAt | date:'mediumDate' }}</td>
                <td class="px-4 py-3">{{ inv.customerName || '—' }}</td>
                <td class="px-4 py-3 text-right font-medium">{{ inv.totalAmount | currency }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="text-xs px-2 py-1 rounded-full"
                    [class]="inv.status === 'Paid' ? 'bg-green-100 text-green-700' :
                             inv.status === 'Refunded' ? 'bg-red-100 text-red-700' :
                             'bg-yellow-100 text-yellow-700'">
                    {{ inv.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center text-xs text-gray-500">{{ inv.paymentMethod }}</td>
                <td class="px-4 py-3 text-right">
                  <a [routerLink]="['/admin/invoices', inv.id]" class="text-blue-600 hover:underline text-sm">View</a>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">No invoices found</td></tr>
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

  readonly invoices = signal<Invoice[]>([]);
  readonly paginated = signal<PaginatedList<Invoice> | null>(null);
  readonly totalRevenue = signal(0);

  dateFrom = '';
  dateTo = '';
  statusFilter = '';
  currentPage = 1;
  pageSize = 20;

  ngOnInit(): void { this.load(); }

  load(): void {
    const params: any = { pageNumber: this.currentPage, pageSize: this.pageSize };
    if (this.dateFrom) params.dateFrom = this.dateFrom;
    if (this.dateTo) params.dateTo = this.dateTo;
    if (this.statusFilter) params.status = this.statusFilter;

    this.api.get<PaginatedList<Invoice>>('/Invoices', params).subscribe(d => {
      if (d) {
        this.paginated.set(d);
        this.invoices.set(d.items);
        this.totalRevenue.set(d.items.reduce((sum, inv) => sum + inv.totalAmount, 0));
      }
    });
  }

  onPage(page: number): void {
    this.currentPage = page;
    this.load();
  }
}
