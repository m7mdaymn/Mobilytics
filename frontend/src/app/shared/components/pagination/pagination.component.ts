import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    <div class="flex items-center justify-between">
      <p class="text-sm text-[color:var(--color-text-muted)]">
        Showing {{ startItem }}–{{ endItem }} of {{ totalCount }}
      </p>
      <div class="flex items-center gap-1">
        <button
          (click)="onPage(currentPage - 1)"
          [disabled]="currentPage <= 1"
          class="px-3 py-1.5 rounded-lg text-sm border border-[color:var(--color-border)] disabled:opacity-40 hover:bg-gray-50">
          ← Prev
        </button>
        @for (page of visiblePages; track page) {
          @if (page === -1) {
            <span class="px-2 text-gray-400">…</span>
          } @else {
            <button
              (click)="onPage(page)"
              class="px-3 py-1.5 rounded-lg text-sm border transition-colors"
              [class]="page === currentPage
                ? 'bg-[color:var(--color-primary)] text-white border-[color:var(--color-primary)]'
                : 'border-[color:var(--color-border)] hover:bg-gray-50'">
              {{ page }}
            </button>
          }
        }
        <button
          (click)="onPage(currentPage + 1)"
          [disabled]="currentPage >= totalPages"
          class="px-3 py-1.5 rounded-lg text-sm border border-[color:var(--color-border)] disabled:opacity-40 hover:bg-gray-50">
          Next →
        </button>
      </div>
    </div>
  `,
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalCount = 0;
  @Input() pageSize = 12;
  @Output() pageChange = new EventEmitter<number>();

  get startItem(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalCount);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1);
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push(-1);
      pages.push(total);
    }
    return pages;
  }

  onPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
