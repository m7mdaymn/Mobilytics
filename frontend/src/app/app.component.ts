import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { TenantService } from './core/services/tenant.service';
import { SettingsStore } from './core/stores/settings.store';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

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
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (!this.tenantService.resolved()) {
      this.router.navigate(['/tenant-not-found']);
      return;
    }

    this.settingsStore.loadSettings().subscribe(settings => {
      if (settings && !settings.isActive) {
        const isAdmin = this.router.url.startsWith('/admin');
        if (!isAdmin) {
          this.router.navigate(['/inactive']);
        }
      }
    });
  }
}
