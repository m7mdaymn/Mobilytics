import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { HomeSection, Item } from '../../../core/models/item.models';
import { SettingsStore } from '../../../core/stores/settings.store';
import { ItemCardComponent } from '../../../shared/components/item-card/item-card.component';
import { ThemeSwitcherComponent } from '../../../shared/components/theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ItemCardComponent, ThemeSwitcherComponent],
  template: `
    @if (loading()) {
      <div class="max-w-7xl mx-auto px-4 py-8 space-y-8">
        @for (i of [1,2,3]; track i) {
          <div>
            <div class="skeleton h-6 w-48 mb-4"></div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              @for (j of [1,2,3,4]; track j) {
                <div class="skeleton h-64 rounded-xl"></div>
              }
            </div>
          </div>
        }
      </div>
    } @else {
      <!-- Hero Banner + Theme Switcher -->
      <div class="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 py-3">
        <div class="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">{{ settingsStore.storeName() }}</h1>
            <p class="text-sm text-gray-600 dark:text-gray-400">Premium electronics & accessories</p>
          </div>
          <app-theme-switcher />
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 py-10 space-y-16">
        <!-- Featured Hero Section -->
        <div class="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-900 dark:to-blue-950 py-16 px-8 text-white shadow-xl">
          <div class="max-w-2xl">
            <h2 class="text-4xl md:text-5xl font-bold mb-4">Welcome to {{ settingsStore.storeName() }}</h2>
            <p class="text-lg text-blue-100 mb-6">Discover premium electronics and accessories at unbeatable prices</p>
            <a routerLink="/catalog" class="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition">
              Shop Now →
            </a>
          </div>
        </div>

        <!-- Main Content -->
        @for (section of sections(); track section.id) {
          @if (section.isActive) {
            <section [@fadeIn]>
              @switch (section.type) {
                @case ('BannerSlider') {
                  <div class="relative overflow-hidden rounded-2xl">
                    @if (section.items.length > 0) {
                      <div class="splide-container">
                        @for (banner of section.items; track banner.id) {
                          <div class="hero-banner rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-lg" [style.aspect-ratio]="'2.5/1'">
                            @if (banner.imageUrl) {
                              <img [src]="banner.imageUrl" [alt]="banner.title" class="w-full h-full object-cover" loading="lazy" />
                            }
                            @if (banner.title || banner.ctaText) {
                              <div class="absolute inset-0 flex items-end p-8 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                                <div>
                                  @if (banner.title) {
                                    <h3 class="text-white text-3xl font-bold mb-2">{{ banner.title }}</h3>
                                  }
                                  @if (banner.ctaText && banner.linkValue) {
                                    <a [href]="banner.linkValue" class="inline-flex bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg transition">
                                      {{ banner.ctaText }}
                                    </a>
                                  }
                                </div>
                              </div>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                }

                @case ('FeaturedItems') {
                  <div>
                    <div class="flex items-center justify-between mb-6">
                      <div>
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">{{ section.title }}</h2>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">Hand-picked products just for you</p>
                      </div>
                      <a routerLink="/catalog" class="text-sm text-[color:var(--color-primary)] hover:underline font-semibold">View all →</a>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4" [style.gap]="'var(--card-gap, 1.5rem)'">
                      @for (item of featuredItems(); track item.id) {
                        <app-item-card [item]="item" />
                      }
                    </div>
                  </div>
                }

                @case ('CategoriesShowcase') {
                  <div>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">{{ section.title }}</h2>
                    <p class="text-gray-600 dark:text-gray-400 text-sm mb-6">Browse by category</p>
                    <div class="grid grid-cols-2 md:grid-cols-5" [style.gap]="'1.5rem'">
                      @for (cat of section.items; track cat.id) {
                        <a [routerLink]="['/category', cat.linkValue]"
                           class="card p-6 flex flex-col items-center gap-3 text-center hover:shadow-lg hover:scale-105 transition-all duration-300">
                          @if (cat.imageUrl) {
                            <img [src]="cat.imageUrl" [alt]="cat.title" class="w-20 h-20 object-contain" loading="lazy" />
                          }
                          <span class="font-semibold text-slate-900 dark:text-white">{{ cat.title }}</span>
                        </a>
                      }
                    </div>
                  </div>
                }

                @case ('BrandsCarousel') {
                  <div>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">{{ section.title }}</h2>
                    <p class="text-gray-600 dark:text-gray-400 text-sm mb-6">Top brands available</p>
                    <div class="grid grid-cols-3 md:grid-cols-6 gap-4">
                      @for (brand of section.items; track brand.id) {
                        <a [routerLink]="['/brand', brand.linkValue]"
                           class="card p-4 flex items-center justify-center min-h-24 hover:shadow-md hover:scale-105 transition-all duration-300">
                          @if (brand.imageUrl) {
                            <img [src]="brand.imageUrl" [alt]="brand.title" class="max-w-full max-h-16 object-contain" loading="lazy" />
                          } @else {
                            <span class="font-semibold text-center text-sm">{{ brand.title }}</span>
                          }
                        </a>
                      }
                    </div>
                  </div>
                }

                @case ('Testimonials') {
                  <div>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">{{ section.title }}</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                      @for (t of section.items; track t.id) {
                        <div class="card p-6 border-l-4 border-[color:var(--color-primary)]">
                          <div class="flex gap-1 mb-3">
                            @for (i of [1,2,3,4,5]; track i) {
                              <span class="text-yellow-400">★</span>
                            }
                          </div>
                          <p class="text-sm italic text-gray-700 dark:text-gray-300 mb-3">"{{ t.title }}"</p>
                          @if (t.ctaText) {
                            <p class="text-xs font-semibold text-gray-600 dark:text-gray-400">— {{ t.ctaText }}</p>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }

                @case ('NewArrivals') {
                  <div>
                    <div class="flex items-center justify-between mb-6">
                      <div>
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">{{ section.title }}</h2>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">Latest products in stock</p>
                      </div>
                      <a routerLink="/catalog" class="text-sm text-[color:var(--color-primary)] hover:underline font-semibold">View all →</a>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4" [style.gap]="'var(--card-gap, 1.5rem)'">
                      @for (item of newArrivals(); track item.id) {
                        <app-item-card [item]="item" />
                      }
                    </div>
                  </div>
                }
              }
            </section>
          }
        }

        <!-- Call to Action -->
        <div class="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-2xl p-12 text-white text-center shadow-xl">
          <h2 class="text-3xl font-bold mb-4">Didn't find what you're looking for?</h2>
          <p class="text-gray-300 mb-6 text-lg">Browse our complete collection of products</p>
          <a routerLink="/catalog" class="inline-flex bg-[color:var(--color-primary)] hover:opacity-90 text-white font-semibold px-8 py-3 rounded-lg transition">
            Explore Full Catalog
          </a>
        </div>
      </div>
    }

    <style>
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    </style>
  `,
  animations: [],
})
export class HomeComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly settingsStore = inject(SettingsStore);

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
