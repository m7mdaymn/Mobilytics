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
            <label class="flex items-center gap-2">
              <input type="checkbox" [(ngModel)]="form.isDevice" class="w-4 h-4 rounded" />
              <span class="text-sm">Is Device (qty always 1, IMEI tracked)</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="checkbox" [(ngModel)]="form.isStockItem" class="w-4 h-4 rounded" />
              <span class="text-sm">Is Stock Item (tracks quantity)</span>
            </label>
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
              <th class="px-4 py-3 text-left font-medium">Name</th>
              <th class="px-4 py-3 text-left font-medium">Slug</th>
              <th class="px-4 py-3 text-center font-medium">Device</th>
              <th class="px-4 py-3 text-center font-medium">Stock</th>
              <th class="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            @for (type of types(); track type.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-medium">{{ type.name }}</td>
                <td class="px-4 py-3 text-gray-500">{{ type.slug }}</td>
                <td class="px-4 py-3 text-center">{{ type.isDevice ? '✓' : '—' }}</td>
                <td class="px-4 py-3 text-center">{{ type.isStockItem ? '✓' : '—' }}</td>
                <td class="px-4 py-3 text-right space-x-2">
                  <button (click)="editType(type)" class="text-blue-600 hover:underline">Edit</button>
                  <button (click)="deleteType(type)" class="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="px-4 py-8 text-center text-gray-400">No item types yet</td></tr>
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

  form = { name: '', slug: '', isDevice: false, isStockItem: false };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.get<ItemType[]>('/ItemTypes').subscribe(d => this.types.set(d || []));
  }

  openForm(): void {
    this.form = { name: '', slug: '', isDevice: false, isStockItem: false };
    this.editId.set(null);
    this.showForm.set(true);
  }

  editType(t: ItemType): void {
    this.form = { name: t.name, slug: t.slug, isDevice: t.isDevice, isStockItem: t.isStockItem };
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
