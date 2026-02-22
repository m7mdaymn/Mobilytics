import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { PlatformAuthService } from '../../core/services/platform-auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-platform-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <!-- Mobile Overlay -->
    @if (sidebarOpen()) {
      <div class="fixed inset-0 bg-black/50 z-40 lg:hidden" (click)="sidebarOpen.set(false)"></div>
    }

    <div class="flex min-h-screen bg-slate-100">
      <!-- Sidebar -->
      <aside
        class="fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-slate-900 text-white flex flex-col transition-transform duration-200"
        [class]="sidebarOpen() ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'">

        <!-- Brand -->
        <div class="h-16 flex items-center gap-3 px-5 border-b border-white/10 shrink-0">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold shadow-lg">
            M
          </div>
          <div class="overflow-hidden">
            <p class="font-bold text-base">Mobilytics</p>
            <p class="text-xs text-slate-400">Platform Admin</p>
          </div>
        </div>

        <!-- Nav -->
        <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          @for (item of navItems; track item.route) {
            <a [routerLink]="item.route"
               routerLinkActive="bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-400"
               [routerLinkActiveOptions]="{ exact: item.route === '/superadmin' }"
               (click)="sidebarOpen.set(false)"
               class="flex items-center gap-3 px-4 py-2.5 rounded-r-lg text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
              <span class="text-lg">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <!-- User -->
        <div class="p-4 border-t border-white/10 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold">
              {{ platformAuth.user()?.name?.charAt(0) || 'S' }}
            </div>
            <div class="flex-1 overflow-hidden">
              <p class="text-sm font-medium truncate">{{ platformAuth.user()?.name || 'SuperAdmin' }}</p>
              <p class="text-xs text-slate-400 truncate">{{ platformAuth.user()?.email }}</p>
            </div>
            <button (click)="platformAuth.logout()" class="text-slate-400 hover:text-white p-2" title="Logout">
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
        <header class="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 shrink-0 sticky top-0 z-30 shadow-sm">
          <button (click)="sidebarOpen.set(true)" class="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div class="flex-1"></div>

          <!-- Quick Actions -->
          <a routerLink="/superadmin/tenants/create" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-lg font-medium transition-colors hidden sm:inline-flex items-center gap-2">
            <span>+ New Tenant</span>
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
export class PlatformLayoutComponent {
  readonly platformAuth = inject(PlatformAuthService);
  readonly sidebarOpen = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: '📊', route: '/superadmin' },
    { label: 'Tenants', icon: '🏢', route: '/superadmin/tenants' },
    { label: 'Plans', icon: '💎', route: '/superadmin/plans' },
    { label: 'Subscriptions', icon: '📋', route: '/superadmin/subscriptions' },
    { label: 'Features', icon: '⚡', route: '/superadmin/features' },
  ];
}
