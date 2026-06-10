// @vitest-environment jsdom
/**
 * TDD RED → GREEN — Dashboard polish tasks
 *
 * Covers:
 * 1. Edit link/button present on every product row in products list
 * 2. Dashboard empty state no-products → "Add your first product" CTA links to /seller/products/new
 * 3. Dashboard empty state no-orders → friendly empty state text
 * 4. Onboarding nudge banner when completion < 100%
 * 5. Products table has overflow-x-auto container for mobile
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

// ── Shared mocks ──────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/seller/products',
  useSearchParams: () => ({ get: vi.fn() }),
  useParams: () => ({}),
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
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('@/utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/i18n/config', () => ({
  default: {},
}));

// Mock components with React-not-defined issues (pre-existing bugs in out-of-scope files)
vi.mock('@/components/opensouk/OpenSoukRequestModal', () => ({
  default: () => null,
}));

vi.mock('@/components/products/ProductFilters', () => ({
  default: () => null,
}));

vi.mock('@/components/products/ProductSort', () => ({
  default: () => null,
}));

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const AUTH_SELLER = { isAuthenticated: true, user: { role: 'seller', is_seller: true } };

// NOTE: SellerProductsPage — edit affordance tests are in
// src/app/seller/products/__tests__/products-edit-affordance.test.tsx
// (split to avoid module-isolation conflicts with sellerOnboardingService mock)

// ─── Dashboard — empty states + onboarding nudge ─────────────────────────────

const mockGetSellerEarnings = vi.fn();
const mockGetSellerOrders = vi.fn();
const mockGetOnboardingStatus = vi.fn();

vi.mock('@/services/sellerDashboardService', () => ({
  getSellerEarnings: () => mockGetSellerEarnings(),
  getSellerOrders: () => mockGetSellerOrders(),
}));

vi.mock('@/services/sellerOnboardingService', () => ({
  getOnboardingStatus: () => mockGetOnboardingStatus(),
}));

describe('SellerDashboardPage — empty states and onboarding nudge', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(AUTH_SELLER);
    mockGetSellerEarnings.mockResolvedValue({
      data: {
        currency: 'MAD',
        gross_revenue: 0,
        total_commission: 0,
        net_revenue: 0,
        orders_count: 0,
        average_order_value: 0,
        by_day: [],
        period: 30,
      },
    });
    mockGetSellerOrders.mockResolvedValue({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } });
    mockGetOnboardingStatus.mockResolvedValue({
      data: {
        store_status: 'active',
        overall_percentage: 60,
        needs_details: true,
        is_verified: false,
        verification_level: 'basic',
        profile_completion_percentage: 60,
        products_count: 0,
        steps: [],
      },
    });
  });

  it('shows friendly no-orders empty state when orders list is empty', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    // Must show the specific no-orders message
    const emptyOrders = await screen.findByText(/no orders yet.*share your store/i);
    expect(emptyOrders).toBeTruthy();
  });

  it('shows onboarding nudge banner when completion < 100%', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    // Banner text should mention the completion percentage or "complete"
    const nudge = await screen.findByText(/60% done|complete your store setup/i);
    expect(nudge).toBeTruthy();
  });

  it('shows "Add your first product" CTA linking to /seller/products/new when orders are empty', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    // Wait for orders to finish loading
    await screen.findByText(/no orders yet.*share your store/i);
    // Check for the "Add your first product" link in the orders empty state
    const allLinks = screen.getAllByRole('link');
    const addProductLink = allLinks.find(
      l => l.getAttribute('href') === '/seller/products/new'
    );
    expect(addProductLink).toBeTruthy();
  });
});
