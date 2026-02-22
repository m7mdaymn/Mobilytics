import { CompareStore } from './compare.store';

describe('CompareStore', () => {
  let store: CompareStore;

  beforeEach(() => {
    store = new CompareStore();
  });

  it('should start empty', () => {
    expect(store.items().length).toBe(0);
    expect(store.count()).toBe(0);
  });

  it('should add an item', () => {
    const item = { id: '1', title: 'iPhone 15' } as any;
    store.add(item);
    expect(store.items().length).toBe(1);
    expect(store.count()).toBe(1);
    expect(store.isInCompare('1')).toBeTrue();
  });

  it('should not exceed max 2 items', () => {
    store.add({ id: '1', title: 'A' } as any);
    store.add({ id: '2', title: 'B' } as any);
    store.add({ id: '3', title: 'C' } as any);
    expect(store.items().length).toBe(2);
  });

  it('should remove an item', () => {
    store.add({ id: '1', title: 'A' } as any);
    store.remove('1');
    expect(store.items().length).toBe(0);
    expect(store.isInCompare('1')).toBeFalse();
  });

  it('should toggle an item', () => {
    const item = { id: '1', title: 'A' } as any;
    store.toggle(item);
    expect(store.isInCompare('1')).toBeTrue();
    store.toggle(item);
    expect(store.isInCompare('1')).toBeFalse();
  });

  it('should clear all items', () => {
    store.add({ id: '1', title: 'A' } as any);
    store.add({ id: '2', title: 'B' } as any);
    store.clear();
    expect(store.items().length).toBe(0);
    expect(store.count()).toBe(0);
  });

  it('should track itemIds correctly', () => {
    store.add({ id: 'x', title: 'X' } as any);
    expect(store.itemIds().has('x')).toBeTrue();
    expect(store.itemIds().has('y')).toBeFalse();
  });
});
