import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Item } from '../../../core/models/item.models';
import { PaginatedList } from '../../../core/models/api.models';
import { ItemCardComponent } from '../../../shared/components/item-card/item-card.component';
import { I18nService } from '../../../core/services/i18n.service';
import { TenantService } from '../../../core/services/tenant.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { FormsModule } from '@angular/forms';
import { StoreNavService } from '../../../core/services/store-nav.service';
import { NavBrand } from '../../../core/models/navigation.models';
import { resolveImageUrl } from '../../../core/utils/image.utils';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [RouterLink, ItemCardComponent, PaginationComponent, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Breadcrumb -->
      <nav class="text-sm text-gray-400 mb-6">
        <a [routerLink]="tenantService.storeUrl()" class="hover:text-[color:var(--color-primary)] transition">{{ i18n.t('common.home') }}</a>
        <span class="mx-2">›</span>
        <a [routerLink]="tenantService.storeUrl() + '/catalog'" class="hover:text-[color:var(--color-primary)] transition">{{ i18n.t('store.catalog') }}</a>
        <span class="mx-2">›</span>
        <span class="text-gray-700 font-medium">{{ categoryName() }}</span>
      </nav>

      <!-- Header with count + sort -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900">{{ categoryName() }}</h1>
          @if (!loading() && totalCount() > 0) {
            <p class="text-sm text-gray-500 mt-1">{{ totalCount() }} {{ i18n.t('store.items') }}</p>
          }
        </div>
        <select [(ngModel)]="sortBy" (ngModelChange)="onSortChange()" class="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-gray-900/10 outline-none">
          <option value="newest">{{ i18n.t('store.newest') }}</option>
          <option value="priceAsc">{{ i18n.t('store.priceLowHigh') }}</option>
          <option value="priceDesc">{{ i18n.t('store.priceHighLow') }}</option>
        </select>
      </div>

      <!-- Brand filter chips -->
      @if (brands().length > 0) {
        <div class="flex flex-wrap gap-2 mb-6">
          <button (click)="filterBrand(null)"
            class="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all"
            [class]="selectedBrandSlug === null
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'">
            {{ i18n.t('store.viewAll') || 'All' }}
          </button>
          @for (brand of brands(); track brand.id) {
            <button (click)="filterBrand(brand.slug)"
              class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all"
              [class]="selectedBrandSlug === brand.slug
                ? 'bg-[color:var(--color-primary)] text-white border-[color:var(--color-primary)]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[color:var(--color-primary)]'">
              @if (brand.logoUrl) {
                <img [src]="resolveImg(brand.logoUrl)" [alt]="brand.name" class="w-4 h-4 object-contain rounded" />
              }
              {{ brand.name }}
            </button>
          }
        </div>
      }

      @if (loading()) {
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <div class="skeleton h-72 rounded-2xl"></div>
          }
        </div>
      } @else if (items().length === 0) {
        <div class="text-center py-20">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          </div>
          <p class="text-gray-500 mb-4">{{ i18n.t('store.noItemsCategory') }}</p>
          <a [routerLink]="tenantService.storeUrl() + '/catalog'" class="inline-flex items-center gap-2 bg-[color:var(--color-primary)] text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition">
            {{ i18n.t('store.browseCatalog') }}
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          @for (item of items(); track item.id) {
            <app-item-card [item]="item" />
          }
        </div>

        @if (totalPages() > 1) {
          <div class="mt-10">
            <app-pagination [currentPage]="currentPage" [totalPages]="totalPages()" (pageChange)="goToPage($event)" />
          </div>
        }
      }
    </div>
  `,
})
export class CategoryComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly tenantService = inject(TenantService);
  readonly i18n = inject(I18nService);
  private readonly storeNav = inject(StoreNavService);

  readonly items = signal<Item[]>([]);
  readonly loading = signal(true);
  readonly categoryName = signal('Category');
  readonly totalCount = signal(0);
  readonly totalPages = signal(1);
  readonly brands = signal<NavBrand[]>([]);

  currentPage = 1;
  sortBy = 'newest';
  selectedBrandSlug: string | null = null;
  private slug = '';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.slug = params['slug'];
      this.categoryName.set(this.slug?.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Category');
      this.currentPage = 1;
      this.selectedBrandSlug = null;
      this.loadBrands();
      this.loadItems();
    });
  }

  private loadBrands(): void {
    const brandsForSlug = this.storeNav.getBrandsByCategorySlug(this.slug);
    this.brands.set(brandsForSlug);
    // Also listen for when nav data arrives (if page is refreshed directly)
    if (brandsForSlug.length === 0) {
      const interval = setInterval(() => {
        if (this.storeNav.navigationLoaded()) {
          this.brands.set(this.storeNav.getBrandsByCategorySlug(this.slug));
          clearInterval(interval);
        }
      }, 250);
      // Clear after 5s to avoid memory leaks
      setTimeout(() => clearInterval(interval), 5000);
    }
  }

  filterBrand(brandSlug: string | null): void {
    this.selectedBrandSlug = brandSlug;
    this.currentPage = 1;
    this.loadItems();
  }

  onSortChange(): void {
    this.currentPage = 1;
    this.loadItems();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadItems();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resolveImg(url: string): string {
    return resolveImageUrl(url);
  }

  private loadItems(): void {
    this.loading.set(true);
    const params: Record<string, any> = {
      categorySlug: this.slug,
      pageSize: 24,
      page: this.currentPage,
      status: 'Available',
    };
    if (this.selectedBrandSlug) params['brandSlug'] = this.selectedBrandSlug;
    if (this.sortBy === 'priceAsc') { params['sortBy'] = 'price'; params['sortDirection'] = 'asc'; }
    else if (this.sortBy === 'priceDesc') { params['sortBy'] = 'price'; params['sortDirection'] = 'desc'; }
    else { params['sortBy'] = 'newest'; }

    this.api.get<PaginatedList<Item>>('/Public/items', params).subscribe({
      next: data => {
        this.items.set(data.items || []);
        this.totalCount.set(data.totalCount || 0);
        this.totalPages.set(data.totalPages || 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
