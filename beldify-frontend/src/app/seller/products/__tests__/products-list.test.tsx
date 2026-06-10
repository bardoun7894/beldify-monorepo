// @vitest-environment jsdom
/**
 * TDD RED → GREEN — Seller products list page
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/seller/products',
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockGetSellerProducts = vi.fn();
vi.mock('@/services/sellerOnboardingService', () => ({
  getSellerProducts: () => mockGetSellerProducts(),
}));

// AI-related mocks (added when marketing copy was integrated into the products list)
vi.mock('@/services/sellerCreditService', () => ({
  getSellerCredits: vi.fn().mockResolvedValue({
    balance: 10,
    costs: { listing_writer: 2, store_creator: 2, translate_listing: 1, marketing_copy: 1 },
    transactions: [],
  }),
}));

vi.mock('@/services/sellerAiService', () => ({
  generateMarketing: vi.fn(),
  generateListing: vi.fn(),
  translateListing: vi.fn(),
  generateStoreProfile: vi.fn(),
  InsufficientCreditsError: class InsufficientCreditsError extends Error {
    balance: number; cost: number; feature: string;
    constructor(balance: number, cost: number, feature: string) {
      super('insufficient_credits');
      this.balance = balance; this.cost = cost; this.feature = feature;
    }
  },
}));

const MOCK_PRODUCTS = {
  data: [
    { id: 1, name: 'Caftan Brodé', price: '450.00', is_active: true, quantity: 10 },
    { id: 2, name: 'Jabador Homme', price: '380.00', is_active: false, quantity: 0 },
  ],
};

const AUTH_SELLER = { isAuthenticated: true, user: { role: 'seller', is_seller: true } };

describe('SellerProductsPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(AUTH_SELLER);
    mockGetSellerProducts.mockResolvedValue(MOCK_PRODUCTS);
  });

  it('renders product names when data loaded', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const p1 = await screen.findByText('Caftan Brodé');
    expect(p1).toBeTruthy();
    expect(screen.getByText('Jabador Homme')).toBeTruthy();
  });

  it('renders product prices', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByText('Caftan Brodé');
    expect(screen.getByText(/450/)).toBeTruthy();
  });

  it('renders an Add product button linking to /seller/products/new', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const btn = await screen.findByRole('link', { name: /add product/i });
    expect(btn.getAttribute('href')).toBe('/seller/products/new');
  });

  it('shows empty state when no products', async () => {
    mockGetSellerProducts.mockResolvedValue({ data: [] });
    const { default: Page } = await import('../page');
    render(<Page />);
    const empty = await screen.findByText(/no products/i);
    expect(empty).toBeTruthy();
  });

  it('shows error message when fetch fails', async () => {
    mockGetSellerProducts.mockRejectedValue(new Error('Network error'));
    const { default: Page } = await import('../page');
    render(<Page />);
    const err = await screen.findByText(/could not load/i);
    expect(err).toBeTruthy();
  });
});
