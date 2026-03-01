import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CompareStore } from '../../../core/stores/compare.store';
import { SettingsStore } from '../../../core/stores/settings.store';
import { WhatsAppService } from '../../../core/services/whatsapp.service';
import { I18nService } from '../../../core/services/i18n.service';
import { TenantService } from '../../../core/services/tenant.service';
import { resolveImageUrl } from '../../../core/utils/image.utils';
import { Item, CustomFieldValue } from '../../../core/models/item.models';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ i18n.t('compare.title') }} ({{ compareStore.count() }}/2)</h1>
        </div>
        @if (compareStore.count() > 0) {
          <button (click)="compareStore.clear()"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            {{ i18n.t('compare.clearAll') }}
          </button>
        }
      </div>

      @if (compareStore.count() === 0) {
        <!-- Empty state -->
        <div class="text-center py-20">
          <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 class="text-lg font-bold text-gray-900 mb-2">{{ i18n.t('compare.noItems') }}</h2>
          <p class="text-gray-500 mb-6 text-sm max-w-md mx-auto">{{ i18n.t('compare.addItems') }}</p>
          <a [routerLink]="tenantService.storeUrl() + '/catalog'"
            class="inline-flex items-center gap-2 bg-[color:var(--color-primary)] text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition text-sm">
            {{ i18n.t('compare.browseCatalog') }}
          </a>
        </div>
      } @else {
        <!-- Comparison Table -->
        <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <!-- Product Headers -->
          <div class="grid border-b border-gray-100" [style.grid-template-columns]="'200px repeat(' + compareStore.count() + ', 1fr)'">
            <div class="p-4 bg-gray-50"></div>
            @for (item of compareStore.items(); track item.id) {
              <div class="p-4 text-center border-s border-gray-100 relative">
                <button (click)="compareStore.remove(item.id)"
                  class="absolute top-2 end-2 w-7 h-7 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center text-sm transition">&times;</button>
                <a [routerLink]="tenantService.storeUrl() + '/item/' + item.slug" class="block group">
                  <div class="w-28 h-28 mx-auto mb-3 rounded-xl overflow-hidden bg-gray-50">
                    @if (item.mainImageUrl) {
                      <img [src]="resolveImg(item.mainImageUrl)" [alt]="item.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center text-gray-300">
                        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      </div>
                    }
                  </div>
                  <h3 class="font-bold text-sm text-gray-900 group-hover:text-[color:var(--color-primary)] transition line-clamp-2">{{ item.title }}</h3>
                </a>
                <div class="text-lg font-bold text-[color:var(--color-primary)] mt-2">
                  {{ item.price | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
                </div>
                @if (item.oldPrice && item.oldPrice > item.price) {
                  <div class="text-xs text-gray-400 line-through">{{ item.oldPrice | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</div>
                }
              </div>
            }
          </div>

          <!-- Comparison Rows -->
          @for (row of comparisonRows(); track row.key; let odd = $odd) {
            <div [class]="'grid' + (odd ? ' bg-gray-50/50' : '')" [style.grid-template-columns]="'200px repeat(' + compareStore.count() + ', 1fr)'">
              <div class="px-5 py-3.5 text-sm font-medium text-gray-500 flex items-center">{{ row.label }}</div>
              @for (val of row.values; track $index) {
                <div class="px-5 py-3.5 text-sm font-semibold text-gray-900 border-s border-gray-100 flex items-center"
                  [class.text-emerald-600]="row.highlight === $index"
                  [class.font-bold]="row.highlight === $index">
                  {{ val }}
                </div>
              }
            </div>
          }

          <!-- WhatsApp buttons -->
          <div class="grid border-t border-gray-100" [style.grid-template-columns]="'200px repeat(' + compareStore.count() + ', 1fr)'">
            <div class="p-4"></div>
            @for (item of compareStore.items(); track item.id) {
              <div class="p-4 border-s border-gray-100">
                <button (click)="onWhatsApp(item)"
                  class="w-full inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.685-1.228A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.34 0-4.527-.655-6.395-1.795l-.372-.23-3.236.849.863-3.153-.253-.403A9.957 9.957 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  {{ i18n.t('compare.askWhatsApp') }}
                </button>
              </div>
            }
          </div>
        </div>

        <!-- Mobile view: stacked cards -->
        <div class="md:hidden mt-6 space-y-4">
          @for (item of compareStore.items(); track item.id) {
            <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div class="flex items-start gap-3 p-4 border-b border-gray-50">
                <div class="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                  @if (item.mainImageUrl) {
                    <img [src]="resolveImg(item.mainImageUrl)" [alt]="item.title" class="w-full h-full object-cover" />
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <a [routerLink]="tenantService.storeUrl() + '/item/' + item.slug" class="font-bold text-sm text-gray-900 line-clamp-2">{{ item.title }}</a>
                  <div class="text-lg font-bold text-[color:var(--color-primary)] mt-1">
                    {{ item.price | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
                  </div>
                </div>
                <button (click)="compareStore.remove(item.id)"
                  class="w-7 h-7 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center text-sm shrink-0">&times;</button>
              </div>
              <div class="divide-y divide-gray-50">
                @for (row of getMobileRows(item); track row.label; let odd = $odd) {
                  <div [class]="'flex justify-between px-4 py-2.5 text-sm' + (odd ? ' bg-gray-50/50' : '')">
                    <span class="text-gray-500">{{ row.label }}</span>
                    <span class="font-semibold text-gray-900">{{ row.value }}</span>
                  </div>
                }
              </div>
              <div class="p-4 border-t border-gray-100">
                <button (click)="onWhatsApp(item)"
                  class="w-full inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.685-1.228A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.34 0-4.527-.655-6.395-1.795l-.372-.23-3.236.849.863-3.153-.253-.403A9.957 9.957 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  {{ i18n.t('compare.askWhatsApp') }}
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    /* Hide desktop table on mobile, show cards */
    @media (max-width: 767px) {
      .bg-white.rounded-2xl.border { display: none; }
    }
    @media (min-width: 768px) {
      .md\\:hidden { display: none !important; }
    }
  `]
})
export class CompareComponent {
  readonly compareStore = inject(CompareStore);
  readonly settingsStore = inject(SettingsStore);
  readonly i18n = inject(I18nService);
  readonly tenantService = inject(TenantService);
  private readonly whatsappService = inject(WhatsAppService);

  resolveImg(url: string | null): string {
    return resolveImageUrl(url);
  }

  /** Build structured comparison rows for the desktop table */
  readonly comparisonRows = computed(() => {
    const items = this.compareStore.items();
    if (!items.length) return [];

    const rows: { key: string; label: string; values: string[]; highlight: number | null }[] = [];

    const addRow = (key: string, labelKey: string, getter: (i: Item) => string) => {
      const values = items.map(getter);
      if (values.some(v => v && v !== '—')) {
        let highlight: number | null = null;
        if (values.length === 2 && values[0] !== values[1] && values[0] !== '—' && values[1] !== '—') {
          highlight = null; // different values, no highlight
        }
        rows.push({ key, label: this.i18n.t(labelKey), values, highlight });
      }
    };

    // Core fields
    addRow('brand', 'compare.brand', i => i.brandName || '—');
    addRow('category', 'compare.category', i => i.categoryName || '—');
    addRow('condition', 'compare.condition', i => i.condition || '—');
    addRow('status', 'compare.status', i => i.status || '—');
    addRow('color', 'compare.color', i => i.color || '—');
    addRow('storage', 'compare.storage', i => i.storage || '—');
    addRow('ram', 'compare.ram', i => i.ram || '—');

    // Battery Health — highlight the higher value
    const batteryValues = items.map(i => i.batteryHealth);
    if (batteryValues.some(v => v != null)) {
      const vals = items.map(i => i.batteryHealth != null ? i.batteryHealth + '%' : '—');
      let highlight: number | null = null;
      if (batteryValues.length === 2 && batteryValues[0] != null && batteryValues[1] != null) {
        highlight = batteryValues[0]! >= batteryValues[1]! ? 0 : 1;
      }
      rows.push({ key: 'battery', label: this.i18n.t('compare.battery'), values: vals, highlight });
    }

    // Warranty
    addRow('warranty', 'compare.warranty', i => {
      if (!i.warrantyType || i.warrantyType === 'None') return '—';
      return i.warrantyMonths ? `${i.warrantyType} (${i.warrantyMonths}m)` : i.warrantyType;
    });

    // Installment availability
    addRow('installment', 'compare.installment', i => i.installmentAvailable ? '✓' : '—');

    // Price comparison — highlight the lower price
    const priceValues = items.map(i => i.price);
    if (priceValues.length === 2) {
      const cur = this.settingsStore.currency();
      const fmt = (p: number) => new Intl.NumberFormat('en', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(p);
      let highlight: number | null = null;
      if (priceValues[0] !== priceValues[1]) {
        highlight = priceValues[0] <= priceValues[1] ? 0 : 1;
      }
      rows.push({ key: 'price', label: this.i18n.t('compare.price'), values: items.map(i => fmt(i.price)), highlight });
    }

    // Custom fields
    const allFieldNames = new Set<string>();
    for (const item of items) {
      if (item.customFieldsJson) {
        try {
          const cfValues: CustomFieldValue[] = JSON.parse(item.customFieldsJson);
          cfValues.forEach(cf => allFieldNames.add(cf.fieldName));
        } catch {}
      }
    }
    for (const fieldName of allFieldNames) {
      rows.push({
        key: 'cf_' + fieldName,
        label: fieldName,
        values: items.map(item => {
          if (!item.customFieldsJson) return '—';
          try {
            const cfValues: CustomFieldValue[] = JSON.parse(item.customFieldsJson);
            return cfValues.find(cf => cf.fieldName === fieldName)?.value || '—';
          } catch { return '—'; }
        }),
        highlight: null,
      });
    }

    return rows;
  });

  /** Build flat row list for mobile card view */
  getMobileRows(item: Item): { label: string; value: string }[] {
    const rows: { label: string; value: string }[] = [];
    if (item.brandName) rows.push({ label: this.i18n.t('compare.brand'), value: item.brandName });
    if (item.categoryName) rows.push({ label: this.i18n.t('compare.category'), value: item.categoryName });
    rows.push({ label: this.i18n.t('compare.condition'), value: item.condition });
    rows.push({ label: this.i18n.t('compare.status'), value: item.status });
    if (item.color) rows.push({ label: this.i18n.t('compare.color'), value: item.color });
    if (item.storage) rows.push({ label: this.i18n.t('compare.storage'), value: item.storage });
    if (item.ram) rows.push({ label: this.i18n.t('compare.ram'), value: item.ram });
    if (item.batteryHealth != null) rows.push({ label: this.i18n.t('compare.battery'), value: item.batteryHealth + '%' });
    if (item.warrantyType && item.warrantyType !== 'None') {
      const val = item.warrantyMonths ? `${item.warrantyType} (${item.warrantyMonths}m)` : item.warrantyType;
      rows.push({ label: this.i18n.t('compare.warranty'), value: val });
    }
    if (item.installmentAvailable) rows.push({ label: this.i18n.t('compare.installment'), value: '✓' });
    if (item.customFieldsJson) {
      try {
        const cfValues: CustomFieldValue[] = JSON.parse(item.customFieldsJson);
        for (const cf of cfValues) {
          if (cf.value) rows.push({ label: cf.fieldName, value: cf.value });
        }
      } catch {}
    }
    return rows;
  }

  onWhatsApp(item: Item): void {
    this.whatsappService.clickAndOpen({
      targetType: 'Item',
      targetId: item.id,
      targetTitle: item.title,
      pageUrl: window.location.origin + this.tenantService.storeUrl() + '/item/' + item.slug,
    }).subscribe();
  }
}
