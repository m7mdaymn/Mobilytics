import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { SettingsStore } from '../../../core/stores/settings.store';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Item } from '../../../core/models/item.models';
import { PaginatedList } from '../../../core/models/api.models';

@Component({
  selector: 'app-items-list',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <h1 class="text-2xl font-bold">Items</h1>
        @if (authService.hasPermission('items.create')) {
          <a routerLink="/admin/items/new" class="btn-primary">+ New Item</a>
        }
      </div>

      <!-- Filters -->
      <div class="card p-4 flex flex-wrap items-center gap-3">
        <input [(ngModel)]="search" (keyup.enter)="loadItems()" placeholder="Search..." class="input-field max-w-xs" />
        <select [(ngModel)]="statusFilter" (change)="loadItems()" class="input-field w-auto">
          <option value="">All Status</option>
          <option value="Available">Available</option>
          <option value="Sold">Sold</option>
          <option value="Reserved">Reserved</option>
          <option value="Hidden">Hidden</option>
        </select>
        <button (click)="loadItems()" class="btn-primary text-sm">Search</button>
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
                <tr class="bg-gray-50 text-left">
                  <th class="px-4 py-3 font-semibold">Image</th>
                  <th class="px-4 py-3 font-semibold">Title</th>
                  <th class="px-4 py-3 font-semibold">Type</th>
                  <th class="px-4 py-3 font-semibold">Price</th>
                  <th class="px-4 py-3 font-semibold">Status</th>
                  <th class="px-4 py-3 font-semibold">Qty</th>
                  <th class="px-4 py-3 font-semibold">Created</th>
                  <th class="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[color:var(--color-border)]">
                @for (item of items(); track item.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3">
                      <div class="w-10 h-10 rounded bg-gray-100 overflow-hidden">
                        @if (item.mainImageUrl) {
                          <img [src]="item.mainImageUrl" [alt]="item.title" class="w-full h-full object-cover" />
                        }
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <div class="font-medium">{{ item.title }}</div>
                      @if (item.isFeatured) {
                        <span class="badge badge-info text-[10px]">Featured</span>
                      }
                    </td>
                    <td class="px-4 py-3 text-[color:var(--color-text-muted)]">{{ item.itemTypeName }}</td>
                    <td class="px-4 py-3 font-medium">
                      {{ item.price | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
                    </td>
                    <td class="px-4 py-3">
                      <select
                        [ngModel]="item.status"
                        (change)="onStatusChange(item, $event)"
                        class="text-xs rounded-full px-2 py-1 border"
                        [disabled]="!authService.hasPermission('items.edit')">
                        <option value="Available">Available</option>
                        <option value="Sold">Sold</option>
                        <option value="Reserved">Reserved</option>
                        <option value="Hidden">Hidden</option>
                      </select>
                    </td>
                    <td class="px-4 py-3">{{ item.quantity }}</td>
                    <td class="px-4 py-3 text-[color:var(--color-text-muted)]">{{ item.createdAt | date: 'shortDate' }}</td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        @if (authService.hasPermission('items.edit')) {
                          <a [routerLink]="['/admin/items', item.id, 'edit']"
                            class="text-[color:var(--color-primary)] hover:underline text-xs">Edit</a>
                        }
                        @if (authService.hasPermission('items.delete')) {
                          <button (click)="deleteItem(item)" class="text-[color:var(--color-danger)] hover:underline text-xs">Delete</button>
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
          <div class="text-center py-8 text-[color:var(--color-text-muted)]">No items found</div>
        }
      }
    </div>
  `,
})
export class ItemsListComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly settingsStore = inject(SettingsStore);
  readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly items = signal<Item[]>([]);
  readonly loading = signal(true);
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
      sortBy: 'createdAt',
      sortDescending: true,
    };
    this.api.get<PaginatedList<Item>>('/Items', params).subscribe({
      next: d => { this.items.set(d.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onStatusChange(item: Item, event: Event): void {
    const newStatus = (event.target as HTMLSelectElement).value;
    this.api.patch(`/Items/${item.id}/status`, { status: newStatus }).subscribe({
      next: () => this.toastService.success(`Status updated to ${newStatus}`),
      error: () => this.toastService.error('Failed to update status'),
    });
  }

  deleteItem(item: Item): void {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    this.api.delete(`/Items/${item.id}`).subscribe({
      next: () => {
        this.items.update(items => items.filter(i => i.id !== item.id));
        this.toastService.success('Item deleted');
      },
      error: () => this.toastService.error('Failed to delete item'),
    });
  }
}
