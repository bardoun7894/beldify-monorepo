// @vitest-environment jsdom
/**
 * TDD RED → GREEN — Store Settings real load + save
 *
 * Covers:
 * 1. Prefills store name from GET /api/seller/store-profile
 * 2. Calls PUT /api/seller/store-profile on Save
 * 3. Disables save button while saving
 * 4. Shows 422 field error under the store name input
 * 5. Shows success feedback after save
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/seller/store-settings',
}));

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

vi.mock('@/services/verticalService', () => ({
  fetchVerticalConfig: vi.fn().mockResolvedValue({ fields: [] }),
}));

const mockGetStoreProfile = vi.fn();
const mockUpdateStoreProfile = vi.fn();

vi.mock('@/services/sellerOnboardingService', () => ({
  getStoreProfile: (...args: unknown[]) => mockGetStoreProfile(...args),
  updateStoreProfile: (...args: unknown[]) => mockUpdateStoreProfile(...args),
}));

// AI-related mocks (added when AI store generation was integrated into store settings)
vi.mock('@/services/sellerCreditService', () => ({
  getSellerCredits: vi.fn().mockResolvedValue({
    balance: 10,
    costs: { listing_writer: 2, store_creator: 2, translate_listing: 1, marketing_copy: 1 },
    transactions: [],
  }),
}));

vi.mock('@/services/sellerAiService', () => ({
  generateStoreProfile: vi.fn(),
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

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const AUTH_SELLER = { isAuthenticated: true, user: { role: 'seller', is_seller: true } };

const MOCK_PROFILE = {
  data: {
    name: 'Atlas Bijoux',
    description: 'Fine Moroccan jewelry',
    contact_email: 'shop@atlas.ma',
    contact_phone: '+212612345678',
    address: '12 Rue de la Kasbah',
    store_logo: null,
    store_banner: null,
    profile_completion_percentage: 80,
  },
};

describe('StoreSettingsPage — real load + save', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(AUTH_SELLER);
    mockGetStoreProfile.mockResolvedValue(MOCK_PROFILE);
    mockUpdateStoreProfile.mockResolvedValue(MOCK_PROFILE);
  });

  it('prefills store name from GET /api/seller/store-profile', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    // Wait for async load
    const nameInput = await screen.findByDisplayValue('Atlas Bijoux');
    expect(nameInput).toBeTruthy();
  });

  it('calls updateStoreProfile on save (not the old setTimeout mock)', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByDisplayValue('Atlas Bijoux');
    // Find and click the save button
    const saveBtn = screen.getByRole('button', { name: /save|حفظ/i });
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(mockUpdateStoreProfile).toHaveBeenCalled();
    });
  });

  it('disables save button while request is pending', async () => {
    // Never resolves — simulates long request
    mockUpdateStoreProfile.mockReturnValue(new Promise(() => {}));
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByDisplayValue('Atlas Bijoux');
    const saveBtn = screen.getByRole('button', { name: /save|حفظ/i });
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect((saveBtn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it('shows 422 validation error under inputs after failed save', async () => {
    mockUpdateStoreProfile.mockRejectedValue({
      response: {
        status: 422,
        data: { errors: { name: ['The name field is required.'] } },
      },
    });
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByDisplayValue('Atlas Bijoux');
    const saveBtn = screen.getByRole('button', { name: /save|حفظ/i });
    fireEvent.click(saveBtn);
    // The error message should appear (either as alert or field error)
    const errMsgs = await screen.findAllByText(/The name field is required\./i);
    expect(errMsgs.length).toBeGreaterThan(0);
  });

  it('shows a success indicator after a successful save', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByDisplayValue('Atlas Bijoux');
    const saveBtn = screen.getByRole('button', { name: /save|حفظ/i });
    fireEvent.click(saveBtn);
    // After successful save, a success text or icon should appear
    const success = await screen.findByText(/saved|success|تم/i);
    expect(success).toBeTruthy();
  });
});
