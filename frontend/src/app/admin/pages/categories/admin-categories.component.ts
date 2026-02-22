import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category } from '../../../core/models/item.models';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Categories</h1>
        <button (click)="openForm()" class="btn-primary">+ Add Category</button>
      </div>

      @if (showForm()) {
        <div class="card p-6 space-y-4">
          <h2 class="font-semibold">{{ editId() ? 'Edit' : 'New' }} Category</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Name <span class="text-red-500">*</span></label>
              <input [(ngModel)]="form.name" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Slug</label>
              <input [(ngModel)]="form.slug" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Parent Category</label>
              <select [(ngModel)]="form.parentId" class="input-field">
                <option value="">None (Top level)</option>
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
          </div>
          <div class="flex gap-2">
            <button (click)="saveCategory()" class="btn-primary" [disabled]="saving()">Save</button>
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
              <th class="px-4 py-3 text-left font-medium">Parent</th>
              <th class="px-4 py-3 text-center font-medium">Order</th>
              <th class="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            @for (cat of sortedCategories(); track cat.id) {
              <tr class="hover:bg-gray-50" [class.pl-8]="cat.parentId">
                <td class="px-4 py-3 font-medium">
                  @if (cat.parentId) { <span class="text-gray-300 mr-2">└</span> }
                  {{ cat.name }}
                </td>
                <td class="px-4 py-3 text-gray-500">{{ cat.slug }}</td>
                <td class="px-4 py-3 text-gray-500">{{ getParentName(cat.parentId) }}</td>
                <td class="px-4 py-3 text-center">{{ cat.sortOrder }}</td>
                <td class="px-4 py-3 text-right space-x-2">
                  <button (click)="editCategory(cat)" class="text-blue-600 hover:underline">Edit</button>
                  <button (click)="deleteCategory(cat)" class="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="px-4 py-8 text-center text-gray-400">No categories yet</td></tr>
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

  readonly categories = signal<Category[]>([]);
  readonly showForm = signal(false);
  readonly editId = signal<string | null>(null);
  readonly saving = signal(false);

  form: { name: string; slug: string; parentId: string; sortOrder: number } = {
    name: '', slug: '', parentId: '', sortOrder: 0,
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
    this.form = { name: '', slug: '', parentId: '', sortOrder: 0 };
    this.editId.set(null);
    this.showForm.set(true);
  }

  editCategory(cat: Category): void {
    this.form = { name: cat.name, slug: cat.slug, parentId: cat.parentId || '', sortOrder: cat.sortOrder };
    this.editId.set(cat.id);
    this.showForm.set(true);
  }

  deleteCategory(cat: Category): void {
    if (!confirm(`Delete "${cat.name}"?`)) return;
    this.api.delete(`/Categories/${cat.id}`).subscribe({
      next: () => { this.toastService.success('Deleted'); this.load(); },
      error: () => this.toastService.error('Failed to delete'),
    });
  }

  saveCategory(): void {
    if (!this.form.name) { this.toastService.error('Name is required'); return; }
    this.saving.set(true);
    const body = { ...this.form, parentId: this.form.parentId || null };
    const req$ = this.editId()
      ? this.api.put(`/Categories/${this.editId()}`, body)
      : this.api.post('/Categories', body);
    req$.subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.toastService.success('Saved'); this.load(); },
      error: () => { this.saving.set(false); this.toastService.error('Failed to save'); },
    });
  }
}
