// @vitest-environment jsdom
/**
 * TDD RED → GREEN — Seller nav: Credits item (A4) + mobile "More" sheet (A5)
 *
 * A4: buildNavItems must include a Credits destination → /seller/credits.
 * A5: the mobile tab bar shows the 5 primary tabs PLUS a "More" tab that opens
 *     a bottom sheet listing every remaining destination, so all 9 nav items
 *     (10 incl. Credits) are reachable on mobile.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const mockPush = vi.fn();
let mockPathname = '/seller';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>{children}</a>
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

vi.mock('@/services/messagingService', () => ({
  getSellerUnreadCount: vi.fn().mockResolvedValue(0),
}));

vi.mock('@/services/sellerCreditService', () => ({
  getSellerCredits: vi.fn().mockResolvedValue({ balance: 12 }),
}));

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));

const AUTH_SELLER = { isAuthenticated: true, loading: false, user: { role: 'store_owner', is_seller: true } };

describe('Seller nav — Credits + mobile More sheet', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(AUTH_SELLER);
    mockPathname = '/seller';
  });

  // ── A4 ─────────────────────────────────────────────────────────────────────
  it('exposes a Credits nav link pointing to /seller/credits', async () => {
    const { default: Layout } = await import('../layout');
    render(<Layout><span>CHILD</span></Layout>);
    const creditsLinks = screen.getAllByRole('link', { name: /credits/i });
    expect(creditsLinks.length).toBeGreaterThan(0);
    expect(creditsLinks.some((l) => l.getAttribute('href') === '/seller/credits')).toBe(true);
  });

  // ── A5 ─────────────────────────────────────────────────────────────────────
  it('renders a "More" trigger in the mobile tab bar', async () => {
    const { default: Layout } = await import('../layout');
    render(<Layout><span>CHILD</span></Layout>);
    expect(screen.getByRole('button', { name: /more/i })).toBeInTheDocument();
  });

  it('opens a sheet listing the overflow destinations when "More" is clicked', async () => {
    const { default: Layout } = await import('../layout');
    render(<Layout><span>CHILD</span></Layout>);

    // Sheet not open initially
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /more/i }));

    const sheet = await screen.findByRole('dialog');
    const inSheet = within(sheet);
    // Every overflow destination must be reachable from the sheet
    expect(inSheet.getByRole('link', { name: /payouts/i }).getAttribute('href')).toBe('/seller/payouts');
    expect(inSheet.getByRole('link', { name: /store settings/i }).getAttribute('href')).toBe('/seller/store-settings');
    expect(inSheet.getByRole('link', { name: /profile/i }).getAttribute('href')).toBe('/seller/profile');
    expect(inSheet.getByRole('link', { name: /messages/i }).getAttribute('href')).toBe('/seller/messages');
  });

  it('every one of the 9 destinations is reachable on mobile (primary tabs + sheet)', async () => {
    const { default: Layout } = await import('../layout');
    render(<Layout><span>CHILD</span></Layout>);
    fireEvent.click(screen.getByRole('button', { name: /more/i }));
    await screen.findByRole('dialog');

    const expectedHrefs = [
      '/seller',
      '/seller/products',
      '/seller/orders',
      '/seller/custom-orders',
      '/seller/earnings',
      '/seller/payouts',
      '/seller/store-settings',
      '/seller/profile',
      '/seller/messages',
    ];
    const allHrefs = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    for (const href of expectedHrefs) {
      expect(allHrefs).toContain(href);
    }
  });
});
