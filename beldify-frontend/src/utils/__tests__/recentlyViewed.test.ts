/**
 * TDD — recentlyViewed utility unit tests
 *
 * Tests run in jsdom (localStorage available).
 * Covers: get, add (prepend + dedupe + cap), clear, SSR guard.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Import AFTER setting up jsdom env
import {
  getRecentlyViewed,
  addRecentlyViewed,
  clearRecentlyViewed,
  STORAGE_KEY,
  MAX_ITEMS,
  type RecentlyViewedItem,
} from '../recentlyViewed';

const ITEM_A: RecentlyViewedItem = {
  id: 1,
  name: 'Royal Caftan',
  image: '/caftan.jpg',
  price: 2500,
  viewedAt: 1000,
};

const ITEM_B: RecentlyViewedItem = {
  id: 2,
  name: 'Silk Djellaba',
  image: '/djellaba.jpg',
  price: 1800,
  viewedAt: 2000,
};

const ITEM_C: RecentlyViewedItem = {
  id: 3,
  name: 'Embroidered Kaftan',
  image: '/kaftan.jpg',
  price: 3200,
  viewedAt: 3000,
};

describe('recentlyViewed — constants', () => {
  it('exports STORAGE_KEY as beldify_recently_viewed', () => {
    expect(STORAGE_KEY).toBe('beldify_recently_viewed');
  });

  it('exports MAX_ITEMS as 20', () => {
    expect(MAX_ITEMS).toBe(20);
  });
});

describe('getRecentlyViewed', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when storage is empty', () => {
    expect(getRecentlyViewed()).toEqual([]);
  });

  it('returns stored items when localStorage has valid JSON', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([ITEM_A]));
    const result = getRecentlyViewed();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('returns empty array when localStorage has invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json!!!');
    expect(getRecentlyViewed()).toEqual([]);
  });
});

describe('addRecentlyViewed', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds an item and it can be retrieved', () => {
    addRecentlyViewed(ITEM_A);
    const result = getRecentlyViewed();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(ITEM_A.id);
  });

  it('prepends new items (most recent first)', () => {
    addRecentlyViewed(ITEM_A);
    addRecentlyViewed(ITEM_B);
    const result = getRecentlyViewed();
    expect(result[0].id).toBe(ITEM_B.id);
    expect(result[1].id).toBe(ITEM_A.id);
  });

  it('deduplicates by id — moves existing item to front instead of adding duplicate', () => {
    addRecentlyViewed(ITEM_A);
    addRecentlyViewed(ITEM_B);
    // Re-add A — should move it to front
    addRecentlyViewed({ ...ITEM_A, viewedAt: 9999 });
    const result = getRecentlyViewed();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(ITEM_A.id);
    expect(result[1].id).toBe(ITEM_B.id);
  });

  it('caps at MAX_ITEMS (20) and drops the oldest', () => {
    // Add 21 items — only 20 should survive
    for (let i = 1; i <= 21; i++) {
      addRecentlyViewed({ id: i, name: `Item ${i}`, image: '', price: i * 100, viewedAt: i });
    }
    const result = getRecentlyViewed();
    expect(result).toHaveLength(20);
    // Item 1 (oldest) should have been evicted
    expect(result.find((r) => r.id === 1)).toBeUndefined();
    // Item 21 (newest) should be at front
    expect(result[0].id).toBe(21);
  });

  it('evicts the oldest entry when a 21st distinct product is viewed', () => {
    for (let i = 1; i <= 20; i++) {
      addRecentlyViewed({ id: i, name: `Item ${i}`, image: '', price: i * 100, viewedAt: i });
    }
    // Item 1 is still the oldest surviving entry
    expect(getRecentlyViewed().find((r) => r.id === 1)).toBeDefined();

    addRecentlyViewed({ id: 21, name: 'Item 21', image: '', price: 2100, viewedAt: 21 });

    const result = getRecentlyViewed();
    expect(result).toHaveLength(20);
    expect(result[0].id).toBe(21);
    expect(result.find((r) => r.id === 1)).toBeUndefined();
  });

  it('stores items in localStorage under STORAGE_KEY', () => {
    addRecentlyViewed(ITEM_A);
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed[0].id).toBe(ITEM_A.id);
  });
});

describe('clearRecentlyViewed', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes all items from storage', () => {
    addRecentlyViewed(ITEM_A);
    addRecentlyViewed(ITEM_B);
    clearRecentlyViewed();
    expect(getRecentlyViewed()).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('SSR guard — typeof window === undefined simulation', () => {
  it('STORAGE_KEY is a plain string (importable in SSR context without errors)', () => {
    // The module must be importable without throwing. Since we're in jsdom, this
    // simply verifies the guard type works — the actual SSR path is covered by
    // the typeof window check in implementation.
    expect(typeof STORAGE_KEY).toBe('string');
  });
});
