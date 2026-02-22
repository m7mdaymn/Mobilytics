import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { SettingsStore } from '../../../core/stores/settings.store';
import { StoreSettings } from '../../../core/models/settings.models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="theme-switcher-toggle">
      <button 
        (click)="toggleMenu()"
        class="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        [class.dark]="settingsStore.themeId() === 2">
        🎨 Theme
      </button>

      @if (showMenu()) {
        <div class="theme-switcher-menu absolute top-full right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div class="p-4 space-y-3">
            <!-- Color Picker for Primary Color -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Primary Color</label>
              <div class="flex gap-2">
                <input 
                  type="color" 
                  [(ngModel)]="primaryColor" 
                  (change)="applyThemeColor('primary')"
                  class="w-10 h-10 rounded cursor-pointer border border-gray-300">
                <input 
                  type="text" 
                  [(ngModel)]="primaryColor" 
                  (change)="applyThemeColor('primary')"
                  placeholder="#2563eb"
                  class="flex-1 px-2 py-1 text-xs border border-gray-300 rounded font-mono">
              </div>
            </div>

            <!-- Color Picker for Secondary Color -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Secondary Color</label>
              <div class="flex gap-2">
                <input 
                  type="color" 
                  [(ngModel)]="secondaryColor" 
                  (change)="applyThemeColor('secondary')"
                  class="w-10 h-10 rounded cursor-pointer border border-gray-300">
                <input 
                  type="text" 
                  [(ngModel)]="secondaryColor" 
                  (change)="applyThemeColor('secondary')"
                  placeholder="#64748b"
                  class="flex-1 px-2 py-1 text-xs border border-gray-300 rounded font-mono">
              </div>
            </div>

            <!-- Color Picker for Accent Color -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Accent Color</label>
              <div class="flex gap-2">
                <input 
                  type="color" 
                  [(ngModel)]="accentColor" 
                  (change)="applyThemeColor('accent')"
                  class="w-10 h-10 rounded cursor-pointer border border-gray-300">
                <input 
                  type="text" 
                  [(ngModel)]="accentColor" 
                  (change)="applyThemeColor('accent')"
                  placeholder="#f97316"
                  class="flex-1 px-2 py-1 text-xs border border-gray-300 rounded font-mono">
              </div>
            </div>

            <!-- Theme Presets -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Preset Themes</label>
              <div class="grid grid-cols-3 gap-2">
                @for (preset of themePresets; track preset.id) {
                  <button 
                    (click)="applyPreset(preset)"
                    class="p-2 rounded border-2 transition"
                    [class.border-gray-500]="preset.id !== selectedPreset()"
                    [class.border-blue-500]="preset.id === selectedPreset()"
                    [title]="preset.name">
                    <div class="flex gap-1">
                      <div [style.background-color]="preset.primary" class="w-5 h-5 rounded"></div>
                      <div [style.background-color]="preset.secondary" class="w-5 h-5 rounded"></div>
                      <div [style.background-color]="preset.accent" class="w-5 h-5 rounded"></div>
                    </div>
                    <p class="text-xs mt-1 font-medium">{{ preset.name }}</p>
                  </button>
                }
              </div>
            </div>

            <!-- Save Button -->
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
  selectedPreset = signal<number>(-1);

  primaryColor = signal('#2563eb');
  secondaryColor = signal('#64748b');
  accentColor = signal('#f97316');

  themePresets = [
    { id: 1, name: 'Blue', primary: '#2563eb', secondary: '#64748b', accent: '#f97316' },
    { id: 2, name: 'Purple', primary: '#7c3aed', secondary: '#6b21a8', accent: '#ec4899' },
    { id: 3, name: 'Green', primary: '#059669', secondary: '#047857', accent: '#f97316' },
    { id: 4, name: 'Red', primary: '#dc2626', secondary: '#991b1b', accent: '#f59e0b' },
    { id: 5, name: 'Dark', primary: '#1f2937', secondary: '#111827', accent: '#60a5fa' },
    { id: 6, name: 'Teal', primary: '#0891b2', secondary: '#0e7490', accent: '#06b6d4' },
  ];

  constructor() {
    this.initializeColors();
  }

  private initializeColors(): void {
    const settings = this.settingsStore.settings();
    if (settings) {
      this.primaryColor.set(settings.primaryColor || '#2563eb');
      this.secondaryColor.set(settings.secondaryColor || '#64748b');
      this.accentColor.set(settings.accentColor || '#f97316');
    }
  }

  toggleMenu(): void {
    this.showMenu.update(v => !v);
  }

  applyThemeColor(type: 'primary' | 'secondary' | 'accent'): void {
    const root = document.documentElement;
    const colorValue = 
      type === 'primary' ? this.primaryColor() :
      type === 'secondary' ? this.secondaryColor() :
      this.accentColor();
    
    const cssVar = `--color-${type}`;
    root.style.setProperty(cssVar, colorValue);
  }

  applyPreset(preset: typeof this.themePresets[0]): void {
    this.primaryColor.set(preset.primary);
    this.secondaryColor.set(preset.secondary);
    this.accentColor.set(preset.accent);
    this.selectedPreset.set(preset.id);

    this.applyThemeColor('primary');
    this.applyThemeColor('secondary');
    this.applyThemeColor('accent');
  }

  saveTheme(): void {
    this.saving.set(true);
    const settings = {
      primaryColor: this.primaryColor(),
      secondaryColor: this.secondaryColor(),
      accentColor: this.accentColor(),
    };

    this.api.put('/Settings', settings).subscribe({
      next: () => {
        alert('Theme saved successfully!');
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
