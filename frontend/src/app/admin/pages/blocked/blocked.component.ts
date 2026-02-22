import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-blocked',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div class="text-center max-w-md">
        <div class="text-6xl mb-4">🚫</div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
        <p class="text-gray-500 mb-6">
          You don't have permission to access this section. Contact your store owner for assistance.
        </p>
        <div class="flex flex-col gap-3 items-center">
          <a routerLink="/admin" class="btn-primary">Back to Dashboard</a>
          <button (click)="logout()" class="btn-outline text-sm">Sign Out</button>
        </div>
        <p class="text-xs text-gray-400 mt-8">
          Logged in as {{ authService.user()?.email }}
        </p>
      </div>
    </div>
  `,
})
export class BlockedComponent {
  readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
