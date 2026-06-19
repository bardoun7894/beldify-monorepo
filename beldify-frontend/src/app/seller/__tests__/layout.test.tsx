// @vitest-environment jsdom
/**
 * TDD RED → GREEN — Seller layout tests
 *
 * Tests:
 * 1. Renders children for funnel routes (register, onboarding) — no sidebar
 * 2. Redirects unauthenticated users for dashboard routes
 * 3. Shows non-seller CTA instead of crashing for authenticated non-sellers
 * 4. Renders sidebar nav for authenticated sellers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

// ── Mocks ──────────────────────────────────────────────────────────────────

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

const AUTH_SELLER       = { isAuthenticated: true,  loading: false, user: { role: 'seller',      is_seller: true  } };
const AUTH_STORE_OWNER  = { isAuthenticated: true,  loading: false, user: { role: 'store_owner', is_seller: false } };
const AUTH_BUYER        = { isAuthenticated: true,  loading: false, user: { role: 'buyer',       is_seller: false } };
const UNAUTH            = { isAuthenticated: false, loading: false, user: null };
const AUTH_LOADING      = { isAuthenticated: false, loading: true,  user: null };

// ── Tests ──────────────────────────────────────────────────────────────────

describe('SellerLayout', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(AUTH_SELLER);
    mockPathname = '/seller';
  });

  it('renders children directly for /seller/register (funnel bypass)', async () => {
    mockPathname = '/seller/register';
    mockUseAuth.mockReturnValue(UNAUTH);
    const { default: Layout } = await import('../layout');
    render(<Layout><span data-testid="child">REGISTER_PAGE</span></Layout>);
    expect(screen.getByTestId('child')).toBeTruthy();
    // No sidebar nav link rendered
    expect(screen.queryByRole('link', { name: /orders/i })).toBeNull();
  });

  it('renders children directly for /seller/onboarding (funnel bypass)', async () => {
    mockPathname = '/seller/onboarding';
    mockUseAuth.mockReturnValue(UNAUTH);
    const { default: Layout } = await import('../layout');
    render(<Layout><span data-testid="child">ONBOARDING_PAGE</span></Layout>);
    expect(screen.getByTestId('child')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /earnings/i })).toBeNull();
  });

  it('redirects unauthenticated users away from dashboard routes', async () => {
    mockPathname = '/seller';
    mockUseAuth.mockReturnValue(UNAUTH);
    const { default: Layout } = await import('../layout');
    render(<Layout><span>CHILD</span></Layout>);
    expect(mockPush).toHaveBeenCalledWith('/login?redirect=/seller');
  });

  it('renders non-seller CTA for authenticated non-sellers on dashboard routes', async () => {
    mockPathname = '/seller/orders';
    mockUseAuth.mockReturnValue(AUTH_BUYER);
    const { default: Layout } = await import('../layout');
    render(<Layout><span>CHILD</span></Layout>);
    const registerLink = await screen.findByRole('link', { name: /become a seller/i });
    expect(registerLink.getAttribute('href')).toBe('/seller/register');
  });

  it('renders the sidebar nav for authenticated sellers', async () => {
    mockPathname = '/seller';
    mockUseAuth.mockReturnValue(AUTH_SELLER);
    const { default: Layout } = await import('../layout');
    render(<Layout><span>CHILD</span></Layout>);
    // Both desktop sidebar and mobile tab render nav links — use getAllBy
    expect(screen.getAllByRole('link', { name: /dashboard/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /products/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /orders/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /earnings/i }).length).toBeGreaterThan(0);
  });

  it('renders children inside seller shell', async () => {
    mockPathname = '/seller';
    mockUseAuth.mockReturnValue(AUTH_SELLER);
    const { default: Layout } = await import('../layout');
    render(<Layout><span data-testid="page-content">DASHBOARD</span></Layout>);
    expect(screen.getByTestId('page-content')).toBeTruthy();
  });

  // FIX 1 — store_owner role must pass the seller guard
  it('renders the seller shell for a user with role store_owner (canonical seller role)', async () => {
    mockPathname = '/seller';
    mockUseAuth.mockReturnValue(AUTH_STORE_OWNER);
    const { default: Layout } = await import('../layout');
    render(<Layout><span data-testid="store-owner-content">STORE_OWNER</span></Layout>);
    // Must NOT show the "Become a seller" wall
    expect(screen.queryByRole('link', { name: /become a seller/i })).toBeNull();
    // Must render sidebar nav links
    expect(screen.getAllByRole('link', { name: /dashboard/i }).length).toBeGreaterThan(0);
    expect(screen.getByTestId('store-owner-content')).toBeTruthy();
  });

  // FIX 2 — loading state must return null (no premature redirect)
  it('returns null (no redirect) while auth is still loading', async () => {
    mockPathname = '/seller';
    mockUseAuth.mockReturnValue(AUTH_LOADING);
    const { default: Layout } = await import('../layout');
    const { container } = render(<Layout><span>CHILD</span></Layout>);
    // Must not redirect while loading
    expect(mockPush).not.toHaveBeenCalled();
    // Must render nothing (null)
    expect(container.firstChild).toBeNull();
  });
});
