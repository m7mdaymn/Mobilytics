import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { WhatsAppService } from '../../../core/services/whatsapp.service';
import { I18nService } from '../../../core/services/i18n.service';
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
        <h1 class="text-2xl font-bold">{{ i18n.t('leads.title') }}</h1>
        <span class="text-sm text-gray-500">{{ paginated()?.totalCount || 0 }} {{ i18n.t('leads.total') }}</span>
      </div>

      <div class="flex flex-wrap gap-3 items-end">
        <div>
          <label class="block text-xs text-gray-500 mb-1">{{ i18n.t('common.search') }}</label>
          <input [(ngModel)]="search" class="input-field" [placeholder]="i18n.t('leads.searchPlaceholder')" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">{{ i18n.t('common.status') }}</label>
          <select [(ngModel)]="statusFilter" class="input-field">
            <option value="">{{ i18n.t('common.all') }}</option>
            <option value="New">{{ i18n.t('leads.status.new') }}</option>
            <option value="Interested">{{ i18n.t('leads.status.interested') }}</option>
            <option value="NoResponse">{{ i18n.t('leads.status.noResponse') }}</option>
            <option value="Sold">{{ i18n.t('leads.status.sold') }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">{{ i18n.t('leads.source') }}</label>
          <select [(ngModel)]="sourceFilter" class="input-field">
            <option value="">{{ i18n.t('common.all') }}</option>
            <option value="WhatsAppClick">{{ i18n.t('leads.source.whatsapp') }}</option>
            <option value="FollowUpRequest">{{ i18n.t('leads.source.followUp') }}</option>
            <option value="Inquiry">{{ i18n.t('leads.source.inquiry') }}</option>
          </select>
        </div>
        <button (click)="load()" class="btn-primary">{{ i18n.t('common.filter') }}</button>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-start font-medium">{{ i18n.t('leads.nameCol') }}</th>
              <th class="px-4 py-3 text-start font-medium">{{ i18n.t('leads.phoneCol') }}</th>
              <th class="px-4 py-3 text-start font-medium">{{ i18n.t('leads.itemCol') }}</th>
              <th class="px-4 py-3 text-center font-medium">{{ i18n.t('leads.source') }}</th>
              <th class="px-4 py-3 text-center font-medium">{{ i18n.t('common.status') }}</th>
              <th class="px-4 py-3 text-start font-medium">{{ i18n.t('leads.dateCol') }}</th>
              <th class="px-4 py-3 text-end font-medium">{{ i18n.t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            @for (lead of leads(); track lead.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-medium">{{ lead.customerName || '—' }}</td>
                <td class="px-4 py-3">{{ lead.customerPhone }}</td>
                <td class="px-4 py-3 text-gray-500 text-xs max-w-[120px] truncate">{{ lead.targetTitleSnapshot || '—' }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="text-xs px-2 py-1 rounded-full"
                    [class]="lead.source === 'WhatsAppClick' ? 'bg-green-100 text-green-700' :
                             lead.source === 'FollowUpRequest' ? 'bg-yellow-100 text-yellow-700' :
                             'bg-blue-100 text-blue-700'">
                    {{ lead.source }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <select [(ngModel)]="lead.status" (change)="updateStatus(lead)"
                    class="text-xs border rounded px-2 py-1"
                    [class]="lead.status === 'Sold' ? 'bg-green-50 text-green-700' :
                             lead.status === 'NoResponse' ? 'bg-red-50 text-red-700' :
                             lead.status === 'New' ? 'bg-blue-50 text-blue-700' :
                             'bg-yellow-50 text-yellow-700'">
                    <option value="New">{{ i18n.t('leads.status.new') }}</option>
                    <option value="Interested">{{ i18n.t('leads.status.interested') }}</option>
                    <option value="NoResponse">{{ i18n.t('leads.status.noResponse') }}</option>
                    <option value="Sold">{{ i18n.t('leads.status.sold') }}</option>
                  </select>
                </td>
                <td class="px-4 py-3 text-xs text-gray-500">{{ lead.createdAt | date:'short' }}</td>
                <td class="px-4 py-3 text-end">
                  @if (lead.customerPhone) {
                    <button (click)="followUp(lead)" class="btn-whatsapp text-xs !py-1 !px-2">WhatsApp</button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">{{ i18n.t('leads.noData') }}</td></tr>
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
  readonly i18n = inject(I18nService);

  readonly leads = signal<Lead[]>([]);
  readonly paginated = signal<PaginatedList<Lead> | null>(null);

  search = '';
  statusFilter = '';
  sourceFilter = '';
  currentPage = 1;
  pageSize = 25;

  ngOnInit(): void { this.load(); }

  load(): void {
    const params: any = { page: this.currentPage, pageSize: this.pageSize };
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
      next: () => this.toastService.success(this.i18n.t('leads.statusUpdated')),
      error: () => this.toastService.error(this.i18n.t('leads.updateFailed')),
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
          this.whatsappService.openFollowUpWhatsApp(lead.customerPhone, lead.customerName || '');
        }
      },
      error: () => {
        // Fallback to local construction
        this.whatsappService.openFollowUpWhatsApp(lead.customerPhone, lead.customerName || '');
      },
    });
  }

  onPage(page: number): void {
    this.currentPage = page;
    this.load();
  }
}
