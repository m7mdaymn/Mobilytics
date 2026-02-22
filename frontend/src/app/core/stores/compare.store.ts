import { Injectable, signal, computed } from '@angular/core';
import { Item } from '../models/item.models';

const MAX_COMPARE = 2;

@Injectable({ providedIn: 'root' })
export class CompareStore {
  private readonly _items = signal<Item[]>([]);

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);
  readonly isFull = computed(() => this._items().length >= MAX_COMPARE);
  readonly itemIds = computed(() => new Set(this._items().map(i => i.id)));

  isInCompare(itemId: string): boolean {
    return this.itemIds().has(itemId);
  }

  toggle(item: Item): void {
    if (this.isInCompare(item.id)) {
      this.remove(item.id);
    } else {
      this.add(item);
    }
  }

  add(item: Item): boolean {
    if (this.isFull() || this.isInCompare(item.id)) {
      return false;
    }
    this._items.update(items => [...items, item]);
    return true;
  }

  remove(itemId: string): void {
    this._items.update(items => items.filter(i => i.id !== itemId));
  }

  clear(): void {
    this._items.set([]);
  }
}
