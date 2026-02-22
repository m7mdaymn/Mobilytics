import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { HomeSection, HomeSectionItem } from '../../../core/models/item.models';

@Component({
  selector: 'app-home-sections',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Home Sections</h1>
        <button (click)="openForm()" class="btn-primary">+ Add Section</button>
      </div>

      @if (showForm()) {
        <div class="card p-6 space-y-4">
          <h2 class="font-semibold">{{ editId() ? 'Edit' : 'New' }} Section</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Title <span class="text-red-500">*</span></label>
              <input [(ngModel)]="form.title" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Type <span class="text-red-500">*</span></label>
              <select [(ngModel)]="form.sectionType" class="input-field">
                <option value="BannerSlider">Banner Slider</option>
                <option value="FeaturedItems">Featured Items</option>
                <option value="NewArrivals">New Arrivals</option>
                <option value="CategoriesShowcase">Categories Showcase</option>
                <option value="BrandsCarousel">Brands Carousel</option>
                <option value="Testimonials">Testimonials</option>
                <option value="CustomHtml">Custom HTML</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Sort Order</label>
              <input [(ngModel)]="form.sortOrder" type="number" min="0" class="input-field" />
            </div>
            <label class="flex items-center gap-2 mt-6">
              <input type="checkbox" [(ngModel)]="form.isVisible" class="w-4 h-4 rounded" />
              <span class="text-sm">Visible</span>
            </label>
            @if (form.sectionType === 'CustomHtml') {
              <div class="md:col-span-2">
                <label class="block text-sm font-medium mb-1">HTML Content</label>
                <textarea [(ngModel)]="form.htmlContent" rows="5" class="input-field font-mono text-xs"></textarea>
              </div>
            }
          </div>
          <div class="flex gap-2">
            <button (click)="saveSection()" class="btn-primary" [disabled]="saving()">Save</button>
            <button (click)="showForm.set(false)" class="btn-outline">Cancel</button>
          </div>
        </div>
      }

      <div class="space-y-3">
        @for (section of sections(); track section.id; let i = $index) {
          <div class="card p-4 flex items-center gap-4">
            <div class="flex flex-col gap-1">
              <button (click)="moveUp(i)" [disabled]="i === 0"
                class="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30">▲</button>
              <button (click)="moveDown(i)" [disabled]="i === sections().length - 1"
                class="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30">▼</button>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ section.title }}</span>
                <span class="badge-info text-xs">{{ section.sectionType }}</span>
                @if (!section.isVisible) {
                  <span class="badge-default text-xs">Hidden</span>
                }
              </div>
              <p class="text-xs text-gray-400 mt-1">Order: {{ section.sortOrder }}</p>
            </div>
            <div class="flex gap-2">
              <button (click)="editSection(section)" class="text-blue-600 text-sm hover:underline">Edit</button>
              <button (click)="toggleVisibility(section)" class="text-sm hover:underline"
                [class]="section.isVisible ? 'text-yellow-600' : 'text-green-600'">
                {{ section.isVisible ? 'Hide' : 'Show' }}
              </button>
              <button (click)="deleteSection(section)" class="text-red-600 text-sm hover:underline">Delete</button>
            </div>
          </div>
        } @empty {
          <div class="text-center text-gray-400 py-8">No sections configured</div>
        }
      </div>
    </div>
  `,
})
export class HomeSectionsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);

  readonly sections = signal<HomeSection[]>([]);
  readonly showForm = signal(false);
  readonly editId = signal<string | null>(null);
  readonly saving = signal(false);

  form: { title: string; sectionType: string; sortOrder: number; isVisible: boolean; htmlContent: string } = {
    title: '', sectionType: 'FeaturedItems', sortOrder: 0, isVisible: true, htmlContent: '',
  };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.get<HomeSection[]>('/HomeSections').subscribe(d => {
      const sorted = (d || []).sort((a, b) => a.sortOrder - b.sortOrder);
      this.sections.set(sorted);
    });
  }

  openForm(): void {
    this.form = { title: '', sectionType: 'FeaturedItems', sortOrder: this.sections().length, isVisible: true, htmlContent: '' };
    this.editId.set(null);
    this.showForm.set(true);
  }

  editSection(s: HomeSection): void {
    this.form = { title: s.title, sectionType: s.sectionType, sortOrder: s.sortOrder, isVisible: s.isVisible, htmlContent: (s as any).htmlContent || '' };
    this.editId.set(s.id);
    this.showForm.set(true);
  }

  deleteSection(s: HomeSection): void {
    if (!confirm(`Delete "${s.title}"?`)) return;
    this.api.delete(`/HomeSections/${s.id}`).subscribe({
      next: () => { this.toastService.success('Deleted'); this.load(); },
      error: () => this.toastService.error('Failed to delete'),
    });
  }

  toggleVisibility(s: HomeSection): void {
    this.api.put(`/HomeSections/${s.id}`, { ...s, isVisible: !s.isVisible }).subscribe({
      next: () => this.load(),
      error: () => this.toastService.error('Failed to update'),
    });
  }

  moveUp(index: number): void {
    if (index === 0) return;
    this.swapOrder(index, index - 1);
  }

  moveDown(index: number): void {
    if (index >= this.sections().length - 1) return;
    this.swapOrder(index, index + 1);
  }

  private swapOrder(a: number, b: number): void {
    const items = [...this.sections()];
    const tempOrder = items[a].sortOrder;
    items[a].sortOrder = items[b].sortOrder;
    items[b].sortOrder = tempOrder;
    // Persist both
    this.api.put(`/HomeSections/${items[a].id}`, items[a]).subscribe();
    this.api.put(`/HomeSections/${items[b].id}`, items[b]).subscribe({
      next: () => this.load(),
    });
  }

  saveSection(): void {
    if (!this.form.title) { this.toastService.error('Title is required'); return; }
    this.saving.set(true);
    const req$ = this.editId()
      ? this.api.put(`/HomeSections/${this.editId()}`, this.form)
      : this.api.post('/HomeSections', this.form);
    req$.subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.toastService.success('Saved'); this.load(); },
      error: () => { this.saving.set(false); this.toastService.error('Failed to save'); },
    });
  }
}
