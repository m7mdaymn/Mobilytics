import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
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
  imports: [FormsModule, DecimalPipe, ItemCardComponent, PaginationComponent, FollowUpModalComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-gray-900">{{ pageTitle() }}</h1>
        <p class="text-gray-500 text-sm mt-1">{{ totalCount() }} {{ i18n.t('store.items') || 'items' }}</p>
      </div>

      <div class="flex gap-6">
        <!-- Sidebar Filters (Desktop) -->
        <aside class="hidden lg:block w-64 shrink-0">
          <div class="bg-white rounded-2xl border border-gray-100 p-5 space-y-5 sticky top-28 shadow-sm">
            <h3 class="font-bold text-sm text-gray-900 uppercase tracking-wider">Filters</h3>

            <!-- Category -->
            <div>
              <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{{ i18n.t('store.allCategories') }}</label>
              <select [(ngModel)]="categoryFilter" (change)="applyFilter()" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-[color:var(--color-primary)]/20 outline-none">
                <option value="">All</option>
                @for (cat of categories(); track cat) {
                  <option [value]="cat">{{ cat }}</option>
                }
              </select>
            </div>

            <!-- Brand -->
            <div>
              <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{{ i18n.t('store.allBrands') }}</label>
              <select [(ngModel)]="brandFilter" (change)="applyFilter()" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-[color:var(--color-primary)]/20 outline-none">
                <option value="">All</option>
                @for (brand of brands(); track brand) {
                  <option [value]="brand">{{ brand }}</option>
                }
              </select>
            </div>

            <!-- Condition -->
            <div>
              <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Condition</label>
              <select [(ngModel)]="conditionFilter" (change)="applyFilter()" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-[color:var(--color-primary)]/20 outline-none">
                <option value="">All</option>
                <option value="New">{{ i18n.t('store.new') }}</option>
                <option value="Used">{{ i18n.t('store.used') }}</option>
                <option value="Refurbished">{{ i18n.t('store.refurbished') }}</option>
              </select>
            </div>

            <!-- Color -->
            <div>
              <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Color</label>
              <input [(ngModel)]="colorFilter" (ngModelChange)="filterSubject.next()" type="text" placeholder="e.g. Black"
                class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-primary)]/20 outline-none" />
            </div>

            <!-- Storage -->
            <div>
              <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Storage</label>
              <input [(ngModel)]="storageFilter" (ngModelChange)="filterSubject.next()" type="text" placeholder="e.g. 256GB"
                class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-primary)]/20 outline-none" />
            </div>

            <!-- RAM -->
            <div>
              <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">RAM</label>
              <input [(ngModel)]="ramFilter" (ngModelChange)="filterSubject.next()" type="text" placeholder="e.g. 8GB"
                class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-primary)]/20 outline-none" />
            </div>

            <!-- Installment Available -->
            <label class="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" [(ngModel)]="installmentFilter" (change)="applyFilter()"
                class="w-4 h-4 rounded border-gray-300 text-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)]" />
              <span class="text-sm font-medium text-gray-700">Installment Available</span>
            </label>

            <!-- Price Range -->
            <div>
              <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{{ i18n.t('store.priceRange') }}</label>
              <div class="flex items-center gap-2 mb-3">
                <input [(ngModel)]="minPriceFilter" (ngModelChange)="filterSubject.next()" type="number" min="0" placeholder="Min"
                  class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-primary)]/20 outline-none" />
                <span class="text-gray-400 text-xs">—</span>
                <input [(ngModel)]="maxPriceFilter" (ngModelChange)="filterSubject.next()" type="number" min="0" placeholder="Max"
                  class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-primary)]/20 outline-none" />
              </div>
              <!-- Visual slider -->
              <input type="range" [min]="0" [max]="50000" [step]="500" [(ngModel)]="maxPriceSlider" (ngModelChange)="onPriceSliderChange()"
                class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[color:var(--color-primary)]" />
              <div class="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>0</span>
                <span>{{ maxPriceSlider | number:'1.0-0' }}</span>
              </div>
            </div>

            <!-- Clear Filters -->
            @if (hasActiveFilters()) {
              <button (click)="clearFilters()" class="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-center">
                Clear All Filters &times;
              </button>
            }
          </div>
        </aside>

        <!-- Main Content -->
        <div class="flex-1 min-w-0">
          <!-- Top Bar: Search + Sort + Mobile Filter Toggle -->
          <div class="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
            <div class="flex flex-col md:flex-row md:items-center gap-3">
              <!-- Search -->
              <div class="flex-1 relative">
                <svg class="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input
                  [(ngModel)]="search"
                  (ngModelChange)="searchSubject.next($event)"
                  type="text"
                  [placeholder]="i18n.t('store.searchItems')"
                  class="w-full ps-10 pe-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-primary)]/20 focus:border-[color:var(--color-primary)] outline-none transition" />
              </div>

              <div class="flex items-center gap-2">
                <!-- Sort -->
                <select [(ngModel)]="sortBy" (change)="loadItems()" class="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-[color:var(--color-primary)]/20 outline-none">
                  <option value="createdAt_desc">{{ i18n.t('store.newest') }}</option>
                  <option value="price_asc">{{ i18n.t('store.priceLowHigh') }}</option>
                  <option value="price_desc">{{ i18n.t('store.priceHighLow') }}</option>
                </select>

                <!-- Mobile filter toggle -->
                <button (click)="mobileFiltersOpen = !mobileFiltersOpen" class="lg:hidden px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-1.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
                  Filters
                  @if (activeFilterCount() > 0) {
                    <span class="bg-[color:var(--color-primary)] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{{ activeFilterCount() }}</span>
                  }
                </button>
              </div>
            </div>

            <!-- Mobile filters (inline) -->
            @if (mobileFiltersOpen) {
              <div class="lg:hidden mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                <select [(ngModel)]="categoryFilter" (change)="applyFilter()" class="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white">
                  <option value="">All Categories</option>
                  @for (cat of categories(); track cat) { <option [value]="cat">{{ cat }}</option> }
                </select>
                <select [(ngModel)]="brandFilter" (change)="applyFilter()" class="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white">
                  <option value="">All Brands</option>
                  @for (brand of brands(); track brand) { <option [value]="brand">{{ brand }}</option> }
                </select>
                <select [(ngModel)]="conditionFilter" (change)="applyFilter()" class="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white">
                  <option value="">All Conditions</option>
                  <option value="New">New</option><option value="Used">Used</option><option value="Refurbished">Refurbished</option>
                </select>
                <input [(ngModel)]="colorFilter" (ngModelChange)="filterSubject.next()" type="text" placeholder="Color" class="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                <input [(ngModel)]="storageFilter" (ngModelChange)="filterSubject.next()" type="text" placeholder="Storage" class="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                <input [(ngModel)]="ramFilter" (ngModelChange)="filterSubject.next()" type="text" placeholder="RAM" class="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                <label class="col-span-2 flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="installmentFilter" (change)="applyFilter()" class="w-4 h-4 rounded border-gray-300 text-[color:var(--color-primary)]" />
                  <span class="text-sm text-gray-700">Installment only</span>
                </label>
                @if (hasActiveFilters()) {
                  <button (click)="clearFilters()" class="col-span-2 py-2 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition">Clear All &times;</button>
                }
              </div>
            }
          </div>

          <!-- Items grid -->
          @if (loading()) {
            <div class="grid grid-cols-2 md:grid-cols-3 gap-5">
              @for (i of [1,2,3,4,5,6]; track i) {
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
            <div class="grid grid-cols-2 md:grid-cols-3 gap-5">
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
      </div>
    </div>

    <app-follow-up-modal
      [open]="followUpOpen"
      [itemId]="followUpItemId"
      [itemTitle]="followUpItemTitle"
      (closed)="followUpOpen = false" />
  `,
})
export class CatalogComponent implements OnInit, OnDestroy {
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
  colorFilter = '';
  storageFilter = '';
  ramFilter = '';
  installmentFilter = false;
  minPriceFilter: number | null = null;
  maxPriceFilter: number | null = null;
  maxPriceSlider = 50000;
  typeSlug = '';
  mobileFiltersOpen = false;

  followUpOpen = false;
  followUpItemId = '';
  followUpItemTitle = '';
  private autoPopupTimer: ReturnType<typeof setTimeout> | null = null;

  readonly searchSubject = new Subject<string>();
  readonly filterSubject = new Subject<void>();

  readonly pageTitle = computed(() => {
    if (this.typeSlug) return this.typeSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return this.i18n.t('store.catalog');
  });

  readonly hasActiveFilters = computed(() =>
    !!(this.search || this.categoryFilter || this.brandFilter || this.conditionFilter || this.colorFilter || this.storageFilter || this.ramFilter || this.installmentFilter || this.minPriceFilter || this.maxPriceFilter)
  );

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.categoryFilter) count++;
    if (this.brandFilter) count++;
    if (this.conditionFilter) count++;
    if (this.colorFilter) count++;
    if (this.storageFilter) count++;
    if (this.ramFilter) count++;
    if (this.installmentFilter) count++;
    return count;
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.typeSlug = params['typeSlug'] || '';
      this.loadItems();
    });

    // Read query params from navigation
    this.route.queryParams.subscribe(qp => {
      let changed = false;
      if (qp['search'] && qp['search'] !== this.search) { this.search = qp['search']; changed = true; }
      if (qp['categorySlug'] && qp['categorySlug'] !== this.categoryFilter) { this.categoryFilter = qp['categorySlug']; changed = true; }
      if (qp['brandSlug'] && qp['brandSlug'] !== this.brandFilter) { this.brandFilter = qp['brandSlug']; changed = true; }
      if (qp['installmentAvailable'] === 'true' && !this.installmentFilter) { this.installmentFilter = true; changed = true; }
      if (qp['isFeatured'] === 'true') { changed = true; }
      if (qp['sortBy']) {
        const desc = qp['sortDescending'] === 'true';
        this.sortBy = qp['sortBy'] + (desc ? '_desc' : '_asc');
        changed = true;
      }
      if (changed) {
        this.currentPage.set(1);
        this.loadItems();
      }
    });

    this.searchSubject.pipe(debounceTime(400)).subscribe(() => {
      this.currentPage.set(1);
      this.loadItems();
    });

    this.filterSubject.pipe(debounceTime(400)).subscribe(() => {
      this.currentPage.set(1);
      this.loadItems();
    });

    // Session-based auto-popup: show follow-up modal once per session after 20s
    if (!sessionStorage.getItem('followUpShown')) {
      this.autoPopupTimer = setTimeout(() => {
        if (!this.followUpOpen) {
          this.followUpOpen = true;
          sessionStorage.setItem('followUpShown', '1');
        }
      }, 20000);
    }
  }

  ngOnDestroy(): void {
    if (this.autoPopupTimer) {
      clearTimeout(this.autoPopupTimer);
    }
  }

  loadItems(): void {
    this.loading.set(true);
    // Map sortBy to backend Sort values: price_asc, price_desc, newest, oldest
    const sortMap: Record<string, string> = {
      'createdAt_desc': 'newest',
      'createdAt_asc': 'oldest',
      'price_asc': 'price_asc',
      'price_desc': 'price_desc',
    };
    const params: ItemQueryParams = {
      page: this.currentPage(),
      pageSize: this.pageSize,
      search: this.search || undefined,
      sort: sortMap[this.sortBy] || 'newest',
      itemTypeSlug: this.typeSlug || undefined,
      categorySlug: this.categoryFilter || undefined,
      brandSlug: this.brandFilter || undefined,
      condition: this.conditionFilter || undefined,
      color: this.colorFilter || undefined,
      storage: this.storageFilter || undefined,
      ram: this.ramFilter || undefined,
      installmentAvailable: this.installmentFilter || undefined,
      priceMin: this.minPriceFilter || undefined,
      priceMax: this.maxPriceFilter || undefined,
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
    this.colorFilter = '';
    this.storageFilter = '';
    this.ramFilter = '';
    this.installmentFilter = false;
    this.minPriceFilter = null;
    this.maxPriceFilter = null;
    this.maxPriceSlider = 50000;
    this.sortBy = 'createdAt_desc';
    this.currentPage.set(1);
    this.loadItems();
  }

  onPriceSliderChange(): void {
    this.maxPriceFilter = this.maxPriceSlider < 50000 ? this.maxPriceSlider : null;
    this.filterSubject.next();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadItems();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
