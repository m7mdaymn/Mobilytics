import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminStoreSettings, SocialLinks, PwaSettings, WhatsAppTemplates, THEME_PRESETS } from '../../../core/models/settings.models';
import { SettingsStore, HeroBanner, Testimonial, FaqItem } from '../../../core/stores/settings.store';
import { I18nService } from '../../../core/services/i18n.service';
import { resolveImageUrl } from '../../../core/utils/image.utils';

interface StorePolicies {
  returnPolicy: string;
  warrantyPolicy: string;
  privacyPolicy: string;
}

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ i18n.t('settings.title') }}</h1>

      <!-- Tabs (scrollable) -->
      <div class="flex gap-1 border-b border-gray-200 overflow-x-auto scrollbar-hide">
        @for (tab of tabs; track tab.key) {
          <button (click)="activeTab.set(tab.key)"
            class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap"
            [class]="activeTab() === tab.key
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'">
            {{ i18n.t(tab.label) }}
          </button>
        }
      </div>

      @if (settings(); as s) {
        <!-- Store Info -->
        @if (activeTab() === 'info') {
          <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('settings.storeInfo') }}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.storeName') }}</label>
                <input [(ngModel)]="s.storeName" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.currency') }}</label>
                <input [(ngModel)]="s.currencyCode" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" [placeholder]="i18n.t('settings.currencyPlaceholder')" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.phone') }}</label>
                <input [(ngModel)]="s.phoneNumber" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.whatsapp') }}</label>
                <input [(ngModel)]="s.whatsAppNumber" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" [placeholder]="i18n.t('settings.whatsappPlaceholder')" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.logo') }}</label>
                <input [(ngModel)]="s.logoUrl" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" placeholder="https://..." />
                @if (s.logoUrl) {
                  <img [src]="resolveImg(s.logoUrl)" alt="Logo" class="mt-2 h-16 object-contain rounded" />
                }
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.banner') }}</label>
                <input [(ngModel)]="s.bannerUrl" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" placeholder="https://..." />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.headerNotice') }}</label>
                <input [(ngModel)]="s.headerNoticeText" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" [placeholder]="i18n.t('settings.headerNoticePlaceholder')" />
                <p class="text-xs text-gray-400 mt-1">{{ i18n.t('settings.headerNoticeHint') }}</p>
              </div>
            </div>
            <button (click)="saveGeneral()" [disabled]="saving()" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
              {{ saving() ? i18n.t('common.saving') : i18n.t('common.save') }}
            </button>
          </div>
        }

        <!-- Theme -->
        @if (activeTab() === 'theme') {
          <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('settings.theme') }}</h2>
            <p class="text-sm text-gray-500">{{ i18n.t('settings.themeHint') }}</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              @for (preset of themePresets; track preset.id) {
                <button (click)="selectPreset(preset.id)"
                  class="relative rounded-2xl border-2 p-3 transition-all hover:shadow-md text-start group"
                  [class]="selectedPreset() === preset.id
                    ? 'border-gray-900 shadow-lg ring-2 ring-gray-900/20'
                    : 'border-gray-200 hover:border-gray-400'">
                  @if (selectedPreset() === preset.id) {
                    <div class="absolute top-2 end-2 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                      <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                    </div>
                  }
                  <!-- Mini storefront preview -->
                  <div class="rounded-lg overflow-hidden border border-gray-100 mb-2.5">
                    <!-- Header bar -->
                    <div [style.background-color]="preset.primary" class="h-5 flex items-center px-2 gap-1">
                      <div class="w-2 h-2 rounded-full bg-white/30"></div>
                      <div class="flex-1 h-1.5 bg-white/20 rounded-full mx-1"></div>
                      <div class="w-3 h-1.5 bg-white/20 rounded-full"></div>
                    </div>
                    <!-- Nav bar -->
                    <div [style.background-color]="preset.secondary" class="h-3 flex items-center justify-center gap-2 px-2">
                      <div class="w-4 h-1 bg-white/20 rounded-full"></div>
                      <div class="w-5 h-1 bg-white/20 rounded-full"></div>
                      <div class="w-4 h-1 bg-white/20 rounded-full"></div>
                    </div>
                    <!-- Content area -->
                    <div class="bg-gray-50 p-2 space-y-1.5">
                      <div [style.background-color]="preset.accent" class="h-6 rounded opacity-30"></div>
                      <div class="grid grid-cols-3 gap-1">
                        <div class="bg-white h-5 rounded shadow-sm border border-gray-100"></div>
                        <div class="bg-white h-5 rounded shadow-sm border border-gray-100"></div>
                        <div class="bg-white h-5 rounded shadow-sm border border-gray-100"></div>
                      </div>
                    </div>
                    <!-- Footer -->
                    <div [style.background-color]="preset.secondary" class="h-3"></div>
                  </div>
                  <!-- Color dots -->
                  <div class="flex items-center gap-1.5 mb-1">
                    <div [style.background-color]="preset.primary" class="w-4 h-4 rounded-full ring-1 ring-black/10"></div>
                    <div [style.background-color]="preset.secondary" class="w-4 h-4 rounded-full ring-1 ring-black/10"></div>
                    <div [style.background-color]="preset.accent" class="w-4 h-4 rounded-full ring-1 ring-black/10"></div>
                  </div>
                  <p class="text-xs font-bold text-gray-900">{{ preset.name }}</p>
                  <p class="text-[10px] text-gray-400 leading-tight">{{ preset.description }}</p>
                </button>
              }
            </div>
            <button (click)="saveTheme()" [disabled]="saving()" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
              {{ saving() ? i18n.t('common.saving') : i18n.t('common.save') }}
            </button>
          </div>
        }

        <!-- Hero Banners -->
        @if (activeTab() === 'hero') {
          <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('settings.heroBanners') }}</h2>
                <p class="text-sm text-gray-500 mt-1">{{ i18n.t('settings.heroHint') }}</p>
              </div>
              <button (click)="addBanner()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">
                {{ i18n.t('settings.addSlide') }}
              </button>
            </div>

            @if (heroBanners.length === 0) {
              <div class="text-center py-8 text-gray-400">
                <p>{{ i18n.t('settings.noHeroBanners') }}</p>
              </div>
            }

            @for (banner of heroBanners; track $index; let i = $index) {
              <div class="border border-gray-200 rounded-xl p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-gray-600">{{ i18n.t('settings.slide') }} {{ i + 1 }}</span>
                  <button (click)="removeBanner(i)" class="text-red-500 hover:text-red-700 text-sm font-medium">{{ i18n.t('common.remove') }}</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">{{ i18n.t('settings.heroTitle') }}</label>
                    <input [(ngModel)]="banner.title" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" [placeholder]="i18n.t('settings.heroTitlePlaceholder')" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">{{ i18n.t('settings.heroSubtitle') }}</label>
                    <input [(ngModel)]="banner.subtitle" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" [placeholder]="i18n.t('settings.heroSubtitlePlaceholder')" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">{{ i18n.t('settings.imageUrl') }}</label>
                    <input [(ngModel)]="banner.imageUrl" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" placeholder="https://..." />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">{{ i18n.t('settings.heroCtaLink') }}</label>
                    <input [(ngModel)]="banner.linkUrl" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" [placeholder]="i18n.t('settings.heroCtaLinkPlaceholder')" />
                  </div>
                </div>
                @if (banner.imageUrl) {
                  <img [src]="banner.imageUrl" alt="Banner preview" class="h-24 w-full object-cover rounded-lg mt-2" />
                }
              </div>
            }

            <button (click)="saveHeroBanners()" [disabled]="saving()" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
              {{ saving() ? i18n.t('common.saving') : i18n.t('common.save') }}
            </button>
          </div>
        }

        <!-- About -->
        @if (activeTab() === 'about') {
          <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('settings.aboutSection') }}</h2>
            <p class="text-sm text-gray-500">{{ i18n.t('settings.aboutDescription') }}</p>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.aboutTitle') }}</label>
                <input [(ngModel)]="aboutTitle" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" [placeholder]="i18n.t('settings.aboutTitlePlaceholder')" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.aboutText') }}</label>
                <textarea [(ngModel)]="aboutDescription" rows="5"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none"
                  [placeholder]="i18n.t('settings.aboutTextPlaceholder')"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.aboutImageUrl') }}</label>
                <input [(ngModel)]="aboutImageUrl" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" placeholder="https://..." />
                @if (aboutImageUrl) {
                  <img [src]="aboutImageUrl" alt="About preview" class="mt-2 h-32 object-cover rounded-lg" />
                }
              </div>
            </div>
            <button (click)="saveAbout()" [disabled]="saving()" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
              {{ saving() ? i18n.t('common.saving') : i18n.t('common.save') }}
            </button>
          </div>
        }

        <!-- Testimonials -->
        @if (activeTab() === 'testimonials') {
          <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('settings.testimonials') }}</h2>
                <p class="text-sm text-gray-500 mt-1">{{ i18n.t('settings.testimonialsHint') }}</p>
              </div>
              <button (click)="addTestimonial()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">
                {{ i18n.t('settings.addReview') }}
              </button>
            </div>

            @if (testimonials.length === 0) {
              <div class="text-center py-8 text-gray-400">
                <p>{{ i18n.t('settings.noTestimonials') }}</p>
              </div>
            }

            @for (t of testimonials; track $index; let i = $index) {
              <div class="border border-gray-200 rounded-xl p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-gray-600">{{ i18n.t('settings.review') }} {{ i + 1 }}</span>
                  <button (click)="removeTestimonial(i)" class="text-red-500 hover:text-red-700 text-sm font-medium">{{ i18n.t('common.remove') }}</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">{{ i18n.t('settings.customerName') }}</label>
                    <input [(ngModel)]="t.name" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" [placeholder]="i18n.t('settings.customerNamePlaceholder')" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">{{ i18n.t('settings.rating') }}</label>
                    <select [(ngModel)]="t.rating" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none bg-white">
                      <option [ngValue]="5">★★★★★ (5)</option>
                      <option [ngValue]="4">★★★★☆ (4)</option>
                      <option [ngValue]="3">★★★☆☆ (3)</option>
                      <option [ngValue]="2">★★☆☆☆ (2)</option>
                      <option [ngValue]="1">★☆☆☆☆ (1)</option>
                    </select>
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-xs font-medium text-gray-600 mb-1">{{ i18n.t('settings.reviewText') }}</label>
                    <textarea [(ngModel)]="t.text" rows="2"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none"
                      [placeholder]="i18n.t('settings.reviewTextPlaceholder')"></textarea>
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-xs font-medium text-gray-600 mb-1">{{ i18n.t('settings.photoUrl') }}</label>
                    <input [(ngModel)]="t.imageUrl" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" placeholder="https://..." />
                  </div>
                </div>
              </div>
            }

            <button (click)="saveTestimonials()" [disabled]="saving()" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
              {{ saving() ? i18n.t('common.saving') : i18n.t('common.save') }}
            </button>
          </div>
        }

        <!-- Policies -->
        @if (activeTab() === 'policies') {
          <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('settings.storePolicies') }}</h2>
            <p class="text-sm text-gray-500">{{ i18n.t('settings.storePoliciesDescription') }}</p>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.returnPolicy') }}</label>
                <textarea [(ngModel)]="policies.returnPolicy" rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none"
                  [placeholder]="i18n.t('settings.refundPolicyPlaceholder')"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.warrantyPolicy') }}</label>
                <textarea [(ngModel)]="policies.warrantyPolicy" rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none"
                  [placeholder]="i18n.t('settings.warrantyPolicyPlaceholder')"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.privacyPolicy') }}</label>
                <textarea [(ngModel)]="policies.privacyPolicy" rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none"
                  [placeholder]="i18n.t('settings.privacyPolicyPlaceholder')"></textarea>
              </div>
            </div>
            <button (click)="savePolicies()" [disabled]="saving()" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
              {{ saving() ? i18n.t('common.saving') : i18n.t('common.save') }}
            </button>
          </div>
        }

        <!-- Footer -->
        @if (activeTab() === 'footer') {
          <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('settings.footer') }}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.footerAddress') }}</label>
                <input [(ngModel)]="footerAddress" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.workingHours') }}</label>
                <input [(ngModel)]="workingHours" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" [placeholder]="i18n.t('settings.workingHoursPlaceholder')" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.mapUrl') }}</label>
                <input [(ngModel)]="mapUrl" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" placeholder="https://maps.google.com/..." />
              </div>
            </div>
            <h3 class="font-medium text-sm text-gray-700 mt-4">{{ i18n.t('settings.socialLinks') }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.facebook') }}</label>
                <input [(ngModel)]="socialLinks.facebook" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.instagram') }}</label>
                <input [(ngModel)]="socialLinks.instagram" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.twitter') }}</label>
                <input [(ngModel)]="socialLinks.twitter" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.tiktok') }}</label>
                <input [(ngModel)]="socialLinks.tiktok" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.youtube') }}</label>
                <input [(ngModel)]="socialLinks.youtube" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
            </div>
            <button (click)="saveFooter()" [disabled]="saving()" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
              {{ saving() ? i18n.t('common.saving') : i18n.t('common.save') }}
            </button>
          </div>
        }

        <!-- WhatsApp -->
        @if (activeTab() === 'whatsapp') {
          <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('settings.whatsapp') }}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.inquiryTemplate') }}</label>
                <textarea [(ngModel)]="whatsAppTemplates.inquiryTemplate" rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none"
                  [placeholder]="i18n.t('settings.inquiryTemplatePlaceholder')"></textarea>
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.followUpTemplate') }}</label>
                <textarea [(ngModel)]="whatsAppTemplates.followUpTemplate" rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none"
                  [placeholder]="i18n.t('settings.followUpTemplatePlaceholder')"></textarea>
              </div>
            </div>
            <button (click)="saveWhatsApp()" [disabled]="saving()" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
              {{ saving() ? i18n.t('common.saving') : i18n.t('common.save') }}
            </button>
          </div>
        }

        <!-- FAQ -->
        @if (activeTab() === 'faq') {
          <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('settings.faq') }}</h2>
                <p class="text-sm text-gray-500 mt-1">{{ i18n.t('settings.faqDescription') }}</p>
              </div>
              <button (click)="addFaqItem()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">
                {{ i18n.t('settings.addQuestion') }}
              </button>
            </div>

            @if (faqItems.length === 0) {
              <div class="text-center py-8 text-gray-400">
                <p>{{ i18n.t('settings.noFaqItems') }}</p>
              </div>
            }

            @for (faq of faqItems; track $index; let i = $index) {
              <div class="border border-gray-200 rounded-xl p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-gray-600">{{ i18n.t('settings.question') }} {{ i + 1 }}</span>
                  <button (click)="removeFaqItem(i)" class="text-red-500 hover:text-red-700 text-sm font-medium">{{ i18n.t('common.remove') }}</button>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">{{ i18n.t('settings.questionLabel') }}</label>
                  <input [(ngModel)]="faq.question" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" [placeholder]="i18n.t('settings.questionPlaceholder')" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">{{ i18n.t('settings.answerLabel') }}</label>
                  <textarea [(ngModel)]="faq.answer" rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none"
                    [placeholder]="i18n.t('settings.answerPlaceholder')"></textarea>
                </div>
              </div>
            }

            <button (click)="saveFaq()" [disabled]="saving()" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
              {{ saving() ? i18n.t('common.saving') : i18n.t('common.save') }}
            </button>
          </div>
        }

        <!-- Trust Badges -->
        @if (activeTab() === 'trustbadges') {
          <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('settings.trustBadges') }}</h2>
                <p class="text-sm text-gray-500 mt-1">{{ i18n.t('settings.trustBadgesDescription') }}</p>
              </div>
              <button (click)="addTrustBadge()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">
                {{ i18n.t('settings.addBadge') }}
              </button>
            </div>

            @if (trustBadges.length === 0) {
              <div class="text-center py-8 text-gray-400">
                <p>{{ i18n.t('settings.noTrustBadges') }}</p>
              </div>
            }

            @for (badge of trustBadges; track $index; let i = $index) {
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-500">{{ i + 1 }}</div>
                <input [ngModel]="badge" (ngModelChange)="updateTrustBadge(i, $event)" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" [placeholder]="i18n.t('settings.trustBadgePlaceholder')" />
                <button (click)="removeTrustBadge(i)" class="text-red-500 hover:text-red-700 text-sm font-medium">{{ i18n.t('common.remove') }}</button>
              </div>
            }

            <button (click)="saveTrustBadges()" [disabled]="saving()" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
              {{ saving() ? i18n.t('common.saving') : i18n.t('common.save') }}
            </button>
          </div>
        }

        <!-- PWA -->
        @if (activeTab() === 'pwa') {
          <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('settings.pwa') }}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.pwaAppName') }}</label>
                <input [(ngModel)]="pwaSettings.appName" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.pwaShortName') }}</label>
                <input [(ngModel)]="pwaSettings.shortName" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.pwaThemeColor') }}</label>
                <div class="flex gap-2 items-center">
                  <input [(ngModel)]="pwaSettings.themeColor" type="color" class="w-10 h-10 rounded cursor-pointer border" />
                  <input [(ngModel)]="pwaSettings.themeColor" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.secondaryColor') }}</label>
                <div class="flex gap-2 items-center">
                  <input [(ngModel)]="pwaSettings.backgroundColor" type="color" class="w-10 h-10 rounded cursor-pointer border" />
                  <input [(ngModel)]="pwaSettings.backgroundColor" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
              </div>
            </div>
            <button (click)="savePwa()" [disabled]="saving()" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
              {{ saving() ? i18n.t('common.saving') : i18n.t('common.save') }}
            </button>
          </div>
        }

        <!-- Security (Change Password) -->
        @if (activeTab() === 'security') {
          <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 max-w-lg">
            <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('settings.changePassword') }}</h2>
            <p class="text-sm text-gray-500">{{ i18n.t('settings.changePasswordHint') }}</p>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.currentPassword') }}</label>
                <input [(ngModel)]="currentPassword" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" autocomplete="current-password" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.newPassword') }}</label>
                <input [(ngModel)]="newPassword" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" autocomplete="new-password" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('settings.confirmPassword') }}</label>
                <input [(ngModel)]="confirmPassword" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" autocomplete="new-password" />
              </div>
              @if (passwordError) {
                <p class="text-sm text-red-500">{{ passwordError }}</p>
              }
              <button (click)="changePassword()" [disabled]="saving()" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
                {{ saving() ? i18n.t('common.saving') : i18n.t('settings.updatePassword') }}
              </button>
            </div>
          </div>
        }
      } @else {
        <div class="text-center py-12 text-gray-400">{{ i18n.t('common.loading') }}</div>
      }
    </div>
  `,
})
export class AdminSettingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);
  private readonly settingsStore = inject(SettingsStore);
  readonly i18n = inject(I18nService);
  readonly resolveImg = resolveImageUrl;

  readonly settings = signal<AdminStoreSettings | null>(null);
  readonly activeTab = signal('info');
  readonly saving = signal(false);
  readonly selectedPreset = signal(1);

  themePresets = THEME_PRESETS;

  // Parsed local editing objects
  socialLinks: SocialLinks = {};
  footerAddress = '';
  workingHours = '';
  mapUrl = '';
  whatsAppTemplates: WhatsAppTemplates = { inquiryTemplate: '', followUpTemplate: '' };
  pwaSettings: PwaSettings = { appName: '', shortName: '', themeColor: '#111827', backgroundColor: '#ffffff' };

  // New local editing objects
  heroBanners: HeroBanner[] = [];
  testimonials: Testimonial[] = [];
  aboutTitle = '';
  aboutDescription = '';
  aboutImageUrl = '';
  policies: StorePolicies = { returnPolicy: '', warrantyPolicy: '', privacyPolicy: '' };

  // Password change
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordError = '';

  tabs = [
    { key: 'info', label: 'settings.tabs.general' },
    { key: 'theme', label: 'settings.tabs.appearance' },
    { key: 'hero', label: 'settings.tabs.home' },
    { key: 'about', label: 'settings.tabs.about' },
    { key: 'testimonials', label: 'settings.tabs.testimonials' },
    { key: 'policies', label: 'settings.tabs.legal' },
    { key: 'footer', label: 'settings.tabs.contact' },
    { key: 'whatsapp', label: 'settings.tabs.whatsapp' },
    { key: 'faq', label: 'settings.tabs.faq' },
    { key: 'trustbadges', label: 'settings.tabs.trustBadges' },
    { key: 'pwa', label: 'settings.tabs.advanced' },
    { key: 'security', label: 'settings.tabs.security' },
  ];

  faqItems: FaqItem[] = [];
  trustBadges: string[] = [];

  ngOnInit(): void {
    this.api.get<AdminStoreSettings>('/Settings').subscribe(d => {
      if (d) {
        this.settings.set(d);
        this.selectedPreset.set(d.themePresetId || 1);

        // Parse JSON fields
        try { this.socialLinks = d.socialLinksJson ? JSON.parse(d.socialLinksJson) : {}; } catch { this.socialLinks = {}; }
        try { this.whatsAppTemplates = d.whatsAppTemplatesJson ? JSON.parse(d.whatsAppTemplatesJson) : { inquiryTemplate: '', followUpTemplate: '' }; } catch { this.whatsAppTemplates = { inquiryTemplate: '', followUpTemplate: '' }; }
        try { this.pwaSettings = d.pwaSettingsJson ? JSON.parse(d.pwaSettingsJson) : { appName: '', shortName: '', themeColor: '#111827', backgroundColor: '#ffffff' }; } catch { this.pwaSettings = { appName: '', shortName: '', themeColor: '#111827', backgroundColor: '#ffffff' }; }
        try { this.heroBanners = d.heroBannersJson ? JSON.parse(d.heroBannersJson) : []; } catch { this.heroBanners = []; }
        try { this.testimonials = d.testimonialsJson ? JSON.parse(d.testimonialsJson) : []; } catch { this.testimonials = []; }
        try { this.policies = d.policiesJson ? JSON.parse(d.policiesJson) : { returnPolicy: '', warrantyPolicy: '', privacyPolicy: '' }; } catch { this.policies = { returnPolicy: '', warrantyPolicy: '', privacyPolicy: '' }; }

        try { this.faqItems = d.faqJson ? JSON.parse(d.faqJson) : []; } catch { this.faqItems = []; }
        try { this.trustBadges = d.trustBadgesJson ? JSON.parse(d.trustBadgesJson) : []; } catch { this.trustBadges = []; }

        this.footerAddress = d.footerAddress || '';
        this.workingHours = d.workingHours || '';
        this.mapUrl = d.mapUrl || '';
        this.aboutTitle = d.aboutTitle || '';
        this.aboutDescription = d.aboutDescription || '';
        this.aboutImageUrl = d.aboutImageUrl || '';
      }
    });
  }

  selectPreset(id: number): void {
    this.selectedPreset.set(id);
  }

  // ── Save methods ──

  saveGeneral(): void {
    const s = this.settings();
    if (!s) return;
    this.saving.set(true);
    this.api.put<AdminStoreSettings>('/Settings', s).subscribe({
      next: () => {
        this.settingsStore.loadSettings();
        this.toastService.success(this.i18n.t('settings.savedSuccess'));
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || this.i18n.t('settings.saveFailed'));
        this.saving.set(false);
      },
    });
  }

  saveTheme(): void {
    this.saving.set(true);
    this.api.put('/Settings/theme', { themePresetId: this.selectedPreset() }).subscribe({
      next: () => {
        const s = this.settings();
        if (s) { s.themePresetId = this.selectedPreset(); this.settings.set({ ...s }); }
        this.settingsStore.loadSettings();
        this.toastService.success(this.i18n.t('settings.savedSuccess'));
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || this.i18n.t('settings.saveFailed'));
        this.saving.set(false);
      },
    });
  }

  saveHeroBanners(): void {
    const s = this.settings();
    if (!s) return;
    this.saving.set(true);
    s.heroBannersJson = JSON.stringify(this.heroBanners);
    this.api.put<AdminStoreSettings>('/Settings', s).subscribe({
      next: () => {
        this.settings.set({ ...s });
        this.settingsStore.loadSettings();
        this.toastService.success(this.i18n.t('settings.savedSuccess'));
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || this.i18n.t('settings.saveFailed'));
        this.saving.set(false);
      },
    });
  }

  saveAbout(): void {
    const s = this.settings();
    if (!s) return;
    this.saving.set(true);
    s.aboutTitle = this.aboutTitle;
    s.aboutDescription = this.aboutDescription;
    s.aboutImageUrl = this.aboutImageUrl;
    this.api.put<AdminStoreSettings>('/Settings', s).subscribe({
      next: () => {
        this.settings.set({ ...s });
        this.settingsStore.loadSettings();
        this.toastService.success(this.i18n.t('settings.savedSuccess'));
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || this.i18n.t('settings.saveFailed'));
        this.saving.set(false);
      },
    });
  }

  saveTestimonials(): void {
    const s = this.settings();
    if (!s) return;
    this.saving.set(true);
    s.testimonialsJson = JSON.stringify(this.testimonials);
    this.api.put<AdminStoreSettings>('/Settings', s).subscribe({
      next: () => {
        this.settings.set({ ...s });
        this.settingsStore.loadSettings();
        this.toastService.success(this.i18n.t('settings.savedSuccess'));
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || this.i18n.t('settings.saveFailed'));
        this.saving.set(false);
      },
    });
  }

  savePolicies(): void {
    this.saving.set(true);
    this.api.put('/Settings/footer', {
      footerAddress: this.footerAddress,
      workingHours: this.workingHours,
      socialLinksJson: JSON.stringify(this.socialLinks),
      policiesJson: JSON.stringify(this.policies),
      mapUrl: this.mapUrl,
    }).subscribe({
      next: () => {
        this.settingsStore.loadSettings();
        this.toastService.success(this.i18n.t('settings.savedSuccess'));
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || this.i18n.t('settings.saveFailed'));
        this.saving.set(false);
      },
    });
  }

  saveFooter(): void {
    this.saving.set(true);
    this.api.put('/Settings/footer', {
      footerAddress: this.footerAddress,
      workingHours: this.workingHours,
      socialLinksJson: JSON.stringify(this.socialLinks),
      policiesJson: JSON.stringify(this.policies),
      mapUrl: this.mapUrl,
    }).subscribe({
      next: () => {
        this.settingsStore.loadSettings();
        this.toastService.success(this.i18n.t('settings.savedSuccess'));
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || this.i18n.t('settings.saveFailed'));
        this.saving.set(false);
      },
    });
  }

  saveWhatsApp(): void {
    this.saving.set(true);
    this.api.put('/Settings/whatsapp', {
      whatsAppTemplatesJson: JSON.stringify(this.whatsAppTemplates),
    }).subscribe({
      next: () => {
        this.toastService.success(this.i18n.t('settings.savedSuccess'));
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || this.i18n.t('settings.saveFailed'));
        this.saving.set(false);
      },
    });
  }

  savePwa(): void {
    this.saving.set(true);
    this.api.put('/Settings/pwa', {
      pwaSettingsJson: JSON.stringify(this.pwaSettings),
    }).subscribe({
      next: () => {
        this.settingsStore.loadSettings();
        this.toastService.success(this.i18n.t('settings.savedSuccess'));
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || this.i18n.t('settings.saveFailed'));
        this.saving.set(false);
      },
    });
  }

  // ── Banner & Testimonial helpers ──

  addBanner(): void {
    this.heroBanners = [...this.heroBanners, { imageUrl: '', title: '', subtitle: '', linkUrl: '' }];
  }

  removeBanner(index: number): void {
    this.heroBanners = this.heroBanners.filter((_, i) => i !== index);
  }

  addTestimonial(): void {
    this.testimonials = [...this.testimonials, { name: '', text: '', rating: 5 }];
  }

  removeTestimonial(index: number): void {
    this.testimonials = this.testimonials.filter((_, i) => i !== index);
  }

  // ── FAQ helpers ──

  addFaqItem(): void {
    this.faqItems = [...this.faqItems, { question: '', answer: '' }];
  }

  removeFaqItem(index: number): void {
    this.faqItems = this.faqItems.filter((_, i) => i !== index);
  }

  saveFaq(): void {
    const s = this.settings();
    if (!s) return;
    this.saving.set(true);
    s.faqJson = JSON.stringify(this.faqItems);
    this.api.put<AdminStoreSettings>('/Settings', s).subscribe({
      next: () => {
        this.settings.set({ ...s });
        this.settingsStore.loadSettings();
        this.toastService.success(this.i18n.t('settings.savedSuccess'));
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || this.i18n.t('settings.saveFailed'));
        this.saving.set(false);
      },
    });
  }

  // ── Trust Badges helpers ──

  addTrustBadge(): void {
    this.trustBadges = [...this.trustBadges, ''];
  }

  removeTrustBadge(index: number): void {
    this.trustBadges = this.trustBadges.filter((_, i) => i !== index);
  }

  updateTrustBadge(index: number, value: string): void {
    this.trustBadges = this.trustBadges.map((b, i) => i === index ? value : b);
  }

  saveTrustBadges(): void {
    const s = this.settings();
    if (!s) return;
    this.saving.set(true);
    s.trustBadgesJson = JSON.stringify(this.trustBadges.filter(b => b.trim()));
    this.api.put<AdminStoreSettings>('/Settings', s).subscribe({
      next: () => {
        this.settings.set({ ...s });
        this.settingsStore.loadSettings();
        this.toastService.success(this.i18n.t('settings.savedSuccess'));
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || this.i18n.t('settings.saveFailed'));
        this.saving.set(false);
      },
    });
  }

  // ── Password Change ──

  changePassword(): void {
    this.passwordError = '';
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError = this.i18n.t('settings.allFieldsRequired');
      return;
    }
    if (this.newPassword.length < 6) {
      this.passwordError = this.i18n.t('settings.passwordTooShort');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = this.i18n.t('settings.passwordMismatch');
      return;
    }
    this.saving.set(true);
    this.api.post('/Auth/change-password', {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
    }).subscribe({
      next: () => {
        this.toastService.success(this.i18n.t('settings.passwordChanged'));
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.saving.set(false);
      },
      error: (err: any) => {
        this.passwordError = err.message || this.i18n.t('settings.passwordChangeFailed');
        this.saving.set(false);
      },
    });
  }
}
