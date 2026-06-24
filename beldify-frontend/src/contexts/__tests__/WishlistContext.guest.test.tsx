/**
 * TDD: WishlistContext — guest (unauthenticated) paths.
 *
 * RED → tests fail because:
 *   - addToWishlist short-circuits with "Please login…" toast for guests
 *   - removeFromWishlist short-circuits for guests
 *   - refreshWishlist clears items for guests instead of loading from localStorage
 *
 * GREEN → after WishlistContext is updated to support guest paths, all pass.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

// ── Hoisted mock state (vi.hoisted values are safe inside vi.mock factories) ──
const { mockPost, mockGet, mockPut, mockDelete } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockGet: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}));

const { authState } = vi.hoisted(() => ({
  authState: { isAuthenticated: false as boolean },
}));

const { mockGetProduct } = vi.hoisted(() => ({
  mockGetProduct: vi.fn(),
}));

// in-memory backing store shared between the mock and test assertions
const { guestStore, guestMocks } = vi.hoisted(() => {
  const store: any[] = [];
  return {
    guestStore: store,
    guestMocks: {
      getGuestWishlist: vi.fn(() => [...store]),
      addGuestWishlistItem: vi.fn((item: any) => {
        if (!store.some((i) => i.product_id === item.product_id)) {
          store.push(item);
        }
      }),
      removeGuestWishlistItem: vi.fn((id: number) => {
        const idx = store.findIndex((i) => i.product_id === id);
        if (idx !== -1) store.splice(idx, 1);
      }),
      clearGuestWishlist: vi.fn(() => store.splice(0)),
      getGuestWishlistProductIds: vi.fn(() => store.map((i) => i.product_id)),
    },
  };
});

// ── vi.mock calls (hoisted to top of file by vitest) ────────────────────────

vi.mock('@/lib/axios', () => ({
  default: {
    post: (...args: any[]) => mockPost(...args),
    get: (...args: any[]) => mockGet(...args),
    put: (...args: any[]) => mockPut(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: authState.isAuthenticated, user: authState.isAuthenticated ? { id: 1 } : null }),
}));

vi.mock('@/utils/toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(() => 'loading-toast'),
    dismiss: vi.fn(),
  },
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: { error: vi.fn(), log: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/services/api', () => ({
  productService: { getProduct: (...args: any[]) => mockGetProduct(...args) },
}));

vi.mock('@/utils/guestWishlist', () => ({
  getGuestWishlist: () => guestMocks.getGuestWishlist(),
  addGuestWishlistItem: (item: any) => guestMocks.addGuestWishlistItem(item),
  removeGuestWishlistItem: (id: number) => guestMocks.removeGuestWishlistItem(id),
  clearGuestWishlist: () => guestMocks.clearGuestWishlist(),
  getGuestWishlistProductIds: () => guestMocks.getGuestWishlistProductIds(),
}));

// ── Import under test (after mocks) ────────────────────────────────────────
import { WishlistProvider, useWishlist } from '@/contexts/WishlistContext';
import toast from '@/utils/toast';

// ── Wrapper ────────────────────────────────────────────────────────────────
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(WishlistProvider, null, children);

// ── Helpers ─────────────────────────────────────────────────────────────────
const makeProductResponse = (id: number) => ({
  product: {
    id,
    name: `Product ${id}`,
    slug: `product-${id}`,
    description: 'desc',
    image_url: `/img/${id}.jpg`,
    price: 200,
    sale_price: null,
    is_on_sale: false,
    discount_percentage: 0,
    variants: { size: '', color: '', style: '' },
  },
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('WishlistContext — guest paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isAuthenticated = false;
    guestStore.splice(0);

    mockGetProduct.mockResolvedValue(makeProductResponse(42));
    mockGet.mockResolvedValue({ data: { success: true, items: [] } });
    mockPost.mockResolvedValue({ data: { success: true, item: { id: 1 } } });
    mockDelete.mockResolvedValue({ data: { success: true } });
  });

  // ─── refreshWishlist (guest) ─────────────────────────────────────────────

  describe('refreshWishlist (guest)', () => {
    it('loads items from localStorage instead of clearing when not authenticated', async () => {
      const preseeded = [
        {
          id: 7,
          product_id: 7,
          product: {
            id: 7,
            name: 'Seeded',
            slug: 'seeded',
            description: '',
            image_url: '/img/7.jpg',
            price: 99,
            sale_price: null,
            is_on_sale: false,
            discount_percentage: 0,
            variants: { size: '', color: '', style: '' },
          },
        },
      ];
      // Seed the backing store so the mock returns pre-existing items
      guestStore.push(...preseeded);
      guestMocks.getGuestWishlist.mockReturnValue([...preseeded]);

      const { result } = renderHook(() => useWishlist(), { wrapper });

      await act(async () => {
        await result.current.refreshWishlist();
      });

      expect(result.current.wishlistItems).toHaveLength(1);
      expect(result.current.wishlistItems[0].product_id).toBe(7);
    });

    it('does NOT call the server GET /api/wishlist when guest', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await act(async () => {
        await result.current.refreshWishlist();
      });

      const wishlistGet = mockGet.mock.calls.filter(
        (call: any[]) => call[0] === '/api/wishlist'
      );
      expect(wishlistGet).toHaveLength(0);
    });
  });

  // ─── addToWishlist (guest) ───────────────────────────────────────────────

  describe('addToWishlist (guest)', () => {
    it('fetches product via productService.getProduct', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await act(async () => {
        await result.current.addToWishlist(42);
      });

      expect(mockGetProduct).toHaveBeenCalledWith(42);
    });

    it('persists the item to localStorage via addGuestWishlistItem', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await act(async () => {
        await result.current.addToWishlist(42);
      });

      expect(guestMocks.addGuestWishlistItem).toHaveBeenCalledOnce();
      const persisted = guestMocks.addGuestWishlistItem.mock.calls[0][0];
      expect(persisted.product_id).toBe(42);
      expect(persisted.product.id).toBe(42);
    });

    it('updates wishlistItems state so isInWishlist returns true', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await act(async () => {
        await result.current.addToWishlist(42);
      });

      expect(result.current.isInWishlist(42)).toBe(true);
    });

    it('shows a success toast (not a "please login" error toast)', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await act(async () => {
        await result.current.addToWishlist(42);
      });

      expect(toast.success).toHaveBeenCalled();
      // Should NOT show a "please login" error
      const errorCalls = (toast.error as ReturnType<typeof vi.fn>).mock.calls;
      const loginError = errorCalls.find(
        (call: any[]) => typeof call[0] === 'string' && call[0].toLowerCase().includes('login')
      );
      expect(loginError).toBeUndefined();
    });

    it('does NOT call POST /api/wishlist for a guest', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await act(async () => {
        await result.current.addToWishlist(42);
      });

      const wishlistPost = mockPost.mock.calls.filter(
        (call: any[]) => call[0] === '/api/wishlist'
      );
      expect(wishlistPost).toHaveLength(0);
    });
  });

  // ─── removeFromWishlist (guest) ──────────────────────────────────────────

  describe('removeFromWishlist (guest)', () => {
    it('calls removeGuestWishlistItem with the correct product_id', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await act(async () => {
        await result.current.addToWishlist(42);
      });
      await act(async () => {
        await result.current.removeFromWishlist(42);
      });

      expect(guestMocks.removeGuestWishlistItem).toHaveBeenCalledWith(42);
    });

    it('removes the item from wishlistItems state', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await act(async () => {
        await result.current.addToWishlist(42);
      });

      expect(result.current.isInWishlist(42)).toBe(true);

      await act(async () => {
        await result.current.removeFromWishlist(42);
      });

      expect(result.current.isInWishlist(42)).toBe(false);
    });

    it('does NOT call DELETE /api/wishlist/:id for a guest', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await act(async () => {
        await result.current.removeFromWishlist(42);
      });

      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  // ─── updateWishlistNotifications (guest) — kept gated ───────────────────

  describe('updateWishlistNotifications (guest)', () => {
    it('shows the sign-in message and does NOT write to localStorage', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await act(async () => {
        await result.current.updateWishlistNotifications(42, {
          notify_price_drop: true,
        });
      });

      const errorCalls = (toast.error as ReturnType<typeof vi.fn>).mock.calls;
      const loginError = errorCalls.find(
        (call: any[]) => typeof call[0] === 'string' && call[0].toLowerCase().includes('login')
      );
      expect(loginError).toBeDefined();
      expect(guestMocks.addGuestWishlistItem).not.toHaveBeenCalled();
    });
  });

  // ─── wishlist:refresh event listener ────────────────────────────────────

  describe('wishlist:refresh event', () => {
    it('re-reads guest localStorage when wishlist:refresh is dispatched as a guest', async () => {
      // Start with empty guest store
      guestMocks.getGuestWishlist.mockReturnValue([]);
      const { result } = renderHook(() => useWishlist(), { wrapper });

      // Wait for initial load
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.wishlistItems).toHaveLength(0);

      // Now seed the store with an item (simulates another tab or component adding it)
      const newItem = {
        id: 55,
        product_id: 55,
        product: makeProductResponse(55).product,
      };
      guestStore.push(newItem);
      guestMocks.getGuestWishlist.mockReturnValue([newItem]);

      await act(async () => {
        window.dispatchEvent(new Event('wishlist:refresh'));
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // The event listener calls refreshWishlist() → reads guest localStorage
      expect(result.current.wishlistItems).toHaveLength(1);
      expect(result.current.wishlistItems[0].product_id).toBe(55);
    });
  });
});
