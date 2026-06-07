// @vitest-environment jsdom
/**
 * TDD RED → GREEN — Seller dashboard home page tests
 *
 * Tests:
 * 1. Renders KPI cards when earnings loaded
 * 2. Renders onboarding banner when status loaded
 * 3. Renders recent orders table when orders loaded
 * 4. Degrades gracefully when one API call fails (others still render)
 * 5. Shows loading skeletons initially
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/seller',
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
const mockGetSellerOrders = vi.fn();
vi.mock('@/services/sellerDashboardService', () => ({
  getSellerEarnings: () => mockGetSellerEarnings(),
  getSellerOrders: () => mockGetSellerOrders(),
}));

const mockGetOnboardingStatus = vi.fn();
vi.mock('@/services/sellerOnboardingService', () => ({
  getOnboardingStatus: () => mockGetOnboardingStatus(),
}));

const MOCK_EARNINGS = {
  data: {
    currency: 'MAD',
    gross_revenue: 5000,
    total_commission: 500,
    net_revenue: 4500,
    orders_count: 12,
    average_order_value: 416,
    by_day: [],
    period: 30,
  },
};

const MOCK_ORDERS = {
  data: [
    { id: 1, order_number: 'ORD-001', customer_name: 'Ahmed B.', status: 'pending', total_amount: 350, items_count: 2, created_at: '2026-01-01' },
    { id: 2, order_number: 'ORD-002', customer_name: 'Fatima Z.', status: 'shipped', total_amount: 200, items_count: 1, created_at: '2026-01-02' },
  ],
  meta: { current_page: 1, last_page: 1, total: 2 },
};

const MOCK_ONBOARDING = {
  data: {
    store_status: 'active' as const,
    needs_details: false,
    is_verified: true,
    verification_level: 'basic',
    profile_completion_percentage: 90,
    products_count: 5,
    overall_percentage: 90,
    steps: [],
  },
};

const AUTH_SELLER = { isAuthenticated: true, user: { role: 'seller', is_seller: true } };

describe('SellerDashboardPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(AUTH_SELLER);
    mockGetSellerEarnings.mockResolvedValue(MOCK_EARNINGS);
    mockGetSellerOrders.mockResolvedValue(MOCK_ORDERS);
    mockGetOnboardingStatus.mockResolvedValue(MOCK_ONBOARDING);
  });

  it('renders gross revenue KPI when earnings loaded', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const revenue = await screen.findByText(/5[,\s.]?000/);
    expect(revenue).toBeTruthy();
  });

  it('renders net revenue KPI', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const net = await screen.findByText(/4[,\s.]?500/);
    expect(net).toBeTruthy();
  });

  it('renders orders count KPI', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    // 12 orders — the number 12 should appear somewhere
    const orders = await screen.findByText('12');
    expect(orders).toBeTruthy();
  });

  it('renders recent orders table with order numbers', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const ord1 = await screen.findByText('ORD-001');
    expect(ord1).toBeTruthy();
    expect(screen.getByText('ORD-002')).toBeTruthy();
  });

  it('renders customer names in recent orders', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const customer = await screen.findByText('Ahmed B.');
    expect(customer).toBeTruthy();
  });

  it('renders onboarding status indicator', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    // Active store status should show active/live/approved text
    const statusEl = await screen.findByText(/active|approved|live/i);
    expect(statusEl).toBeTruthy();
  });

  it('renders earnings even when onboarding call fails (graceful degradation)', async () => {
    mockGetOnboardingStatus.mockRejectedValue(new Error('Network error'));
    const { default: Page } = await import('../page');
    render(<Page />);
    // KPIs still show despite onboarding failure
    const revenue = await screen.findByText(/5[,\s.]?000/);
    expect(revenue).toBeTruthy();
  });

  it('renders orders even when earnings call fails (graceful degradation)', async () => {
    mockGetSellerEarnings.mockRejectedValue(new Error('Network error'));
    const { default: Page } = await import('../page');
    render(<Page />);
    // Orders still show despite earnings failure
    const ord = await screen.findByText('ORD-001');
    expect(ord).toBeTruthy();
  });

  it('renders a link to view all orders', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const link = await screen.findByRole('link', { name: /view all orders/i });
    expect(link.getAttribute('href')).toBe('/seller/orders');
  });
});
