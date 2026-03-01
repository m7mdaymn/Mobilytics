import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../core/services/auth.service';
import { SettingsStore } from '../../core/stores/settings.store';
import { TenantService } from '../../core/services/tenant.service';
import { I18nService } from '../../core/services/i18n.service';
import { ApiService } from '../../core/services/api.service';
import { resolveImageUrl } from '../../core/utils/image.utils';

interface NavItem {
  i18nKey: string;
  icon: SafeHtml;
  route: string;
  permission?: string;
  separator?: boolean;
}

const ICON = (d: string, extra = '') =>
  `<svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="${d}"/>${extra}</svg>`;

const ICONS: Record<string, string> = {
  dashboard: ICON('M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z'),
  items: ICON('m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9'),
  brands: ICON('M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21'),
  categories: ICON('M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z',
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" stroke="currentColor" fill="currentColor" d="M6 6h.008v.008H6V6Z"/>'),
  invoices: ICON('M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z'),
  expenses: ICON('M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3'),
  employees: ICON('M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z'),
  leads: ICON('M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z'),
  installments: ICON('M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z'),
  settings: ICON('M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z',
    '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>'),
  help: ICON('M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z'),
};

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <!-- Mobile Overlay -->
    @if (sidebarOpen()) {
      <div class="fixed inset-0 bg-black/50 z-40 lg:hidden" (click)="sidebarOpen.set(false)"></div>
    }

    <div class="flex min-h-screen bg-gray-50">
      <!-- Sidebar -->
      <aside
        class="fixed lg:static inset-y-0 start-0 z-50 w-[260px] bg-gray-900 text-white flex flex-col transition-transform duration-200 shadow-xl"
        [class]="sidebarOpen() ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 rtl:translate-x-full rtl:lg:translate-x-0'">

        <!-- Store Brand -->
        <div class="h-16 flex items-center gap-3 px-5 border-b border-white/10 shrink-0">
          @if (settingsStore.settings()?.logoUrl) {
            <img [src]="resolveImg(settingsStore.settings()!.logoUrl!)" alt="" class="w-8 h-8 rounded-lg object-cover" />
          } @else {
            <div class="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-sm font-bold">
              {{ settingsStore.storeName().charAt(0) }}
            </div>
          }
          <div class="overflow-hidden flex-1">
            <p class="font-semibold text-sm truncate">{{ settingsStore.storeName() }}</p>
            <p class="text-[11px] text-gray-400 truncate">{{ i18n.t('admin.nav.dashboard') }}</p>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          @for (item of visibleNavItems(); track item.route) {
            @if (item.separator) {
              <div class="my-3 border-t border-white/5"></div>
            }
            <a [routerLink]="item.route"
               routerLinkActive="!bg-white/10 !text-white before:!opacity-100"
               [routerLinkActiveOptions]="{ exact: item.route === tenantService.adminUrl() }"
               (click)="sidebarOpen.set(false)"
               class="relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-all before:absolute before:start-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:rounded-e before:bg-indigo-400 before:opacity-0 before:transition-opacity">
              <span [innerHTML]="item.icon"></span>
              <span>{{ i18n.t(item.i18nKey) }}</span>
            </a>
          }
        </nav>

        <!-- User Section -->
        <div class="p-4 border-t border-white/10 shrink-0 space-y-3">
          <!-- Subscription Badge -->
          @if (subInfo()) {
            <div class="bg-white/5 rounded-xl p-3">
              <div class="flex items-center justify-between">
                <span class="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{{ i18n.t('subscription.plan') }}</span>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  [class]="subInfo()?.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                           subInfo()?.status === 'Trial' ? 'bg-blue-500/20 text-blue-400' :
                           subInfo()?.status === 'Grace' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'">
                  {{ subInfo()?.status }}
                </span>
              </div>
              <p class="text-sm font-semibold text-white mt-1">{{ subInfo()?.planName || '—' }}</p>
              @if (subInfo()?.endDate) {
                <p class="text-[11px] text-gray-400 mt-0.5">{{ i18n.t('subscription.expires') }}: {{ subInfo()!.endDate }}</p>
              }
            </div>
            @if (subInfo()?.supportWhatsApp) {
              <a [href]="'https://wa.me/' + subInfo()!.supportWhatsApp" target="_blank"
                class="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                {{ i18n.t('subscription.contactSupport') }}
              </a>
            }
          }
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-indigo-500/80 flex items-center justify-center text-sm font-bold">
              {{ authService.user()?.name?.charAt(0) || 'A' }}
            </div>
            <div class="flex-1 overflow-hidden">
              <p class="text-sm font-medium truncate">{{ authService.user()?.name || 'Admin' }}</p>
              <p class="text-[11px] text-gray-400 truncate">{{ authService.user()?.role }}</p>
            </div>
            <button (click)="authService.logout()" class="text-gray-500 hover:text-white transition-colors" [title]="i18n.t('auth.logout')">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Top Bar -->
        <header class="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0 sticky top-0 z-30 shadow-sm">
          <button (click)="sidebarOpen.set(true)" class="lg:hidden p-1.5 -ms-1 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div class="flex-1"></div>

          <!-- Notification Bell -->
          <div class="relative">
            <button (click)="notifOpen.set(!notifOpen())" class="relative p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/>
              </svg>
              @if (unreadCount() > 0) {
                <span class="absolute -top-0.5 -end-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{{ unreadCount() > 9 ? '9+' : unreadCount() }}</span>
              }
            </button>
            @if (notifOpen()) {
              <div class="absolute end-0 top-10 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-200 z-50">
                <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 class="text-sm font-semibold text-gray-900">{{ i18n.t('notifications.title') }}</h3>
                  @if (unreadCount() > 0) {
                    <button (click)="markAllRead()" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">{{ i18n.t('notifications.markAllRead') }}</button>
                  }
                </div>
                @if (notifications().length === 0) {
                  <p class="text-sm text-gray-400 text-center py-8">{{ i18n.t('notifications.empty') }}</p>
                } @else {
                  @for (n of notifications(); track n.id) {
                    <div (click)="onNotifClick(n)" class="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                      [class.bg-indigo-50]="!n.isRead">
                      <div class="flex items-start gap-2">
                        <div class="w-2 h-2 mt-1.5 rounded-full shrink-0" [class]="n.isRead ? 'bg-transparent' : 'bg-indigo-500'"></div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-gray-900 truncate">{{ n.title }}</p>
                          @if (n.message) { <p class="text-xs text-gray-500 mt-0.5 truncate">{{ n.message }}</p> }
                          <p class="text-[10px] text-gray-400 mt-1">{{ formatTimeAgo(n.createdAt) }}</p>
                        </div>
                      </div>
                    </div>
                  }
                }
              </div>
            }
          </div>

          <!-- Language -->
          <button (click)="i18n.toggle()"
            class="text-xs font-semibold text-gray-500 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors">
            {{ i18n.t('lang.switch') }}
          </button>

          <!-- Quick Actions -->
          @if (authService.hasPermission('items.create')) {
          <a [routerLink]="tenantService.adminUrl() + '/items/new'"
            class="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            {{ i18n.t('items.addNew') }}
          </a>
          }
          @if (authService.hasPermission('invoices.create')) {
          <a [routerLink]="tenantService.adminUrl() + '/invoices/new'"
            class="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            {{ i18n.t('invoices.create') }}
          </a>
          }

          <!-- View Store -->
          <a [routerLink]="tenantService.storeUrl()" target="_blank"
            class="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors" title="View Store">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
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
  readonly tenantService = inject(TenantService);
  readonly i18n = inject(I18nService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly sidebarOpen = signal(false);
  readonly notifOpen = signal(false);
  readonly resolveImg = resolveImageUrl;
  readonly subInfo = signal<{ planName?: string; status?: string; endDate?: string; supportWhatsApp?: string } | null>(null);
  readonly notifications = signal<any[]>([]);
  readonly unreadCount = signal(0);

  private icon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] || '');
  }

  constructor() {
    this.api.get<any>('/Settings/subscription').subscribe({
      next: s => this.subInfo.set(s),
    });
    this.loadNotifications();
    // Poll every 60s
    setInterval(() => this.loadNotifications(), 60000);
  }

  loadNotifications(): void {
    this.api.get<any[]>('/Notifications').subscribe({
      next: list => this.notifications.set(list || []),
    });
    this.api.get<{ count: number }>('/Notifications/unread-count').subscribe({
      next: r => this.unreadCount.set(r?.count || 0),
    });
  }

  markAllRead(): void {
    this.api.patch('/Notifications/read-all', {}).subscribe({
      next: () => {
        this.unreadCount.set(0);
        this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
      },
    });
  }

  onNotifClick(n: any): void {
    if (!n.isRead) {
      this.api.patch(`/Notifications/${n.id}/read`, {}).subscribe();
      n.isRead = true;
      this.unreadCount.update(c => Math.max(0, c - 1));
    }
    this.notifOpen.set(false);
    if (n.actionUrl) {
      this.router.navigateByUrl(this.tenantService.adminUrl() + n.actionUrl);
    }
  }

  formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  readonly visibleNavItems = computed(() => {
    const base = this.tenantService.adminUrl();
    const items: NavItem[] = [
      { i18nKey: 'admin.nav.dashboard', icon: this.icon('dashboard'), route: base },
      { i18nKey: 'admin.nav.items', icon: this.icon('items'), route: base + '/items', permission: 'items.create' },
      { i18nKey: 'admin.nav.categories', icon: this.icon('categories'), route: base + '/categories', permission: 'categories.manage' },
      { i18nKey: 'admin.nav.brands', icon: this.icon('brands'), route: base + '/brands', permission: 'brands.manage' },
      { i18nKey: 'admin.nav.invoices', icon: this.icon('invoices'), route: base + '/invoices', permission: 'invoices.create', separator: true },
      { i18nKey: 'admin.nav.expenses', icon: this.icon('expenses'), route: base + '/expenses', permission: 'expenses.manage' },
      { i18nKey: 'admin.nav.employees', icon: this.icon('employees'), route: base + '/employees', permission: 'employees.manage', separator: true },
      { i18nKey: 'admin.nav.leads', icon: this.icon('leads'), route: base + '/leads', permission: 'leads.manage' },
      { i18nKey: 'admin.nav.installments', icon: this.icon('installments'), route: base + '/installments', permission: 'settings.edit' },
      { i18nKey: 'admin.nav.settings', icon: this.icon('settings'), route: base + '/settings', permission: 'settings.edit', separator: true },
      { i18nKey: 'admin.nav.onboarding', icon: this.icon('help'), route: base + '/onboarding' },
    ];
    return items.filter(item => {
      if (!item.permission) return true;
      return this.authService.hasPermission(item.permission as any);
    });
  });
}
