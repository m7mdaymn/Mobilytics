import { Component, Input, signal } from '@angular/core';
import { ItemImage } from '../../../core/models/item.models';
import { resolveImageUrl } from '../../../core/utils/image.utils';

@Component({
  selector: 'app-item-gallery',
  standalone: true,
  template: `
    <div class="space-y-3">
      <!-- Main Image -->
      <div class="relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer" (click)="openLightbox()">
        @if (currentImage()) {
          <img [src]="currentImage()" [alt]="alt" class="w-full h-full object-contain" loading="lazy" />
        } @else {
          <div class="w-full h-full flex items-center justify-center text-gray-400">
            <svg class="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        }
        <div class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/10">
          <svg class="w-8 h-8 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>

      <!-- Thumbnails -->
      @if (allImages().length > 1) {
        <div class="flex gap-2 overflow-x-auto pb-1">
          @for (img of allImages(); track img; let i = $index) {
            <button
              (click)="selectImage(i)"
              class="shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all"
              [class]="selectedIndex() === i ? 'border-[color:var(--color-primary)] ring-1 ring-[color:var(--color-primary)]' : 'border-transparent opacity-70 hover:opacity-100'">
              <img [src]="img" [alt]="alt + ' thumbnail ' + (i + 1)" class="w-full h-full object-cover" loading="lazy" />
            </button>
          }
        </div>
      }
    </div>

    <!-- Lightbox -->
    @if (lightboxOpen()) {
      <div class="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4" (click)="closeLightbox()">
        <button class="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10">&times;</button>
        @if (allImages().length > 1) {
          <button class="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 z-10" (click)="prev($event)">&#8249;</button>
          <button class="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 z-10" (click)="next($event)">&#8250;</button>
        }
        <img
          [src]="currentImage()"
          [alt]="alt"
          class="max-w-full max-h-full object-contain"
          (click)="$event.stopPropagation()" />
      </div>
    }
  `,
})
export class ItemGalleryComponent {
  @Input() mainImage: string | null = null;
  @Input() gallery: ItemImage[] = [];
  @Input() alt = 'Product image';

  readonly selectedIndex = signal(0);
  readonly lightboxOpen = signal(false);

  readonly allImages = signal<string[]>([]);

  ngOnChanges(): void {
    const images: string[] = [];
    if (this.mainImage) images.push(resolveImageUrl(this.mainImage));
    if (this.gallery?.length) {
      images.push(...this.gallery.sort((a, b) => a.sortOrder - b.sortOrder).map(g => resolveImageUrl(g.url)));
    }
    this.allImages.set(images);
    this.selectedIndex.set(0);
  }

  readonly currentImage = () => {
    const imgs = this.allImages();
    const idx = this.selectedIndex();
    return imgs[idx] || null;
  };

  selectImage(index: number): void {
    this.selectedIndex.set(index);
  }

  openLightbox(): void {
    if (this.allImages().length) {
      this.lightboxOpen.set(true);
    }
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  prev(event: Event): void {
    event.stopPropagation();
    const len = this.allImages().length;
    this.selectedIndex.update(i => (i - 1 + len) % len);
  }

  next(event: Event): void {
    event.stopPropagation();
    const len = this.allImages().length;
    this.selectedIndex.update(i => (i + 1) % len);
  }
}
