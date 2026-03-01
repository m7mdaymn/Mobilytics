import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Brand } from '../../../core/models/item.models';
import { I18nService } from '../../../core/services/i18n.service';
import { TenantService } from '../../../core/services/tenant.service';
import { resolveImageUrl } from '../../../core/utils/image.utils';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Breadcrumb -->
      <nav class="text-sm text-gray-400 mb-6">
        <a [routerLink]="tenantService.storeUrl()" class="hover:text-[color:var(--color-primary)] transition">{{ i18n.t('common.home') }}</a>
        <span class="mx-2">›</span>
        <span class="text-gray-700 font-medium">{{ i18n.t('store.brands') }}</span>
      </nav>

      <!-- Header with search -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900">{{ i18n.t('store.brands') }}</h1>
          @if (!loading()) {
            <p class="text-sm text-gray-500 mt-1">{{ filteredBrands().length }} {{ i18n.t('store.brands').toLowerCase() }}</p>
          }
        </div>
        <div class="relative">
          <svg class="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" [(ngModel)]="searchQuery" [placeholder]="i18n.t('store.searchBrands')" class="ps-10 pe-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-gray-900/10 outline-none w-64" />
        </div>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          @for (i of [1,2,3,4,5,6,7,8,9,10,11,12]; track i) {
            <div class="skeleton h-36 rounded-2xl"></div>
          }
        </div>
      } @else if (filteredBrands().length === 0) {
        <div class="text-center py-20">
          <p class="text-gray-500">{{ i18n.t('common.noResults') }}</p>
        </div>
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          @for (brand of filteredBrands(); track brand.id) {
            <a [routerLink]="tenantService.storeUrl() + '/brand/' + brand.slug"
               class="group bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-3 p-6 text-center hover:shadow-lg hover:border-gray-200 transition-all duration-200">
              @if (brand.logoUrl) {
                <img [src]="resolveImg(brand.logoUrl)" [alt]="brand.name" class="h-14 w-auto object-contain group-hover:scale-105 transition-transform" loading="lazy" />
              } @else {
                <div class="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-[color:var(--color-primary)] font-bold text-xl shadow-inner">
                  {{ brand.name.charAt(0) }}
                </div>
              }
              <span class="font-semibold text-sm text-gray-900 group-hover:text-[color:var(--color-primary)] transition-colors">{{ brand.name }}</span>
              <span class="text-xs text-gray-400">{{ brand.itemCount }} {{ i18n.t('store.items') }}</span>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class BrandsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly tenantService = inject(TenantService);
  readonly i18n = inject(I18nService);

  readonly brands = signal<Brand[]>([]);
  readonly loading = signal(true);
  searchQuery = '';

  readonly filteredBrands = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.brands();
    return this.brands().filter(b => b.name.toLowerCase().includes(q));
  });

  resolveImg = resolveImageUrl;

  ngOnInit(): void {
    this.api.get<Brand[]>('/Public/brands').subscribe({
      next: data => {
        this.brands.set(data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
