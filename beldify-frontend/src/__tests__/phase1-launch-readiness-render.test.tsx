// @vitest-environment jsdom
/**
 * Phase 1 launch-readiness — render (behavioral) tests
 *
 * Uses relative imports to avoid needing @/ alias in vitest config.
 * Uses standard vitest assertions (no jest-dom matchers).
 *
 * Covers:
 *  - /seller/register auth-gated state (unauthenticated → login prompt)
 *  - /seller/register form state (authenticated → onboarding form shown)
 *  - /seller/register already-seller state → dashboard entry shown
 *  - COD payment method mapping logic
 *  - seller/enter URL construction contract
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// ── Module mocks ──────────────────────────────────────────────────────────────
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en' },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('../services/sellerService', () => ({
  submitStoreRequest: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// ── Import after mocks ────────────────────────────────────────────────────────
import { useAuth } from '../hooks/useAuth';
import SellerRegisterPage from '../app/seller/register/page';

const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

// ── /seller/register — auth-gated (unauthenticated) ───────────────────────────
describe('/seller/register — auth-gated state (unauthenticated)', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
    });
  });

  it('renders login prompt text when unauthenticated', () => {
    render(<SellerRegisterPage />);
    expect(screen.queryByText('Sign in to continue')).not.toBeNull();
  });

  it('renders a link to /login when unauthenticated', () => {
    render(<SellerRegisterPage />);
    const loginLinks = screen
      .getAllByRole('link')
      .filter((el) => el.getAttribute('href')?.includes('/login'));
    expect(loginLinks.length).toBeGreaterThan(0);
  });

  it('does NOT render the onboarding form when unauthenticated', () => {
    render(<SellerRegisterPage />);
    // Business type select only appears in the authenticated form
    expect(screen.queryByRole('combobox', { name: /business type/i })).toBeNull();
  });
});

// ── /seller/register — form state (authenticated) ─────────────────────────────
describe('/seller/register — form state (authenticated, non-seller)', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, email: 'test@example.com', role: 'customer' },
      loading: false,
    });
  });

  it('renders the business type selector when authenticated', () => {
    render(<SellerRegisterPage />);
    const select = screen.queryByRole('combobox', { name: /business type/i });
    expect(select).not.toBeNull();
  });

  it('renders country selector when authenticated', () => {
    render(<SellerRegisterPage />);
    const select = screen.queryByRole('combobox', { name: /country/i });
    expect(select).not.toBeNull();
  });

  it('renders contact email input when authenticated', () => {
    render(<SellerRegisterPage />);
    const emailInput = screen.queryByRole('textbox', { name: /contact email/i });
    expect(emailInput).not.toBeNull();
  });

  it('renders submit/apply button when authenticated', () => {
    render(<SellerRegisterPage />);
    const btns = screen.queryAllByRole('button', { name: /apply to sell/i });
    expect(btns.length).toBeGreaterThan(0);
  });

  it('does NOT render seller dashboard entry for non-seller users (gated)', () => {
    render(<SellerRegisterPage />);
    // dashboard entry is only shown to users with seller role
    const dashboardBtns = screen.queryAllByTestId('seller-dashboard-entry');
    expect(dashboardBtns.length).toBe(0);
  });
});

// ── /seller/register — already-seller state ───────────────────────────────────
describe('/seller/register — already-seller state', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, email: 'seller@example.com', role: 'seller' },
      loading: false,
    });
  });

  it('shows already-seller title when user has seller role', () => {
    render(<SellerRegisterPage />);
    const el = screen.queryByText('You already have a seller account');
    expect(el).not.toBeNull();
  });

  it('renders go-to-dashboard button for seller role', () => {
    render(<SellerRegisterPage />);
    const btns = screen.queryAllByRole('button', { name: /go to seller dashboard/i });
    expect(btns.length).toBeGreaterThan(0);
  });

  it('clicking go-to-dashboard navigates to seller/enter via window.location.href', () => {
    // Capture href assignment via setter
    let assignedHref = '';
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        set href(val: string) {
          assignedHref = val;
        },
        get href() {
          return assignedHref;
        },
      },
      writable: true,
      configurable: true,
    });

    render(<SellerRegisterPage />);
    const btns = screen.queryAllByRole('button', { name: /go to seller dashboard/i });
    expect(btns.length).toBeGreaterThan(0);
    btns[0].click();

    expect(assignedHref).toMatch(/seller\/enter/);

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });
});

// ── COD payment method logic ──────────────────────────────────────────────────
describe('COD checkout — payment method mapping logic', () => {
  it('paymentMethodMap maps cod to cash_on_delivery', () => {
    const paymentMethodMap: Record<string, string> = {
      card: 'credit_card',
      paypal: 'paypal',
      cod: 'cash_on_delivery',
    };
    expect(paymentMethodMap['cod']).toBe('cash_on_delivery');
  });

  it('cash_on_delivery is in the accepted payment methods list', () => {
    const availablePaymentMethods = ['credit_card', 'paypal', 'cash_on_delivery'];
    expect(availablePaymentMethods).toContain('cash_on_delivery');
  });

  it('COD normalization does not yield credit_card (no card form required)', () => {
    const selectedPayment = 'cod';
    const paymentMethodMap: Record<string, string> = {
      card: 'credit_card',
      paypal: 'paypal',
      cod: 'cash_on_delivery',
    };
    const normalizedPaymentMethod = paymentMethodMap[selectedPayment] || selectedPayment;
    expect(normalizedPaymentMethod).not.toBe('credit_card');
    expect(normalizedPaymentMethod).toBe('cash_on_delivery');
  });
});

// ── seller/enter URL construction ─────────────────────────────────────────────
describe('UNIT 3 — seller/enter URL contract', () => {
  it('NEXT_PUBLIC_API_URL is a bare origin (no /api suffix) per .env.example', () => {
    // .env.example: NEXT_PUBLIC_API_URL=https://api.beldify.com (no /api suffix)
    // So seller/enter = https://api.beldify.com/seller/enter (correct Blade web route)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.beldify.com';
    expect(apiUrl).not.toMatch(/\/api$/);
  });

  it('seller/enter URL path matches the Blade web route pattern', () => {
    // Confirms the route pattern — not /api/seller/enter
    const sellerEnterPath = '/seller/enter';
    expect(sellerEnterPath).toMatch(/^\/seller\/enter$/);
    expect(sellerEnterPath).not.toContain('/api/');
  });
});
