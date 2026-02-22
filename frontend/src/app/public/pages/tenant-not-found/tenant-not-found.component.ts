import { Component } from '@angular/core';

@Component({
  selector: 'app-tenant-not-found',
  standalone: true,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div class="text-center max-w-md">
        <div class="text-6xl mb-4">🏪</div>
        <h1 class="text-2xl font-bold mb-3">Store Not Found</h1>
        <p class="text-[color:var(--color-text-muted)] mb-6">
          We couldn't find the store you're looking for. The URL may be incorrect or the store may no longer exist.
        </p>
        <a href="https://mobilytics.com" class="btn-primary">Visit Mobilytics</a>
        <p class="text-xs text-gray-400 mt-8">Powered by <strong>Nova Node</strong></p>
      </div>
    </div>
  `,
})
export class TenantNotFoundComponent {}
