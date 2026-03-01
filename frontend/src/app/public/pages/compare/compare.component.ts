import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CompareStore } from '../../../core/stores/compare.store';
import { SettingsStore } from '../../../core/stores/settings.store';
import { WhatsAppService } from '../../../core/services/whatsapp.service';
import { Item, CustomFieldValue } from '../../../core/models/item.models';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">Compare ({{ compareStore.count() }}/2)</h1>
        @if (compareStore.count() > 0) {
          <button (click)="compareStore.clear()" class="btn-outline text-sm">Clear All</button>
        }
      </div>

      @if (compareStore.count() === 0) {
        <div class="text-center py-16">
          <p class="text-[color:var(--color-text-muted)] text-lg mb-4">No items to compare</p>
          <a routerLink="/catalog" class="btn-primary">Browse Catalog</a>
        </div>
      } @else {
        <!-- Desktop: side-by-side -->
        <div class="hidden md:grid gap-6" [style.grid-template-columns]="'repeat(' + compareStore.count() + ', 1fr)'">
          @for (item of compareStore.items(); track item.id) {
            <div class="card p-4 space-y-4">
              <div class="relative">
                <button (click)="compareStore.remove(item.id)"
                  class="absolute -top-2 -end-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">&times;</button>
                <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  @if (item.mainImageUrl) {
                    <img [src]="item.mainImageUrl" [alt]="item.title" class="w-full h-full object-cover" />
                  }
                </div>
              </div>
              <a [routerLink]="['/item', item.slug]" class="font-bold text-sm hover:text-[color:var(--color-primary)]">{{ item.title }}</a>
              <div class="text-xl font-bold text-[color:var(--color-primary)]">
                {{ item.price | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
              </div>
              @for (row of getCompareRows(item); track row.label) {
                <div class="flex justify-between text-sm border-b border-[color:var(--color-border)] py-1.5">
                  <span class="text-[color:var(--color-text-muted)]">{{ row.label }}</span>
                  <span class="font-medium">{{ row.value }}</span>
                </div>
              }
              <button (click)="onWhatsApp(item)" class="btn-whatsapp w-full justify-center text-sm">Ask on WhatsApp</button>
            </div>
          }
        </div>

        <!-- Mobile: stacked -->
        <div class="md:hidden space-y-6">
          @for (item of compareStore.items(); track item.id) {
            <div class="card p-4 space-y-3">
              <div class="flex items-start gap-3">
                <div class="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  @if (item.mainImageUrl) {
                    <img [src]="item.mainImageUrl" [alt]="item.title" class="w-full h-full object-cover" />
                  }
                </div>
                <div class="flex-1">
                  <a [routerLink]="['/item', item.slug]" class="font-bold text-sm">{{ item.title }}</a>
                  <div class="text-lg font-bold text-[color:var(--color-primary)] mt-1">
                    {{ item.price | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
                  </div>
                </div>
                <button (click)="compareStore.remove(item.id)" class="text-red-500 text-lg">&times;</button>
              </div>
              @for (row of getCompareRows(item); track row.label) {
                <div class="flex justify-between text-sm">
                  <span class="text-[color:var(--color-text-muted)]">{{ row.label }}</span>
                  <span class="font-medium">{{ row.value }}</span>
                </div>
              }
              <button (click)="onWhatsApp(item)" class="btn-whatsapp w-full justify-center text-sm">Ask on WhatsApp</button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class CompareComponent {
  readonly compareStore = inject(CompareStore);
  readonly settingsStore = inject(SettingsStore);
  private readonly whatsappService = inject(WhatsAppService);

  getCompareRows(item: Item): { label: string; value: string }[] {
    const rows = [
      { label: 'Brand', value: item.brandName || '—' },
      { label: 'Category', value: item.categoryName || '—' },
      { label: 'Condition', value: item.condition },
      { label: 'Status', value: item.status },
    ];

    if (item.customFieldsJson) {
      try {
        const cfValues: CustomFieldValue[] = JSON.parse(item.customFieldsJson);
        for (const cf of cfValues) {
          rows.push({ label: cf.fieldName, value: cf.value || '—' });
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
      pageUrl: window.location.origin + '/item/' + item.slug,
    }).subscribe();
  }
}
