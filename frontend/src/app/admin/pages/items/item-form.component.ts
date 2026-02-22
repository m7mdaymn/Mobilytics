import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ItemCreateDto, ItemType, Brand, Category, CustomFieldDefinition } from '../../../core/models/item.models';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="max-w-4xl space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">{{ isEdit() ? 'Edit Item' : 'New Item' }}</h1>
        <a routerLink="/admin/items" class="btn-outline text-sm">← Back</a>
      </div>

      <!-- Basic -->
      <div class="card p-6 space-y-4">
        <h2 class="font-semibold text-lg">Basic Info</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-1">Title <span class="text-red-500">*</span></label>
            <input [(ngModel)]="form.title" (ngModelChange)="autoSlug()" class="input-field" placeholder="iPhone 15 Pro Max" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Slug</label>
            <input [(ngModel)]="form.slug" class="input-field" placeholder="auto-generated" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Item Type <span class="text-red-500">*</span></label>
            <select [(ngModel)]="form.itemTypeId" (change)="onTypeChange()" class="input-field">
              <option value="">Select type...</option>
              @for (type of itemTypes(); track type.id) {
                <option [value]="type.id">{{ type.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Brand</label>
            <select [(ngModel)]="form.brandId" class="input-field">
              <option value="">None</option>
              @for (brand of brands(); track brand.id) {
                <option [value]="brand.id">{{ brand.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Category</label>
            <select [(ngModel)]="form.categoryId" class="input-field">
              <option value="">None</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
              }
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-1">Description</label>
            <textarea [(ngModel)]="form.description" rows="3" class="input-field" placeholder="Item description..."></textarea>
          </div>
        </div>
      </div>

      <!-- Pricing -->
      <div class="card p-6 space-y-4">
        <h2 class="font-semibold text-lg">Pricing</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Price <span class="text-red-500">*</span></label>
            <input [(ngModel)]="form.price" type="number" min="0" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Old Price</label>
            <input [(ngModel)]="form.oldPrice" type="number" min="0" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Tax Status</label>
            <select [(ngModel)]="form.taxStatus" (change)="onTaxChange()" class="input-field">
              <option value="Taxable">Taxable</option>
              <option value="Exempt">Exempt</option>
            </select>
          </div>
          @if (form.taxStatus === 'Taxable') {
            <div>
              <label class="block text-sm font-medium mb-1">VAT %</label>
              <input [(ngModel)]="form.vatPercent" type="number" min="0" max="100" class="input-field" />
            </div>
          }
        </div>
      </div>

      <!-- Inventory -->
      <div class="card p-6 space-y-4">
        <h2 class="font-semibold text-lg">Inventory & Condition</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Condition</label>
            <select [(ngModel)]="form.condition" class="input-field">
              <option value="New">New</option>
              <option value="Used">Used</option>
              <option value="Refurbished">Refurbished</option>
            </select>
          </div>
          @if (showQuantity()) {
            <div>
              <label class="block text-sm font-medium mb-1">Quantity</label>
              <input [(ngModel)]="form.quantity" type="number" min="0" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Low Stock Threshold</label>
              <input [(ngModel)]="form.lowStockThreshold" type="number" min="0" class="input-field" />
            </div>
          }
          <div>
            <label class="block text-sm font-medium mb-1">IMEI</label>
            <input [(ngModel)]="form.imei" class="input-field" placeholder="Optional" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Serial Number</label>
            <input [(ngModel)]="form.serialNumber" class="input-field" placeholder="Optional" />
          </div>
          <div>
            <label class="flex items-center gap-2 mt-6">
              <input type="checkbox" [(ngModel)]="form.isFeatured" class="w-4 h-4 rounded" />
              <span class="text-sm font-medium">Featured</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Custom Fields -->
      @if (customFields().length) {
        <div class="card p-6 space-y-4">
          <h2 class="font-semibold text-lg">Custom Fields</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (field of customFields(); track field.id) {
              <div>
                <label class="block text-sm font-medium mb-1">{{ field.name }}</label>
                @switch (field.fieldType) {
                  @case ('Boolean') {
                    <select [(ngModel)]="customFieldValues[field.id]" class="input-field">
                      <option value="">Select...</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  }
                  @case ('Select') {
                    <select [(ngModel)]="customFieldValues[field.id]" class="input-field">
                      <option value="">Select...</option>
                      @for (opt of field.options; track opt) {
                        <option [value]="opt">{{ opt }}</option>
                      }
                    </select>
                  }
                  @case ('Number') {
                    <input [(ngModel)]="customFieldValues[field.id]" type="number" class="input-field" />
                  }
                  @default {
                    <input [(ngModel)]="customFieldValues[field.id]" class="input-field" />
                  }
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Images -->
      <div class="card p-6 space-y-4">
        <h2 class="font-semibold text-lg">Images</h2>
        <div>
          <label class="block text-sm font-medium mb-2">Main Image</label>
          <input type="file" (change)="onMainImageChange($event)" accept="image/*" class="text-sm" />
          @if (mainImagePreview()) {
            <img [src]="mainImagePreview()" alt="Preview" class="mt-2 w-32 h-32 object-cover rounded-lg" />
          }
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Gallery Images (up to 5)</label>
          <input type="file" (change)="onGalleryChange($event)" accept="image/*" multiple class="text-sm" />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-3">
        <button (click)="save('Hidden')" class="btn-secondary" [disabled]="saving()">Save as Draft</button>
        <button (click)="save('Available')" class="btn-primary" [disabled]="saving()">Save & Publish</button>
        <button (click)="save('Hidden')" class="btn-outline" [disabled]="saving()">Save & Hide</button>
        <a routerLink="/admin/items" class="btn-outline">Cancel</a>
      </div>
    </div>
  `,
})
export class ItemFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly isEdit = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly itemTypes = signal<ItemType[]>([]);
  readonly brands = signal<Brand[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly customFields = signal<CustomFieldDefinition[]>([]);
  readonly showQuantity = signal(false);
  readonly mainImagePreview = signal<string | null>(null);

  private editId = '';
  private mainImageFile: File | null = null;
  private galleryFiles: File[] = [];
  customFieldValues: Record<string, string> = {};

  form: ItemCreateDto & { isFeatured: boolean; quantity: number; lowStockThreshold: number } = {
    title: '', slug: '', description: '', price: 0, oldPrice: undefined,
    condition: 'New', status: 'Hidden', isFeatured: false,
    brandId: '', categoryId: '', itemTypeId: '',
    quantity: 1, lowStockThreshold: 2,
    imei: '', serialNumber: '',
    taxStatus: 'Taxable', vatPercent: 14,
  };

  ngOnInit(): void {
    // Load lookup data
    this.api.get<ItemType[]>('/ItemTypes').subscribe(d => this.itemTypes.set(d || []));
    this.api.get<Brand[]>('/Brands').subscribe(d => this.brands.set(d || []));
    this.api.get<Category[]>('/Categories').subscribe(d => this.categories.set(d || []));
    this.api.get<CustomFieldDefinition[]>('/CustomFields').subscribe(d => this.customFields.set(d || []));

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.editId = params['id'];
        this.isEdit.set(true);
        this.loadItem(this.editId);
      }
    });
  }

  private loadItem(id: string): void {
    this.loading.set(true);
    this.api.get<any>(`/Items/${id}`).subscribe({
      next: item => {
        Object.assign(this.form, item);
        if (item.customFieldValues) {
          for (const cf of item.customFieldValues) {
            this.customFieldValues[cf.fieldId] = cf.value;
          }
        }
        this.onTypeChange();
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.toastService.error('Failed to load item'); },
    });
  }

  onTypeChange(): void {
    const type = this.itemTypes().find(t => t.id === this.form.itemTypeId);
    this.showQuantity.set(type?.isStockItem ?? false);
    if (type?.isDevice) {
      this.form.quantity = 1;
    }
  }

  onTaxChange(): void {
    if (this.form.taxStatus === 'Exempt') {
      this.form.vatPercent = 0;
    } else {
      this.form.vatPercent = 14;
    }
  }

  autoSlug(): void {
    if (!this.isEdit()) {
      this.form.slug = this.form.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }
  }

  onMainImageChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.mainImageFile = file;
      const reader = new FileReader();
      reader.onload = () => this.mainImagePreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  onGalleryChange(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      this.galleryFiles = Array.from(files).slice(0, 5);
    }
  }

  save(status: string): void {
    if (!this.form.title || !this.form.itemTypeId || !this.form.price) {
      this.toastService.error('Please fill required fields: Title, Type, Price');
      return;
    }

    this.saving.set(true);
    const body: any = {
      ...this.form,
      status,
      customFieldValues: Object.entries(this.customFieldValues)
        .filter(([, v]) => v)
        .map(([fieldId, value]) => ({ fieldId, value })),
    };

    const req$ = this.isEdit()
      ? this.api.put<any>(`/Items/${this.editId}`, body)
      : this.api.post<any>('/Items', body);

    req$.subscribe({
      next: (result: any) => {
        const itemId = result?.id || this.editId;

        // Upload images if any
        if (this.mainImageFile) {
          const fd = new FormData();
          fd.append('file', this.mainImageFile);
          this.api.upload(`/Items/${itemId}/images?isMain=true`, fd).subscribe();
        }
        for (const file of this.galleryFiles) {
          const fd = new FormData();
          fd.append('file', file);
          this.api.upload(`/Items/${itemId}/images`, fd).subscribe();
        }

        this.toastService.success(this.isEdit() ? 'Item updated!' : 'Item created!');
        this.saving.set(false);
        this.router.navigate(['/admin/items']);
      },
      error: (err: any) => {
        this.toastService.error(err.message || 'Failed to save item');
        this.saving.set(false);
      },
    });
  }
}
