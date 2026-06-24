// @vitest-environment jsdom
/**
 * TDD RED → GREEN — AI store profile generation in store-settings page
 *
 * Verifies:
 *   - "Generate with AI" button is present in store description section
 *   - Clicking it calls generateStoreProfile
 *   - Slogan, description, name ideas are shown in a copyable panel
 *   - 402 opens InsufficientCreditsModal
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

afterEach(() => vi.clearAllMocks());

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

vi.mock('@/services/verticalService', () => ({
  fetchVerticalConfig: vi.fn().mockResolvedValue({ vertical: 'regular', fields: [] }),
}));

vi.mock('@/services/sellerOnboardingService', () => ({
  getStoreProfile: vi.fn().mockResolvedValue({
    data: { name: 'My Store', contact_email: 'test@example.com', description: '', contact_phone: '', address: '' },
  }),
  updateStoreProfile: vi.fn().mockResolvedValue({ data: {} }),
}));

const mockGetSellerCredits = vi.fn();
vi.mock('@/services/sellerCreditService', () => ({
  getSellerCredits: (...args: unknown[]) => mockGetSellerCredits(...args),
}));

const mockGenerateStoreProfile = vi.fn();
vi.mock('@/services/sellerAiService', () => ({
  generateStoreProfile: (...args: unknown[]) => mockGenerateStoreProfile(...args),
  generateListing: vi.fn(),
  translateListing: vi.fn(),
  generateMarketing: vi.fn(),
  InsufficientCreditsError: class InsufficientCreditsError extends Error {
    balance: number; cost: number; feature: string;
    constructor(balance: number, cost: number, feature: string) {
      super('insufficient_credits');
      this.balance = balance; this.cost = cost; this.feature = feature;
    }
  },
}));

describe('StoreSettingsPage — AI store profile generation', () => {
  beforeEach(() => {
    mockGetSellerCredits.mockResolvedValue({
      balance: 10,
      costs: { listing_writer: 2, store_creator: 2, translate_listing: 1, marketing_copy: 1 },
      transactions: [],
    });
    mockGenerateStoreProfile.mockResolvedValue({
      credits_charged: 2,
      balance: 8,
      result: {
        name_ideas: ['Atlas Bijoux', 'Sahara Gold'],
        slogan: 'Crafted with love in Morocco',
        description: 'A beautiful store selling handmade jewelry',
        return_policy: 'Returns within 14 days',
        shipping_policy: 'Ships within 3-5 days',
      },
    });
  });

  it('renders the AI generate button in the store info section', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    // Wait for store name to load
    await screen.findByLabelText(/store name/i);
    const aiBtn = await screen.findByRole('button', { name: /generate.*ai|ai.*generate/i });
    expect(aiBtn).toBeTruthy();
  });

  it('shows generated store name ideas and slogan after AI generation', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/store name/i);

    const aiBtn = await screen.findByRole('button', { name: /generate.*ai|ai.*generate/i });
    await act(async () => { fireEvent.click(aiBtn); });

    await waitFor(() => {
      expect(mockGenerateStoreProfile).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/Atlas Bijoux/)).toBeTruthy();
    });
  });

  it('shows slogan in the AI results panel', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/store name/i);

    const aiBtn = await screen.findByRole('button', { name: /generate.*ai|ai.*generate/i });
    await act(async () => { fireEvent.click(aiBtn); });

    await waitFor(() => {
      expect(screen.getByText(/Crafted with love in Morocco/)).toBeTruthy();
    });
  });

  it('opens InsufficientCreditsModal on 402', async () => {
    const { InsufficientCreditsError } = await import('@/services/sellerAiService');
    mockGenerateStoreProfile.mockRejectedValue(
      new (InsufficientCreditsError as any)(1, 2, 'store_creator')
    );

    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/store name/i);

    const aiBtn = await screen.findByRole('button', { name: /generate.*ai|ai.*generate/i });
    await act(async () => { fireEvent.click(aiBtn); });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
    });
  });
});
