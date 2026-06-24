// @vitest-environment jsdom
/**
 * TDD RED → GREEN — Seller products list: Edit button affordance
 *
 * Covers:
 * 1. Edit link is rendered for every product row
 * 2. Edit links point to /seller/products/{id}/edit
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/seller/products',
  useSearchParams: () => ({ get: vi.fn() }),
  useParams: () => ({}),
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
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('@/utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/i18n/config', () => ({
  default: {},
}));

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockGetSellerProducts = vi.fn();
vi.mock('@/services/sellerOnboardingService', () => ({
  getSellerProducts: () => mockGetSellerProducts(),
}));

// AI-related mocks (needed after marketing copy integration)
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

const AUTH_SELLER = { isAuthenticated: true, user: { role: 'seller', is_seller: true } };

const MOCK_PRODUCTS = {
  data: [
    { id: 1, name: 'Caftan Brodé', price: '450.00', is_active: true, quantity: 10 },
    { id: 2, name: 'Jabador Homme', price: '380.00', is_active: false, quantity: 0 },
  ],
};

describe('SellerProductsPage — edit affordance', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(AUTH_SELLER);
    mockGetSellerProducts.mockResolvedValue(MOCK_PRODUCTS);
  });

  it('renders an edit link for every product row pointing to /seller/products/{id}/edit', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByText('Caftan Brodé');

    // Both products should have an edit link
    const editLinks = screen.getAllByRole('link').filter(l =>
      l.getAttribute('href')?.includes('/edit')
    );
    expect(editLinks.length).toBeGreaterThanOrEqual(2);
    expect(editLinks.some(l => l.getAttribute('href') === '/seller/products/1/edit')).toBe(true);
    expect(editLinks.some(l => l.getAttribute('href') === '/seller/products/2/edit')).toBe(true);
  });
});
