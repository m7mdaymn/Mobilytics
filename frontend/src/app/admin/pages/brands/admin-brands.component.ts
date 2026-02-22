import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Brand } from '../../../core/models/item.models';

@Component({
  selector: 'app-admin-brands',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Brands</h1>
        <button (click)="openForm()" class="btn-primary">+ Add Brand</button>
      </div>

      @if (showForm()) {
        <div class="card p-6 space-y-4">
          <h2 class="font-semibold">{{ editId() ? 'Edit' : 'New' }} Brand</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Name <span class="text-red-500">*</span></label>
              <input [(ngModel)]="form.name" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Slug</label>
              <input [(ngModel)]="form.slug" class="input-field" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium mb-1">Logo URL</label>
              <input [(ngModel)]="form.logoUrl" class="input-field" placeholder="https://..." />
              @if (form.logoUrl) {
                <img [src]="form.logoUrl" alt="Logo preview" class="mt-2 w-24 h-24 object-contain rounded border" />
              }
            </div>
          </div>
          <div class="flex gap-2">
            <button (click)="saveBrand()" class="btn-primary" [disabled]="saving()">Save</button>
            <button (click)="showForm.set(false)" class="btn-outline">Cancel</button>
          </div>
        </div>
      }

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        @for (brand of brands(); track brand.id) {
          <div class="card p-4 text-center space-y-2 relative group">
            @if (brand.logoUrl) {
              <img [src]="brand.logoUrl" [alt]="brand.name" class="w-16 h-16 object-contain mx-auto" />
            } @else {
              <div class="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-gray-400">
                {{ brand.name.charAt(0) }}
              </div>
            }
            <p class="font-medium text-sm">{{ brand.name }}</p>
            <div class="absolute top-2 right-2 hidden group-hover:flex gap-1">
              <button (click)="editBrand(brand)" class="text-xs text-blue-600 hover:underline">Edit</button>
              <button (click)="deleteBrand(brand)" class="text-xs text-red-600 hover:underline">Del</button>
            </div>
          </div>
        } @empty {
          <div class="col-span-full text-center text-gray-400 py-8">No brands yet</div>
        }
      </div>
    </div>
  `,
})
export class AdminBrandsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);

  readonly brands = signal<Brand[]>([]);
  readonly showForm = signal(false);
  readonly editId = signal<string | null>(null);
  readonly saving = signal(false);

  form = { name: '', slug: '', logoUrl: '' };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.get<Brand[]>('/Brands').subscribe(d => this.brands.set(d || []));
  }

  openForm(): void {
    this.form = { name: '', slug: '', logoUrl: '' };
    this.editId.set(null);
    this.showForm.set(true);
  }

  editBrand(b: Brand): void {
    this.form = { name: b.name, slug: b.slug, logoUrl: b.logoUrl || '' };
    this.editId.set(b.id);
    this.showForm.set(true);
  }

  deleteBrand(b: Brand): void {
    if (!confirm(`Delete "${b.name}"?`)) return;
    this.api.delete(`/Brands/${b.id}`).subscribe({
      next: () => { this.toastService.success('Deleted'); this.load(); },
      error: () => this.toastService.error('Failed to delete'),
    });
  }

  saveBrand(): void {
    if (!this.form.name) { this.toastService.error('Name is required'); return; }
    this.saving.set(true);
    const req$ = this.editId()
      ? this.api.put(`/Brands/${this.editId()}`, this.form)
      : this.api.post('/Brands', this.form);
    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.toastService.success('Saved');
        this.load();
      },
      error: () => { this.saving.set(false); this.toastService.error('Failed to save'); },
    });
  }
}
