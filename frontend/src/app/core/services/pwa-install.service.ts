import { Injectable, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Captures the `beforeinstallprompt` event and exposes a method
 * to trigger the native PWA install dialog.
 */
@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private deferredPrompt: any = null;
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;

  /** True when the browser has fired beforeinstallprompt and the app is not yet installed */
  readonly canInstall = signal(false);

  /** True after the user accepted the install prompt */
  readonly installed = signal(false);

  constructor() {
    if (!this.window) return;

    this.window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.canInstall.set(true);
    });

    this.window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall.set(false);
      this.installed.set(true);
    });

    // Check if already installed (standalone mode)
    if (this.window.matchMedia?.('(display-mode: standalone)').matches) {
      this.installed.set(true);
    }
  }

  /** Triggers the native install prompt. Returns true if user accepted. */
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) return false;
    this.deferredPrompt.prompt();
    const result = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.canInstall.set(false);
    if (result.outcome === 'accepted') {
      this.installed.set(true);
      return true;
    }
    return false;
  }
}
