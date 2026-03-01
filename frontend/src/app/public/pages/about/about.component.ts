import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SettingsStore } from '../../../core/stores/settings.store';
import { I18nService } from '../../../core/services/i18n.service';
import { TenantService } from '../../../core/services/tenant.service';
import { resolveImageUrl } from '../../../core/utils/image.utils';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-12">
      <!-- Hero Section -->
      <div class="grid md:grid-cols-2 gap-12 items-center mb-20">
        <!-- Content -->
        <div>
          <p class="text-sm font-semibold text-[color:var(--color-primary)] uppercase tracking-widest mb-3">{{ i18n.t('store.aboutUs') }}</p>
          <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">{{ settingsStore.aboutTitle() || settingsStore.storeName() }}</h1>
          <div class="text-gray-600 leading-relaxed text-lg whitespace-pre-line mb-8">{{ settingsStore.aboutDescription() }}</div>

          <div class="flex flex-col sm:flex-row gap-3">
            <a [routerLink]="tenantService.storeUrl() + '/catalog'"
              class="inline-flex items-center justify-center gap-2 bg-[color:var(--color-primary)] text-white font-bold px-6 py-3.5 rounded-xl hover:opacity-90 transition text-sm shadow-lg">
              {{ i18n.t('store.exploreCatalog') }}
            </a>
            @if (settingsStore.whatsappNumber()) {
              <a [href]="'https://wa.me/' + settingsStore.whatsappNumber().replace('+', '')" target="_blank"
                class="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold px-6 py-3.5 rounded-xl hover:bg-[#128c7e] transition text-sm">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                {{ i18n.t('store.askWhatsApp') }}
              </a>
            }
          </div>
        </div>

        <!-- Image -->
        @if (settingsStore.aboutImageUrl()) {
          <div class="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
            <img [src]="resolveImg(settingsStore.aboutImageUrl())" [alt]="settingsStore.aboutTitle()" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        } @else {
          <div class="rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 aspect-[4/3] flex items-center justify-center">
            <svg class="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
          </div>
        }
      </div>

      <!-- Trust Badges / Why Choose Us -->
      @if (settingsStore.trustBadges().length) {
        <div class="mb-20">
          <h2 class="text-2xl font-bold text-gray-900 text-center mb-2">{{ i18n.t('store.whyChooseUs') }}</h2>
          <p class="text-gray-500 text-center text-sm mb-10">{{ settingsStore.storeName() }} — {{ i18n.t('store.trustedExperience') }}</p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            @for (badge of settingsStore.trustBadges(); track badge; let i = $index) {
              <div class="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm hover:shadow-md transition">
                <div class="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                  [class]="['bg-blue-50 text-blue-600', 'bg-emerald-50 text-emerald-600', 'bg-purple-50 text-purple-600', 'bg-amber-50 text-amber-600'][i % 4]">
                  @switch (i % 4) {
                    @case (0) { <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> }
                    @case (1) { <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> }
                    @case (2) { <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg> }
                    @case (3) { <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg> }
                  }
                </div>
                <p class="text-sm font-semibold text-gray-900">{{ badge }}</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Store Info Cards -->
      <div class="grid md:grid-cols-3 gap-6 mb-20">
        @if (settingsStore.settings()?.workingHours) {
          <div class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 class="font-bold text-gray-900 mb-2">Working Hours</h3>
            <p class="text-sm text-gray-600">{{ settingsStore.settings()?.workingHours }}</p>
          </div>
        }
        @if (settingsStore.settings()?.footerAddress) {
          <div class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div class="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
              <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <h3 class="font-bold text-gray-900 mb-2">{{ i18n.t('store.location') }}</h3>
            <p class="text-sm text-gray-600">{{ settingsStore.settings()?.footerAddress }}</p>
          </div>
        }
        @if (settingsStore.phone()) {
          <div class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div class="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            </div>
            <h3 class="font-bold text-gray-900 mb-2">{{ i18n.t('common.phone') }}</h3>
            <p class="text-sm text-gray-600">{{ settingsStore.phone() }}</p>
          </div>
        }
      </div>

      <!-- Policies -->
      @if (policies()) {
        <div>
          <h2 class="text-2xl font-bold text-gray-900 text-center mb-8">{{ i18n.t('store.policies') }}</h2>
          <div class="grid md:grid-cols-3 gap-6">
            @if (policies()?.returnPolicy) {
              <div class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                </div>
                <h3 class="font-bold text-gray-900 mb-2">{{ i18n.t('store.returnPolicy') }}</h3>
                <p class="text-sm text-gray-600">{{ policies()?.returnPolicy }}</p>
              </div>
            }
            @if (policies()?.warrantyPolicy) {
              <div class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div class="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <h3 class="font-bold text-gray-900 mb-2">{{ i18n.t('store.warranty') }}</h3>
                <p class="text-sm text-gray-600">{{ policies()?.warrantyPolicy }}</p>
              </div>
            }
            @if (policies()?.privacyPolicy) {
              <div class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div class="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
                <h3 class="font-bold text-gray-900 mb-2">{{ i18n.t('store.privacy') }}</h3>
                <p class="text-sm text-gray-600">{{ policies()?.privacyPolicy }}</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class AboutComponent {
  readonly settingsStore = inject(SettingsStore);
  readonly i18n = inject(I18nService);
  readonly tenantService = inject(TenantService);

  readonly policies = computed(() => {
    const json = this.settingsStore.settings()?.policiesJson;
    try { return json ? JSON.parse(json) : null; } catch { return null; }
  });

  resolveImg(url: string | null): string {
    return url ? resolveImageUrl(url) : '';
  }
}
