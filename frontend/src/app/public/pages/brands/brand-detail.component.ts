import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Item } from '../../../core/models/item.models';
import { PaginatedList } from '../../../core/models/api.models';
import { ItemCardComponent } from '../../../shared/components/item-card/item-card.component';
import { I18nService } from '../../../core/services/i18n.service';
import { TenantService } from '../../../core/services/tenant.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-brand-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, ItemCardComponent, PaginationComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Breadcrumb -->
      <nav class="text-sm text-gray-400 mb-6">
        <a [routerLink]="tenantService.storeUrl()" class="hover:text-[color:var(--color-primary)] transition">{{ i18n.t('common.home') }}</a>
        <span class="mx-2">›</span>
        <a [routerLink]="tenantService.storeUrl() + '/brands'" class="hover:text-[color:var(--color-primary)] transition">{{ i18n.t('store.brands') }}</a>
        <span class="mx-2">›</span>
        <span class="text-gray-700 font-medium">{{ brandName() }}</span>
      </nav>

      <!-- Header with count + sort -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900">{{ brandName() }}</h1>
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
          <p class="text-gray-500 mb-4">{{ i18n.t('store.noItemsBrand') }}</p>
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
export class BrandDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly tenantService = inject(TenantService);
  readonly i18n = inject(I18nService);

  readonly items = signal<Item[]>([]);
  readonly loading = signal(true);
  readonly brandName = signal('Brand');
  readonly totalCount = signal(0);
  readonly totalPages = signal(1);

  currentPage = 1;
  sortBy = 'newest';
  private slug = '';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.slug = params['slug'];
      this.brandName.set(this.slug?.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Brand');
      this.currentPage = 1;
      this.loadItems();
    });
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

  private loadItems(): void {
    this.loading.set(true);
    const params: Record<string, any> = {
      brandSlug: this.slug,
      pageSize: 24,
      page: this.currentPage,
      status: 'Available',
    };
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
