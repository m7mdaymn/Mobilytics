import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { SettingsStore } from '../../core/stores/settings.store';
import { CompareStore } from '../../core/stores/compare.store';
import { TenantService } from '../../core/services/tenant.service';
import { I18nService } from '../../core/services/i18n.service';
import { PwaInstallService } from '../../core/services/pwa-install.service';
import { ApiService } from '../../core/services/api.service';
import { Navigation, NavItemType, NavCategory, NavBrand } from '../../core/models/navigation.models';
import { resolveImageUrl } from '../../core/utils/image.utils';

@Component({
  selector: 'app-storefront-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, FormsModule],
  styles: [`
    @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    .notice-marquee { animation: marquee 30s linear infinite; }
    .notice-marquee:hover { animation-play-state: paused; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
    .mobile-drawer { animation: slideDown .25s ease-out; }
    .mega-enter { animation: slideDown .2s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .shell-enter { animation: fadeIn .35s ease-out; }

    /* ═══ PREMIUM SPLASH SCREEN ═══ */
    .splash-screen {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: #fafafa;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2.5rem;
    }
    .splash-logo-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
      animation: splashReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes splashReveal {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .splash-icon {
      width: 64px;
      height: 64px;
      border-radius: 1.25rem;
      background: linear-gradient(135deg, var(--color-primary, #6366f1), var(--color-accent, #ec4899));
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px -8px rgba(99, 102, 241, 0.4);
    }
    .splash-icon svg { width: 32px; height: 32px; color: #fff; }
    .splash-name {
      font-size: 1.5rem;
      font-weight: 800;
      color: #111;
      letter-spacing: -0.03em;
    }
    .splash-sub {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #9ca3af;
      animation: splashReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
    }
    .splash-loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      animation: splashReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
    }
    .splash-bar-wrap {
      width: 180px;
      height: 3px;
      background: #e5e7eb;
      border-radius: 999px;
      overflow: hidden;
    }
    .splash-bar-fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--color-primary, #6366f1), var(--color-accent, #ec4899));
      animation: splashBarFill 2s ease-out forwards;
    }
    @keyframes splashBarFill { from { width: 0; } to { width: 70%; } }
    .splash-dots {
      display: flex;
      gap: 6px;
    }
    .splash-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--color-primary, #6366f1);
      opacity: 0.3;
      animation: splashPulse 1.4s ease-in-out infinite;
    }
    @keyframes splashPulse { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
    .splash-powered {
      position: absolute;
      bottom: 2rem;
      font-size: 0.65rem;
      color: #d1d5db;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-weight: 600;
      animation: splashReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both;
    }
  `],
  template: `
    <!-- ═══ PREMIUM LOADING SPLASH ═══ -->
    @if (settingsStore.loading() && !settingsStore.settings()) {
      <div class="splash-screen">
        <div class="splash-logo-wrap">
          <div class="splash-icon">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 20V10L7 4L12 10V20" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 20V10L17 4L22 10V20" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="16" y="14" width="2" height="6" rx="1" fill="white" opacity="0.5"/>
          <rect x="19" y="11" width="2" height="9" rx="1" fill="white" opacity="0.7"/>
        </svg>          </div>
        </div>
        <span class="splash-sub">Powered by Mobilytics</span>
        <div class="splash-loader">
          <div class="splash-bar-wrap">
            <div class="splash-bar-fill"></div>
          </div>
          <div class="splash-dots">
            <div class="splash-dot" style="animation-delay: 0s"></div>
            <div class="splash-dot" style="animation-delay: 0.15s"></div>
            <div class="splash-dot" style="animation-delay: 0.3s"></div>
          </div>
        </div>
      </div>
    } @else {
    <div class="shell-enter">

    <!--  ROW 1: Header Notice (scrolling marquee)  -->
    @if (settingsStore.headerNoticeText()) {
      <div class="bg-[color:var(--color-primary)] text-white overflow-hidden">
        <div class="max-w-7xl mx-auto relative h-8 flex items-center">
          <div class="notice-marquee whitespace-nowrap flex items-center gap-12 text-xs font-medium">
            @for (i of [0,1]; track i) {
              @for (badge of settingsStore.trustBadges(); track badge) {
                <span class="flex items-center gap-1.5 opacity-90">
                  <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  {{ badge }}
                </span>
              }
              <span class="opacity-75">{{ settingsStore.headerNoticeText() }}</span>
            }
          </div>
        </div>
      </div>
    }

    <!--  ROW 2: Main Header — SOLID ═══ -->
    <header class="storefront-header bg-white sticky top-0 z-50 border-b border-gray-100" style="box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
      <!-- Top Micro-bar (contact + language) -->
      <div class="border-b border-gray-50 hidden md:block">
        <div class="max-w-7xl mx-auto px-4 flex items-center justify-between h-8 text-xs text-gray-400">
          <div class="flex items-center gap-5">
            @if (settingsStore.phone()) {
              <a [href]="'tel:' + settingsStore.phone()" class="flex items-center gap-1.5 hover:text-gray-700 transition">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                {{ settingsStore.phone() }}
              </a>
            }
            @if (settingsStore.workingHours()) {
              <span class="flex items-center gap-1.5">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {{ settingsStore.workingHours() }}
              </span>
            }
          </div>
          <div class="flex items-center gap-3">
            @if (settingsStore.whatsappNumber()) {
              <a [href]="'https://wa.me/' + settingsStore.whatsappNumber()" target="_blank" class="flex items-center gap-1 text-[#25D366] hover:underline font-medium">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                WhatsApp
              </a>
            }
            <button (click)="i18n.toggle()" class="font-semibold hover:text-gray-700 transition px-2 py-0.5 rounded hover:bg-gray-50">
              {{ i18n.t('lang.switch') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Logo + Search + Actions -->
      <div class="max-w-7xl mx-auto px-4 flex items-center gap-4 h-[60px]">
        <!-- Logo -->
        <a [routerLink]="tenantService.storeUrl()" class="flex items-center gap-2.5 shrink-0 group">
          @if (settingsStore.settings()?.logoUrl) {
            <img [src]="resolveImg(settingsStore.settings()!.logoUrl!)" [alt]="settingsStore.storeName()"
              class="h-9 w-auto group-hover:scale-105 transition-transform duration-300"
              (error)="$any($event.target).style.display='none'" />
          } @else {
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-[color:var(--color-primary)] to-[color:var(--color-accent)] text-white flex items-center justify-center font-bold text-lg shadow-sm">{{ settingsStore.storeName().charAt(0) }}</div>
          }
          <span class="text-lg font-extrabold text-gray-900 hidden sm:block tracking-tight">{{ settingsStore.storeName() }}</span>
        </a>

        <!-- Search -->
        <div class="flex-1 max-w-xl mx-auto">
          <div class="relative">
            <svg class="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input [(ngModel)]="searchQuery" (keyup.enter)="doSearch()" type="text"
              [placeholder]="i18n.t('store.searchItems')"
              class="w-full ps-10 pe-12 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-[color:var(--color-primary)]/20 focus:border-[color:var(--color-primary)] outline-none transition" />
            <button (click)="doSearch()" class="absolute end-1 top-1/2 -translate-y-1/2 bg-[color:var(--color-primary)] text-white rounded-full p-2 hover:opacity-90 transition">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </button>
          </div>
        </div>

        <!-- Right Actions -->
        <div class="flex items-center gap-1.5 shrink-0">
          @if (compareStore.count() > 0) {
            <a [routerLink]="tenantService.storeUrl() + '/compare'" class="relative p-2.5 text-gray-500 hover:text-[color:var(--color-primary)] transition rounded-xl hover:bg-gray-50">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              <span class="absolute -top-0.5 -end-0.5 bg-[color:var(--color-primary)] text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-sm">{{ compareStore.count() }}</span>
            </a>
          }
          @if (settingsStore.whatsappNumber()) {
            <a [href]="'https://wa.me/' + settingsStore.whatsappNumber()" target="_blank"
              class="hidden sm:flex items-center gap-1.5 bg-[#25D366] text-white text-xs font-bold px-3.5 py-2 rounded-full hover:bg-[#128c7e] transition shadow-sm">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
              {{ i18n.t('store.support') || 'Support' }}
            </a>
          }
          @if (pwaInstall.canInstall()) {
            <button (click)="pwaInstall.promptInstall()" class="hidden sm:flex items-center gap-1 text-xs font-semibold text-[color:var(--color-primary)] px-2.5 py-2 rounded-full border border-[color:var(--color-primary)]/20 hover:bg-[color:var(--color-primary)]/5 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              {{ i18n.t('store.installApp') }}
            </button>
          }
          <button (click)="mobileMenuOpen = !mobileMenuOpen" class="md:hidden p-2 text-gray-500 rounded-xl hover:bg-gray-50 transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              @if (mobileMenuOpen) {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              } @else {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              }
            </svg>
          </button>
        </div>
      </div>

      <!--  ROW 3: Desktop Mega Nav — SOLID ═══ -->
      <nav class="hidden md:block border-t border-gray-50 bg-white">
        <div class="max-w-7xl mx-auto px-4 flex items-center gap-0.5 h-11 text-[13px] font-medium">
          <a [routerLink]="tenantService.storeUrl()" class="px-3 py-1.5 text-gray-600 hover:text-[color:var(--color-primary)] hover:bg-gray-50 rounded-lg transition">{{ i18n.t('store.home') }}</a>
          @for (type of navTypes(); track type.id) {
            <div class="relative group">
              <a [routerLink]="tenantService.storeUrl() + '/type/' + type.slug"
                class="px-3 py-1.5 text-gray-600 hover:text-[color:var(--color-primary)] hover:bg-gray-50 rounded-lg transition flex items-center gap-1">
                {{ type.name }}
                <svg class="w-3 h-3 opacity-40 group-hover:opacity-100 group-hover:rotate-180 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </a>
              <!-- Mega panel -->
              <div class="absolute start-0 top-full pt-1 w-[560px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div class="mega-enter bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <div class="grid grid-cols-2 gap-8">
                    <div>
                      <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">{{ i18n.t('store.allCategories') }}</h4>
                      <div class="space-y-0.5">
                        @for (cat of getCategoriesForType(type.id); track cat.id) {
                          <a [routerLink]="tenantService.storeUrl() + '/category/' + cat.slug"
                            class="flex items-center gap-2 text-[13px] text-gray-600 hover:text-[color:var(--color-primary)] p-1.5 rounded-lg hover:bg-gray-50 transition-all hover:ps-3">
                            <svg class="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                            {{ cat.name }}
                          </a>
                        }
                        @if (!getCategoriesForType(type.id).length) {
                          <span class="text-xs text-gray-400 italic">No categories yet</span>
                        }
                      </div>
                    </div>
                    <div>
                      <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">{{ i18n.t('store.brands') }}</h4>
                      <div class="grid grid-cols-2 gap-1.5">
                        @for (brand of getBrandsForType(type.id); track brand.id) {
                          <a [routerLink]="tenantService.storeUrl() + '/brand/' + brand.slug"
                            class="flex items-center gap-2 text-[13px] text-gray-600 hover:text-[color:var(--color-primary)] p-2 rounded-lg hover:bg-gray-50 transition">
                            @if (brand.logoUrl) {
                              <img [src]="resolveImg(brand.logoUrl)" [alt]="brand.name" class="w-5 h-5 object-contain rounded" />
                            } @else {
                              <span class="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">{{ brand.name.charAt(0) }}</span>
                            }
                            {{ brand.name }}
                          </a>
                        }
                      </div>
                    </div>
                  </div>
                  <div class="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <a [routerLink]="tenantService.storeUrl() + '/type/' + type.slug"
                      class="text-xs font-semibold text-[color:var(--color-primary)] hover:underline">
                      {{ i18n.t('store.viewAll') || 'View All' }} {{ type.name }} &rarr;
                    </a>
                  </div>
                </div>
              </div>
            </div>
          }
          <a [routerLink]="tenantService.storeUrl() + '/brands'" class="px-3 py-1.5 text-gray-600 hover:text-[color:var(--color-primary)] hover:bg-gray-50 rounded-lg transition">{{ i18n.t('store.brands') }}</a>
          <a [routerLink]="tenantService.storeUrl() + '/catalog'" class="px-3 py-1.5 text-gray-600 hover:text-[color:var(--color-primary)] hover:bg-gray-50 rounded-lg transition">{{ i18n.t('store.catalog') }}</a>
          <a [routerLink]="tenantService.storeUrl() + '/about'" class="px-3 py-1.5 text-gray-600 hover:text-[color:var(--color-primary)] hover:bg-gray-50 rounded-lg transition">{{ i18n.t('store.aboutUs') || 'About' }}</a>
        </div>
      </nav>

      <!--  Mobile Nav Drawer (accordion style)  -->
      @if (mobileMenuOpen) {
        <div class="mobile-drawer md:hidden bg-white border-t border-gray-100 max-h-[75vh] overflow-y-auto">
          <!-- Mobile Search -->
          <div class="p-4 border-b border-gray-50">
            <div class="relative">
              <svg class="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input [(ngModel)]="searchQuery" (keyup.enter)="doSearch()" type="text" [placeholder]="i18n.t('store.searchItems')"
                class="w-full ps-10 pe-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 outline-none" />
            </div>
          </div>
          <div class="divide-y divide-gray-50">
            <a [routerLink]="tenantService.storeUrl()" (click)="mobileMenuOpen=false" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
              {{ i18n.t('store.home') }}
            </a>
            @for (type of navTypes(); track type.id) {
              <div>
                <button (click)="toggleMobileSection(type.id)" class="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50">
                  <span class="flex items-center gap-3">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
                    {{ type.name }}
                  </span>
                  <svg class="w-4 h-4 text-gray-400 transition-transform" [class.rotate-180]="expandedMobileSection === type.id" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
                @if (expandedMobileSection === type.id) {
                  <div class="bg-gray-50 px-4 py-2 space-y-0.5">
                    <a [routerLink]="tenantService.storeUrl() + '/type/' + type.slug" (click)="mobileMenuOpen=false"
                      class="block py-2 ps-8 text-sm text-[color:var(--color-primary)] font-medium">{{ i18n.t('store.viewAll') || 'View All' }} &rarr;</a>
                    @for (cat of getCategoriesForType(type.id); track cat.id) {
                      <a [routerLink]="tenantService.storeUrl() + '/category/' + cat.slug" (click)="mobileMenuOpen=false"
                        class="block py-2 ps-8 text-sm text-gray-600 hover:text-gray-900">{{ cat.name }}</a>
                    }
                    @if (getBrandsForType(type.id).length) {
                      <div class="pt-2 pb-1">
                        <span class="ps-8 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Brands</span>
                        <div class="flex flex-wrap gap-2 ps-8 pt-1.5">
                          @for (brand of getBrandsForType(type.id); track brand.id) {
                            <a [routerLink]="tenantService.storeUrl() + '/brand/' + brand.slug" (click)="mobileMenuOpen=false"
                              class="text-xs bg-white px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-[color:var(--color-primary)] transition">
                              {{ brand.name }}
                            </a>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
            <a [routerLink]="tenantService.storeUrl() + '/catalog'" (click)="mobileMenuOpen=false" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
              {{ i18n.t('store.catalog') }}
            </a>
            <a [routerLink]="tenantService.storeUrl() + '/brands'" (click)="mobileMenuOpen=false" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
              {{ i18n.t('store.brands') }}
            </a>
            <a [routerLink]="tenantService.storeUrl() + '/about'" (click)="mobileMenuOpen=false" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {{ i18n.t('store.aboutUs') || 'About' }}
            </a>
            @if (compareStore.count() > 0) {
              <a [routerLink]="tenantService.storeUrl() + '/compare'" (click)="mobileMenuOpen=false" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                {{ i18n.t('store.compare') }} ({{ compareStore.count() }})
              </a>
            }
          </div>
          <!-- Mobile contact info -->
          <div class="p-4 bg-gray-50 flex items-center justify-center gap-4 text-xs">
            @if (settingsStore.phone()) {
              <a [href]="'tel:' + settingsStore.phone()" class="flex items-center gap-1 text-gray-600">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                {{ settingsStore.phone() }}
              </a>
            }
            <button (click)="i18n.toggle()" class="font-semibold text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition">{{ i18n.t('lang.switch') }}</button>
          </div>
        </div>
      }
    </header>

    <!-- Main Content -->
    <main class="min-h-[calc(100vh-320px)]">
      <router-outlet />
    </main>

    <!--  FOOTER — PREMIUM DARK ═══ -->
    <footer class="bg-[#0a0a0a] text-gray-400">
      <!-- Newsletter -->
      <div class="border-b border-white/5">
        <div class="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="text-center md:text-start">
            <h3 class="text-white font-bold text-xl tracking-tight">{{ i18n.t('store.stayUpdated') || 'Stay Updated' }}</h3>
            <p class="text-sm text-gray-500 mt-1">{{ i18n.t('store.newsletterDesc') || 'Get notified about new arrivals and exclusive deals' }}</p>
          </div>
          <div class="flex gap-2 w-full md:w-auto">
            <input [(ngModel)]="newsletterEmail" type="email" [placeholder]="i18n.t('store.emailPlaceholder') || 'Enter your email'"
              class="flex-1 md:w-72 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-[color:var(--color-primary)] transition" />
            <button (click)="subscribeNewsletter()" class="bg-[color:var(--color-primary)] text-white px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition shrink-0">
              {{ i18n.t('store.subscribe') || 'Subscribe' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Footer Grid -->
      <div class="max-w-7xl mx-auto px-4 py-14 grid grid-cols-2 md:grid-cols-12 gap-8">
        <!-- Col 1: Store Info — spans 4 cols -->
        <div class="col-span-2 md:col-span-4">
          <div class="flex items-center gap-2.5 mb-5">
            @if (settingsStore.settings()?.logoUrl) {
              <img [src]="resolveImg(settingsStore.settings()!.logoUrl!)" [alt]="settingsStore.storeName()"
                class="h-8 w-auto brightness-0 invert opacity-80"
                (error)="$any($event.target).style.display='none'" />
            } @else {
              <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-[color:var(--color-primary)] to-[color:var(--color-accent)] text-white flex items-center justify-center font-bold text-lg">{{ settingsStore.storeName().charAt(0) }}</div>
            }
            <h3 class="font-bold text-white text-lg tracking-tight">{{ settingsStore.storeName() }}</h3>
          </div>
          <div class="space-y-3 text-sm">
            @if (settingsStore.address()) {
              <p class="flex items-start gap-2.5">
                <svg class="w-4 h-4 mt-0.5 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span class="leading-relaxed">{{ settingsStore.address() }}</span>
              </p>
            }
            @if (settingsStore.phone()) {
              <p class="flex items-start gap-2.5">
                <svg class="w-4 h-4 mt-0.5 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                <a [href]="'tel:' + settingsStore.phone()" class="hover:text-white transition">{{ settingsStore.phone() }}</a>
              </p>
            }
            @if (settingsStore.workingHours()) {
              <p class="flex items-start gap-2.5">
                <svg class="w-4 h-4 mt-0.5 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>{{ settingsStore.workingHours() }}</span>
              </p>
            }
          </div>
          <!-- Social Icons -->
          <div class="flex flex-wrap gap-2 mt-6">
            @if (settingsStore.socialLinks()['facebook']) {
              <a [href]="settingsStore.socialLinks()['facebook']" target="_blank" aria-label="Facebook"
                class="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#1877F2] flex items-center justify-center transition text-gray-500 hover:text-white">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            }
            @if (settingsStore.socialLinks()['instagram']) {
              <a [href]="settingsStore.socialLinks()['instagram']" target="_blank" aria-label="Instagram"
                class="w-9 h-9 rounded-lg bg-white/5 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#bc1888] flex items-center justify-center transition text-gray-500 hover:text-white">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            }
            @if (settingsStore.socialLinks()['tiktok']) {
              <a [href]="settingsStore.socialLinks()['tiktok']" target="_blank" aria-label="TikTok"
                class="w-9 h-9 rounded-lg bg-white/5 hover:bg-black flex items-center justify-center transition text-gray-500 hover:text-white">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .55.04.81.11v-3.5a6.37 6.37 0 00-.81-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13a8.16 8.16 0 005.58 2.21V11.7a4.84 4.84 0 01-3.77-1.24V6.69h3.77z"/></svg>
              </a>
            }
            @if (settingsStore.socialLinks()['twitter']) {
              <a [href]="settingsStore.socialLinks()['twitter']" target="_blank" aria-label="X"
                class="w-9 h-9 rounded-lg bg-white/5 hover:bg-black flex items-center justify-center transition text-gray-500 hover:text-white">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            }
            @if (settingsStore.socialLinks()['youtube']) {
              <a [href]="settingsStore.socialLinks()['youtube']" target="_blank" aria-label="YouTube"
                class="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#FF0000] flex items-center justify-center transition text-gray-500 hover:text-white">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            }
          </div>
        </div>

        <!-- Col 2: Shop -->
        <div class="md:col-span-2">
          <h4 class="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-5">{{ i18n.t('store.catalog') }}</h4>
          <div class="space-y-3 text-sm">
            <a [routerLink]="tenantService.storeUrl() + '/catalog'" class="block hover:text-white transition">{{ i18n.t('store.viewAll') || 'All Products' }}</a>
            @for (type of navTypes(); track type.id) {
              <a [routerLink]="tenantService.storeUrl() + '/type/' + type.slug" class="block hover:text-white transition">{{ type.name }}</a>
            }
            <a [routerLink]="tenantService.storeUrl() + '/brands'" class="block hover:text-white transition">{{ i18n.t('store.brands') }}</a>
          </div>
        </div>

        <!-- Col 3: Support -->
        <div class="md:col-span-2">
          <h4 class="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-5">{{ i18n.t('store.support') || 'Support' }}</h4>
          <div class="space-y-3 text-sm">
            <a [routerLink]="tenantService.storeUrl() + '/about'" class="block hover:text-white transition">{{ i18n.t('store.aboutUs') || 'About Us' }}</a>
            @if (settingsStore.whatsappNumber()) {
              <a [href]="'https://wa.me/' + settingsStore.whatsappNumber()" target="_blank" class="block hover:text-white transition flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                WhatsApp Support
              </a>
            }
            @if (settingsStore.mapUrl()) {
              <button (click)="showMap = true" class="block hover:text-white transition text-start">{{ i18n.t('store.showMap') || 'Our Location' }}</button>
            }
          </div>
        </div>

        <!-- Col 4: Policies -->
        <div class="md:col-span-2">
          <h4 class="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-5">{{ i18n.t('store.policies') || 'Policies' }}</h4>
          <div class="space-y-3 text-sm">
            @if (settingsStore.policies()['return']) {
              <a [routerLink]="tenantService.storeUrl() + '/policies/return'" class="block hover:text-white transition">{{ i18n.t('store.returnPolicy') || 'Return Policy' }}</a>
            }
            @if (settingsStore.policies()['warranty']) {
              <a [routerLink]="tenantService.storeUrl() + '/policies/warranty'" class="block hover:text-white transition">{{ i18n.t('store.warranty') || 'Warranty' }}</a>
            }
            @if (settingsStore.policies()['privacy']) {
              <a [routerLink]="tenantService.storeUrl() + '/policies/privacy'" class="block hover:text-white transition">{{ i18n.t('store.privacy') || 'Privacy Policy' }}</a>
            }
            @if (settingsStore.mapUrl()) {
              <button (click)="showMap = true" class="flex items-center gap-1.5 hover:text-white transition text-start">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                {{ i18n.t('store.showMap') || 'View on Map' }}
              </button>
            }
          </div>
        </div>

        <!-- Col 5: Install / PWA -->
        <div class="md:col-span-2">
          <h4 class="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-5">{{ i18n.t('store.getApp') || 'Get the App' }}</h4>
          <div class="space-y-3 text-sm">
            @if (pwaInstall.canInstall()) {
              <button (click)="pwaInstall.promptInstall()" class="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-lg hover:bg-white/10 transition text-white text-xs font-semibold">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                {{ i18n.t('store.installApp') || 'Install App' }}
              </button>
            }
            <p class="text-xs text-gray-600 leading-relaxed">{{ i18n.t('store.installDesc') || 'Install our app for a faster, native-like experience.' }}</p>
          </div>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="border-t border-white/5">
        <div class="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <span>&copy; {{ currentYear }} {{ settingsStore.storeName() }}. {{ i18n.t('store.allRightsReserved') || 'All rights reserved.' }}</span>
          @if (settingsStore.showPoweredBy()) {
            <span class="flex items-center gap-1.5">
              {{ i18n.t('store.poweredBy') }}
              <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </span>
          }
        </div>
      </div>
    </footer>

    <!-- Sticky WhatsApp FAB -->
    @if (settingsStore.whatsappNumber()) {
      <a [href]="'https://wa.me/' + settingsStore.whatsappNumber()" target="_blank"
        class="fixed bottom-5 end-5 z-[999] w-14 h-14 bg-[#25D366] rounded-full shadow-lg flex items-center justify-center hover:bg-[#128c7e] transition hover:scale-110 active:scale-95"
        aria-label="Chat on WhatsApp">
        <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.697-6.413-1.896l-.447-.292-2.637.884.884-2.637-.292-.447A9.953 9.953 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
      </a>
    }

    <!-- Map Modal -->
    @if (showMap) {
      <div class="fixed inset-0 z-[9998] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" (click)="showMap = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" (click)="$event.stopPropagation()">
          <div class="flex justify-between items-center p-4 border-b">
            <h3 class="font-bold text-gray-900">{{ i18n.t('store.showMap') || 'Our Location' }}</h3>
            <button (click)="showMap = false" class="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition">&times;</button>
          </div>
          <div class="aspect-video">
            <iframe [src]="safeMapUrl()" class="w-full h-full border-0" allowfullscreen loading="lazy"></iframe>
          </div>
        </div>
      </div>
    }

    </div><!-- /shell-enter -->
    }
  `,
})
export class StorefrontShellComponent implements OnInit {
  readonly settingsStore = inject(SettingsStore);
  readonly compareStore = inject(CompareStore);
  readonly tenantService = inject(TenantService);
  readonly i18n = inject(I18nService);
  readonly pwaInstall = inject(PwaInstallService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  readonly navTypes = signal<NavItemType[]>([]);
  private navCategories: Record<string, NavCategory[]> = {};
  private navBrands: Record<string, NavBrand[]> = {};

  readonly safeMapUrl = computed(() => {
    const url = this.settingsStore.mapUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  mobileMenuOpen = false;
  expandedMobileSection: string | null = null;
  showMap = false;
  searchQuery = '';
  newsletterEmail = '';
  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    this.api.get<Navigation>('/Public/navigation').subscribe({
      next: nav => {
        this.navTypes.set(nav.itemTypes);
        this.navCategories = nav.categoriesByType || {};
        this.navBrands = nav.featuredBrandsByType || {};
      },
    });
  }

  getCategoriesForType(typeId: string): NavCategory[] {
    return this.navCategories[typeId] || [];
  }

  getBrandsForType(typeId: string): NavBrand[] {
    return this.navBrands[typeId] || [];
  }

  resolveImg(url: string): string {
    return resolveImageUrl(url);
  }

  toggleMobileSection(typeId: string): void {
    this.expandedMobileSection = this.expandedMobileSection === typeId ? null : typeId;
  }

  doSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate([this.tenantService.storeUrl(), 'catalog'], {
        queryParams: { search: this.searchQuery.trim() },
      });
      this.mobileMenuOpen = false;
    }
  }

  subscribeNewsletter(): void {
    if (this.newsletterEmail.trim()) {
      // Could integrate with a backend endpoint later
      this.newsletterEmail = '';
    }
  }
}
