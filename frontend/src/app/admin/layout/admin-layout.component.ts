import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SettingsStore } from '../../core/stores/settings.store';
import { I18nService } from '../../core/services/i18n.service';

interface NavItem {
  i18nKey: string;
  icon: string;
  route: string;
  permission?: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <!-- Mobile Overlay -->
    @if (sidebarOpen()) {
      <div class="fixed inset-0 bg-black/50 z-40 lg:hidden" (click)="sidebarOpen.set(false)"></div>
    }

    <div class="flex min-h-screen bg-[color:var(--color-bg-alt)]">
      <!-- Sidebar -->
      <aside
        class="fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-[color:var(--color-bg-sidebar)] text-white flex flex-col transition-transform duration-200"
        [class]="sidebarOpen() ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'">

        <!-- Brand -->
        <div class="h-16 flex items-center gap-3 px-5 border-b border-white/10 shrink-0">
          <div class="w-8 h-8 rounded-lg bg-[color:var(--color-primary)] flex items-center justify-center text-sm font-bold">
            {{ settingsStore.storeName().charAt(0) }}
          </div>
          <div class="overflow-hidden">
            <p class="font-bold text-sm truncate">{{ settingsStore.storeName() }}</p>
            <p class="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>

        <!-- Nav -->
        <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          @for (item of visibleNavItems(); track item.route) {
            <a [routerLink]="item.route"
               routerLinkActive="bg-white/10 text-white"
               [routerLinkActiveOptions]="{ exact: item.route === '/admin' }"
               (click)="sidebarOpen.set(false)"
               class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
              <span class="text-lg" [innerHTML]="item.icon"></span>
              <span>{{ i18n.t(item.i18nKey) }}</span>
            </a>
          }
        </nav>

        <!-- User -->
        <div class="p-4 border-t border-white/10 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-[color:var(--color-primary)] flex items-center justify-center text-sm font-bold">
              {{ authService.user()?.name?.charAt(0) || 'A' }}
            </div>
            <div class="flex-1 overflow-hidden">
              <p class="text-sm font-medium truncate">{{ authService.user()?.name || 'Admin' }}</p>
              <p class="text-xs text-gray-400 truncate">{{ authService.user()?.role }}</p>
            </div>
            <button (click)="authService.logout()" class="text-gray-400 hover:text-white" title="Logout">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Top Bar -->
        <header class="h-16 bg-white border-b border-[color:var(--color-border)] flex items-center px-4 gap-4 shrink-0 sticky top-0 z-30">
          <button (click)="sidebarOpen.set(true)" class="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div class="flex-1"></div>

          <!-- Language toggle -->
          <button (click)="i18n.toggle()" class="text-sm font-medium text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-100">
            {{ i18n.t('lang.switch') }}
          </button>

          <!-- Quick Actions -->
          <a routerLink="/admin/items/new" class="btn-primary text-xs py-1.5 hidden sm:inline-flex">+ {{ i18n.t('items.addNew') }}</a>
          <a routerLink="/admin/invoices/new" class="btn-accent text-xs py-1.5 hidden sm:inline-flex">+ {{ i18n.t('admin.nav.invoices') }}</a>

          <!-- Store link -->
          <a href="/" target="_blank" class="text-sm text-[color:var(--color-text-muted)] hover:text-[color:var(--color-primary)]" title="View Store">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </header>

        <!-- Page Content -->
        <main class="flex-1 p-4 md:p-6 overflow-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent {
  readonly authService = inject(AuthService);
  readonly settingsStore = inject(SettingsStore);
  readonly i18n = inject(I18nService);
  readonly sidebarOpen = signal(false);

  private readonly navItems: NavItem[] = [
    { i18nKey: 'admin.nav.dashboard', icon: '📊', route: '/admin' },
    { i18nKey: 'admin.nav.items', icon: '📱', route: '/admin/items', permission: 'items.create' },
    { i18nKey: 'admin.nav.itemTypes', icon: '🏷️', route: '/admin/item-types', permission: 'itemtypes.manage' },
    { i18nKey: 'admin.nav.brands', icon: '🏢', route: '/admin/brands', permission: 'brands.manage' },
    { i18nKey: 'admin.nav.categories', icon: '📁', route: '/admin/categories', permission: 'categories.manage' },
    { i18nKey: 'admin.nav.homeSections', icon: '🏠', route: '/admin/home', permission: 'home.manage' },
    { i18nKey: 'admin.nav.invoices', icon: '🧾', route: '/admin/invoices', permission: 'invoices.create' },
    { i18nKey: 'admin.nav.expenses', icon: '💸', route: '/admin/expenses', permission: 'expenses.manage' },
    { i18nKey: 'admin.nav.employees', icon: '👥', route: '/admin/employees', permission: 'employees.manage' },
    { i18nKey: 'admin.nav.leads', icon: '🎯', route: '/admin/leads', permission: 'leads.manage' },
    { i18nKey: 'admin.nav.settings', icon: '⚙️', route: '/admin/settings', permission: 'settings.edit' },
  ];

  visibleNavItems(): NavItem[] {
    return this.navItems.filter(item => {
      if (!item.permission) return true;
      return this.authService.hasPermission(item.permission as any);
    });
  }
}
