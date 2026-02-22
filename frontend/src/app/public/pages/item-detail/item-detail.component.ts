import { Component, inject, OnInit, signal } from '@angular/core';
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
      <div class="max-w-7xl mx-auto px-4 py-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="skeleton aspect-square rounded-xl"></div>
          <div class="space-y-4">
            <div class="skeleton h-8 w-3/4"></div>
            <div class="skeleton h-6 w-1/2"></div>
            <div class="skeleton h-12 w-full"></div>
            <div class="skeleton h-32 w-full"></div>
          </div>
        </div>
      </div>
    } @else if (item()) {
      <div class="max-w-7xl mx-auto px-4 py-6">
        <!-- Breadcrumb -->
        <nav class="text-sm text-[color:var(--color-text-muted)] mb-4">
          <a routerLink="/" class="hover:text-[color:var(--color-primary)]">Home</a>
          <span class="mx-2">›</span>
          <a routerLink="/catalog" class="hover:text-[color:var(--color-primary)]">Catalog</a>
          <span class="mx-2">›</span>
          <span>{{ item()!.title }}</span>
        </nav>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Gallery -->
          <app-item-gallery
            [mainImage]="item()!.mainImageUrl"
            [gallery]="item()!.galleryImages"
            [alt]="item()!.title" />

          <!-- Details -->
          <div class="space-y-5">
            <!-- Title & Brand -->
            <div>
              @if (item()!.brandName) {
                <p class="text-sm font-medium text-[color:var(--color-primary)] mb-1">{{ item()!.brandName }}</p>
              }
              <h1 class="text-2xl font-bold">{{ item()!.title }}</h1>
            </div>

            <!-- Badges -->
            <div class="flex flex-wrap gap-2">
              @if (item()!.condition === 'New') {
                <span class="badge badge-success">New</span>
              }
              @if (item()!.condition === 'Used') {
                <span class="badge badge-warning">Used</span>
              }
              @if (item()!.condition === 'Refurbished') {
                <span class="badge badge-info">Refurbished</span>
              }
              @if (item()!.status === 'Reserved') {
                <span class="badge badge-warning">Reserved</span>
              }
              @if (item()!.status === 'Sold') {
                <span class="badge badge-neutral">Sold</span>
              }
              @if (item()!.oldPrice && item()!.oldPrice! > item()!.price) {
                <span class="badge badge-danger">Sale</span>
              }
              @if (item()!.taxStatus === 'Taxable') {
                <span class="badge badge-neutral">Tax Incl.</span>
              }
            </div>

            <!-- Price -->
            <div class="flex items-baseline gap-3">
              <span class="text-3xl font-bold text-[color:var(--color-primary)]">
                {{ item()!.price | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
              </span>
              @if (item()!.oldPrice && item()!.oldPrice! > item()!.price) {
                <span class="text-lg line-through text-[color:var(--color-text-muted)]">
                  {{ item()!.oldPrice | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
                </span>
              }
            </div>

            <!-- Specs -->
            <div class="border border-[color:var(--color-border)] rounded-xl p-4 space-y-3">
              <h3 class="font-semibold text-sm">Details</h3>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="text-[color:var(--color-text-muted)]">Type</div>
                <div class="font-medium">{{ item()!.itemTypeName }}</div>
                @if (item()!.categoryName) {
                  <div class="text-[color:var(--color-text-muted)]">Category</div>
                  <div class="font-medium">{{ item()!.categoryName }}</div>
                }
                <div class="text-[color:var(--color-text-muted)]">Condition</div>
                <div class="font-medium">{{ item()!.condition }}</div>
              </div>
            </div>

            <!-- Checklist -->
            @if (item()!.checklist?.length) {
              <div class="border border-[color:var(--color-border)] rounded-xl p-4">
                <h3 class="font-semibold text-sm mb-3">Checklist</h3>
                <div class="space-y-2">
                  @for (check of item()!.checklist; track check.key) {
                    <div class="flex items-center gap-2 text-sm">
                      @if (check.passed) {
                        <span class="text-green-500">✓</span>
                      } @else {
                        <span class="text-red-400">✗</span>
                      }
                      <span>{{ check.label }}</span>
                      @if (check.notes) {
                        <span class="text-[color:var(--color-text-muted)] text-xs">({{ check.notes }})</span>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Custom Fields -->
            @if (item()!.customFieldValues?.length) {
              <div class="border border-[color:var(--color-border)] rounded-xl p-4">
                <h3 class="font-semibold text-sm mb-3">Specifications</h3>
                <div class="grid grid-cols-2 gap-2 text-sm">
                  @for (field of item()!.customFieldValues; track field.fieldId) {
                    <div class="text-[color:var(--color-text-muted)]">{{ field.fieldName }}</div>
                    <div class="font-medium">{{ field.value }}</div>
                  }
                </div>
              </div>
            }

            <!-- Description -->
            @if (item()!.description) {
              <div>
                <h3 class="font-semibold text-sm mb-2">Description</h3>
                <p class="text-sm text-[color:var(--color-text-muted)] leading-relaxed">{{ item()!.description }}</p>
              </div>
            }

            <!-- CTAs -->
            <div class="flex flex-col sm:flex-row gap-3 pt-2">
              <button (click)="onWhatsAppClick()" class="btn-whatsapp flex-1 justify-center text-base py-3">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.697-6.413-1.896l-.447-.292-2.637.884.884-2.637-.292-.447A9.953 9.953 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                Ask on WhatsApp
              </button>
              <button (click)="followUpOpen = true" class="btn-outline flex-1 justify-center py-3">Request Follow-up</button>
              <button
                (click)="onCompareToggle()"
                class="btn-outline px-4 py-3"
                [disabled]="!compareStore.isInCompare(item()!.id) && compareStore.isFull()">
                {{ compareStore.isInCompare(item()!.id) ? 'Remove from Compare' : 'Add to Compare' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 class="text-xl font-bold mb-2">Item not found</h2>
        <p class="text-[color:var(--color-text-muted)]">The item you're looking for doesn't exist.</p>
        <a routerLink="/catalog" class="btn-primary mt-4 inline-block">Browse Catalog</a>
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
