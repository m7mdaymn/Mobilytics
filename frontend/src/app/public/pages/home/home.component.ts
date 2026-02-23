import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { HomeSection, Item } from '../../../core/models/item.models';
import { SettingsStore } from '../../../core/stores/settings.store';
import { ItemCardComponent } from '../../../shared/components/item-card/item-card.component';
import { ThemeSwitcherComponent } from '../../../shared/components/theme-switcher/theme-switcher.component';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ItemCardComponent, ThemeSwitcherComponent],
  template: `
    @if (loading()) {
      <div class="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div class="skeleton h-[340px] rounded-2xl"></div>
        @for (i of [1,2]; track i) {
          <div>
            <div class="skeleton h-6 w-48 mb-4"></div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-5">
              @for (j of [1,2,3,4]; track j) {
                <div class="skeleton h-72 rounded-2xl"></div>
              }
            </div>
          </div>
        }
      </div>
    } @else {
      <div class="max-w-7xl mx-auto px-4 py-8 space-y-14">

        <!-- Hero Banner -->
        <div class="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[color:var(--color-primary)] via-[color:var(--color-secondary)] to-black min-h-[340px] flex items-center shadow-2xl">
          @if (settingsStore.settings()?.bannerUrl) {
            <img [src]="settingsStore.settings()!.bannerUrl" alt="" class="absolute inset-0 w-full h-full object-cover opacity-30" />
          }
          <div class="relative z-10 px-8 md:px-14 py-12 max-w-xl">
            <p class="text-white/60 text-sm font-medium uppercase tracking-widest mb-3">{{ i18n.t('store.welcome') || 'Welcome to' }}</p>
            <h1 class="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">{{ settingsStore.storeName() }}</h1>
            <p class="text-white/70 text-lg mb-8">{{ i18n.t('store.browseAll') }}</p>
            <a routerLink="/catalog" class="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-7 py-3.5 rounded-xl hover:bg-gray-100 transition shadow-lg text-sm">
              {{ i18n.t('store.shopNow') }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </a>
          </div>
          <!-- Theme Switcher -->
          <div class="absolute top-4 right-4 z-20">
            <app-theme-switcher />
          </div>
        </div>

        <!-- Dynamic Sections -->
        @for (section of sections(); track section.id) {
          @if (section.isActive) {
            @switch (section.type) {
              @case ('BannerSlider') {
                <div class="relative overflow-hidden rounded-2xl">
                  @if (section.items.length > 0) {
                    @for (banner of section.items; track banner.id) {
                      <div class="rounded-2xl overflow-hidden bg-gray-100 shadow-lg" style="aspect-ratio:2.5/1">
                        @if (banner.imageUrl) {
                          <img [src]="banner.imageUrl" [alt]="banner.title" class="w-full h-full object-cover" loading="lazy" />
                        }
                        @if (banner.title || banner.ctaText) {
                          <div class="absolute inset-0 flex items-end p-8 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                            <div>
                              @if (banner.title) { <h3 class="text-white text-3xl font-bold mb-2">{{ banner.title }}</h3> }
                              @if (banner.ctaText && banner.linkValue) {
                                <a [href]="banner.linkValue" class="inline-flex bg-white/90 text-gray-900 font-semibold px-5 py-2 rounded-lg hover:bg-white transition text-sm">{{ banner.ctaText }}</a>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    }
                  }
                </div>
              }

              @case ('FeaturedItems') {
                <section>
                  <div class="flex items-end justify-between mb-6">
                    <div>
                      <h2 class="text-2xl font-bold text-gray-900">{{ section.title }}</h2>
                      <p class="text-gray-500 text-sm mt-0.5">{{ i18n.t('store.handPicked') }}</p>
                    </div>
                    <a routerLink="/catalog" class="text-sm font-semibold text-[color:var(--color-primary)] hover:underline">{{ i18n.t('store.viewAll') }} &rarr;</a>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    @for (item of featuredItems(); track item.id) {
                      <app-item-card [item]="item" />
                    }
                  </div>
                </section>
              }

              @case ('CategoriesShowcase') {
                <section>
                  <h2 class="text-2xl font-bold text-gray-900 mb-1">{{ section.title }}</h2>
                  <p class="text-gray-500 text-sm mb-6">{{ i18n.t('store.browseByCategory') }}</p>
                  <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                    @for (cat of section.items; track cat.id) {
                      <a [routerLink]="['/category', cat.linkValue]"
                         class="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center gap-3 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        @if (cat.imageUrl) {
                          <img [src]="cat.imageUrl" [alt]="cat.title" class="w-16 h-16 object-contain" loading="lazy" />
                        } @else {
                          <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                          </div>
                        }
                        <span class="font-semibold text-sm text-gray-900">{{ cat.title }}</span>
                      </a>
                    }
                  </div>
                </section>
              }

              @case ('BrandsCarousel') {
                <section>
                  <h2 class="text-2xl font-bold text-gray-900 mb-1">{{ section.title }}</h2>
                  <p class="text-gray-500 text-sm mb-6">{{ i18n.t('store.topBrands') }}</p>
                  <div class="grid grid-cols-3 md:grid-cols-6 gap-4">
                    @for (brand of section.items; track brand.id) {
                      <a [routerLink]="['/brand', brand.linkValue]"
                         class="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-center min-h-24 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                        @if (brand.imageUrl) {
                          <img [src]="brand.imageUrl" [alt]="brand.title" class="max-w-full max-h-14 object-contain" loading="lazy" />
                        } @else {
                          <span class="font-bold text-center text-sm text-gray-700">{{ brand.title }}</span>
                        }
                      </a>
                    }
                  </div>
                </section>
              }

              @case ('Testimonials') {
                <section>
                  <h2 class="text-2xl font-bold text-gray-900 mb-6">{{ section.title }}</h2>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                    @for (t of section.items; track t.id) {
                      <div class="bg-white rounded-2xl border border-gray-100 p-6 relative">
                        <div class="text-[color:var(--color-accent)] text-3xl font-serif leading-none mb-3">&ldquo;</div>
                        <p class="text-sm text-gray-600 italic mb-4">{{ t.title }}</p>
                        @if (t.ctaText) {
                          <p class="text-xs font-bold text-gray-900">&mdash; {{ t.ctaText }}</p>
                        }
                        <div class="flex gap-0.5 mt-3">
                          @for (i of [1,2,3,4,5]; track i) {
                            <span class="text-amber-400 text-sm">&#9733;</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </section>
              }

              @case ('NewArrivals') {
                <section>
                  <div class="flex items-end justify-between mb-6">
                    <div>
                      <h2 class="text-2xl font-bold text-gray-900">{{ section.title }}</h2>
                      <p class="text-gray-500 text-sm mt-0.5">{{ i18n.t('store.latestProducts') }}</p>
                    </div>
                    <a routerLink="/catalog" class="text-sm font-semibold text-[color:var(--color-primary)] hover:underline">{{ i18n.t('store.viewAll') }} &rarr;</a>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    @for (item of newArrivals(); track item.id) {
                      <app-item-card [item]="item" />
                    }
                  </div>
                </section>
              }
            }
          }
        }

        <!-- CTA Block -->
        <div class="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[color:var(--color-secondary)] to-[color:var(--color-primary)] p-12 md:p-16 text-center shadow-xl">
          <h2 class="text-3xl md:text-4xl font-extrabold text-white mb-4">{{ i18n.t('store.notFound') }}</h2>
          <p class="text-white/70 mb-8 text-lg max-w-md mx-auto">{{ i18n.t('store.browseAll') }}</p>
          <a routerLink="/catalog" class="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition shadow-lg text-sm">
            {{ i18n.t('store.exploreCatalog') }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
          </a>
        </div>
      </div>
    }
  `,
  animations: [],
})
export class HomeComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly settingsStore = inject(SettingsStore);
  readonly i18n = inject(I18nService);

  readonly sections = signal<HomeSection[]>([]);
  readonly featuredItems = signal<Item[]>([]);
  readonly newArrivals = signal<Item[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.api.get<HomeSection[]>('/Public/sections').subscribe({
      next: data => {
        this.sections.set(data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // Load featured items
    this.api.get<{ items: Item[] }>('/Public/items', { pageSize: 8, isFeatured: true }).subscribe({
      next: data => this.featuredItems.set(data.items || []),
    });

    // Load new arrivals
    this.api.get<{ items: Item[] }>('/Public/items', { pageSize: 8, sortBy: 'createdAt', sortDescending: true }).subscribe({
      next: data => this.newArrivals.set(data.items || []),
    });
  }
}
