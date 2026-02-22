import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Item, ItemQueryParams } from '../../../core/models/item.models';
import { PaginatedList } from '../../../core/models/api.models';
import { ItemCardComponent } from '../../../shared/components/item-card/item-card.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { FollowUpModalComponent } from '../../../shared/components/follow-up-modal/follow-up-modal.component';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [FormsModule, RouterLink, ItemCardComponent, PaginationComponent, FollowUpModalComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold mb-6">{{ pageTitle() }}</h1>

      <!-- Filters Bar -->
      <div class="bg-white border border-[color:var(--color-border)] rounded-xl p-4 mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 md:flex-wrap">
        <!-- Search -->
        <div class="flex-1 min-w-[200px]">
          <input
            [(ngModel)]="search"
            (ngModelChange)="searchSubject.next($event)"
            type="text"
            placeholder="Search items..."
            class="input-field" />
        </div>

        <!-- Sort -->
        <select [(ngModel)]="sortBy" (change)="loadItems()" class="input-field w-auto">
          <option value="createdAt_desc">Newest</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>

        <!-- Category Filter -->
        <select [(ngModel)]="categoryFilter" (change)="applyFilter()" class="input-field w-auto">
          <option value="">All Categories</option>
          @for (cat of categories(); track cat) {
            <option [value]="cat">{{ cat }}</option>
          }
        </select>

        <!-- Brand Filter -->
        <select [(ngModel)]="brandFilter" (change)="applyFilter()" class="input-field w-auto">
          <option value="">All Brands</option>
          @for (brand of brands(); track brand) {
            <option [value]="brand">{{ brand }}</option>
          }
        </select>

        <!-- Condition -->
        <select [(ngModel)]="conditionFilter" (change)="applyFilter()" class="input-field w-auto">
          <option value="">All Conditions</option>
          <option value="New">New</option>
          <option value="Used">Used</option>
          <option value="Refurbished">Refurbished</option>
        </select>

        <!-- Clear -->
        <button (click)="clearFilters()" class="btn-outline text-xs">Clear</button>
      </div>

      <!-- Items grid -->
      @if (loading()) {
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <div class="skeleton h-72 rounded-xl"></div>
          }
        </div>
      } @else if (items().length === 0) {
        <div class="text-center py-16">
          <p class="text-[color:var(--color-text-muted)] text-lg">No items found</p>
          <button (click)="clearFilters()" class="btn-primary mt-4">Clear Filters</button>
        </div>
      } @else {
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          @for (item of items(); track item.id) {
            <app-item-card [item]="item" />
          }
        </div>
        <div class="mt-8">
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
    return 'Catalog';
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
