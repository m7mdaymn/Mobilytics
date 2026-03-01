import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { TenantService } from './core/services/tenant.service';
import { SettingsStore } from './core/stores/settings.store';
import { I18nService } from './core/services/i18n.service';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <router-outlet />
    <app-toast-container />
  `,
  styles: [':host { display: block; min-height: 100vh; }'],
})
export class AppComponent implements OnInit {
  private readonly tenantService = inject(TenantService);
  private readonly settingsStore = inject(SettingsStore);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    // Initialize i18n (applies saved or default language)
    this.i18n.init();

    // Settings are loaded after tenant resolution by the guard + SettingsStore.
    // Watch for navigation to detect when settings should be loaded.
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e) => {
      const event = e as NavigationEnd;
      if (this.tenantService.resolved() && event.urlAfterRedirects.startsWith('/store/')) {
        // Load settings if not already loaded
        if (!this.settingsStore.settings()) {
          this.settingsStore.loadSettings().subscribe(settings => {
            if (settings && !settings.isActive) {
              const url = event.urlAfterRedirects;
              const isAdmin = /\/store\/[^/]+\/admin/.test(url);
              const isSuperAdmin = url.startsWith('/superadmin');
              if (!isAdmin && !isSuperAdmin) {
                this.router.navigate(['/inactive']);
              }
            }
          });
        }
      }
    });
  }
}
