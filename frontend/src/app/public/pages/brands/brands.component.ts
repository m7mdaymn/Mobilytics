import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Brand } from '../../../core/models/item.models';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold mb-6">Brands</h1>

      @if (loading()) {
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="skeleton h-32 rounded-xl"></div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          @for (brand of brands(); track brand.id) {
            <a [routerLink]="['/brand', brand.slug]"
               class="card flex flex-col items-center justify-center gap-3 p-6 text-center hover:shadow-md">
              @if (brand.logoUrl) {
                <img [src]="brand.logoUrl" [alt]="brand.name" class="h-12 w-auto object-contain" loading="lazy" />
              } @else {
                <div class="w-12 h-12 rounded-full bg-[color:var(--color-primary-light)] flex items-center justify-center text-[color:var(--color-primary)] font-bold text-lg">
                  {{ brand.name.charAt(0) }}
                </div>
              }
              <span class="font-medium text-sm">{{ brand.name }}</span>
              <span class="text-xs text-[color:var(--color-text-muted)]">{{ brand.itemCount }} items</span>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class BrandsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly brands = signal<Brand[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.api.get<Brand[]>('/Brands').subscribe({
      next: data => {
        this.brands.set(data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
