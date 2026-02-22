import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Item } from '../../../core/models/item.models';
import { PaginatedList } from '../../../core/models/api.models';
import { ItemCardComponent } from '../../../shared/components/item-card/item-card.component';

@Component({
  selector: 'app-brand-detail',
  standalone: true,
  imports: [RouterLink, ItemCardComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6">
      <nav class="text-sm text-[color:var(--color-text-muted)] mb-4">
        <a routerLink="/" class="hover:text-[color:var(--color-primary)]">Home</a>
        <span class="mx-2">›</span>
        <a routerLink="/brands" class="hover:text-[color:var(--color-primary)]">Brands</a>
        <span class="mx-2">›</span>
        <span>{{ brandName() }}</span>
      </nav>

      <h1 class="text-2xl font-bold mb-6">{{ brandName() }}</h1>

      @if (loading()) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="skeleton h-72 rounded-xl"></div>
          }
        </div>
      } @else if (items().length === 0) {
        <p class="text-center py-16 text-[color:var(--color-text-muted)]">No items from this brand</p>
      } @else {
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          @for (item of items(); track item.id) {
            <app-item-card [item]="item" />
          }
        </div>
      }
    </div>
  `,
})
export class BrandDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly items = signal<Item[]>([]);
  readonly loading = signal(true);
  readonly brandName = signal('Brand');

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      this.brandName.set(slug?.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Brand');
      this.loading.set(true);

      this.api.get<PaginatedList<Item>>('/Public/items', { brandSlug: slug, pageSize: 24, status: 'Available' }).subscribe({
        next: data => {
          this.items.set(data.items || []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }
}
