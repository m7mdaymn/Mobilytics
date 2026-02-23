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

    // Only load tenant settings if a tenant is resolved
    // Landing page and superadmin routes work without a tenant
    if (this.tenantService.resolved()) {
      this.settingsStore.loadSettings().subscribe(settings => {
        if (settings && !settings.isActive) {
          const url = this.router.url;
          const isAdmin = url.startsWith('/admin');
          const isSuperAdmin = url.startsWith('/superadmin');
          if (!isAdmin && !isSuperAdmin) {
            this.router.navigate(['/inactive']);
          }
        }
      });
    }
  }
}
