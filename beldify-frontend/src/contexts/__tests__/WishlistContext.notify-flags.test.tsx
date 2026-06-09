/**
 * TDD: WishlistContext — addToWishlist must forward notify flags to the API.
 *
 * RED → tests fail because addToWishlist hardcodes false for both flags.
 * GREEN → after the fix, the exact payload is verified via the axios mock.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

// ── Mocks (must be defined before any module imports) ──────────────────────

const mockPost = vi.fn();
const mockGet = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/axios', () => ({
  default: {
    post: (...args: any[]) => mockPost(...args),
    get: (...args: any[]) => mockGet(...args),
    put: (...args: any[]) => mockPut(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: 1 } }),
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

// ── Import under test (after mocks) ────────────────────────────────────────
import { WishlistProvider, useWishlist } from '@/contexts/WishlistContext';

// ── Wrapper ────────────────────────────────────────────────────────────────
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(WishlistProvider, null, children);

// ── Tests ──────────────────────────────────────────────────────────────────

describe('WishlistContext — addToWishlist notify flags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockResolvedValue({ data: { success: true, item: { id: 1 } } });
    mockGet.mockResolvedValue({ data: { success: true, items: [] } });
    mockPut.mockResolvedValue({ data: { success: true } });
    mockDelete.mockResolvedValue({ data: { success: true } });
  });

  it('sends notify_back_in_stock=true when the opt is passed', async () => {
    const { result } = renderHook(() => useWishlist(), { wrapper });

    await act(async () => {
      await result.current.addToWishlist(42, { notify_back_in_stock: true });
    });

    const wishlistPost = mockPost.mock.calls.find(
      ([url]: [string]) => url === '/api/wishlist'
    );
    expect(wishlistPost).toBeDefined();
    const payload = wishlistPost![1];
    expect(payload).toMatchObject({
      product_id: 42,
      notify_back_in_stock: true,
      notify_price_drop: false,
    });
  });

  it('sends notify_price_drop=true and target_price when the opts are passed', async () => {
    const { result } = renderHook(() => useWishlist(), { wrapper });

    await act(async () => {
      await result.current.addToWishlist(99, { notify_price_drop: true, target_price: 199 });
    });

    const wishlistPost = mockPost.mock.calls.find(
      ([url]: [string]) => url === '/api/wishlist'
    );
    expect(wishlistPost).toBeDefined();
    const payload = wishlistPost![1];
    expect(payload).toMatchObject({
      product_id: 99,
      notify_price_drop: true,
      target_price: 199,
    });
  });

  it('sends both flags true when both opts are passed', async () => {
    const { result } = renderHook(() => useWishlist(), { wrapper });

    await act(async () => {
      await result.current.addToWishlist(7, {
        notify_back_in_stock: true,
        notify_price_drop: true,
        target_price: 350,
      });
    });

    const wishlistPost = mockPost.mock.calls.find(
      ([url]: [string]) => url === '/api/wishlist'
    );
    expect(wishlistPost).toBeDefined();
    const payload = wishlistPost![1];
    expect(payload).toMatchObject({
      product_id: 7,
      notify_back_in_stock: true,
      notify_price_drop: true,
      target_price: 350,
    });
  });

  it('defaults both flags to false when no opts are passed (backward compat)', async () => {
    const { result } = renderHook(() => useWishlist(), { wrapper });

    await act(async () => {
      await result.current.addToWishlist(5);
    });

    const wishlistPost = mockPost.mock.calls.find(
      ([url]: [string]) => url === '/api/wishlist'
    );
    expect(wishlistPost).toBeDefined();
    const payload = wishlistPost![1];
    expect(payload).toMatchObject({
      product_id: 5,
      notify_back_in_stock: false,
      notify_price_drop: false,
    });
  });
});

describe('WishlistContext — updateWishlistNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPut.mockResolvedValue({ data: { success: true } });
    mockGet.mockResolvedValue({ data: { success: true, items: [] } });
    mockPost.mockResolvedValue({ data: { success: true, item: { id: 1 } } });
    mockDelete.mockResolvedValue({ data: { success: true } });
  });

  it('calls PUT /api/wishlist/:productId with notify flags', async () => {
    const { result } = renderHook(() => useWishlist(), { wrapper });

    await act(async () => {
      await result.current.updateWishlistNotifications(42, {
        notify_back_in_stock: true,
        notify_price_drop: false,
      });
    });

    expect(mockPut).toHaveBeenCalledWith(
      '/api/wishlist/42',
      expect.objectContaining({
        notify_back_in_stock: true,
        notify_price_drop: false,
      })
    );
  });
});
