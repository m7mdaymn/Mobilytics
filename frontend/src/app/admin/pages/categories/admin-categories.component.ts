import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { I18nService } from '../../../core/services/i18n.service';
import { Category } from '../../../core/models/item.models';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">{{ i18n.t('categories.title') }}</h1>
        <button (click)="openForm()" class="btn-primary">+ {{ i18n.t('categories.addNew') }}</button>
      </div>

      @if (showForm()) {
        <div class="card p-6 space-y-4">
          <h2 class="font-semibold">{{ editId() ? i18n.t('categories.editCategory') : i18n.t('categories.addNew') }}</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">{{ i18n.t('common.name') }} <span class="text-red-500">*</span></label>
              <input [(ngModel)]="form.name" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">{{ i18n.t('common.slug') }}</label>
              <input [(ngModel)]="form.slug" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">{{ i18n.t('categories.parent') }}</label>
              <select [(ngModel)]="form.parentId" class="input-field">
                <option value="">{{ i18n.t('common.none') }}</option>
                @for (cat of categories(); track cat.id) {
                  @if (cat.id !== editId()) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Sort Order</label>
              <input [(ngModel)]="form.sortOrder" type="number" min="0" class="input-field" />
            </div>
            <label class="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" [(ngModel)]="form.isVisibleInNav" class="w-4 h-4 rounded" />
              <span class="text-sm">{{ i18n.t('common.showInNav') }}</span>
            </label>
          </div>

          <!-- Capability Flags -->
          <div class="border-t pt-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Product Type Capabilities</h3>
            <p class="text-xs text-gray-500 mb-3">Configure which features are available for products in this category</p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label class="flex items-center gap-2 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" [(ngModel)]="form.isDevice" class="w-4 h-4 rounded accent-blue-600" />
                <div>
                  <span class="text-sm font-medium">📱 Device</span>
                  <p class="text-xs text-gray-400">Unique item (qty=1 on sold)</p>
                </div>
              </label>
              <label class="flex items-center gap-2 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" [(ngModel)]="form.isStockItem" class="w-4 h-4 rounded accent-blue-600" />
                <div>
                  <span class="text-sm font-medium">📦 Stock Item</span>
                  <p class="text-xs text-gray-400">Bulk inventory (qty decreases)</p>
                </div>
              </label>
              <label class="flex items-center gap-2 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" [(ngModel)]="form.supportsIMEI" class="w-4 h-4 rounded accent-blue-600" />
                <div>
                  <span class="text-sm font-medium">🔢 IMEI</span>
                  <p class="text-xs text-gray-400">Has IMEI number field</p>
                </div>
              </label>
              <label class="flex items-center gap-2 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" [(ngModel)]="form.supportsSerial" class="w-4 h-4 rounded accent-blue-600" />
                <div>
                  <span class="text-sm font-medium">#️⃣ Serial</span>
                  <p class="text-xs text-gray-400">Has serial number field</p>
                </div>
              </label>
              <label class="flex items-center gap-2 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" [(ngModel)]="form.supportsBatteryHealth" class="w-4 h-4 rounded accent-blue-600" />
                <div>
                  <span class="text-sm font-medium">🔋 Battery</span>
                  <p class="text-xs text-gray-400">Battery health tracking</p>
                </div>
              </label>
              <label class="flex items-center gap-2 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" [(ngModel)]="form.supportsWarranty" class="w-4 h-4 rounded accent-blue-600" />
                <div>
                  <span class="text-sm font-medium">🛡️ Warranty</span>
                  <p class="text-xs text-gray-400">Warranty type & duration</p>
                </div>
              </label>
            </div>
          </div>
          <div class="flex gap-2">
            <button (click)="saveCategory()" class="btn-primary" [disabled]="saving()">{{ saving() ? i18n.t('common.saving') : i18n.t('common.save') }}</button>
            <button (click)="showForm.set(false)" class="btn-outline">{{ i18n.t('common.cancel') }}</button>
          </div>
        </div>
      }

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-start font-medium">{{ i18n.t('common.name') }}</th>
              <th class="px-4 py-3 text-start font-medium">{{ i18n.t('common.slug') }}</th>
              <th class="px-4 py-3 text-start font-medium">{{ i18n.t('categories.parent') }}</th>
              <th class="px-4 py-3 text-center font-medium">Order</th>
              <th class="px-4 py-3 text-center font-medium">Nav</th>
              <th class="px-4 py-3 text-center font-medium">Flags</th>
              <th class="px-4 py-3 text-end font-medium">{{ i18n.t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            @for (cat of sortedCategories(); track cat.id) {
              <tr class="hover:bg-gray-50" [class.pl-8]="cat.parentId">
                <td class="px-4 py-3 font-medium">
                  @if (cat.parentId) { <span class="text-gray-300 me-2">└</span> }
                  {{ cat.name }}
                </td>
                <td class="px-4 py-3 text-gray-500">{{ cat.slug }}</td>
                <td class="px-4 py-3 text-gray-500">{{ getParentName(cat.parentId) }}</td>
                <td class="px-4 py-3 text-center">{{ cat.sortOrder }}</td>
                <td class="px-4 py-3 text-center">{{ cat.isVisibleInNav !== false ? '✓' : '—' }}</td>
                <td class="px-4 py-3 text-center text-xs space-x-1">
                  @if (cat.isDevice) { <span title="Device">📱</span> }
                  @if (cat.isStockItem) { <span title="Stock">📦</span> }
                  @if (cat.supportsIMEI) { <span title="IMEI">🔢</span> }
                  @if (cat.supportsSerial) { <span title="Serial">#️⃣</span> }
                  @if (cat.supportsBatteryHealth) { <span title="Battery">🔋</span> }
                  @if (cat.supportsWarranty) { <span title="Warranty">🛡️</span> }
                </td>
                <td class="px-4 py-3 text-end space-x-2">
                  <button (click)="editCategory(cat)" class="text-blue-600 hover:underline">{{ i18n.t('common.edit') }}</button>
                  <button (click)="deleteCategory(cat)" class="text-red-600 hover:underline">{{ i18n.t('common.delete') }}</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">No categories yet</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminCategoriesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);
  readonly i18n = inject(I18nService);

  readonly categories = signal<Category[]>([]);
  readonly showForm = signal(false);
  readonly editId = signal<string | null>(null);
  readonly saving = signal(false);

  form: {
    name: string; slug: string; parentId: string; sortOrder: number; isVisibleInNav: boolean;
    isDevice: boolean; isStockItem: boolean; supportsIMEI: boolean; supportsSerial: boolean;
    supportsBatteryHealth: boolean; supportsWarranty: boolean;
  } = {
    name: '', slug: '', parentId: '', sortOrder: 0, isVisibleInNav: true,
    isDevice: false, isStockItem: false, supportsIMEI: false, supportsSerial: false,
    supportsBatteryHealth: false, supportsWarranty: false,
  };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.get<Category[]>('/Categories').subscribe(d => this.categories.set(d || []));
  }

  sortedCategories(): Category[] {
    const cats = this.categories();
    const topLevel = cats.filter(c => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
    const result: Category[] = [];
    for (const parent of topLevel) {
      result.push(parent);
      const children = cats
        .filter(c => c.parentId === parent.id)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      result.push(...children);
    }
    return result;
  }

  getParentName(parentId?: string | null): string {
    if (!parentId) return '—';
    return this.categories().find(c => c.id === parentId)?.name || '—';
  }

  openForm(): void {
    this.form = {
      name: '', slug: '', parentId: '', sortOrder: 0, isVisibleInNav: true,
      isDevice: false, isStockItem: false, supportsIMEI: false, supportsSerial: false,
      supportsBatteryHealth: false, supportsWarranty: false,
    };
    this.editId.set(null);
    this.showForm.set(true);
  }

  editCategory(cat: Category): void {
    this.form = {
      name: cat.name, slug: cat.slug, parentId: cat.parentId || '', sortOrder: cat.sortOrder,
      isVisibleInNav: cat.isVisibleInNav !== false,
      isDevice: cat.isDevice || false, isStockItem: cat.isStockItem || false,
      supportsIMEI: cat.supportsIMEI || false, supportsSerial: cat.supportsSerial || false,
      supportsBatteryHealth: cat.supportsBatteryHealth || false, supportsWarranty: cat.supportsWarranty || false,
    };
    this.editId.set(cat.id);
    this.showForm.set(true);
  }

  deleteCategory(cat: Category): void {
    if (!confirm(`Delete "${cat.name}"?`)) return;
    this.api.delete(`/Categories/${cat.id}`).subscribe({
      next: () => { this.toastService.success(this.i18n.t('common.deleted')); this.load(); },
      error: () => this.toastService.error(this.i18n.t('common.failedToDelete')),
    });
  }

  saveCategory(): void {
    if (!this.form.name) { this.toastService.error(this.i18n.t('common.nameRequired')); return; }
    this.saving.set(true);
    const body = { ...this.form, parentId: this.form.parentId || null };
    const req$ = this.editId()
      ? this.api.put(`/Categories/${this.editId()}`, body)
      : this.api.post('/Categories', body);
    req$.subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.toastService.success(this.i18n.t('common.saved')); this.load(); },
      error: () => { this.saving.set(false); this.toastService.error(this.i18n.t('common.failedToSave')); },
    });
  }
}
