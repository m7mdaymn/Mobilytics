import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { SettingsStore } from '../../core/stores/settings.store';
import { CompareStore } from '../../core/stores/compare.store';

@Component({
  selector: 'app-storefront-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <!-- Header -->
    <header class="storefront-header sticky top-0 z-50 bg-[color:var(--header-bg,#fff)] border-b border-[color:var(--header-border,var(--color-border))] shadow-sm">
      <div class="max-w-7xl mx-auto px-4 flex items-center justify-between" [style.height]="'var(--header-height, 64px)'">
        <!-- Logo / Store Name -->
        <a routerLink="/" class="flex items-center gap-3">
          @if (settingsStore.settings()?.logoUrl) {
            <img [src]="settingsStore.settings()!.logoUrl" [alt]="settingsStore.storeName()" class="h-8 w-auto" />
          }
          <span class="store-name text-xl font-bold text-[color:var(--color-primary)]">{{ settingsStore.storeName() }}</span>
        </a>

        <!-- Desktop Nav -->
        <nav class="storefront-nav hidden md:flex items-center gap-6 text-sm font-medium">
          <a routerLink="/" class="hover:text-[color:var(--color-primary)] transition-colors">Home</a>
          <a routerLink="/catalog" class="hover:text-[color:var(--color-primary)] transition-colors">Catalog</a>
          <a routerLink="/brands" class="hover:text-[color:var(--color-primary)] transition-colors">Brands</a>
          @if (compareStore.count() > 0) {
            <a routerLink="/compare" class="relative hover:text-[color:var(--color-primary)] transition-colors">
              Compare
              <span class="absolute -top-2 -right-4 bg-[color:var(--color-primary)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {{ compareStore.count() }}
              </span>
            </a>
          }
        </nav>

        <!-- Mobile Menu Toggle -->
        <button (click)="mobileMenuOpen = !mobileMenuOpen" class="mobile-menu-btn md:hidden p-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            @if (mobileMenuOpen) {
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            } @else {
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      <!-- Mobile Nav -->
      @if (mobileMenuOpen) {
        <div class="md:hidden bg-white border-t border-[color:var(--color-border)] px-4 py-3 space-y-2">
          <a routerLink="/" (click)="mobileMenuOpen = false" class="block py-2 text-sm font-medium hover:text-[color:var(--color-primary)]">Home</a>
          <a routerLink="/catalog" (click)="mobileMenuOpen = false" class="block py-2 text-sm font-medium hover:text-[color:var(--color-primary)]">Catalog</a>
          <a routerLink="/brands" (click)="mobileMenuOpen = false" class="block py-2 text-sm font-medium hover:text-[color:var(--color-primary)]">Brands</a>
          @if (compareStore.count() > 0) {
            <a routerLink="/compare" (click)="mobileMenuOpen = false" class="block py-2 text-sm font-medium hover:text-[color:var(--color-primary)]">
              Compare ({{ compareStore.count() }})
            </a>
          }
        </div>
      }
    </header>

    <!-- Main Content -->
    <main class="min-h-[calc(100vh-var(--header-height,64px)-200px)]">
      <router-outlet />
    </main>

    <!-- Footer -->
    <footer class="storefront-footer bg-[color:var(--footer-bg,var(--color-secondary))] text-white">
      <div class="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Store Info -->
        <div>
          <h3 class="font-bold text-lg mb-3">{{ settingsStore.storeName() }}</h3>
          @if (settingsStore.settings()?.address) {
            <p class="text-gray-300 text-sm mb-2">📍 {{ settingsStore.settings()!.address }}</p>
          }
          @if (settingsStore.settings()?.phone) {
            <p class="text-gray-300 text-sm mb-2">📞 {{ settingsStore.settings()!.phone }}</p>
          }
          @if (settingsStore.settings()?.workingHours) {
            <p class="text-gray-300 text-sm">🕐 {{ settingsStore.settings()!.workingHours }}</p>
          }
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="font-bold text-lg mb-3">Quick Links</h3>
          <div class="space-y-2 text-sm">
            <a routerLink="/catalog" class="block text-gray-300 hover:text-white">Catalog</a>
            <a routerLink="/brands" class="block text-gray-300 hover:text-white">Brands</a>
            <a routerLink="/policies/about" class="block text-gray-300 hover:text-white">About</a>
            <a routerLink="/policies/warranty" class="block text-gray-300 hover:text-white">Warranty Policy</a>
            <a routerLink="/policies/return" class="block text-gray-300 hover:text-white">Return Policy</a>
          </div>
        </div>

        <!-- Social & Map -->
        <div>
          <h3 class="font-bold text-lg mb-3">Follow Us</h3>
          <div class="flex gap-3 mb-4">
            @if (settingsStore.settings()?.socialLinks?.facebook) {
              <a [href]="settingsStore.settings()!.socialLinks.facebook" target="_blank" class="text-gray-300 hover:text-white">Facebook</a>
            }
            @if (settingsStore.settings()?.socialLinks?.instagram) {
              <a [href]="settingsStore.settings()!.socialLinks.instagram" target="_blank" class="text-gray-300 hover:text-white">Instagram</a>
            }
          </div>
          @if (settingsStore.settings()?.mapUrl) {
            <button (click)="showMap = true" class="text-sm text-gray-300 hover:text-white underline">📍 Show Map</button>
          }
        </div>
      </div>

      <!-- Powered By -->
      <div class="border-t border-gray-700 py-4 text-center text-xs text-gray-400">
        @if (settingsStore.showPoweredBy()) {
          <span>Powered by <strong>Nova Node</strong></span>
        }
      </div>
    </footer>

    <!-- Sticky WhatsApp CTA (Theme 3) -->
    @if (settingsStore.themeId() === 3 && settingsStore.whatsappNumber()) {
      <a [href]="'https://wa.me/' + settingsStore.whatsappNumber()" target="_blank" class="whatsapp-sticky" aria-label="Chat on WhatsApp">
        <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.697-6.413-1.896l-.447-.292-2.637.884.884-2.637-.292-.447A9.953 9.953 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
      </a>
    }

    <!-- Map Modal -->
    @if (showMap) {
      <div class="fixed inset-0 z-[9998] bg-black/50 flex items-center justify-center p-4" (click)="showMap = false">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden" (click)="$event.stopPropagation()">
          <div class="flex justify-between items-center p-4 border-b">
            <h3 class="font-bold">Location</h3>
            <button (click)="showMap = false" class="text-xl text-gray-500 hover:text-gray-700">&times;</button>
          </div>
          <div class="aspect-video">
            <iframe
              [src]="settingsStore.settings()!.mapUrl"
              class="w-full h-full border-0"
              allowfullscreen
              loading="lazy">
            </iframe>
          </div>
        </div>
      </div>
    }
  `,
})
export class StorefrontShellComponent {
  readonly settingsStore = inject(SettingsStore);
  readonly compareStore = inject(CompareStore);
  mobileMenuOpen = false;
  showMap = false;
}
