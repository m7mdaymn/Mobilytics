import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { SettingsStore } from '../../../core/stores/settings.store';
import { TenantService } from '../../../core/services/tenant.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { I18nService } from '../../../core/services/i18n.service';
import { Item } from '../../../core/models/item.models';
import { PaginatedList } from '../../../core/models/api.models';
import { resolveImageUrl } from '../../../core/utils/image.utils';

@Component({
  selector: 'app-items-list',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <h1 class="text-2xl font-bold">{{ i18n.t('items.title') }}</h1>
        @if (authService.hasPermission('items.create')) {
          <a [routerLink]="tenantService.adminUrl() + '/items/new'" class="btn-primary">+ {{ i18n.t('items.addNew') }}</a>
        }
      </div>

      <!-- Filters -->
      <div class="card p-4 flex flex-wrap items-center gap-3">
        <input [(ngModel)]="search" (keyup.enter)="loadItems()" [placeholder]="i18n.t('common.search') + '...'" class="input-field max-w-xs" />
        <select [(ngModel)]="statusFilter" (change)="loadItems()" class="input-field w-auto">
          <option value="">{{ i18n.t('items.allStatus') }}</option>
          <option value="Available">{{ i18n.t('items.status.available') }}</option>
          <option value="Sold">{{ i18n.t('items.status.sold') }}</option>
          <option value="Reserved">{{ i18n.t('items.status.reserved') }}</option>
          <option value="Hidden">{{ i18n.t('items.status.hidden') }}</option>
        </select>
        <button (click)="loadItems()" class="btn-primary text-sm">{{ i18n.t('common.search') }}</button>
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="space-y-2">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton h-16 rounded-lg"></div>
          }
        </div>
      } @else {
        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 text-start">
                  <th class="px-4 py-3 font-semibold">{{ i18n.t('items.image') }}</th>
                  <th class="px-4 py-3 font-semibold">{{ i18n.t('items.titleCol') }}</th>
                  <th class="px-4 py-3 font-semibold">{{ i18n.t('items.type') }}</th>
                  <th class="px-4 py-3 font-semibold">{{ i18n.t('items.price') }}</th>
                  <th class="px-4 py-3 font-semibold">{{ i18n.t('items.status') }}</th>
                  <th class="px-4 py-3 font-semibold">{{ i18n.t('items.qty') }}</th>
                  <th class="px-4 py-3 font-semibold">{{ i18n.t('items.created') }}</th>
                  <th class="px-4 py-3 font-semibold">{{ i18n.t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[color:var(--color-border)]">
                @for (item of items(); track item.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3">
                      <div class="w-10 h-10 rounded bg-gray-100 overflow-hidden">
                        @if (item.mainImageUrl) {
                          <img [src]="resolveImg(item.mainImageUrl)" [alt]="item.title" class="w-full h-full object-cover" />
                        }
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <div class="font-medium">{{ item.title }}</div>
                      @if (item.isFeatured) {
                        <span class="badge badge-info text-[10px]">Featured</span>
                      }
                    </td>
                    <td class="px-4 py-3 text-[color:var(--color-text-muted)]">{{ item.categoryName }}</td>
                    <td class="px-4 py-3 font-medium">
                      {{ item.price | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
                    </td>
                    <td class="px-4 py-3">
                      <select
                        [ngModel]="item.status"
                        (change)="onStatusChange(item, $event)"
                        class="text-xs rounded-full px-2 py-1 border"
                        [disabled]="!authService.hasPermission('items.edit')">
                        <option value="Available">{{ i18n.t('items.status.available') }}</option>
                        <option value="Sold">{{ i18n.t('items.status.sold') }}</option>
                        <option value="Reserved">{{ i18n.t('items.status.reserved') }}</option>
                        <option value="Hidden">{{ i18n.t('items.status.hidden') }}</option>
                      </select>
                    </td>
                    <td class="px-4 py-3">{{ item.quantity }}</td>
                    <td class="px-4 py-3 text-[color:var(--color-text-muted)]">{{ item.createdAt | date: 'shortDate' }}</td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        @if (authService.hasPermission('items.edit')) {
                          <a [routerLink]="tenantService.adminUrl() + '/items/' + item.id + '/edit'"
                            class="text-[color:var(--color-primary)] hover:underline text-xs">{{ i18n.t('common.edit') }}</a>
                        }
                        @if (authService.hasPermission('items.delete')) {
                          <button (click)="deleteItem(item)" class="text-[color:var(--color-danger)] hover:underline text-xs">{{ i18n.t('common.delete') }}</button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        @if (items().length === 0) {
          <div class="text-center py-8 text-[color:var(--color-text-muted)]">{{ i18n.t('common.noResults') }}</div>
        }
      }
    </div>
  `,
})
export class ItemsListComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly settingsStore = inject(SettingsStore);
  readonly tenantService = inject(TenantService);
  readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  readonly i18n = inject(I18nService);

  readonly items = signal<Item[]>([]);
  readonly loading = signal(true);
  readonly resolveImg = resolveImageUrl;
  search = '';
  statusFilter = '';

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean | undefined> = {
      pageSize: 50,
      search: this.search || undefined,
      status: this.statusFilter || undefined,
      sort: 'newest',
    };
    this.api.get<PaginatedList<Item>>('/Items', params).subscribe({
      next: d => { this.items.set(d.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onStatusChange(item: Item, event: Event): void {
    const newStatus = (event.target as HTMLSelectElement).value;
    this.api.patch(`/Items/${item.id}/status`, { status: newStatus }).subscribe({
      next: () => this.toastService.success(this.i18n.t('items.statusUpdated')),
      error: () => this.toastService.error(this.i18n.t('items.statusFailed')),
    });
  }

  deleteItem(item: Item): void {
    if (!confirm(this.i18n.t('common.confirmDelete'))) return;
    this.api.delete(`/Items/${item.id}`).subscribe({
      next: () => {
        this.items.update(items => items.filter(i => i.id !== item.id));
        this.toastService.success(this.i18n.t('items.deleted'));
      },
      error: () => this.toastService.error(this.i18n.t('items.deleteFailed')),
    });
  }
}
