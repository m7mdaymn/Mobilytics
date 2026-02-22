import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _counter = 0;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string, duration = 4000): void {
    this.add({ message, type: 'success', duration });
  }

  error(message: string, duration = 6000): void {
    this.add({ message, type: 'error', duration });
  }

  warning(message: string, duration = 5000): void {
    this.add({ message, type: 'warning', duration });
  }

  info(message: string, duration = 4000): void {
    this.add({ message, type: 'info', duration });
  }

  remove(id: number): void {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  private add(partial: Omit<Toast, 'id'>): void {
    const id = ++this._counter;
    const toast: Toast = { id, ...partial };
    this._toasts.update(toasts => [...toasts, toast]);
    setTimeout(() => this.remove(id), partial.duration);
  }
}
