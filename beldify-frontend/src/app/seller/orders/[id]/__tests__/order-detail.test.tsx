// @vitest-environment jsdom
/**
 * TDD RED → GREEN — Seller order detail page
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/seller/orders/1',
  useParams: () => ({ id: '1' }),
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

const mockGetSellerOrder = vi.fn();
const mockUpdateOrderStatus = vi.fn();
vi.mock('@/services/sellerDashboardService', () => ({
  getSellerOrder: (id: number) => mockGetSellerOrder(id),
  updateOrderStatus: (id: number, status: string) => mockUpdateOrderStatus(id, status),
}));

const MOCK_ORDER_DETAIL = {
  data: {
    id: 1,
    order_number: 'ORD-001',
    status: 'pending' as const,
    customer: { name: 'Ahmed Bensalem' },
    items: [
      { product_name: 'Caftan Brodé', quantity: 2, unit_price: 450, line_total: 900, variant: 'L / Rouge' },
      { product_name: 'Jabador Homme', quantity: 1, unit_price: 380, line_total: 380, variant: null },
    ],
    subtotal: 1280,
    total_amount: 1380,
    commission_amount: 138,
    commission_rate: 10,
    net_amount: 1242,
    shipping_address: '12 Rue Allal Ben Abdallah, Casablanca',
    created_at: '2026-01-01T00:00:00Z',
  },
};

const AUTH_SELLER = { isAuthenticated: true, user: { role: 'seller', is_seller: true } };

describe('SellerOrderDetailPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(AUTH_SELLER);
    mockGetSellerOrder.mockResolvedValue(MOCK_ORDER_DETAIL);
    mockUpdateOrderStatus.mockResolvedValue({ data: { id: 1, status: 'processing' } });
  });

  it('renders the order number', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const heading = await screen.findByText('ORD-001');
    expect(heading).toBeTruthy();
  });

  it('renders customer name', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const customer = await screen.findByText('Ahmed Bensalem');
    expect(customer).toBeTruthy();
  });

  it('renders product names from order items', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const item1 = await screen.findByText('Caftan Brodé');
    expect(item1).toBeTruthy();
    expect(screen.getByText('Jabador Homme')).toBeTruthy();
  });

  it('renders net amount', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByText('ORD-001');
    expect(screen.getByText(/1[,\s.]?242/)).toBeTruthy();
  });

  it('renders shipping address', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const addr = await screen.findByText(/Casablanca/);
    expect(addr).toBeTruthy();
  });

  it('renders a status update control', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByText('ORD-001');
    const select = screen.getByRole('combobox');
    expect(select).toBeTruthy();
  });

  it('renders status update button', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByText('ORD-001');
    // The update button exists (disabled when same status selected)
    const btn = screen.getByRole('button', { name: /update/i });
    expect(btn).toBeTruthy();
  });

  it('calls updateOrderStatus with current form value on submit', async () => {
    const { default: Page } = await import('../page');
    const { container } = render(<Page />);
    await screen.findByText('ORD-001');

    // The form's select starts at 'pending' (matches order.status, so button is disabled).
    // Directly submit the form bypassing the disabled button — verifies the handler fires
    // and calls updateOrderStatus with whatever value the form currently holds.
    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      // Handler was called — it passes the select's current DOM value ('pending')
      expect(mockUpdateOrderStatus).toHaveBeenCalledWith(1, expect.any(String));
    });
  });

  it('shows toast error on 403 suspended when updating status', async () => {
    mockUpdateOrderStatus.mockRejectedValue({ response: { status: 403 } });
    const { default: Page } = await import('../page');
    const { container } = render(<Page />);
    await screen.findByText('ORD-001');

    // Submit the form (handler fires and calls updateOrderStatus which rejects with 403)
    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    const toastModule = await import('@/utils/toast');
    const toastMock = (toastModule as any).default;
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalled();
    });
  });

  it('renders back link to orders list', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByText('ORD-001');
    const back = screen.getByRole('link', { name: /orders/i });
    expect(back.getAttribute('href')).toBe('/seller/orders');
  });
});
