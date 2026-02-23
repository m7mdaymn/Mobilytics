import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { SettingsStore } from '../../../core/stores/settings.store';
import { THEME_PRESETS } from '../../../core/models/settings.models';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [],
  template: `
    <div class="theme-switcher-toggle">
      <button
        (click)="toggleMenu()"
        class="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 transition">
        🎨 Theme
      </button>

      @if (showMenu()) {
        <div class="theme-switcher-menu absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div class="p-4 space-y-3">
            <label class="block text-xs font-semibold text-gray-700 mb-2">Theme Presets</label>
            <div class="grid grid-cols-2 gap-2">
              @for (preset of themePresets; track preset.id) {
                <button
                  (click)="selectPreset(preset.id)"
                  class="p-3 rounded-lg border-2 transition"
                  [class]="selectedPreset() === preset.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-400'">
                  <div class="flex gap-1 mb-1">
                    <div [style.background-color]="preset.primary" class="w-5 h-5 rounded-full"></div>
                    <div [style.background-color]="preset.secondary" class="w-5 h-5 rounded-full"></div>
                    <div [style.background-color]="preset.accent" class="w-5 h-5 rounded-full"></div>
                  </div>
                  <p class="text-xs font-medium text-gray-700">{{ preset.name }}</p>
                </button>
              }
            </div>

            <button
              (click)="saveTheme()"
              [disabled]="saving()"
              class="w-full px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 disabled:opacity-50 transition">
              {{ saving() ? 'Saving...' : 'Save Theme' }}
            </button>
          </div>
        </div>
      }
    </div>

    <style>
      .theme-switcher-toggle {
        position: relative;
      }

      .theme-switcher-menu {
        min-width: 280px;
      }
    </style>
  `,
})
export class ThemeSwitcherComponent {
  private readonly api = inject(ApiService);
  readonly settingsStore = inject(SettingsStore);

  showMenu = signal(false);
  saving = signal(false);
  selectedPreset = signal(1);

  themePresets = THEME_PRESETS;

  constructor() {
    this.selectedPreset.set(this.settingsStore.themePresetId());
  }

  toggleMenu(): void {
    this.showMenu.update(v => !v);
  }

  selectPreset(id: number): void {
    this.selectedPreset.set(id);
    // Live preview
    const preset = THEME_PRESETS.find(p => p.id === id);
    if (preset) {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', preset.primary);
      root.style.setProperty('--color-secondary', preset.secondary);
      root.style.setProperty('--color-accent', preset.accent);
    }
  }

  saveTheme(): void {
    this.saving.set(true);
    this.api.put('/Settings/theme', { themePresetId: this.selectedPreset() }).subscribe({
      next: () => {
        this.settingsStore.loadSettings();
        this.saving.set(false);
        this.showMenu.set(false);
      },
      error: () => {
        alert('Failed to save theme');
        this.saving.set(false);
      },
    });
  }
}
