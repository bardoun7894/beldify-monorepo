// @vitest-environment jsdom
/**
 * TDD RED → GREEN — Credit balance chip in seller layout
 *
 * Tests:
 * 1. Credit chip renders balance from getSellerCredits
 * 2. Chip links to /seller/credits
 * 3. Chip renders nothing (gracefully) when fetch fails
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const mockPush = vi.fn();
let mockPathname = '/seller';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
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

const AUTH_SELLER = { isAuthenticated: true, user: { role: 'seller', is_seller: true } };

const mockGetSellerCredits = vi.fn();
vi.mock('@/services/sellerCreditService', () => ({
  getSellerCredits: () => mockGetSellerCredits(),
  getSellerCreditPacks: vi.fn(),
  purchaseCredits: vi.fn(),
  getSellerCreditPurchases: vi.fn(),
}));

// Also mock messaging service used by layout
vi.mock('@/services/messagingService', () => ({
  getSellerUnreadCount: vi.fn().mockResolvedValue(0),
}));

describe('SellerLayout — credit balance chip', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(AUTH_SELLER);
    mockPathname = '/seller';
    mockGetSellerCredits.mockResolvedValue({
      balance: 14,
      costs: {},
      transactions: [],
    });
  });

  it('renders a credit chip with balance and link to /seller/credits', async () => {
    const { default: Layout } = await import('../layout');
    render(<Layout><span>content</span></Layout>);
    // Wait for async balance fetch
    await waitFor(() => {
      const chip = screen.getByTestId('credit-chip');
      expect(chip).toBeTruthy();
      expect(chip.textContent).toContain('14');
    });
    const link = screen.getByTestId('credit-chip').closest('a');
    expect(link?.getAttribute('href')).toBe('/seller/credits');
  });

  it('renders nothing in the chip area when fetch fails (no layout crash)', async () => {
    mockGetSellerCredits.mockRejectedValue(new Error('Network error'));
    const { default: Layout } = await import('../layout');
    // Should not throw
    render(<Layout><span data-testid="child">content</span></Layout>);
    await waitFor(() => expect(screen.getByTestId('child')).toBeTruthy());
    // chip should not be in the DOM when fetch failed
    expect(screen.queryByTestId('credit-chip')).toBeNull();
  });
});
