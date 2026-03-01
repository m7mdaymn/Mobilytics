import { Component, inject } from '@angular/core';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="fixed top-4 end-4 z-[9999] flex flex-col gap-2 max-w-sm w-full">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="p-4 rounded-lg shadow-lg text-white text-sm font-medium flex items-center justify-between animate-slide-in"
          [class]="getClass(toast)">
          <span>{{ toast.message }}</span>
          <button (click)="toastService.remove(toast.id)" class="ms-3 opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-slide-in {
      animation: slideInRight 0.3s ease-out;
    }
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `],
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  getClass(toast: Toast): string {
    const base = 'p-4 rounded-lg shadow-lg text-white text-sm font-medium flex items-center justify-between animate-slide-in';
    switch (toast.type) {
      case 'success': return `${base} bg-green-600`;
      case 'error': return `${base} bg-red-600`;
      case 'warning': return `${base} bg-yellow-600`;
      case 'info': return `${base} bg-blue-600`;
      default: return base;
    }
  }
}
