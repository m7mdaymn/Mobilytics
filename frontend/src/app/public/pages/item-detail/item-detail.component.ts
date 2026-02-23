import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { Item } from '../../../core/models/item.models';
import { SettingsStore } from '../../../core/stores/settings.store';
import { CompareStore } from '../../../core/stores/compare.store';
import { WhatsAppService } from '../../../core/services/whatsapp.service';
import { ItemGalleryComponent } from '../../../shared/components/item-gallery/item-gallery.component';
import { FollowUpModalComponent } from '../../../shared/components/follow-up-modal/follow-up-modal.component';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, ItemGalleryComponent, FollowUpModalComponent],
  template: `
    @if (loading()) {
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div class="skeleton aspect-square rounded-2xl"></div>
          <div class="space-y-5">
            <div class="skeleton h-5 w-24"></div>
            <div class="skeleton h-9 w-3/4"></div>
            <div class="skeleton h-7 w-1/3"></div>
            <div class="skeleton h-48 w-full rounded-2xl"></div>
            <div class="skeleton h-14 w-full rounded-xl"></div>
          </div>
        </div>
      </div>
    } @else if (item()) {
      <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <a routerLink="/" class="hover:text-[color:var(--color-primary)] transition">Home</a>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          <a routerLink="/catalog" class="hover:text-[color:var(--color-primary)] transition">Catalog</a>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          <span class="text-gray-600 font-medium truncate">{{ item()!.title }}</span>
        </nav>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <!-- Gallery -->
          <app-item-gallery
            [mainImage]="item()!.mainImageUrl"
            [gallery]="item()!.galleryImages"
            [alt]="item()!.title" />

          <!-- Details -->
          <div class="space-y-6">
            <!-- Brand & Title -->
            <div>
              @if (item()!.brandName) {
                <p class="text-sm font-semibold text-[color:var(--color-primary)] uppercase tracking-wider mb-1.5">{{ item()!.brandName }}</p>
              }
              <h1 class="text-3xl font-extrabold text-gray-900 leading-tight">{{ item()!.title }}</h1>
            </div>

            <!-- Badges -->
            <div class="flex flex-wrap gap-2">
              @if (item()!.condition === 'New') {
                <span class="text-xs font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">New</span>
              }
              @if (item()!.condition === 'Used') {
                <span class="text-xs font-semibold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">Used</span>
              }
              @if (item()!.condition === 'Refurbished') {
                <span class="text-xs font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">Refurbished</span>
              }
              @if (item()!.status === 'Reserved') {
                <span class="text-xs font-semibold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">Reserved</span>
              }
              @if (item()!.status === 'Sold') {
                <span class="text-xs font-semibold bg-gray-200 text-gray-600 px-3 py-1 rounded-full">Sold</span>
              }
              @if (item()!.oldPrice && item()!.oldPrice! > item()!.price) {
                <span class="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1 rounded-full">Sale</span>
              }
              @if (item()!.taxStatus === 'Taxable') {
                <span class="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">Tax Incl.</span>
              }
            </div>

            <!-- Price -->
            <div class="flex items-baseline gap-3">
              <span class="text-4xl font-extrabold text-[color:var(--color-primary)]">
                {{ item()!.price | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
              </span>
              @if (item()!.oldPrice && item()!.oldPrice! > item()!.price) {
                <span class="text-xl line-through text-gray-400">
                  {{ item()!.oldPrice | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
                </span>
                <span class="text-sm font-bold text-red-500">-{{ discountPercent() }}%</span>
              }
            </div>

            <!-- Specs Card -->
            <div class="bg-gray-50 rounded-2xl p-5 space-y-3">
              <h3 class="font-bold text-sm text-gray-900">Details</h3>
              <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div class="text-gray-500">Type</div>
                <div class="font-semibold text-gray-900">{{ item()!.itemTypeName }}</div>
                @if (item()!.categoryName) {
                  <div class="text-gray-500">Category</div>
                  <div class="font-semibold text-gray-900">{{ item()!.categoryName }}</div>
                }
                <div class="text-gray-500">Condition</div>
                <div class="font-semibold text-gray-900">{{ item()!.condition }}</div>
              </div>
            </div>

            <!-- Checklist -->
            @if (item()!.checklist.length) {
              <div class="bg-gray-50 rounded-2xl p-5">
                <h3 class="font-bold text-sm text-gray-900 mb-3">Quality Checklist</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  @for (check of item()!.checklist; track check.key) {
                    <div class="flex items-center gap-2 text-sm">
                      @if (check.passed) {
                        <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">&#10003;</span>
                      } @else {
                        <span class="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs font-bold">&times;</span>
                      }
                      <span class="text-gray-700">{{ check.label }}</span>
                      @if (check.notes) {
                        <span class="text-gray-400 text-xs">({{ check.notes }})</span>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Custom Fields -->
            @if (item()!.customFieldValues.length) {
              <div class="bg-gray-50 rounded-2xl p-5">
                <h3 class="font-bold text-sm text-gray-900 mb-3">Specifications</h3>
                <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  @for (field of item()!.customFieldValues; track field.fieldId) {
                    <div class="text-gray-500">{{ field.fieldName }}</div>
                    <div class="font-semibold text-gray-900">{{ field.value }}</div>
                  }
                </div>
              </div>
            }

            <!-- Description -->
            @if (item()!.description) {
              <div>
                <h3 class="font-bold text-sm text-gray-900 mb-2">Description</h3>
                <p class="text-sm text-gray-600 leading-relaxed">{{ item()!.description }}</p>
              </div>
            }

            <!-- CTAs -->
            <div class="flex flex-col sm:flex-row gap-3 pt-3">
              <button (click)="onWhatsAppClick()"
                class="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128c7e] text-white font-bold py-3.5 rounded-xl transition shadow-lg text-base">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.697-6.413-1.896l-.447-.292-2.637.884.884-2.637-.292-.447A9.953 9.953 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                Ask on WhatsApp
              </button>
              <button (click)="followUpOpen = true"
                class="flex-1 py-3.5 px-5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-gray-300 hover:bg-gray-50 transition text-base text-center">
                Request Follow-up
              </button>
              <button
                (click)="onCompareToggle()"
                class="p-3.5 rounded-xl border-2 transition"
                [class]="compareStore.isInCompare(item()!.id) ? 'bg-[color:var(--color-primary)] text-white border-transparent' : 'border-gray-200 text-gray-500 hover:border-gray-300'"
                [disabled]="!compareStore.isInCompare(item()!.id) && compareStore.isFull()">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="max-w-7xl mx-auto px-4 py-20 text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">Item not found</h2>
        <p class="text-gray-500 mb-6">The item you're looking for doesn't exist or has been removed.</p>
        <a routerLink="/catalog" class="inline-flex items-center gap-2 bg-[color:var(--color-primary)] text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition text-sm">Browse Catalog</a>
      </div>
    }

    <app-follow-up-modal
      [open]="followUpOpen"
      [itemId]="item()?.id || ''"
      [itemTitle]="item()?.title || ''"
      (closed)="followUpOpen = false" />
  `,
})
export class ItemDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly whatsappService = inject(WhatsAppService);
  readonly settingsStore = inject(SettingsStore);
  readonly compareStore = inject(CompareStore);

  readonly item = signal<Item | null>(null);
  readonly loading = signal(true);
  followUpOpen = false;

  readonly discountPercent = computed(() => {
    const i = this.item();
    if (!i || !i.oldPrice || i.oldPrice <= i.price) return 0;
    return Math.round(((i.oldPrice - i.price) / i.oldPrice) * 100);
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      this.loading.set(true);
      this.api.get<Item>(`/Public/items/${slug}`).subscribe({
        next: data => {
          this.item.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.item.set(null);
          this.loading.set(false);
        },
      });
    });
  }

  onWhatsAppClick(): void {
    const i = this.item();
    if (!i) return;
    this.whatsappService.clickAndOpen({
      targetType: 'Item',
      targetId: i.id,
      targetTitle: i.title,
      pageUrl: window.location.href,
    }).subscribe();
  }

  onCompareToggle(): void {
    const i = this.item();
    if (i) this.compareStore.toggle(i);
  }
}
