import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { TenantService } from '../../../core/services/tenant.service';
import { CommonModule } from '@angular/common';

interface Tenant {
  id: string;
  slug: string;
  name: string;
  description?: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <!-- Header -->
      <header class="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h1 class="text-xl font-bold text-slate-900 dark:text-white">Mobilytics</h1>
              <p class="text-xs text-gray-600 dark:text-gray-400">Multi-Store Platform</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <main>
        <div class="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div class="text-center mb-16">
            <div class="inline-block mb-4">
              <span class="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
                ✨ Welcome to Mobilytics
              </span>
            </div>
            <h2 class="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Discover Amazing Stores
            </h2>
            <p class="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Mobilytics is a modern multi-tenant e-commerce platform. Browse through our collection of stores or create your own.
            </p>
          </div>

          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            @if (demoTenantSlug()) {
              <button 
                (click)="visitDemoStore()"
                class="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg">
                🚀 Visit Demo Store
              </button>
            }
            <button 
              (click)="scrollToStores()"
              class="px-8 py-4 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-semibold rounded-lg border-2 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all">
              📖 Browse All Stores
            </button>
          </div>

          <!-- Info Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            <div class="card p-8 text-center hover:shadow-lg transition-all">
              <div class="text-4xl mb-4">🛍️</div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Browse Stores</h3>
              <p class="text-gray-600 dark:text-gray-400">Explore a variety of stores and find exactly what you're looking for.</p>
            </div>
            <div class="card p-8 text-center hover:shadow-lg transition-all">
              <div class="text-4xl mb-4">💎</div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Quality Products</h3>
              <p class="text-gray-600 dark:text-gray-400">Each store curates premium products with competitive pricing.</p>
            </div>
            <div class="card p-8 text-center hover:shadow-lg transition-all">
              <div class="text-4xl mb-4">🔒</div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Secure & Fast</h3>
              <p class="text-gray-600 dark:text-gray-400">Safe checkout and lightning-fast delivery to your doorstep.</p>
            </div>
          </div>

          <!-- Stores Section -->
          <div #storesSection id="stores" class="mb-16">
            <h3 class="text-3xl font-bold text-slate-900 dark:text-white mb-4 text-center">Available Stores</h3>
            <p class="text-gray-600 dark:text-gray-400 text-center mb-12">Select a store to start shopping</p>

            @if (loading()) {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @for (i of [1,2,3,4,5,6]; track i) {
                  <div class="skeleton h-48 rounded-xl"></div>
                }
              </div>
            } @else if (tenants().length > 0) {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @for (tenant of tenants(); track tenant.id) {
                  <button 
                    (click)="visitStore(tenant)"
                    class="group card p-8 text-left hover:shadow-xl hover:border-blue-400 transition-all duration-300 cursor-pointer">
                    <div class="flex items-start justify-between mb-4">
                      <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span class="text-white font-bold">{{ tenant.name.charAt(0) }}</span>
                      </div>
                      <span class="text-2xl group-hover:scale-125 transition-transform">→</span>
                    </div>
                    <h4 class="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                      {{ tenant.name }}
                    </h4>
                    @if (tenant.description) {
                      <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">{{ tenant.description }}</p>
                    }
                    <div class="text-xs text-gray-500 dark:text-gray-500">{{ tenant.slug }}</div>
                  </button>
                }
              </div>
            } @else {
              <div class="text-center py-12">
                <div class="text-6xl mb-4">🏪</div>
                <p class="text-gray-600 dark:text-gray-400 mb-6">No stores available yet.</p>
                <p class="text-sm text-gray-500">Check back soon!</p>
              </div>
            }
          </div>

          <!-- Features Section -->
          <div class="bg-white dark:bg-gray-800/50 rounded-2xl p-12 border border-gray-200 dark:border-gray-700">
            <h3 class="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">How It Works</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div class="text-center">
                <div class="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold mb-4">1</div>
                <h4 class="font-semibold text-slate-900 dark:text-white mb-2">Choose Store</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">Browse and select from available stores</p>
              </div>
              <div class="text-center">
                <div class="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold mb-4">2</div>
                <h4 class="font-semibold text-slate-900 dark:text-white mb-2">Browse Products</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">Explore curated product collections</p>
              </div>
              <div class="text-center">
                <div class="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold mb-4">3</div>
                <h4 class="font-semibold text-slate-900 dark:text-white mb-2">Add to Cart</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">Select items you want to purchase</p>
              </div>
              <div class="text-center">
                <div class="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold mb-4">4</div>
                <h4 class="font-semibold text-slate-900 dark:text-white mb-2">Checkout</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">Complete your purchase securely</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="bg-slate-900 dark:bg-black text-white mt-20">
        <div class="max-w-7xl mx-auto px-4 py-12 text-center">
          <p class="text-gray-400 mb-2">&copy; 2026 Mobilytics Platform. All rights reserved.</p>
          <p class="text-xs text-gray-500">Powered by <strong>Nova Node</strong></p>
        </div>
      </footer>
    </div>
  `,
})
export class LandingComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private tenantService = inject(TenantService);

  loading = signal(true);
  tenants = signal<Tenant[]>([]);
  demoTenantSlug = signal<string | null>(null);

  ngOnInit() {
    this.loadTenants();
    // Set demo tenant slug (from seeded data)
    this.demoTenantSlug.set('demo');
  }

  loadTenants() {
    this.apiService.get('/api/tenants/public').subscribe({
      next: (response: any) => {
        this.tenants.set(response.data || []);
        this.loading.set(false);
      },
      error: () => {
        // If API fails, show demo tenant only
        this.tenants.set([
          {
            id: 'demo',
            slug: 'demo',
            name: 'Demo Store',
            description: 'Explore our premium electronics and accessories',
          },
        ]);
        this.loading.set(false);
      },
    });
  }

  visitDemoStore() {
    const demoSlug = this.demoTenantSlug();
    if (demoSlug) {
      // Set override and redirect
      this.tenantService.setOverride(demoSlug);
      this.router.navigate(['/']);
    }
  }

  visitStore(tenant: Tenant) {
    // Set tenant override and navigate to home
    this.tenantService.setOverride(tenant.slug);
    this.router.navigate(['/']);
  }

  scrollToStores() {
    const element = document.getElementById('stores');
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
