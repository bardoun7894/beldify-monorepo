// @vitest-environment jsdom
/**
 * TDD — sparse real-shop-state coverage for the shop detail page.
 *
 * Mirrors production reality (bardstore, id 14): store_cover is null,
 * products is an empty array, rating/reviews are 0, is_verified is false.
 * These tests pin the "looks intentional, not broken" behaviour.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import ShopPage from '../page';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOpts?: any, maybeOpts?: any) => {
      const fallback = typeof fallbackOrOpts === 'string' ? fallbackOrOpts : undefined;
      const opts = typeof fallbackOrOpts === 'object' ? fallbackOrOpts : maybeOpts;
      let str = fallback ?? key;
      if (opts) {
        Object.keys(opts).forEach((k) => {
          str = str.replace(`{{${k}}}`, String(opts[k]));
        });
      }
      return str;
    },
  }),
}));

vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ isRTL: false }),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ name: 'bardstore' }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt} src={typeof props.src === 'string' ? props.src : ''} />;
  },
}));

vi.mock('@/components/products/ProductCard', () => ({
  __esModule: true,
  default: ({ product }: any) => <div data-testid="product-card">{product?.name}</div>,
}));

vi.mock('@/components/share/ShareButton', () => ({
  __esModule: true,
  default: () => <button type="button">Share</button>,
}));

vi.mock('@/utils/consoleLogger', () => ({
  __esModule: true,
  default: { log: vi.fn(), error: vi.fn() },
}));

vi.mock('@/utils/toast', () => ({
  __esModule: true,
  default: { success: vi.fn(), error: vi.fn() },
}));

const bardstore = {
  id: 14,
  name: 'bardstore',
  created_at: '2026-07-01T00:00:00Z',
  status: 'active',
  is_verified: false,
  profile: {
    store_name: 'bardstore',
    store_logo: null,
    cover_image: null,
    description: "Moroccan women's traditional wear — caftans and takchita.",
    is_verified: false,
    rating: 0,
    total_reviews: 0,
  },
  products: [],
};

vi.mock('@/services/shopService', () => ({
  shopService: {
    getShopByName: vi.fn(async () => ({ data: { store: bardstore }, error: null })),
    getShops: vi.fn(async () => ({ data: { shops: [], pagination: {} }, error: null })),
    checkFollowing: vi.fn(async () => ({ data: { isFollowing: false }, error: null, isAuthenticated: true })),
    followShop: vi.fn(),
    unfollowShop: vi.fn(),
  },
}));

describe('Shop detail page — sparse real-shop state (bardstore)', () => {
  afterEach(() => cleanup());

  it('renders a designed gradient cover fallback (no <img>) when cover_image is null', async () => {
    render(<ShopPage />);
    await waitFor(() => expect(screen.getByText('bardstore')).toBeTruthy());
    // No cover image should be rendered — a broken/grey <img> is worse than none.
    const images = screen.queryAllByRole('img');
    const coverImg = images.find((img) => (img.getAttribute('alt') || '').toLowerCase().includes('cover'));
    expect(coverImg).toBeUndefined();
  });

  it('shows a "no products yet" empty state (not a generic filtered-empty message) for a brand-new shop', async () => {
    render(<ShopPage />);
    await waitFor(() => expect(screen.getByText('bardstore')).toBeTruthy());
    expect(screen.getByText(/no products yet/i)).toBeTruthy();
  });

  it('does not render a 0.0-star rating for a shop with no reviews', async () => {
    render(<ShopPage />);
    await waitFor(() => expect(screen.getByText('bardstore')).toBeTruthy());
    expect(screen.queryByText(/0\.0/)).toBeNull();
  });

  it('does not render an "unverified" warning badge for is_verified=false', async () => {
    render(<ShopPage />);
    await waitFor(() => expect(screen.getByText('bardstore')).toBeTruthy());
    expect(screen.queryByText(/unverified/i)).toBeNull();
  });
});
