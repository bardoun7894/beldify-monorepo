// @vitest-environment jsdom
/**
 * TDD RED → GREEN — Seller credits page
 *
 * Tests:
 * 1. Balance card renders the balance and feature costs
 * 2. Pack cards render name, credits, price
 * 3. Purchase flow shows bank_details and file upload
 * 4. Purchase history shows status badges
 * 5. Transaction history renders signed amounts
 * 6. Loading skeleton shown while fetching
 * 7. Purchase flow validates receipt file
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

// ── Navigation + Link stubs ─────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/seller/credits',
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// ── i18n stub ────────────────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'en' },
  }),
}));

// ── Auth ─────────────────────────────────────────────────────────────────────
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { role: 'seller', is_seller: true } }),
}));

// ── Service mocks ─────────────────────────────────────────────────────────────
const mockGetSellerCredits = vi.fn();
const mockGetSellerCreditPacks = vi.fn();
const mockPurchaseCredits = vi.fn();
const mockGetSellerCreditPurchases = vi.fn();

vi.mock('@/services/sellerCreditService', () => ({
  getSellerCredits: () => mockGetSellerCredits(),
  getSellerCreditPacks: () => mockGetSellerCreditPacks(),
  purchaseCredits: (p: unknown) => mockPurchaseCredits(p),
  getSellerCreditPurchases: () => mockGetSellerCreditPurchases(),
}));

// ── Toast stub ───────────────────────────────────────────────────────────────
vi.mock('@/utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_CREDITS = {
  balance: 14,
  costs: { listing_writer: 2, store_creator: 2, translate_listing: 1, marketing_copy: 1 },
  transactions: [
    { id: 1, type: 'bonus', amount: 10, balance_after: 10, feature: null, created_at: '2026-06-01T00:00:00Z' },
    { id: 2, type: 'consumption', amount: -2, balance_after: 8, feature: 'listing_writer', created_at: '2026-06-02T00:00:00Z' },
    { id: 3, type: 'purchase', amount: 50, balance_after: 58, feature: null, created_at: '2026-06-03T00:00:00Z' },
  ],
};

const MOCK_PACKS = {
  packs: [
    { id: 1, name: 'Starter', credits: 10, price_mad: 50 },
    { id: 2, name: 'Growth', credits: 50, price_mad: 200 },
  ],
  bank_details: 'RIB: 0123456789012345678901234',
};

const MOCK_PURCHASES = {
  purchases: [
    { id: 1, pack_name: 'Starter', credits: 10, price_mad: 50, status: 'approved', notes: null, created_at: '2026-06-01T00:00:00Z', reviewed_at: '2026-06-02T00:00:00Z' },
    { id: 2, pack_name: 'Growth', credits: 50, price_mad: 200, status: 'pending', notes: null, created_at: '2026-06-05T00:00:00Z', reviewed_at: null },
    { id: 3, pack_name: 'Starter', credits: 10, price_mad: 50, status: 'rejected', notes: 'Receipt unclear', created_at: '2026-05-30T00:00:00Z', reviewed_at: '2026-05-31T00:00:00Z' },
  ],
};

describe('SellerCreditsPage', () => {
  beforeEach(() => {
    mockGetSellerCredits.mockResolvedValue(MOCK_CREDITS);
    mockGetSellerCreditPacks.mockResolvedValue(MOCK_PACKS);
    mockGetSellerCreditPurchases.mockResolvedValue(MOCK_PURCHASES);
  });

  it('renders the credit balance', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    // Balance of 14 should be visible
    await waitFor(() => expect(screen.getByText('14')).toBeTruthy());
  });

  it('renders feature costs list', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    // "Listing Writer" with cost 2 — find by text
    await waitFor(() => {
      const costItems = screen.getAllByText(/2 credits?/i);
      expect(costItems.length).toBeGreaterThan(0);
    });
  });

  it('renders pack cards with name, credits and price', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText('Starter')).toBeTruthy();
      expect(screen.getByText('Growth')).toBeTruthy();
    });
    // 10 credits + 200 MAD price visible
    expect(screen.getByText('10 credits')).toBeTruthy();
    expect(screen.getByText('200 MAD')).toBeTruthy();
  });

  it('shows bank_details and file upload after selecting a pack', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await waitFor(() => expect(screen.getByText('Starter')).toBeTruthy());

    // Click on the Starter pack
    const starterBtn = screen.getByRole('button', { name: /starter/i });
    fireEvent.click(starterBtn);

    await waitFor(() => {
      expect(screen.getByText(/RIB: 0123456789012345678901234/)).toBeTruthy();
    });
    // File input should be present
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();
  });

  it('shows approved, pending, rejected status badges in purchase history', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await waitFor(() => {
      // approved
      const approved = screen.getByText(/approved/i);
      expect(approved).toBeTruthy();
      // pending
      const pending = screen.getByText(/pending/i);
      expect(pending).toBeTruthy();
      // rejected + notes
      const rejected = screen.getByText(/rejected/i);
      expect(rejected).toBeTruthy();
    });
    expect(screen.getByText('Receipt unclear')).toBeTruthy();
  });

  it('renders transaction history with signed amounts', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    // bonus = +10, consumption = -2, purchase = +50
    await waitFor(() => {
      expect(screen.getByText(/\+10/)).toBeTruthy();
    });
    expect(screen.getByText(/-2/)).toBeTruthy();
    expect(screen.getByText(/\+50/)).toBeTruthy();
  });

  it('shows loading skeletons while data is loading', async () => {
    // Delay the response so we can check for skeleton
    let resolveCredits!: (v: typeof MOCK_CREDITS) => void;
    mockGetSellerCredits.mockReturnValue(new Promise((res) => { resolveCredits = res; }));

    const { default: Page } = await import('../page');
    render(<Page />);
    // The skeleton container should be visible
    const skeleton = document.querySelector('[data-testid="credits-skeleton"]');
    expect(skeleton).not.toBeNull();
    // Resolve to avoid hanging
    resolveCredits(MOCK_CREDITS);
  });
});
