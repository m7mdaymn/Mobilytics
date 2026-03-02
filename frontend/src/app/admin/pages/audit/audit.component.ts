import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="space-y-6 page-enter">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ i18n.t('audit.title') }}</h1>
        <p class="text-sm text-gray-500 mt-0.5">{{ i18n.t('audit.subtitle') }}</p>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <div class="flex items-center gap-2 text-sm">
          <label class="text-gray-500 font-medium">{{ i18n.t('audit.filterBy') }}</label>
          <select (change)="onTypeFilter($event)" class="px-3 py-1.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/10">
            <option value="">{{ i18n.t('audit.allActions') }}</option>
            @for (t of actionTypes; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </div>
        <div class="flex-1"></div>
        <span class="text-xs text-gray-400 font-medium">{{ filteredLogs().length }} {{ i18n.t('audit.entries') }}</span>
      </div>

      <!-- Audit Log Timeline -->
      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="animate-pulse bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <div class="w-10 h-10 bg-gray-200 rounded-xl"></div>
              <div class="flex-1 space-y-2">
                <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                <div class="h-2.5 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          }
        </div>
      } @else if (!filteredLogs().length) {
        <div class="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <svg class="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"/></svg>
          <p class="text-gray-500 font-medium">{{ i18n.t('audit.noLogs') }}</p>
        </div>
      } @else {
        <div class="space-y-2">
          @for (log of filteredLogs(); track log.id; let idx = $index) {
            <div class="bg-white rounded-xl border border-gray-100 hover:border-gray-200 p-4 flex items-start gap-4 transition animate-fade-in-up" [style.animation-delay.ms]="idx * 30">
              <!-- Icon -->
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                [class]="getActionColor(log.action)">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  @switch (getActionIcon(log.action)) {
                    @case ('create') {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.5v15m7.5-7.5h-15"/>
                    }
                    @case ('update') {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                    }
                    @case ('delete') {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                    }
                    @case ('login') {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"/>
                    }
                    @default {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                    }
                  }
                </svg>
              </div>
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="text-sm font-semibold text-gray-900">{{ log.action }} — {{ log.entityName }}</p>
                    @if (log.entityId) {
                      <p class="text-xs text-gray-500 mt-0.5">ID: {{ log.entityId }}</p>
                    }
                  </div>
                  <span class="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">{{ log.createdAt | date:'short' }}</span>
                </div>
                <div class="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span class="px-2 py-0.5 bg-gray-100 rounded-md font-medium text-gray-600">{{ log.action }}</span>
                  <span class="px-2 py-0.5 bg-gray-50 rounded-md text-gray-500">{{ log.entityName }}</span>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Load More -->
        @if (hasMore()) {
          <div class="text-center pt-4">
            <button (click)="loadMore()" [disabled]="loading()" class="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">
              {{ i18n.t('audit.loadMore') }}
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class AuditComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly i18n = inject(I18nService);

  readonly logs = signal<any[]>([]);
  readonly filteredLogs = signal<any[]>([]);
  readonly loading = signal(true);
  readonly hasMore = signal(false);

  private page = 1;
  private readonly pageSize = 50;
  private typeFilter = '';

  readonly actionTypes = ['Created', 'Updated', 'Deleted', 'Login'];

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    this.api.get<any[]>('/Audit', { page: this.page, pageSize: this.pageSize } as any).subscribe({
      next: (data) => {
        const items = data || [];
        if (this.page === 1) {
          this.logs.set(items);
        } else {
          this.logs.set([...this.logs(), ...items]);
        }
        this.hasMore.set(items.length === this.pageSize);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadMore(): void {
    this.page++;
    this.loadLogs();
  }

  onTypeFilter(event: Event): void {
    this.typeFilter = (event.target as HTMLSelectElement).value;
    this.applyFilter();
  }

  applyFilter(): void {
    if (!this.typeFilter) {
      this.filteredLogs.set(this.logs());
    } else {
      this.filteredLogs.set(this.logs().filter(l => l.action?.toLowerCase().includes(this.typeFilter.toLowerCase())));
    }
  }

  getActionColor(action: string): string {
    if (action?.includes('Created')) return 'bg-green-50 text-green-600';
    if (action?.includes('Updated')) return 'bg-blue-50 text-blue-600';
    if (action?.includes('Deleted')) return 'bg-red-50 text-red-600';
    if (action?.includes('Login')) return 'bg-indigo-50 text-indigo-600';
    return 'bg-gray-100 text-gray-500';
  }

  getActionIcon(action: string): string {
    if (action?.includes('Created')) return 'create';
    if (action?.includes('Updated')) return 'update';
    if (action?.includes('Deleted')) return 'delete';
    if (action?.includes('Login')) return 'login';
    return 'default';
  }
}
