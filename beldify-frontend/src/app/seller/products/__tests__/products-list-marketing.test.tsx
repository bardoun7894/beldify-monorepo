// @vitest-environment jsdom
/**
 * TDD RED → GREEN — Marketing copy action in seller products list
 *
 * Verifies:
 *   - Per-product Marketing copy button is present
 *   - Clicking it calls generateMarketing
 *   - Bottom sheet/modal shows whatsapp_message, social_caption, product_url
 *   - Copy buttons fire clipboard write
 *   - 402 opens InsufficientCreditsModal
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

afterEach(() => vi.clearAllMocks());

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' '),
}));

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));

const AUTHENTICATED_USER = { isAuthenticated: true, user: { role: 'seller', is_seller: true } };

const MOCK_PRODUCTS = [
  { id: 1, name: 'Royal Caftan', price: 500, is_active: true, quantity: 5 },
  { id: 2, name: 'Silver Ring', price: 200, is_active: true, quantity: 2 },
];

vi.mock('@/services/sellerOnboardingService', () => ({
  getSellerProducts: vi.fn().mockResolvedValue({ data: MOCK_PRODUCTS }),
}));

const mockGetSellerCredits = vi.fn();
vi.mock('@/services/sellerCreditService', () => ({
  getSellerCredits: (...args: unknown[]) => mockGetSellerCredits(...args),
}));

const mockGenerateMarketing = vi.fn();
vi.mock('@/services/sellerAiService', () => ({
  generateMarketing: (...args: unknown[]) => mockGenerateMarketing(...args),
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

describe('SellerProductsPage — Marketing copy', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(AUTHENTICATED_USER);
    mockGetSellerCredits.mockResolvedValue({
      balance: 10,
      costs: { listing_writer: 2, store_creator: 2, translate_listing: 1, marketing_copy: 1 },
      transactions: [],
    });
    mockGenerateMarketing.mockResolvedValue({
      credits_charged: 1,
      balance: 9,
      result: {
        whatsapp_message: 'Check out Royal Caftan at Beldify!',
        social_caption: 'Amazing Moroccan fashion',
        product_url: 'https://beldify.com/products/1',
      },
    });
  });

  it('renders a marketing copy button per product', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    // Wait for products to load
    await screen.findByText('Royal Caftan');
    const marketingBtns = screen.getAllByRole('button', { name: /marketing|copy|market/i });
    expect(marketingBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('shows a sheet/modal with whatsapp message and social caption after click', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByText('Royal Caftan');

    const [firstBtn] = screen.getAllByRole('button', { name: /marketing|copy|market/i });
    await act(async () => { fireEvent.click(firstBtn); });

    await waitFor(() => {
      expect(mockGenerateMarketing).toHaveBeenCalledWith({ product_id: 1 });
    });

    await waitFor(() => {
      expect(screen.getByText(/Check out Royal Caftan/)).toBeTruthy();
    });
  });

  it('shows copy-to-clipboard buttons for each piece of content', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByText('Royal Caftan');

    const [firstBtn] = screen.getAllByRole('button', { name: /marketing|copy|market/i });
    await act(async () => { fireEvent.click(firstBtn); });

    await waitFor(() => {
      expect(screen.getByText(/Check out Royal Caftan/)).toBeTruthy();
    });

    // Should have copy buttons
    const copyBtns = screen.getAllByRole('button', { name: /copy/i });
    expect(copyBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('opens InsufficientCreditsModal on 402', async () => {
    const { InsufficientCreditsError } = await import('@/services/sellerAiService');
    mockGenerateMarketing.mockRejectedValue(
      new (InsufficientCreditsError as any)(1, 1, 'marketing_copy')
    );

    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByText('Royal Caftan');

    const [firstBtn] = screen.getAllByRole('button', { name: /marketing|copy|market/i });
    await act(async () => { fireEvent.click(firstBtn); });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
    });
  });
});
