import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { WhatsAppService } from '../../../core/services/whatsapp.service';
import { Lead } from '../../../core/models/item.models';
import { PaginatedList } from '../../../core/models/api.models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [FormsModule, DatePipe, PaginationComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Leads</h1>
        <span class="text-sm text-gray-500">{{ paginated()?.totalCount || 0 }} total</span>
      </div>

      <div class="flex flex-wrap gap-3 items-end">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Search</label>
          <input [(ngModel)]="search" class="input-field" placeholder="Name or phone..." />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Status</label>
          <select [(ngModel)]="statusFilter" class="input-field">
            <option value="">All</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Source</label>
          <select [(ngModel)]="sourceFilter" class="input-field">
            <option value="">All</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="FollowUp">Follow Up</option>
            <option value="WalkIn">Walk-in</option>
            <option value="Referral">Referral</option>
          </select>
        </div>
        <button (click)="load()" class="btn-primary">Filter</button>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium">Name</th>
              <th class="px-4 py-3 text-left font-medium">Phone</th>
              <th class="px-4 py-3 text-left font-medium">Item</th>
              <th class="px-4 py-3 text-left font-medium">Message</th>
              <th class="px-4 py-3 text-center font-medium">Source</th>
              <th class="px-4 py-3 text-center font-medium">Status</th>
              <th class="px-4 py-3 text-left font-medium">Date</th>
              <th class="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            @for (lead of leads(); track lead.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-medium">{{ lead.name || '—' }}</td>
                <td class="px-4 py-3">{{ lead.phone }}</td>
                <td class="px-4 py-3 text-gray-500 text-xs max-w-[120px] truncate">{{ lead.itemTitle || '—' }}</td>
                <td class="px-4 py-3 text-gray-500 text-xs max-w-[150px] truncate">{{ lead.message || '—' }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="text-xs px-2 py-1 rounded-full"
                    [class]="lead.source === 'WhatsApp' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'">
                    {{ lead.source }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <select [(ngModel)]="lead.status" (change)="updateStatus(lead)"
                    class="text-xs border rounded px-2 py-1"
                    [class]="lead.status === 'Converted' ? 'bg-green-50 text-green-700' :
                             lead.status === 'Lost' ? 'bg-red-50 text-red-700' :
                             lead.status === 'New' ? 'bg-blue-50 text-blue-700' :
                             'bg-gray-50'">
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Converted">Converted</option>
                    <option value="Lost">Lost</option>
                  </select>
                </td>
                <td class="px-4 py-3 text-xs text-gray-500">{{ lead.createdAt | date:'short' }}</td>
                <td class="px-4 py-3 text-right">
                  @if (lead.phone) {
                    <button (click)="followUp(lead)" class="btn-whatsapp text-xs !py-1 !px-2">WhatsApp</button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="px-4 py-8 text-center text-gray-400">No leads found</td></tr>
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
export class LeadsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);
  private readonly whatsappService = inject(WhatsAppService);

  readonly leads = signal<Lead[]>([]);
  readonly paginated = signal<PaginatedList<Lead> | null>(null);

  search = '';
  statusFilter = '';
  sourceFilter = '';
  currentPage = 1;
  pageSize = 25;

  ngOnInit(): void { this.load(); }

  load(): void {
    const params: any = { pageNumber: this.currentPage, pageSize: this.pageSize };
    if (this.search) params.search = this.search;
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.sourceFilter) params.source = this.sourceFilter;

    this.api.get<PaginatedList<Lead>>('/Leads', params).subscribe(d => {
      if (d) {
        this.paginated.set(d);
        this.leads.set(d.items);
      }
    });
  }

  updateStatus(lead: Lead): void {
    this.api.patch(`/Leads/${lead.id}/status`, { status: lead.status }).subscribe({
      next: () => this.toastService.success('Status updated'),
      error: () => this.toastService.error('Failed to update'),
    });
  }

  followUp(lead: Lead): void {
    // Use backend endpoint to get the WhatsApp follow-up link
    this.api.get<{ url: string }>(`/Leads/${lead.id}/follow-up-link`).subscribe({
      next: (result) => {
        if (result?.url) {
          window.open(result.url, '_blank');
        } else {
          // Fallback to local construction
          this.whatsappService.openFollowUpWhatsApp(lead.phone, lead.name || '');
        }
      },
      error: () => {
        // Fallback to local construction
        this.whatsappService.openFollowUpWhatsApp(lead.phone, lead.name || '');
      },
    });
  }

  onPage(page: number): void {
    this.currentPage = page;
    this.load();
  }
}
