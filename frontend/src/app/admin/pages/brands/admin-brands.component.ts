import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { I18nService } from '../../../core/services/i18n.service';
import { Brand } from '../../../core/models/item.models';
import { resolveImageUrl } from '../../../core/utils/image.utils';

@Component({
  selector: 'app-admin-brands',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">{{ i18n.t('brands.title') }}</h1>
        <button (click)="openForm()" class="btn-primary">+ {{ i18n.t('brands.addNew') }}</button>
      </div>

      @if (showForm()) {
        <div class="card p-6 space-y-4">
          <h2 class="font-semibold">{{ editId() ? i18n.t('brands.editBrand') : i18n.t('brands.addNew') }}</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">{{ i18n.t('common.name') }} <span class="text-red-500">*</span></label>
              <input [(ngModel)]="form.name" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">{{ i18n.t('common.slug') }}</label>
              <input [(ngModel)]="form.slug" class="input-field" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium mb-1">Logo URL</label>
              <input [(ngModel)]="form.logoUrl" class="input-field" placeholder="https://..." />
              @if (form.logoUrl) {
                <img [src]="resolveImg(form.logoUrl)" alt="Logo preview" class="mt-2 w-24 h-24 object-contain rounded border" />
              }
            </div>
            <label class="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" [(ngModel)]="form.isVisibleInNav" class="w-4 h-4 rounded" />
              <span class="text-sm">{{ i18n.t('common.showInNav') }}</span>
            </label>
          </div>
          <div class="flex gap-2">
            <button (click)="saveBrand()" class="btn-primary" [disabled]="saving()">{{ saving() ? i18n.t('common.saving') : i18n.t('common.save') }}</button>
            <button (click)="showForm.set(false)" class="btn-outline">{{ i18n.t('common.cancel') }}</button>
          </div>
        </div>
      }

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        @for (brand of brands(); track brand.id) {
          <div class="card p-4 text-center space-y-2 relative group">
            @if (brand.logoUrl) {
              <img [src]="resolveImg(brand.logoUrl)" [alt]="brand.name" class="w-16 h-16 object-contain mx-auto" />
            } @else {
              <div class="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-gray-400">
                {{ brand.name.charAt(0) }}
              </div>
            }
            <p class="font-medium text-sm">{{ brand.name }}</p>
            @if (!brand.isVisibleInNav) {
              <span class="text-xs text-gray-400">Hidden from nav</span>
            }
            <div class="absolute top-2 end-2 hidden group-hover:flex gap-1">
              <button (click)="editBrand(brand)" class="text-xs text-blue-600 hover:underline">{{ i18n.t('common.edit') }}</button>
              <button (click)="deleteBrand(brand)" class="text-xs text-red-600 hover:underline">{{ i18n.t('common.delete') }}</button>
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
  readonly i18n = inject(I18nService);
  readonly resolveImg = resolveImageUrl;
  readonly brands = signal<Brand[]>([]);
  readonly showForm = signal(false);
  readonly editId = signal<string | null>(null);
  readonly saving = signal(false);

  form = { name: '', slug: '', logoUrl: '', isVisibleInNav: true };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.get<Brand[]>('/Brands').subscribe(d => this.brands.set(d || []));
  }

  openForm(): void {
    this.form = { name: '', slug: '', logoUrl: '', isVisibleInNav: true };
    this.editId.set(null);
    this.showForm.set(true);
  }

  editBrand(b: Brand): void {
    this.form = { name: b.name, slug: b.slug, logoUrl: b.logoUrl || '', isVisibleInNav: b.isVisibleInNav !== false };
    this.editId.set(b.id);
    this.showForm.set(true);
  }

  deleteBrand(b: Brand): void {
    if (!confirm(`Delete "${b.name}"?`)) return;
    this.api.delete(`/Brands/${b.id}`).subscribe({
      next: () => { this.toastService.success(this.i18n.t('common.deleted')); this.load(); },
      error: () => this.toastService.error(this.i18n.t('common.failedToDelete')),
    });
  }

  saveBrand(): void {
    if (!this.form.name) { this.toastService.error(this.i18n.t('common.nameRequired')); return; }
    this.saving.set(true);
    const req$ = this.editId()
      ? this.api.put(`/Brands/${this.editId()}`, this.form)
      : this.api.post('/Brands', this.form);
    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.toastService.success(this.i18n.t('common.saved'));
        this.load();
      },
      error: () => { this.saving.set(false); this.toastService.error(this.i18n.t('common.failedToSave')); },
    });
  }
}
