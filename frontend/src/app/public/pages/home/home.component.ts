import { Component, inject, OnInit, OnDestroy, AfterViewInit, signal, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Item, Brand, Category } from '../../../core/models/item.models';
import { PaginatedList } from '../../../core/models/api.models';
import { SettingsStore, HeroBanner, FaqItem } from '../../../core/stores/settings.store';
import { TenantService } from '../../../core/services/tenant.service';
import { ItemCardComponent } from '../../../shared/components/item-card/item-card.component';
import { I18nService } from '../../../core/services/i18n.service';
import { resolveImageUrl } from '../../../core/utils/image.utils';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ItemCardComponent],
  styleUrl: './home.component.css',
  template: `
    <!-- ═══ SKELETON LOADING ═══ -->
    @if (loading()) {
      <div class="home-skeleton">
        <div class="skeleton hero-skel"></div>
        @for (i of [1,2]; track i) {
          <div class="skel-section">
            <div class="skeleton skel-title"></div>
            <div class="skel-grid">
              @for (j of [1,2,3,4]; track j) {
                <div class="skeleton skel-card"></div>
              }
            </div>
          </div>
        }
      </div>
    } @else {

    <!-- ═══════════════════════════════════════════════
         PREMIUM APPLE-STYLE STOREFRONT HOME
         ═══════════════════════════════════════════════ -->
    <div class="home-root">

      <!-- ═══ SECTION 1: HERO — CINEMATIC FULL-BLEED ═══ -->
      @if (heroBanners().length > 0) {
        <section class="hero-cinema">
          <div class="hero-orb hero-orb--primary"></div>
          <div class="hero-orb hero-orb--accent"></div>
          <div class="hero-grain"></div>

          @for (banner of heroBanners(); track $index; let i = $index) {
            <div class="hero-slide"
              [class.active]="activeSlide() === i"
              [class.prev]="activeSlide() !== i">
              @if (banner.imageUrl) {
                <img [src]="resolveImg(banner.imageUrl)" [alt]="banner.title"
                  class="hero-slide__img" loading="lazy" />
              }
              <div class="hero-slide__gradient"></div>
              <div class="hero-slide__content">
                <div class="hero-slide__inner reveal-hero">
                  @if (banner.title) {
                    <h1 class="hero-slide__title">{{ banner.title }}</h1>
                  }
                  @if (banner.subtitle) {
                    <p class="hero-slide__sub">{{ banner.subtitle }}</p>
                  }
                  @if (banner.linkUrl) {
                    <a [routerLink]="banner.linkUrl" class="hero-cta">
                      {{ i18n.t('store.shopNow') }}
                      <svg class="hero-cta__arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                    </a>
                  }
                </div>
              </div>
            </div>
          }

          @if (heroBanners().length > 1) {
            <div class="hero-nav">
              <button (click)="prevSlide()" class="hero-nav__btn" aria-label="Previous">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <div class="hero-dots">
                @for (banner of heroBanners(); track $index; let i = $index) {
                  <button (click)="goToSlide(i)" class="hero-dot" [class.active]="activeSlide() === i"
                    [attr.aria-label]="'Slide ' + (i + 1)"></button>
                }
              </div>
              <button (click)="nextSlide()" class="hero-nav__btn" aria-label="Next">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          }
        </section>
      } @else {
        <section class="hero-cinema hero-cinema--fallback">
          <div class="hero-orb hero-orb--primary"></div>
          <div class="hero-orb hero-orb--accent"></div>
          <div class="hero-grain"></div>
          @if (settingsStore.settings()?.bannerUrl) {
            <img [src]="resolveImg(settingsStore.settings()!.bannerUrl!)" alt="" class="hero-slide__img" style="opacity: 0.2" />
          }
          <div class="hero-slide__content" style="position: relative; z-index: 10">
            <div class="hero-slide__inner reveal-hero">
              <p class="hero-eyebrow">{{ i18n.t('store.welcome') || 'Welcome to' }}</p>
              <h1 class="hero-slide__title">{{ settingsStore.storeName() }}</h1>
              <p class="hero-slide__sub">{{ i18n.t('store.browseAll') || 'Discover our curated collection' }}</p>
              <a [routerLink]="tenantService.storeUrl() + '/catalog'" class="hero-cta">
                {{ i18n.t('store.shopNow') }}
                <svg class="hero-cta__arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </a>
            </div>
          </div>
        </section>
      }

      <!-- ═══ SECTION 2: SHOP BY CATEGORY — 3D GLASS CARDS ═══ -->
      @if (categories().length > 0) {
        <section class="section reveal-section">
          <div class="section__header">
            <div>
              <p class="section__eyebrow">{{ i18n.t('store.browseByCategory') || 'Categories' }}</p>
              <h2 class="section__title">Shop by Category</h2>
            </div>
            <div class="section__arrows">
              <button (click)="scrollCategories(-1)" class="arrow-btn" aria-label="Scroll left">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <button (click)="scrollCategories(1)" class="arrow-btn" aria-label="Scroll right">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
          <div #catScroll class="cat-scroll">
            @for (cat of categories(); track cat.id; let idx = $index) {
              <a [routerLink]="tenantService.storeUrl() + '/catalog'" [queryParams]="{categorySlug: cat.slug}"
                class="cat-card reveal-item" [style.animation-delay.ms]="idx * 60">
                <div class="cat-card__icon-wrap">
                  @if (cat.imageUrl) {
                    <img [src]="resolveImg(cat.imageUrl)" [alt]="cat.name" class="cat-card__img" loading="lazy" />
                  } @else {
                    <div class="cat-card__placeholder">
                      <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                    </div>
                  }
                </div>
                <span class="cat-card__name">{{ cat.name }}</span>
                @if (cat.itemCount) {
                  <span class="cat-card__count">{{ cat.itemCount }} items</span>
                }
              </a>
            }
          </div>
        </section>
      }

      <!-- ═══ SECTION 3: FEATURED & LATEST — BENTO LAYOUT ═══ -->
      @if (featuredItems().length > 0) {
        <section class="section reveal-section">
          <div class="section__header">
            <div>
              <p class="section__eyebrow">{{ i18n.t('store.handPicked') || 'Curated for you' }}</p>
              <h2 class="section__title">{{ i18n.t('store.featured') || 'Latest & Featured' }}</h2>
            </div>
            <a [routerLink]="tenantService.storeUrl() + '/catalog'" [queryParams]="{isFeatured: true}" class="section__link">
              {{ i18n.t('store.viewAll') || 'View All' }}
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </a>
          </div>
          @if (featuredItems().length >= 5) {
            <div class="bento-grid">
              <div class="bento-hero">
                <app-item-card [item]="featuredItems()[0]" [large]="true" />
              </div>
              @for (item of featuredItems().slice(1,5); track item.id) {
                <app-item-card [item]="item" class="reveal-item" />
              }
            </div>
            @if (featuredItems().length > 5) {
              <div class="items-grid mt-6">
                @for (item of featuredItems().slice(5); track item.id) {
                  <app-item-card [item]="item" class="reveal-item" />
                }
              </div>
            }
          } @else {
            <div class="items-grid">
              @for (item of featuredItems(); track item.id) {
                <app-item-card [item]="item" class="reveal-item" />
              }
            </div>
          }
        </section>
      }

      <!-- ═══ SECTION 4: BRANDS — INFINITE MARQUEE ═══ -->
      @if (brands().length > 0) {
        <section class="section section--brands reveal-section">
          <div class="section__header section__header--center">
            <div>
              <p class="section__eyebrow">{{ i18n.t('store.topBrands') || 'Trusted Brands' }}</p>
              <h2 class="section__title">Shop by Brand</h2>
            </div>
          </div>
          @if (brands().length >= 5) {
            <div class="marquee-wrap">
              <div class="marquee-fade marquee-fade--start"></div>
              <div class="marquee-track">
                @for (brand of brands(); track brand.id) {
                  <a [routerLink]="tenantService.storeUrl() + '/catalog'" [queryParams]="{brandSlug: brand.slug}" class="brand-pill">
                    @if (brand.logoUrl) {
                      <img [src]="resolveImg(brand.logoUrl)" [alt]="brand.name" class="brand-pill__img" loading="lazy" />
                    } @else {
                      <span class="brand-pill__text">{{ brand.name }}</span>
                    }
                  </a>
                }
                @for (brand of brands(); track 'dup-' + brand.id) {
                  <a [routerLink]="tenantService.storeUrl() + '/catalog'" [queryParams]="{brandSlug: brand.slug}" class="brand-pill">
                    @if (brand.logoUrl) {
                      <img [src]="resolveImg(brand.logoUrl)" [alt]="brand.name" class="brand-pill__img" loading="lazy" />
                    } @else {
                      <span class="brand-pill__text">{{ brand.name }}</span>
                    }
                  </a>
                }
              </div>
              <div class="marquee-fade marquee-fade--end"></div>
            </div>
          } @else {
            <div class="brand-grid">
              @for (brand of brands(); track brand.id) {
                <a [routerLink]="tenantService.storeUrl() + '/catalog'" [queryParams]="{brandSlug: brand.slug}" class="brand-pill brand-pill--static">
                  @if (brand.logoUrl) {
                    <img [src]="resolveImg(brand.logoUrl)" [alt]="brand.name" class="brand-pill__img" loading="lazy" />
                  } @else {
                    <span class="brand-pill__text">{{ brand.name }}</span>
                  }
                </a>
              }
            </div>
          }
        </section>
      }

      <!-- ═══ SECTION 5: INSTALLMENT OFFERS — FROSTED CARD ═══ -->
      @if (installmentItems().length > 0) {
        <section class="section section--promo reveal-section">
          <div class="promo-card">
            <div class="promo-card__glow"></div>
            <div class="promo-card__inner">
              <div class="section__header">
                <div>
                  <div class="promo-badge">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                    Buy Now, Pay Later
                  </div>
                  <h2 class="section__title">{{ i18n.t('store.installmentAvailable') || 'Installment Offers' }}</h2>
                  <p class="section__subtitle">Split your payments into easy monthly installments</p>
                </div>
                <a [routerLink]="tenantService.storeUrl() + '/catalog'" [queryParams]="{installmentAvailable: true}" class="section__link">
                  {{ i18n.t('store.viewAll') || 'View All' }}
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                </a>
              </div>
              <div class="items-grid">
                @for (item of installmentItems(); track item.id) {
                  <app-item-card [item]="item" class="reveal-item" />
                }
              </div>
            </div>
          </div>
        </section>
      }

      <!-- ═══ SECTION 6: BEST SELLERS ═══ -->
      @if (bestSellers().length > 0) {
        <section class="section reveal-section">
          <div class="section__header">
            <div>
              <div class="trending-badge">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Trending
              </div>
              <h2 class="section__title">{{ i18n.t('store.bestSellers') || 'Best Sellers' }}</h2>
              <p class="section__subtitle">Most popular this month</p>
            </div>
            <a [routerLink]="tenantService.storeUrl() + '/catalog'" class="section__link">
              {{ i18n.t('store.viewAll') || 'View All' }}
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </a>
          </div>
          <div class="items-grid">
            @for (item of bestSellers(); track item.id) {
              <app-item-card [item]="item" class="reveal-item" />
            }
          </div>
        </section>
      }

      <!-- ═══ SECTION 7: TRUST / WHY CHOOSE US — 3D DEPTH CARDS ═══ -->
      @if (settingsStore.trustBadges().length > 0) {
        <section class="section section--trust reveal-section">
          <div class="trust-bg">
            <div class="trust-bg__line trust-bg__line--1"></div>
            <div class="trust-bg__line trust-bg__line--2"></div>
            <div class="trust-bg__line trust-bg__line--3"></div>
          </div>
          <div class="section__header section__header--center">
            <div>
              <p class="section__eyebrow">{{ i18n.t('store.whyChooseUs') || 'Why Choose Us' }}</p>
              <h2 class="section__title">{{ settingsStore.storeName() }}</h2>
              <p class="section__subtitle">{{ i18n.t('store.trustedExperience') || 'Your trusted shopping experience' }}</p>
            </div>
          </div>
          <div class="trust-grid">
            @for (badge of settingsStore.trustBadges(); track badge; let i = $index) {
              <div class="trust-card reveal-item" [style.animation-delay.ms]="i * 80">
                <div class="trust-card__icon">
                  @switch (i % 6) {
                    @case (0) {
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    }
                    @case (1) {
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    }
                    @case (2) {
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7"/></svg>
                    }
                    @case (3) {
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    }
                    @case (4) {
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                    }
                    @case (5) {
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                    }
                  }
                </div>
                <h3 class="trust-card__label">{{ badge }}</h3>
              </div>
            }
          </div>
        </section>
      }

      <!-- ═══ SECTION 8: TESTIMONIALS — GLASS CARDS ═══ -->
      @if (settingsStore.testimonials().length > 0) {
        <section class="section reveal-section">
          <div class="section__header section__header--center">
            <div>
              <p class="section__eyebrow">{{ i18n.t('store.testimonials') || 'Testimonials' }}</p>
              <h2 class="section__title">What Our Customers Say</h2>
              <p class="section__subtitle">Real reviews from real customers</p>
            </div>
          </div>
          <div class="testimonial-grid">
            @for (t of settingsStore.testimonials(); track $index; let i = $index) {
              <div class="testimonial-card reveal-item" [style.animation-delay.ms]="i * 100">
                <div class="testimonial-card__stars">
                  @for (star of [1,2,3,4,5]; track star) {
                    <span [class]="star <= t.rating ? 'star--filled' : 'star--empty'">&#9733;</span>
                  }
                </div>
                <p class="testimonial-card__text">{{ t.text }}</p>
                <div class="testimonial-card__author">
                  @if (t.imageUrl) {
                    <img [src]="resolveImg(t.imageUrl)" [alt]="t.name" class="testimonial-card__avatar" />
                  } @else {
                    <div class="testimonial-card__avatar-placeholder">{{ t.name.charAt(0) }}</div>
                  }
                  <span class="testimonial-card__name">{{ t.name }}</span>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- ═══ SECTION 9: FAQ — CLEAN ACCORDION ═══ -->
      @if (settingsStore.faq().length > 0) {
        <section class="section reveal-section">
          <div class="section__header section__header--center">
            <div>
              <p class="section__eyebrow">{{ i18n.t('store.faq') || 'FAQ' }}</p>
              <h2 class="section__title">Frequently Asked Questions</h2>
              <p class="section__subtitle">Everything you need to know</p>
            </div>
          </div>
          <div class="faq-list">
            @for (item of settingsStore.faq(); track $index; let idx = $index) {
              <div class="faq-item" [class.faq-item--open]="openFaq() === idx">
                <button (click)="toggleFaq(idx)" class="faq-item__trigger">
                  <span class="faq-item__q">{{ item.question }}</span>
                  <div class="faq-item__icon" [class.open]="openFaq() === idx">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6"/></svg>
                  </div>
                </button>
                <div class="faq-item__answer" [class.open]="openFaq() === idx">
                  <div class="faq-item__answer-inner">
                    {{ item.answer }}
                  </div>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- ═══ SECTION 10: CTA — GRADIENT DEPTH ═══ -->
      <section class="cta-section reveal-section">
        <div class="cta-card">
          <div class="cta-card__bg"></div>
          <div class="cta-card__noise"></div>
          <div class="cta-card__content">
            <h2 class="cta-card__title">{{ i18n.t('store.notFound') || "Can't find what you need?" }}</h2>
            <p class="cta-card__sub">{{ i18n.t('store.browseAll') || 'Browse our full catalog' }}</p>
            <a [routerLink]="tenantService.storeUrl() + '/catalog'" class="cta-card__btn">
              {{ i18n.t('store.exploreCatalog') || 'Explore Catalog' }}
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </a>
          </div>
        </div>
      </section>

    </div>
    }
  `,
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly api = inject(ApiService);
  private readonly el = inject(ElementRef);
  readonly settingsStore = inject(SettingsStore);
  readonly tenantService = inject(TenantService);
  readonly i18n = inject(I18nService);
  readonly resolveImg = resolveImageUrl;

  @ViewChild('catScroll') catScrollRef?: ElementRef<HTMLElement>;

  readonly loading = signal(true);
  readonly categories = signal<Category[]>([]);
  readonly brands = signal<Brand[]>([]);
  readonly featuredItems = signal<Item[]>([]);
  readonly bestSellers = signal<Item[]>([]);
  readonly installmentItems = signal<Item[]>([]);
  readonly heroBanners = signal<HeroBanner[]>([]);
  readonly activeSlide = signal(0);
  readonly openFaq = signal<number | null>(null);

  private slideInterval: ReturnType<typeof setInterval> | null = null;
  private observer: IntersectionObserver | null = null;
  private loadCounter = 0;
  private readonly totalLoads = 5;

  ngOnInit(): void {
    const banners = this.settingsStore.heroBanners();
    this.heroBanners.set(banners);
    if (banners.length > 1) {
      this.startAutoSlide();
    }

    this.api.get<Category[]>('/Public/categories').subscribe({
      next: data => { this.categories.set(data || []); this.checkLoaded(); },
      error: () => this.checkLoaded(),
    });

    this.api.get<PaginatedList<Item>>('/Public/items', { pageSize: 8, isFeatured: true } as any).subscribe({
      next: data => { this.featuredItems.set(data?.items || []); this.checkLoaded(); },
      error: () => this.checkLoaded(),
    });

    this.api.get<Item[]>('/Public/items/best-sellers').subscribe({
      next: data => { this.bestSellers.set(data || []); this.checkLoaded(); },
      error: () => this.checkLoaded(),
    });

    this.api.get<PaginatedList<Item>>('/Public/items', { pageSize: 8, installmentAvailable: true } as any).subscribe({
      next: data => { this.installmentItems.set(data?.items || []); this.checkLoaded(); },
      error: () => this.checkLoaded(),
    });

    this.api.get<Brand[]>('/Public/brands').subscribe({
      next: data => { this.brands.set(data || []); this.checkLoaded(); },
      error: () => this.checkLoaded(),
    });
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            this.observer?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: '0px 0px -60px 0px' }
    );
    setTimeout(() => this.observeAll(), 100);
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
    this.observer?.disconnect();
  }

  goToSlide(index: number): void {
    this.activeSlide.set(index);
    this.restartAutoSlide();
  }

  nextSlide(): void {
    const total = this.heroBanners().length;
    if (total === 0) return;
    this.activeSlide.set((this.activeSlide() + 1) % total);
    this.restartAutoSlide();
  }

  prevSlide(): void {
    const total = this.heroBanners().length;
    if (total === 0) return;
    this.activeSlide.set((this.activeSlide() - 1 + total) % total);
    this.restartAutoSlide();
  }

  scrollCategories(direction: number): void {
    const el = this.catScrollRef?.nativeElement;
    if (el) el.scrollBy({ left: direction * 300, behavior: 'smooth' });
  }

  toggleFaq(index: number): void {
    this.openFaq.set(this.openFaq() === index ? null : index);
  }

  private startAutoSlide(): void {
    this.slideInterval = setInterval(() => {
      const total = this.heroBanners().length;
      if (total > 1) this.activeSlide.set((this.activeSlide() + 1) % total);
    }, 5000);
  }

  private stopAutoSlide(): void {
    if (this.slideInterval) { clearInterval(this.slideInterval); this.slideInterval = null; }
  }

  private restartAutoSlide(): void {
    this.stopAutoSlide();
    if (this.heroBanners().length > 1) this.startAutoSlide();
  }

  private checkLoaded(): void {
    this.loadCounter++;
    if (this.loadCounter >= this.totalLoads) {
      this.loading.set(false);
      setTimeout(() => this.observeAll(), 50);
    }
  }

  private observeAll(): void {
    const els = this.el.nativeElement.querySelectorAll('.reveal-section, .reveal-item');
    els.forEach((el: Element) => this.observer?.observe(el));
  }
}
