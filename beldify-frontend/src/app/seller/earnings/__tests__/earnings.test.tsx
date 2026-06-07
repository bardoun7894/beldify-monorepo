// @vitest-environment jsdom
/**
 * TDD RED → GREEN — Seller earnings page
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/seller/earnings',
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

const mockGetSellerEarnings = vi.fn();
vi.mock('@/services/sellerDashboardService', () => ({
  getSellerEarnings: (period: number) => mockGetSellerEarnings(period),
}));

const MOCK_EARNINGS = {
  data: {
    currency: 'MAD',
    gross_revenue: 8500,
    total_commission: 850,
    net_revenue: 7650,
    orders_count: 20,
    average_order_value: 425,
    by_day: [
      { date: '2026-01-01', revenue: 300 },
      { date: '2026-01-02', revenue: 500 },
      { date: '2026-01-03', revenue: 450 },
    ],
    period: 30,
  },
};

const AUTH_SELLER = { isAuthenticated: true, user: { role: 'seller', is_seller: true } };

describe('SellerEarningsPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(AUTH_SELLER);
    mockGetSellerEarnings.mockResolvedValue(MOCK_EARNINGS);
  });

  it('renders gross revenue KPI', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    // multiple elements may show same value (KPI + breakdown table)
    const kpis = await screen.findAllByText(/8[,\s.]?500/);
    expect(kpis.length).toBeGreaterThan(0);
  });

  it('renders net revenue KPI', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const kpis = await screen.findAllByText(/7[,\s.]?650/);
    expect(kpis.length).toBeGreaterThan(0);
  });

  it('renders orders count', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    // Wait for data
    await screen.findAllByText(/8[,\s.]?500/);
    expect(screen.getByText('20')).toBeTruthy();
  });

  it('renders period switcher buttons (7, 30, 90 days)', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findAllByText(/8[,\s.]?500/);
    expect(screen.getByRole('button', { name: '7 days' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '30 days' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '90 days' })).toBeTruthy();
  });

  it('renders a chart or bar visualization for by_day data', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findAllByText(/8[,\s.]?500/);
    // Should have a chart container with data-testid
    const chart = document.querySelector('[data-testid="earnings-chart"]');
    expect(chart).not.toBeNull();
  });

  it('shows error state gracefully when fetch fails', async () => {
    mockGetSellerEarnings.mockRejectedValue(new Error('Network error'));
    const { default: Page } = await import('../page');
    render(<Page />);
    const err = await screen.findByText(/could not load/i);
    expect(err).toBeTruthy();
  });

  it('renders commission amount', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    // 850 appears in commission KPI and breakdown — use findAllByText
    const items = await screen.findAllByText(/850/);
    expect(items.length).toBeGreaterThan(0);
  });
});
