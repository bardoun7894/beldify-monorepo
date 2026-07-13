// @vitest-environment jsdom
/**
 * TDD — sparse real-shop-state coverage for ShopCard.
 *
 * Production reality (bardstore, id 14): store_logo is null, rating/reviews
 * are 0, is_verified is false. These tests pin the "looks intentional, not
 * broken" fallback behaviour instead of the rich-mock states the card used
 * to be exercised against.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import ShopCard from '../ShopCard';
import type { Shop } from '@/lib/types/shop';

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

function makeShop(overrides: Partial<Shop> = {}): Shop {
  return {
    id: 14,
    name: 'bardstore',
    store_type: { id: 1, name: "Women's Clothing", slug: 'womenswear', capabilities: [] },
    profile: {
      store_name: 'bardstore',
      store_logo: null,
      description: "Moroccan women's traditional wear — caftans and takchita.",
      contact_email: null,
      contact_phone: null,
      website: null,
      business_hours: {},
      shipping_methods: [],
      payment_methods: [],
      return_policy: null,
      shipping_policy: null,
      is_verified: false,
      status: 'active',
      social_media: {},
      business_categories: [],
      rating: 0,
      total_reviews: 0,
      total_sales: 0,
      store_locations: [],
    },
    products_count: 0,
    status: 'active',
    is_active: true,
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
    ...overrides,
  } as Shop;
}

describe('ShopCard — sparse real-shop state', () => {
  afterEach(() => cleanup());

  it('renders a dignified monogram fallback instead of a broken/empty image when store_logo is null', () => {
    render(<ShopCard shop={makeShop()} />);
    // Must NOT render a "no image available" placeholder caption — that reads
    // as broken. Must render an initial/monogram-style avatar instead.
    expect(screen.queryByText(/no image/i)).toBeNull();
    // Monogram: first letter of the shop name, uppercased.
    expect(screen.getByText('B')).toBeTruthy();
  });

  it('does not render a 0.0-star rating for a shop with no reviews yet', () => {
    render(<ShopCard shop={makeShop()} />);
    expect(screen.queryByText(/0\.0/)).toBeNull();
    expect(screen.queryByText(/★/)).toBeNull();
  });

  it('does not render a scary "unverified" warning badge when is_verified is false', () => {
    render(<ShopCard shop={makeShop()} />);
    expect(screen.queryByText(/unverified/i)).toBeNull();
  });

  it('the card link is keyboard reachable and the fallback avatar is announced to assistive tech', () => {
    render(<ShopCard shop={makeShop()} />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    // The fallback avatar container carries an accessible name (role=img or aria-label)
    expect(screen.getByRole('img', { hidden: true })).toBeTruthy();
  });
});
