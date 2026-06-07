// @vitest-environment jsdom
/**
 * TDD RED → GREEN — Seller orders list page
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/seller/orders',
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

const mockGetSellerOrders = vi.fn();
vi.mock('@/services/sellerDashboardService', () => ({
  getSellerOrders: (params: unknown) => mockGetSellerOrders(params),
}));

const MOCK_ORDERS = {
  data: [
    { id: 1, order_number: 'ORD-001', customer_name: 'Ahmed B.', status: 'pending', total_amount: 350, items_count: 2, created_at: '2026-01-01T00:00:00Z' },
    { id: 2, order_number: 'ORD-002', customer_name: 'Fatima Z.', status: 'shipped', total_amount: 200, items_count: 1, created_at: '2026-01-02T00:00:00Z' },
  ],
  meta: { current_page: 1, last_page: 2, total: 10 },
};

const AUTH_SELLER = { isAuthenticated: true, user: { role: 'seller', is_seller: true } };

describe('SellerOrdersPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(AUTH_SELLER);
    mockGetSellerOrders.mockResolvedValue(MOCK_ORDERS);
  });

  it('renders order numbers from API', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const ord = await screen.findByText('ORD-001');
    expect(ord).toBeTruthy();
    expect(screen.getByText('ORD-002')).toBeTruthy();
  });

  it('renders customer names', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const c = await screen.findByText('Ahmed B.');
    expect(c).toBeTruthy();
  });

  it('renders status filter dropdown', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByText('ORD-001');
    const filter = screen.getByRole('combobox');
    expect(filter).toBeTruthy();
  });

  it('renders order amounts', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByText('ORD-001');
    expect(screen.getByText(/350/)).toBeTruthy();
  });

  it('shows empty state when no orders', async () => {
    mockGetSellerOrders.mockResolvedValue({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } });
    const { default: Page } = await import('../page');
    render(<Page />);
    const empty = await screen.findByText(/no orders/i);
    expect(empty).toBeTruthy();
  });
});
