// @vitest-environment jsdom
/**
 * TDD GREEN — Seller Onboarding Hub smoke tests
 *
 * Tests:
 * 1. Renders the progress bar with overall_percentage
 * 2. Renders 5 step cards with labels
 * 3. Renders profile CTA for incomplete profile_complete step
 * 4. Renders product CTA for incomplete first_product step
 * 5. Renders pending status banner when store_status === 'pending'
 * 6. Renders active status banner when store_status === 'active'
 * 7. Shows CTAs even while store_status === 'pending' (independent steps)
 * 8. Renders login CTA when not authenticated
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

// ─── Module-level mocks ───────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/seller/onboarding',
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' '),
}));

// Mock useAuth as vi.fn() so we can call mockReturnValueOnce in specific tests
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const AUTHENTICATED_USER = { isAuthenticated: true, user: { role: 'seller', is_seller: true } };
const UNAUTHENTICATED = { isAuthenticated: false, user: null };

const PENDING_STEPS = [
  { key: 'registered', label: 'Account registered', status: 'done' as const },
  { key: 'profile_complete', label: 'Complete your profile', status: 'incomplete' as const },
  { key: 'store_approved', label: 'Store approved', status: 'incomplete' as const },
  { key: 'first_product', label: 'Add first product', status: 'incomplete' as const },
  { key: 'live', label: 'Go live', status: 'incomplete' as const },
];

const MOCK_STATUS_PENDING = {
  data: {
    store_status: 'pending' as const,
    needs_details: false,
    is_verified: false,
    verification_level: 'basic',
    profile_completion_percentage: 40,
    products_count: 0,
    overall_percentage: 30,
    steps: PENDING_STEPS,
  },
};

const MOCK_STATUS_ACTIVE = {
  data: {
    store_status: 'active' as const,
    needs_details: false,
    is_verified: true,
    verification_level: 'basic',
    profile_completion_percentage: 80,
    products_count: 2,
    overall_percentage: 80,
    steps: PENDING_STEPS.map(s =>
      s.key === 'store_approved' ? { ...s, status: 'done' as const } : s
    ),
  },
};

// Mock service as vi.fn() so we can override per test
const mockGetOnboardingStatus = vi.fn();
vi.mock('@/services/sellerOnboardingService', () => ({
  getOnboardingStatus: () => mockGetOnboardingStatus(),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SellerOnboardingPage', () => {
  beforeEach(() => {
    // Default: authenticated + pending status
    mockUseAuth.mockReturnValue(AUTHENTICATED_USER);
    mockGetOnboardingStatus.mockResolvedValue(MOCK_STATUS_PENDING);
  });

  it('renders progress bar with overall_percentage', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const progressbar = await screen.findByRole('progressbar');
    expect(progressbar).not.toBeNull();
    expect(progressbar.getAttribute('aria-valuenow')).toBe('30');
  });

  it('renders 5 step cards/rows', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByText('Account registered');
    expect(screen.getByText('Complete your profile')).toBeTruthy();
    expect(screen.getByText('Store approved')).toBeTruthy();
    expect(screen.getByText('Add first product')).toBeTruthy();
    expect(screen.getByText('Go live')).toBeTruthy();
  });

  it('renders profile CTA linking to /seller/profile for incomplete profile_complete step', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByText('Complete your profile');
    const profileLinks = screen.getAllByRole('link').filter(
      l => l.getAttribute('href') === '/seller/profile'
    );
    expect(profileLinks.length).toBeGreaterThan(0);
  });

  it('renders product CTA linking to /seller/products/new for incomplete first_product step', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByText('Add first product');
    const productLinks = screen.getAllByRole('link').filter(
      l => l.getAttribute('href') === '/seller/products/new'
    );
    expect(productLinks.length).toBeGreaterThan(0);
  });

  it('renders pending banner when store_status is pending', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const banner = await screen.findByRole('status');
    expect(banner).not.toBeNull();
    expect(banner.textContent?.toLowerCase()).toMatch(/review|pending/);
  });

  it('shows profile and product CTAs even when store_status is pending (independent steps)', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByText('Complete your profile');
    const profileLink = screen.getAllByRole('link').find(
      l => l.getAttribute('href') === '/seller/profile'
    );
    const productLink = screen.getAllByRole('link').find(
      l => l.getAttribute('href') === '/seller/products/new'
    );
    expect(profileLink).toBeTruthy();
    expect(productLink).toBeTruthy();
  });

  it('renders active banner when store_status is active', async () => {
    mockGetOnboardingStatus.mockResolvedValue(MOCK_STATUS_ACTIVE);
    const { default: Page } = await import('../page');
    render(<Page />);
    const banner = await screen.findByRole('status');
    expect(banner.textContent?.toLowerCase()).toMatch(/approved|active|live/);
  });

  it('renders login CTA when not authenticated', async () => {
    mockUseAuth.mockReturnValue(UNAUTHENTICATED);
    const { default: Page } = await import('../page');
    render(<Page />);
    const loginLink = await screen.findByRole('link', { name: /sign in/i });
    expect(loginLink).toBeTruthy();
  });
});
