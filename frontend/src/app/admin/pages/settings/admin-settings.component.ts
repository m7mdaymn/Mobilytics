import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminStoreSettings, SocialLinks, PwaSettings, WhatsAppTemplates, THEME_PRESETS } from '../../../core/models/settings.models';
import { SettingsStore } from '../../../core/stores/settings.store';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ i18n.t('settings.title') }}</h1>

      <!-- Tabs -->
      <div class="flex gap-1 border-b border-gray-200">
        @for (tab of tabs; track tab.key) {
          <button (click)="activeTab.set(tab.key)"
            class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
            [class]="activeTab() === tab.key
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'">
            {{ tab.label }}
          </button>
        }
      </div>

      @if (settings(); as s) {
        <!-- Store Info -->
        @if (activeTab() === 'info') {
          <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 class="font-semibold text-lg text-gray-900">Store Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input [(ngModel)]="s.storeName" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Currency Code</label>
                <input [(ngModel)]="s.currencyCode" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" placeholder="EGP" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input [(ngModel)]="s.phoneNumber" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                <input [(ngModel)]="s.whatsAppNumber" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" placeholder="+201234567890" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input [(ngModel)]="s.logoUrl" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" placeholder="https://..." />
                @if (s.logoUrl) {
                  <img [src]="s.logoUrl" alt="Logo" class="mt-2 h-16 object-contain rounded" />
                }
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Banner URL</label>
                <input [(ngModel)]="s.bannerUrl" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" placeholder="https://..." />
              </div>
            </div>
            <button (click)="saveGeneral()" [disabled]="saving()" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
              {{ saving() ? 'Saving...' : 'Save Info' }}
            </button>
          </div>
        }

        <!-- Theme -->
        @if (activeTab() === 'theme') {
          <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('settings.theme') }}</h2>
            <p class="text-sm text-gray-500">Choose a theme preset for your store. Colors are applied automatically.</p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              @for (preset of themePresets; track preset.id) {
                <button (click)="selectPreset(preset.id)"
                  class="relative rounded-2xl border-2 p-4 transition-all hover:shadow-md"
                  [class]="selectedPreset() === preset.id
                    ? 'border-gray-900 shadow-lg ring-2 ring-gray-900/20'
                    : 'border-gray-200 hover:border-gray-400'">
                  @if (selectedPreset() === preset.id) {
                    <div class="absolute top-2 right-2 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                      <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                    </div>
                  }
                  <!-- Color swatches -->
                  <div class="flex gap-2 mb-3">
                    <div [style.background-color]="preset.primary" class="w-10 h-10 rounded-xl shadow-inner"></div>
                    <div [style.background-color]="preset.secondary" class="w-10 h-10 rounded-xl shadow-inner"></div>
                    <div [style.background-color]="preset.accent" class="w-10 h-10 rounded-xl shadow-inner"></div>
                  </div>
                  <!-- Preview bar -->
                  <div class="rounded-lg overflow-hidden h-6 flex">
                    <div [style.background-color]="preset.primary" class="flex-1"></div>
                    <div [style.background-color]="preset.secondary" class="flex-1"></div>
                    <div [style.background-color]="preset.accent" class="flex-1"></div>
                  </div>
                  <p class="text-sm font-semibold text-gray-900 mt-2">{{ preset.name }}</p>
                </button>
              }
            </div>
            <button (click)="saveTheme()" [disabled]="saving()" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
              {{ saving() ? 'Saving...' : 'Save Theme' }}
            </button>
          </div>
        }

        <!-- Footer -->
        @if (activeTab() === 'footer') {
          <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('settings.footer') }}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Footer Address</label>
                <input [(ngModel)]="footerAddress" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Working Hours</label>
                <input [(ngModel)]="workingHours" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" placeholder="9:00 AM - 10:00 PM" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Map URL</label>
                <input [(ngModel)]="mapUrl" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" placeholder="https://maps.google.com/..." />
              </div>
            </div>
            <h3 class="font-medium text-sm text-gray-700 mt-4">Social Links</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                <input [(ngModel)]="socialLinks.facebook" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                <input [(ngModel)]="socialLinks.instagram" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Twitter / X</label>
                <input [(ngModel)]="socialLinks.twitter" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">TikTok</label>
                <input [(ngModel)]="socialLinks.tiktok" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">YouTube</label>
                <input [(ngModel)]="socialLinks.youtube" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
            </div>
            <button (click)="saveFooter()" [disabled]="saving()" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
              {{ saving() ? 'Saving...' : 'Save Footer' }}
            </button>
          </div>
        }

        <!-- WhatsApp -->
        @if (activeTab() === 'whatsapp') {
          <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('settings.whatsapp') }}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Inquiry Template</label>
                <textarea [(ngModel)]="whatsAppTemplates.inquiryTemplate" rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none"
                  placeholder="Hi, I'm interested in {{'{{itemTitle}}'}}"></textarea>
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Follow-Up Template</label>
                <textarea [(ngModel)]="whatsAppTemplates.followUpTemplate" rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none"
                  placeholder="Hi, I wanted to follow up about..."></textarea>
              </div>
            </div>
            <button (click)="saveWhatsApp()" [disabled]="saving()" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
              {{ saving() ? 'Saving...' : 'Save WhatsApp' }}
            </button>
          </div>
        }

        <!-- PWA -->
        @if (activeTab() === 'pwa') {
          <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 class="font-semibold text-lg text-gray-900">{{ i18n.t('settings.pwa') }}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">App Name</label>
                <input [(ngModel)]="pwaSettings.appName" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
                <input [(ngModel)]="pwaSettings.shortName" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Theme Color</label>
                <div class="flex gap-2 items-center">
                  <input [(ngModel)]="pwaSettings.themeColor" type="color" class="w-10 h-10 rounded cursor-pointer border" />
                  <input [(ngModel)]="pwaSettings.themeColor" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                <div class="flex gap-2 items-center">
                  <input [(ngModel)]="pwaSettings.backgroundColor" type="color" class="w-10 h-10 rounded cursor-pointer border" />
                  <input [(ngModel)]="pwaSettings.backgroundColor" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
              </div>
            </div>
            <button (click)="savePwa()" [disabled]="saving()" class="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
              {{ saving() ? 'Saving...' : 'Save PWA' }}
            </button>
          </div>
        }
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
  readonly i18n = inject(I18nService);

  readonly settings = signal<AdminStoreSettings | null>(null);
  readonly activeTab = signal('info');
  readonly saving = signal(false);
  readonly selectedPreset = signal(1);

  themePresets = THEME_PRESETS;

  // Parsed local editing objects
  socialLinks: SocialLinks = {};
  footerAddress = '';
  workingHours = '';
  mapUrl = '';
  whatsAppTemplates: WhatsAppTemplates = { inquiryTemplate: '', followUpTemplate: '' };
  pwaSettings: PwaSettings = { appName: '', shortName: '', themeColor: '#111827', backgroundColor: '#ffffff' };

  tabs = [
    { key: 'info', label: 'Store Info' },
    { key: 'theme', label: 'Theme' },
    { key: 'footer', label: 'Footer' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'pwa', label: 'PWA' },
  ];

  ngOnInit(): void {
    this.api.get<AdminStoreSettings>('/Settings').subscribe(d => {
      if (d) {
        this.settings.set(d);
        this.selectedPreset.set(d.themePresetId || 1);

        // Parse JSON fields
        try { this.socialLinks = d.socialLinksJson ? JSON.parse(d.socialLinksJson) : {}; } catch { this.socialLinks = {}; }
        try { this.whatsAppTemplates = d.whatsAppTemplatesJson ? JSON.parse(d.whatsAppTemplatesJson) : { inquiryTemplate: '', followUpTemplate: '' }; } catch { this.whatsAppTemplates = { inquiryTemplate: '', followUpTemplate: '' }; }
        try { this.pwaSettings = d.pwaSettingsJson ? JSON.parse(d.pwaSettingsJson) : { appName: '', shortName: '', themeColor: '#111827', backgroundColor: '#ffffff' }; } catch { this.pwaSettings = { appName: '', shortName: '', themeColor: '#111827', backgroundColor: '#ffffff' }; }

        this.footerAddress = d.footerAddress || '';
        this.workingHours = d.workingHours || '';
        this.mapUrl = d.mapUrl || '';
      }
    });
  }

  selectPreset(id: number): void {
    this.selectedPreset.set(id);
  }

  saveGeneral(): void {
    const s = this.settings();
    if (!s) return;
    this.saving.set(true);
    this.api.put<AdminStoreSettings>('/Settings', s).subscribe({
      next: () => {
        this.settingsStore.loadSettings();
        this.toastService.success('Store info saved!');
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || 'Failed to save');
        this.saving.set(false);
      },
    });
  }

  saveTheme(): void {
    this.saving.set(true);
    this.api.put('/Settings/theme', { themePresetId: this.selectedPreset() }).subscribe({
      next: () => {
        const s = this.settings();
        if (s) { s.themePresetId = this.selectedPreset(); this.settings.set({ ...s }); }
        this.settingsStore.loadSettings();
        this.toastService.success('Theme saved!');
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || 'Failed to save theme');
        this.saving.set(false);
      },
    });
  }

  saveFooter(): void {
    this.saving.set(true);
    this.api.put('/Settings/footer', {
      footerAddress: this.footerAddress,
      workingHours: this.workingHours,
      socialLinksJson: JSON.stringify(this.socialLinks),
      mapUrl: this.mapUrl,
    }).subscribe({
      next: () => {
        this.settingsStore.loadSettings();
        this.toastService.success('Footer saved!');
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || 'Failed to save footer');
        this.saving.set(false);
      },
    });
  }

  saveWhatsApp(): void {
    this.saving.set(true);
    this.api.put('/Settings/whatsapp', {
      whatsAppTemplatesJson: JSON.stringify(this.whatsAppTemplates),
    }).subscribe({
      next: () => {
        this.toastService.success('WhatsApp settings saved!');
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || 'Failed to save');
        this.saving.set(false);
      },
    });
  }

  savePwa(): void {
    this.saving.set(true);
    this.api.put('/Settings/pwa', {
      pwaSettingsJson: JSON.stringify(this.pwaSettings),
    }).subscribe({
      next: () => {
        this.settingsStore.loadSettings();
        this.toastService.success('PWA settings saved!');
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || 'Failed to save');
        this.saving.set(false);
      },
    });
  }
}
