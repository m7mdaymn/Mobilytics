import { Component, inject } from '@angular/core';
import { SettingsStore } from '../../../core/stores/settings.store';

@Component({
  selector: 'app-inactive',
  standalone: true,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div class="text-center max-w-md">
        @if (settingsStore.settings()?.logoUrl) {
          <img [src]="settingsStore.settings()!.logoUrl" alt="Store logo" class="h-16 mx-auto mb-6" />
        }
        <h1 class="text-2xl font-bold mb-3">Store is Currently Inactive</h1>
        <p class="text-[color:var(--color-text-muted)] mb-6">
          This store is temporarily unavailable. Please check back later.
        </p>
        @if (settingsStore.showPoweredBy()) {
          <p class="text-xs text-gray-400">Powered by <strong>Nova Node</strong></p>
        }
      </div>
    </div>
  `,
})
export class InactiveComponent {
  readonly settingsStore = inject(SettingsStore);
}
