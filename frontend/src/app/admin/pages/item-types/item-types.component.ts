import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ItemType } from '../../../core/models/item.models';

@Component({
  selector: 'app-item-types',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Item Types</h1>
        <button (click)="openForm()" class="btn-primary">+ Add Type</button>
      </div>

      @if (showForm()) {
        <div class="card p-6 space-y-4">
          <h2 class="font-semibold">{{ editId() ? 'Edit' : 'New' }} Item Type</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Name <span class="text-red-500">*</span></label>
              <input [(ngModel)]="form.name" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Slug</label>
              <input [(ngModel)]="form.slug" class="input-field" />
            </div>
          </div>

          <!-- Type Flags -->
          <div class="space-y-2">
            <h3 class="text-sm font-semibold text-gray-700">Type Behavior</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label class="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                <input type="checkbox" [(ngModel)]="form.isDevice" class="w-4 h-4 rounded accent-gray-900" />
                <div>
                  <span class="text-sm font-medium">Is Device</span>
                  <p class="text-xs text-gray-500">Quantity always 1, enables device-specific fields</p>
                </div>
              </label>
              <label class="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                <input type="checkbox" [(ngModel)]="form.isStockItem" class="w-4 h-4 rounded accent-gray-900" />
                <div>
                  <span class="text-sm font-medium">Stock Item</span>
                  <p class="text-xs text-gray-500">Tracks quantity and low-stock alerts</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Supported Fields  -->
          <div class="space-y-2">
            <h3 class="text-sm font-semibold text-gray-700">Supported Fields</h3>
            <p class="text-xs text-gray-400">Select which fields appear on the item form for this type</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label class="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                <input type="checkbox" [(ngModel)]="form.supportsIMEI" class="w-4 h-4 rounded accent-gray-900" />
                <span class="text-sm">IMEI</span>
              </label>
              <label class="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                <input type="checkbox" [(ngModel)]="form.supportsSerial" class="w-4 h-4 rounded accent-gray-900" />
                <span class="text-sm">Serial Number</span>
              </label>
              <label class="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                <input type="checkbox" [(ngModel)]="form.supportsBatteryHealth" class="w-4 h-4 rounded accent-gray-900" />
                <span class="text-sm">Battery Health</span>
              </label>
              <label class="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                <input type="checkbox" [(ngModel)]="form.supportsWarranty" class="w-4 h-4 rounded accent-gray-900" />
                <span class="text-sm">Warranty</span>
              </label>
            </div>
          </div>

          <!-- Display Options -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="flex items-center gap-2">
              <input type="checkbox" [(ngModel)]="form.isVisibleInNav" class="w-4 h-4 rounded accent-gray-900" />
              <span class="text-sm">Show in storefront navigation</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="checkbox" [(ngModel)]="form.isActive" class="w-4 h-4 rounded accent-gray-900" />
              <span class="text-sm">Active</span>
            </label>
            <div>
              <label class="block text-sm font-medium mb-1">Display Order</label>
              <input [(ngModel)]="form.displayOrder" type="number" min="0" class="input-field w-32" />
            </div>
          </div>

          <div class="flex gap-2">
            <button (click)="saveType()" class="btn-primary" [disabled]="saving()">Save</button>
            <button (click)="showForm.set(false)" class="btn-outline">Cancel</button>
          </div>
        </div>
      }

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-start font-medium">Name</th>
              <th class="px-4 py-3 text-start font-medium">Slug</th>
              <th class="px-4 py-3 text-center font-medium">Device</th>
              <th class="px-4 py-3 text-center font-medium">Stock</th>
              <th class="px-4 py-3 text-center font-medium">Fields</th>
              <th class="px-4 py-3 text-center font-medium">Nav</th>
              <th class="px-4 py-3 text-center font-medium">Status</th>
              <th class="px-4 py-3 text-end font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            @for (type of types(); track type.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-medium">{{ type.name }}</td>
                <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ type.slug }}</td>
                <td class="px-4 py-3 text-center">{{ type.isDevice ? '✓' : '—' }}</td>
                <td class="px-4 py-3 text-center">{{ type.isStockItem ? '✓' : '—' }}</td>
                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center gap-1 flex-wrap">
                    @if (type.supportsIMEI) { <span class="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">IMEI</span> }
                    @if (type.supportsSerial) { <span class="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Serial</span> }
                    @if (type.supportsBatteryHealth) { <span class="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Battery</span> }
                    @if (type.supportsWarranty) { <span class="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Warranty</span> }
                    @if (!type.supportsIMEI && !type.supportsSerial && !type.supportsBatteryHealth && !type.supportsWarranty) { <span class="text-gray-400">—</span> }
                  </div>
                </td>
                <td class="px-4 py-3 text-center">{{ type.isVisibleInNav !== false ? '✓' : '—' }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="text-xs px-2 py-0.5 rounded-full" [class]="type.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                    {{ type.isActive !== false ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-end space-x-2">
                  <button (click)="editType(type)" class="text-blue-600 hover:underline">Edit</button>
                  <button (click)="deleteType(type)" class="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="px-4 py-8 text-center text-gray-400">No item types yet</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ItemTypesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);

  readonly types = signal<ItemType[]>([]);
  readonly showForm = signal(false);
  readonly editId = signal<string | null>(null);
  readonly saving = signal(false);

  form: any = { name: '', slug: '', isDevice: false, isStockItem: false, isVisibleInNav: true, supportsIMEI: false, supportsSerial: false, supportsBatteryHealth: false, supportsWarranty: false, isActive: true, displayOrder: 0 };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.get<ItemType[]>('/ItemTypes').subscribe(d => this.types.set(d || []));
  }

  openForm(): void {
    this.form = { name: '', slug: '', isDevice: false, isStockItem: false, isVisibleInNav: true, supportsIMEI: false, supportsSerial: false, supportsBatteryHealth: false, supportsWarranty: false, isActive: true, displayOrder: 0 };
    this.editId.set(null);
    this.showForm.set(true);
  }

  editType(t: ItemType): void {
    this.form = {
      name: t.name, slug: t.slug, isDevice: t.isDevice, isStockItem: t.isStockItem, isVisibleInNav: t.isVisibleInNav !== false,
      supportsIMEI: t.supportsIMEI ?? false, supportsSerial: t.supportsSerial ?? false,
      supportsBatteryHealth: t.supportsBatteryHealth ?? false, supportsWarranty: t.supportsWarranty ?? false,
      isActive: t.isActive !== false, displayOrder: (t as any).displayOrder ?? 0,
    };
    this.editId.set(t.id);
    this.showForm.set(true);
  }

  deleteType(t: ItemType): void {
    if (!confirm(`Delete "${t.name}"?`)) return;
    this.api.delete(`/ItemTypes/${t.id}`).subscribe({
      next: () => { this.toastService.success('Deleted'); this.load(); },
      error: () => this.toastService.error('Failed to delete'),
    });
  }

  saveType(): void {
    if (!this.form.name) { this.toastService.error('Name is required'); return; }
    this.saving.set(true);
    const req$ = this.editId()
      ? this.api.put(`/ItemTypes/${this.editId()}`, this.form)
      : this.api.post('/ItemTypes', this.form);
    req$.subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.toastService.success('Saved'); this.load(); },
      error: () => { this.saving.set(false); this.toastService.error('Failed to save'); },
    });
  }
}
