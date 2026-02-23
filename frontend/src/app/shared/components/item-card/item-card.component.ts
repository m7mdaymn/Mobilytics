import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Item } from '../../../core/models/item.models';
import { CompareStore } from '../../../core/stores/compare.store';
import { SettingsStore } from '../../../core/stores/settings.store';
import { WhatsAppService } from '../../../core/services/whatsapp.service';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <div class="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <!-- Discount Tag -->
      @if (item.oldPrice && item.oldPrice > item.price) {
        <span class="absolute top-3 right-3 z-10 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">-{{ discountPercent }}%</span>
      }

      <!-- Image -->
      <a [routerLink]="['/item', item.slug]" class="block overflow-hidden bg-gray-50 relative aspect-square">
        @if (item.mainImageUrl) {
          <img
            [src]="item.mainImageUrl"
            [alt]="item.title"
            loading="lazy"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        } @else {
          <div class="w-full h-full flex items-center justify-center text-gray-300">
            <svg class="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        }

        <!-- Badges -->
        <div class="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          @if (item.condition === 'Used') {
            <span class="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Used</span>
          }
          @if (item.condition === 'Refurbished') {
            <span class="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Refurbished</span>
          }
          @if (item.status === 'Reserved') {
            <span class="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Reserved</span>
          }
          @if (item.status === 'Sold') {
            <span class="text-[10px] font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Sold</span>
          }
          @if (item.isStockItem && item.quantity === 1) {
            <span class="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Last piece!</span>
          }
          @if (item.isStockItem && item.quantity === 0) {
            <span class="text-[10px] font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Out of stock</span>
          }
        </div>
      </a>

      <!-- Info -->
      <div class="p-3.5 space-y-1.5">
        <div class="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{{ item.brandName || item.itemTypeName }}</div>
        <a [routerLink]="['/item', item.slug]"
           class="block font-semibold text-sm leading-snug text-gray-900 line-clamp-2 hover:text-[color:var(--color-primary)] transition-colors">
          {{ item.title }}
        </a>

        <div class="flex items-baseline gap-2 pt-0.5">
          <span class="text-lg font-bold text-[color:var(--color-primary)]">
            {{ item.price | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
          </span>
          @if (item.oldPrice && item.oldPrice > item.price) {
            <span class="text-xs line-through text-gray-400">
              {{ item.oldPrice | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
            </span>
          }
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 pt-2">
          <button (click)="onWhatsAppClick($event)"
            class="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#128c7e] text-white text-xs font-semibold py-2 px-3 rounded-xl transition">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.697-6.413-1.896l-.447-.292-2.637.884.884-2.637-.292-.447A9.953 9.953 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
            Ask
          </button>
          <button
            (click)="onCompareToggle($event)"
            class="p-2 rounded-xl border transition"
            [class]="compareStore.isInCompare(item.id) ? 'bg-[color:var(--color-primary)] text-white border-transparent' : 'border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300'"
            [disabled]="!compareStore.isInCompare(item.id) && compareStore.isFull()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ItemCardComponent {
  @Input({ required: true }) item!: Item;

  readonly compareStore = inject(CompareStore);
  readonly settingsStore = inject(SettingsStore);
  private readonly whatsappService = inject(WhatsAppService);

  get discountPercent(): number {
    if (!this.item.oldPrice || this.item.oldPrice <= this.item.price) return 0;
    return Math.round(((this.item.oldPrice - this.item.price) / this.item.oldPrice) * 100);
  }

  onWhatsAppClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.whatsappService.clickAndOpen({
      targetType: 'Item',
      targetId: this.item.id,
      targetTitle: this.item.title,
      pageUrl: window.location.origin + '/item/' + this.item.slug,
    }).subscribe();
  }

  onCompareToggle(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.compareStore.toggle(this.item);
  }
}
