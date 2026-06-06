// @vitest-environment jsdom
/**
 * TDD GREEN — Seller New Product page smoke tests
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

// ─── Module-level mocks ───────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/seller/products/new',
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

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const AUTHENTICATED_USER = { isAuthenticated: true, user: { role: 'seller', is_seller: true } };
const UNAUTHENTICATED = { isAuthenticated: false, user: null };

const MOCK_CATEGORIES = [
  { id: 1, name_en: 'Jewelry', name_ar: 'مجوهرات', slug: 'jewelry', itemCount: 10 },
  { id: 2, name_en: 'Caftan', name_ar: 'قفطان', slug: 'caftan', itemCount: 5 },
];

const mockGetAllCategories = vi.fn();
vi.mock('@/services/categoryService', () => ({
  categoryService: {
    getAllCategories: () => mockGetAllCategories(),
  },
}));

const mockCreateSellerProduct = vi.fn();
vi.mock('@/services/sellerOnboardingService', () => ({
  createSellerProduct: (...args: unknown[]) => mockCreateSellerProduct(...args),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SellerNewProductPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(AUTHENTICATED_USER);
    mockGetAllCategories.mockResolvedValue(MOCK_CATEGORIES);
    mockCreateSellerProduct.mockResolvedValue({ data: { id: 99, product_name_en: 'Test Product' } });
  });

  it('renders the product name (English) field', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    expect(await screen.findByLabelText(/product name.*english/i)).toBeTruthy();
  });

  it('renders the price field labeled with MAD', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    const priceInput = screen.getByLabelText(/price.*mad|mad.*price/i);
    expect(priceInput).toBeTruthy();
  });

  it('renders the quantity field', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    expect(screen.getByLabelText(/quantity/i)).toBeTruthy();
  });

  it('renders a category select populated with fetched categories', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    const categorySelect = await screen.findByRole('combobox', { name: /category/i });
    expect(categorySelect).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('Jewelry')).toBeTruthy();
    });
  });

  it('renders a file input for product image upload', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();
  });

  it('renders the submit button', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    const submitBtn = screen.getByRole('button', { name: /add product|create product|publish/i });
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
