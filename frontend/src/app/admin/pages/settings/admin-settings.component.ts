import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { StoreSettings } from '../../../core/models/settings.models';
import { SettingsStore } from '../../../core/stores/settings.store';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold">Store Settings</h1>

      <!-- Tabs -->
      <div class="flex gap-1 border-b">
        @for (tab of tabs; track tab.key) {
          <button (click)="activeTab.set(tab.key)"
            class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
            [class]="activeTab() === tab.key ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'">
            {{ tab.label }}
          </button>
        }
      </div>

      @if (settings(); as s) {
        <!-- Store Info -->
        @if (activeTab() === 'info') {
          <div class="card p-6 space-y-4">
            <h2 class="font-semibold text-lg">Store Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Store Name</label>
                <input [(ngModel)]="s.storeName" class="input-field" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Slug</label>
                <input [value]="s.slug" disabled class="input-field bg-gray-50" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Tagline</label>
                <input [(ngModel)]="s.tagline" class="input-field" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Currency</label>
                <input [(ngModel)]="s.currency" class="input-field" placeholder="EGP" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Phone</label>
                <input [(ngModel)]="s.contactPhone" class="input-field" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Email</label>
                <input [(ngModel)]="s.contactEmail" class="input-field" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium mb-1">Address</label>
                <input [(ngModel)]="s.address" class="input-field" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium mb-1">Google Maps URL</label>
                <input [(ngModel)]="s.googleMapsUrl" class="input-field" placeholder="https://maps.google.com/..." />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Logo URL</label>
                <input [(ngModel)]="s.logoUrl" class="input-field" placeholder="https://..." />
                @if (s.logoUrl) {
                  <img [src]="s.logoUrl" alt="Logo" class="mt-2 h-16 object-contain" />
                }
              </div>
            </div>
          </div>
        }

        <!-- Theme -->
        @if (activeTab() === 'theme') {
          <div class="card p-6 space-y-4">
            <h2 class="font-semibold text-lg">Theme Settings</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Theme</label>
                <select [(ngModel)]="s.theme.themeId" class="input-field">
                  <option [value]="1">Theme 1 — Modern</option>
                  <option [value]="2">Theme 2 — Classic</option>
                  <option [value]="3">Theme 3 — Minimal</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Primary Color</label>
                <div class="flex gap-2 items-center">
                  <input [(ngModel)]="s.theme.primaryColor" type="color" class="w-10 h-10 rounded cursor-pointer" />
                  <input [(ngModel)]="s.theme.primaryColor" class="input-field flex-1" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Secondary Color</label>
                <div class="flex gap-2 items-center">
                  <input [(ngModel)]="s.theme.secondaryColor" type="color" class="w-10 h-10 rounded cursor-pointer" />
                  <input [(ngModel)]="s.theme.secondaryColor" class="input-field flex-1" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Accent Color</label>
                <div class="flex gap-2 items-center">
                  <input [(ngModel)]="s.theme.accentColor" type="color" class="w-10 h-10 rounded cursor-pointer" />
                  <input [(ngModel)]="s.theme.accentColor" class="input-field flex-1" />
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Footer -->
        @if (activeTab() === 'footer') {
          <div class="card p-6 space-y-4">
            <h2 class="font-semibold text-lg">Footer Settings</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="flex items-center gap-2">
                <input type="checkbox" [(ngModel)]="s.footer.showPoweredBy" class="w-4 h-4 rounded" />
                <span class="text-sm">Show "Powered by Mobilytics"</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" [(ngModel)]="s.footer.showMap" class="w-4 h-4 rounded" />
                <span class="text-sm">Show map in footer</span>
              </label>
            </div>
            <h3 class="font-medium text-sm mt-4">Social Links</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Facebook</label>
                <input [(ngModel)]="s.socialLinks.facebook" class="input-field" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Instagram</label>
                <input [(ngModel)]="s.socialLinks.instagram" class="input-field" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Twitter / X</label>
                <input [(ngModel)]="s.socialLinks.twitter" class="input-field" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">TikTok</label>
                <input [(ngModel)]="s.socialLinks.tiktok" class="input-field" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">YouTube</label>
                <input [(ngModel)]="s.socialLinks.youtube" class="input-field" />
              </div>
            </div>
          </div>
        }

        <!-- WhatsApp -->
        @if (activeTab() === 'whatsapp') {
          <div class="card p-6 space-y-4">
            <h2 class="font-semibold text-lg">WhatsApp Settings</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">WhatsApp Number</label>
                <input [(ngModel)]="s.whatsapp.phoneNumber" class="input-field" placeholder="+201234567890" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Default Message Template</label>
                <input [(ngModel)]="s.whatsapp.defaultMessage" class="input-field" placeholder="Hi, I'm interested in {{'{{itemTitle}}'}}" />
              </div>
              <label class="flex items-center gap-2">
                <input type="checkbox" [(ngModel)]="s.whatsapp.showOnItemCard" class="w-4 h-4 rounded" />
                <span class="text-sm">Show WhatsApp button on item cards</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" [(ngModel)]="s.whatsapp.showFloatingButton" class="w-4 h-4 rounded" />
                <span class="text-sm">Show floating WhatsApp button</span>
              </label>
            </div>
          </div>
        }

        <!-- PWA -->
        @if (activeTab() === 'pwa') {
          <div class="card p-6 space-y-4">
            <h2 class="font-semibold text-lg">PWA Settings</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">App Name</label>
                <input [(ngModel)]="s.pwa.appName" class="input-field" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Short Name</label>
                <input [(ngModel)]="s.pwa.shortName" class="input-field" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Theme Color</label>
                <div class="flex gap-2 items-center">
                  <input [(ngModel)]="s.pwa.themeColor" type="color" class="w-10 h-10 rounded cursor-pointer" />
                  <input [(ngModel)]="s.pwa.themeColor" class="input-field flex-1" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Background Color</label>
                <div class="flex gap-2 items-center">
                  <input [(ngModel)]="s.pwa.backgroundColor" type="color" class="w-10 h-10 rounded cursor-pointer" />
                  <input [(ngModel)]="s.pwa.backgroundColor" class="input-field flex-1" />
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Save -->
        <div class="flex gap-3">
          <button (click)="save()" class="btn-primary" [disabled]="saving()">Save Settings</button>
        </div>
      } @else {
        <div class="text-center py-12 text-gray-400">Loading settings...</div>
      }
    </div>
  `,
})
export class AdminSettingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);
  private readonly settingsStore = inject(SettingsStore);

  readonly settings = signal<StoreSettings | null>(null);
  readonly activeTab = signal('info');
  readonly saving = signal(false);

  tabs = [
    { key: 'info', label: 'Store Info' },
    { key: 'theme', label: 'Theme' },
    { key: 'footer', label: 'Footer' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'pwa', label: 'PWA' },
  ];

  ngOnInit(): void {
    this.api.get<StoreSettings>('/Settings').subscribe(d => {
      if (d) {
        // Ensure nested objects exist
        d.theme = d.theme || { themeId: 1, primaryColor: '#2563eb', secondaryColor: '#1e293b', accentColor: '#f59e0b' };
        d.footer = d.footer || { showPoweredBy: true, showMap: false };
        d.socialLinks = d.socialLinks || {} as any;
        d.whatsapp = d.whatsapp || {} as any;
        d.pwa = d.pwa || {} as any;
        this.settings.set(d);
      }
    });
  }

  save(): void {
    const s = this.settings();
    if (!s) return;
    this.saving.set(true);
    this.api.put('/Settings', s).subscribe({
      next: () => {
        this.settingsStore.loadSettings(); // Refresh global settings
        this.toastService.success('Settings saved!');
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || 'Failed to save');
        this.saving.set(false);
      },
    });
  }
}
