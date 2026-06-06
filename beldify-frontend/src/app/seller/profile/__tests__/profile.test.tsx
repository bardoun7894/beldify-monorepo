// @vitest-environment jsdom
/**
 * TDD GREEN — Seller Profile page smoke tests
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

// ─── Module-level mocks ───────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/seller/profile',
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
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

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const AUTHENTICATED_USER = { isAuthenticated: true, user: { role: 'seller', is_seller: true } };
const UNAUTHENTICATED = { isAuthenticated: false, user: null };

const MOCK_PROFILE = {
  name: 'Atlas Bijoux',
  description: 'Authentic Moroccan jewelry',
  contact_email: 'atlas@bijoux.ma',
  contact_phone: '+212612345678',
  address: '12 Rue Moulay Ismail, Fès',
  store_logo: null,
  store_banner: null,
  profile_completion_percentage: 60,
};

const mockGetStoreProfile = vi.fn();
const mockUpdateStoreProfile = vi.fn();

vi.mock('@/services/sellerOnboardingService', () => ({
  getStoreProfile: () => mockGetStoreProfile(),
  updateStoreProfile: (...args: unknown[]) => mockUpdateStoreProfile(...args),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SellerProfilePage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(AUTHENTICATED_USER);
    mockGetStoreProfile.mockResolvedValue({ data: MOCK_PROFILE });
    mockUpdateStoreProfile.mockResolvedValue({ data: { ...MOCK_PROFILE, profile_completion_percentage: 80 } });
  });

  it('renders the profile form with name and email fields', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    expect(await screen.findByLabelText(/store name/i)).toBeTruthy();
    expect(screen.getByLabelText(/contact email/i)).toBeTruthy();
  });

  it('pre-fills the store name from the API response', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const input = await screen.findByLabelText(/store name/i);
    expect((input as HTMLInputElement).value).toBe('Atlas Bijoux');
  });

  it('pre-fills the contact email from the API response', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const input = await screen.findByLabelText(/contact email/i);
    expect((input as HTMLInputElement).value).toBe('atlas@bijoux.ma');
  });

  it('renders a logo upload control', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/store name/i);
    const fileInputs = document.querySelectorAll('input[type="file"]');
    expect(fileInputs.length).toBeGreaterThan(0);
  });

  it('renders the save / submit button', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/store name/i);
    const submitBtn = screen.getByRole('button', { name: /save/i });
    expect(submitBtn).toBeTruthy();
  });

  it('renders login CTA when not authenticated', async () => {
    mockUseAuth.mockReturnValue(UNAUTHENTICATED);
    const { default: Page } = await import('../page');
    render(<Page />);
    const loginLink = await screen.findByRole('link', { name: /sign in/i });
    expect(loginLink).toBeTruthy();
  });
});
