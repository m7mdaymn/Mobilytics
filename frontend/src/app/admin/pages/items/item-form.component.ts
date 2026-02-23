import { Component, inject, OnInit, signal, computed } from '@angular/core';
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
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ isEdit() ? 'Edit Item' : 'Add New Item' }}</h1>
          <p class="text-sm text-gray-500 mt-0.5">Fill in the details below to {{ isEdit() ? 'update' : 'create' }} your item</p>
        </div>
        <a routerLink="/admin/items" class="text-sm text-gray-500 hover:text-gray-900 font-medium transition">&larr; Back to Items</a>
      </div>

      <!-- Step indicators -->
      <div class="flex items-center gap-2 text-sm">
        @for (step of steps; track step.key; let idx = $index) {
          <button (click)="currentStep.set(step.key)"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all"
            [class]="currentStep() === step.key
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'">
            <span class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" [class]="currentStep() === step.key ? 'bg-white/20' : 'bg-gray-200'">{{ idx + 1 }}</span>
            {{ step.label }}
          </button>
        }
      </div>

      <!-- Step 1: Basic Info -->
      @if (currentStep() === 'basic') {
        <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <h2 class="font-semibold text-lg text-gray-900">Basic Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Title <span class="text-red-500">*</span></label>
              <input [(ngModel)]="form.title" (ngModelChange)="autoSlug()" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" placeholder="e.g. iPhone 15 Pro Max 256GB" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
              <input [(ngModel)]="form.slug" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none font-mono" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Item Type <span class="text-red-500">*</span></label>
              <select [(ngModel)]="form.itemTypeId" (change)="onTypeChange()" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none">
                <option value="">Select type...</option>
                @for (type of itemTypes(); track type.id) {
                  <option [value]="type.id">{{ type.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <select [(ngModel)]="form.brandId" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none">
                <option value="">None</option>
                @for (brand of brands(); track brand.id) {
                  <option [value]="brand.id">{{ brand.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select [(ngModel)]="form.categoryId" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none">
                <option value="">None</option>
                @for (cat of categories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea [(ngModel)]="form.description" rows="3" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" placeholder="Optional product description..."></textarea>
            </div>
          </div>
          <div class="flex justify-end">
            <button (click)="currentStep.set('pricing')" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-xl text-sm font-semibold transition">Next: Pricing &rarr;</button>
          </div>
        </div>
      }

      <!-- Step 2: Pricing & Inventory -->
      @if (currentStep() === 'pricing') {
        <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <h2 class="font-semibold text-lg text-gray-900">Pricing & Inventory</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Price <span class="text-red-500">*</span></label>
              <input [(ngModel)]="form.price" type="number" min="0" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Old Price <span class="text-gray-400">(strike-through)</span></label>
              <input [(ngModel)]="form.oldPrice" type="number" min="0" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select [(ngModel)]="form.condition" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 outline-none">
                <option value="New">New</option>
                <option value="Used">Used</option>
                <option value="Refurbished">Refurbished</option>
              </select>
            </div>
          </div>

          <!-- Tax -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tax Status</label>
              <select [(ngModel)]="form.taxStatus" (change)="onTaxChange()" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 outline-none">
                <option value="Taxable">Taxable</option>
                <option value="Exempt">Exempt</option>
              </select>
            </div>
            @if (form.taxStatus === 'Taxable') {
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">VAT %</label>
                <input [(ngModel)]="form.vatPercent" type="number" min="0" max="100" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 outline-none" />
              </div>
            }
          </div>

          <!-- Inventory (type-aware) -->
          <div class="border-t border-gray-100 pt-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Inventory & Identifiers</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              @if (showQuantity()) {
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input [(ngModel)]="form.quantity" type="number" min="0" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                  <input [(ngModel)]="form.lowStockThreshold" type="number" min="0" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none" />
                </div>
              }
              @if (selectedType()?.isDevice) {
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">IMEI</label>
                  <input [(ngModel)]="form.imei" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none font-mono" placeholder="Optional" />
                </div>
              }
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                <input [(ngModel)]="form.serialNumber" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none font-mono" placeholder="Optional" />
              </div>
              <div class="flex items-center">
                <label class="flex items-center gap-2 mt-6 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="form.isFeatured" class="w-4 h-4 rounded accent-gray-900" />
                  <span class="text-sm font-medium text-gray-700">Featured Item</span>
                </label>
              </div>
            </div>
          </div>

          <div class="flex justify-between">
            <button (click)="currentStep.set('basic')" class="text-gray-500 hover:text-gray-900 px-4 py-2 text-sm font-medium transition">&larr; Back</button>
            <button (click)="currentStep.set('details')" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-xl text-sm font-semibold transition">Next: Details &rarr;</button>
          </div>
        </div>
      }

      <!-- Step 3: Custom Fields + Images -->
      @if (currentStep() === 'details') {
        <!-- Custom Fields -->
        @if (customFields().length) {
          <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 class="font-semibold text-lg text-gray-900">Custom Fields</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (field of customFields(); track field.id) {
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ field.name }}</label>
                  @switch (field.fieldType) {
                    @case ('Boolean') {
                      <select [(ngModel)]="customFieldValues[field.id]" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none">
                        <option value="">Select...</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    }
                    @case ('Select') {
                      <select [(ngModel)]="customFieldValues[field.id]" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none">
                        <option value="">Select...</option>
                        @for (opt of field.options; track opt) {
                          <option [value]="opt">{{ opt }}</option>
                        }
                      </select>
                    }
                    @case ('Number') {
                      <input [(ngModel)]="customFieldValues[field.id]" type="number" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none" />
                    }
                    @default {
                      <input [(ngModel)]="customFieldValues[field.id]" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none" />
                    }
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- Images -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 class="font-semibold text-lg text-gray-900">Images</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Main Image</label>
              <label class="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition">
                @if (mainImagePreview()) {
                  <img [src]="mainImagePreview()" alt="Preview" class="w-full h-full object-cover rounded-xl" />
                } @else {
                  <svg class="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  <span class="text-sm text-gray-500">Click to upload</span>
                }
                <input type="file" (change)="onMainImageChange($event)" accept="image/*" class="hidden" />
              </label>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Gallery Images (up to 5)</label>
              <label class="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition">
                <svg class="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"/></svg>
                <span class="text-sm text-gray-500">{{ galleryFiles.length ? galleryFiles.length + ' file(s) selected' : 'Click to upload' }}</span>
                <input type="file" (change)="onGalleryChange($event)" accept="image/*" multiple class="hidden" />
              </label>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap items-center gap-3">
          <button (click)="currentStep.set('pricing')" class="text-gray-500 hover:text-gray-900 px-4 py-2 text-sm font-medium transition">&larr; Back</button>
          <div class="flex-1"></div>
          <button (click)="save('Hidden')" [disabled]="saving()"
            class="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">
            Save as Draft
          </button>
          <button (click)="save('Available')" [disabled]="saving()"
            class="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 hover:bg-black text-white transition disabled:opacity-50">
            {{ saving() ? 'Saving...' : (isEdit() ? 'Update & Publish' : 'Create & Publish') }}
          </button>
        </div>
      }
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
  readonly currentStep = signal<'basic' | 'pricing' | 'details'>('basic');

  readonly selectedType = computed(() => this.itemTypes().find(t => t.id === this.form.itemTypeId) || null);

  readonly steps: { key: 'basic' | 'pricing' | 'details'; label: string }[] = [
    { key: 'basic', label: 'Basic' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'details', label: 'Details' },
  ];

  private editId = '';
  private mainImageFile: File | null = null;
  galleryFiles: File[] = [];
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
