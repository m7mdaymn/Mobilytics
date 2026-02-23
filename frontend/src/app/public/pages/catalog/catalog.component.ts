import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Item, ItemQueryParams } from '../../../core/models/item.models';
import { PaginatedList } from '../../../core/models/api.models';
import { ItemCardComponent } from '../../../shared/components/item-card/item-card.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { FollowUpModalComponent } from '../../../shared/components/follow-up-modal/follow-up-modal.component';
import { I18nService } from '../../../core/services/i18n.service';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [FormsModule, ItemCardComponent, PaginationComponent, FollowUpModalComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-gray-900">{{ pageTitle() }}</h1>
        <p class="text-gray-500 text-sm mt-1">{{ totalCount() }} {{ i18n.t('store.items') || 'items' }}</p>
      </div>

      <!-- Filters Bar -->
      <div class="bg-white rounded-2xl border border-gray-100 p-4 mb-8 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-center gap-3">
          <!-- Search -->
          <div class="flex-1 relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              [(ngModel)]="search"
              (ngModelChange)="searchSubject.next($event)"
              type="text"
              [placeholder]="i18n.t('store.searchItems')"
              class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-primary)]/20 focus:border-[color:var(--color-primary)] outline-none transition" />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- Sort -->
            <select [(ngModel)]="sortBy" (change)="loadItems()" class="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-[color:var(--color-primary)]/20 outline-none">
              <option value="createdAt_desc">{{ i18n.t('store.newest') }}</option>
              <option value="price_asc">{{ i18n.t('store.priceLowHigh') }}</option>
              <option value="price_desc">{{ i18n.t('store.priceHighLow') }}</option>
            </select>

            <!-- Category Filter -->
            <select [(ngModel)]="categoryFilter" (change)="applyFilter()" class="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-[color:var(--color-primary)]/20 outline-none">
              <option value="">{{ i18n.t('store.allCategories') }}</option>
              @for (cat of categories(); track cat) {
                <option [value]="cat">{{ cat }}</option>
              }
            </select>

            <!-- Brand Filter -->
            <select [(ngModel)]="brandFilter" (change)="applyFilter()" class="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-[color:var(--color-primary)]/20 outline-none">
              <option value="">{{ i18n.t('store.allBrands') }}</option>
              @for (brand of brands(); track brand) {
                <option [value]="brand">{{ brand }}</option>
              }
            </select>

            <!-- Condition -->
            <select [(ngModel)]="conditionFilter" (change)="applyFilter()" class="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-[color:var(--color-primary)]/20 outline-none">
              <option value="">{{ i18n.t('store.allConditions') }}</option>
              <option value="New">{{ i18n.t('store.new') }}</option>
              <option value="Used">{{ i18n.t('store.used') }}</option>
              <option value="Refurbished">{{ i18n.t('store.refurbished') }}</option>
            </select>

            <!-- Clear -->
            @if (search || categoryFilter || brandFilter || conditionFilter) {
              <button (click)="clearFilters()" class="px-3 py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                {{ i18n.t('store.clear') }} &times;
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Items grid -->
      @if (loading()) {
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <div class="skeleton h-80 rounded-2xl"></div>
          }
        </div>
      } @else if (items().length === 0) {
        <div class="text-center py-20">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <p class="text-gray-500 text-lg font-medium mb-2">{{ i18n.t('store.noItems') }}</p>
          <button (click)="clearFilters()" class="mt-2 px-5 py-2.5 bg-[color:var(--color-primary)] text-white font-semibold rounded-xl hover:opacity-90 transition text-sm">{{ i18n.t('store.clearFilters') }}</button>
        </div>
      } @else {
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          @for (item of items(); track item.id) {
            <app-item-card [item]="item" />
          }
        </div>
        <div class="mt-10">
          <app-pagination
            [currentPage]="currentPage()"
            [totalPages]="totalPages()"
            [totalCount]="totalCount()"
            [pageSize]="pageSize"
            (pageChange)="onPageChange($event)" />
        </div>
      }
    </div>

    <app-follow-up-modal
      [open]="followUpOpen"
      [itemId]="followUpItemId"
      [itemTitle]="followUpItemTitle"
      (closed)="followUpOpen = false" />
  `,
})
export class CatalogComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(I18nService);

  readonly items = signal<Item[]>([]);
  readonly loading = signal(true);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly totalCount = signal(0);
  readonly pageSize = 12;

  readonly categories = signal<string[]>([]);
  readonly brands = signal<string[]>([]);

  search = '';
  sortBy = 'createdAt_desc';
  categoryFilter = '';
  brandFilter = '';
  conditionFilter = '';
  typeSlug = '';

  followUpOpen = false;
  followUpItemId = '';
  followUpItemTitle = '';

  readonly searchSubject = new Subject<string>();

  readonly pageTitle = computed(() => {
    if (this.typeSlug) return this.typeSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return this.i18n.t('store.catalog');
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.typeSlug = params['typeSlug'] || '';
      this.loadItems();
    });

    this.searchSubject.pipe(debounceTime(400)).subscribe(() => {
      this.currentPage.set(1);
      this.loadItems();
    });
  }

  loadItems(): void {
    this.loading.set(true);
    const [field, dir] = this.sortBy.split('_');
    const params: ItemQueryParams = {
      pageNumber: this.currentPage(),
      pageSize: this.pageSize,
      search: this.search || undefined,
      sortBy: field,
      sortDescending: dir === 'desc',
      itemTypeSlug: this.typeSlug || undefined,
      categorySlug: this.categoryFilter || undefined,
      brandSlug: this.brandFilter || undefined,
      condition: this.conditionFilter || undefined,
      status: 'Available',
    };

    this.api.get<PaginatedList<Item>>('/Public/items', params as Record<string, string | number | boolean | undefined>).subscribe({
      next: data => {
        this.items.set(data.items);
        this.totalPages.set(data.totalPages);
        this.totalCount.set(data.totalCount);
        this.loading.set(false);

        // Collect unique filter options
        const cats = new Set(data.items.map(i => i.categoryName).filter(Boolean));
        const brs = new Set(data.items.map(i => i.brandName).filter(Boolean));
        if (cats.size) this.categories.set([...cats]);
        if (brs.size) this.brands.set([...brs]);
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilter(): void {
    this.currentPage.set(1);
    this.loadItems();
  }

  clearFilters(): void {
    this.search = '';
    this.categoryFilter = '';
    this.brandFilter = '';
    this.conditionFilter = '';
    this.sortBy = 'createdAt_desc';
    this.currentPage.set(1);
    this.loadItems();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadItems();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
