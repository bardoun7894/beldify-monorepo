/**
 * TDD: guestWishlist util — localStorage-backed guest wishlist helpers.
 *
 * RED → all tests fail because the module does not exist yet.
 * GREEN → after creating src/utils/guestWishlist.ts, all pass.
 */
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';

// Import after mocks are set (module does not exist yet → RED)
import {
  getGuestWishlist,
  addGuestWishlistItem,
  removeGuestWishlistItem,
  clearGuestWishlist,
  getGuestWishlistProductIds,
} from '@/utils/guestWishlist';

const STORAGE_KEY = 'guest_wishlist';

const makeItem = (productId: number) => ({
  id: productId,
  product_id: productId,
  product: {
    id: productId,
    name: `Product ${productId}`,
    slug: `product-${productId}`,
    description: 'A test product',
    image_url: `/images/${productId}.jpg`,
    price: 100,
    sale_price: null,
    is_on_sale: false,
    discount_percentage: 0,
    variants: { size: '', color: '', style: '' },
  },
});

describe('guestWishlist util', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getGuestWishlist', () => {
    it('returns an empty array when localStorage is empty', () => {
      expect(getGuestWishlist()).toEqual([]);
    });

    it('returns the stored items when they exist', () => {
      const items = [makeItem(1), makeItem(2)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      expect(getGuestWishlist()).toEqual(items);
    });

    it('returns an empty array when the stored value is invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not-json');
      expect(getGuestWishlist()).toEqual([]);
    });
  });

  describe('addGuestWishlistItem', () => {
    it('adds a new item to an empty list', () => {
      const item = makeItem(5);
      addGuestWishlistItem(item);
      expect(getGuestWishlist()).toEqual([item]);
    });

    it('appends to existing items', () => {
      addGuestWishlistItem(makeItem(1));
      addGuestWishlistItem(makeItem(2));
      expect(getGuestWishlist()).toHaveLength(2);
      expect(getGuestWishlistProductIds()).toEqual([1, 2]);
    });

    it('does not add a duplicate (same product_id)', () => {
      addGuestWishlistItem(makeItem(3));
      addGuestWishlistItem(makeItem(3));
      expect(getGuestWishlist()).toHaveLength(1);
    });
  });

  describe('removeGuestWishlistItem', () => {
    it('removes the item with the given product_id', () => {
      addGuestWishlistItem(makeItem(10));
      addGuestWishlistItem(makeItem(11));
      removeGuestWishlistItem(10);
      const ids = getGuestWishlistProductIds();
      expect(ids).not.toContain(10);
      expect(ids).toContain(11);
    });

    it('is a no-op when the product_id is not in the list', () => {
      addGuestWishlistItem(makeItem(7));
      removeGuestWishlistItem(999);
      expect(getGuestWishlist()).toHaveLength(1);
    });
  });

  describe('clearGuestWishlist', () => {
    it('removes all items from storage', () => {
      addGuestWishlistItem(makeItem(1));
      addGuestWishlistItem(makeItem(2));
      clearGuestWishlist();
      expect(getGuestWishlist()).toEqual([]);
    });

    it('does not error when already empty', () => {
      expect(() => clearGuestWishlist()).not.toThrow();
    });
  });

  describe('getGuestWishlistProductIds', () => {
    it('returns an array of product_ids from the stored items', () => {
      addGuestWishlistItem(makeItem(20));
      addGuestWishlistItem(makeItem(21));
      expect(getGuestWishlistProductIds()).toEqual([20, 21]);
    });

    it('returns an empty array when storage is empty', () => {
      expect(getGuestWishlistProductIds()).toEqual([]);
    });
  });
});
