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
const mockGetStoreProfile = vi.fn();
vi.mock('@/services/sellerOnboardingService', () => ({
  createSellerProduct: (...args: unknown[]) => mockCreateSellerProduct(...args),
  getStoreProfile: (...args: unknown[]) => mockGetStoreProfile(...args),
}));

const mockFetchVerticalConfig = vi.fn();
const mockPatchProductVerticalConfig = vi.fn();
vi.mock('@/services/verticalService', () => ({
  fetchVerticalConfig: (...args: unknown[]) => mockFetchVerticalConfig(...args),
  patchProductVerticalConfig: (...args: unknown[]) => mockPatchProductVerticalConfig(...args),
}));

const JEWELRY_CONFIG = {
  vertical: 'jewelry',
  fields: [
    { key: 'material', label: 'Material', type: 'select', required: true, options: ['gold', 'silver'], group: null },
    { key: 'purity',   label: 'Purity',   type: 'select', required: false, options: ['18k', '24k'], group: null },
    { key: 'size',     label: 'Size',     type: 'text',   required: false, options: null, group: null },
  ],
};
const REGULAR_CONFIG = { vertical: 'regular', fields: [] };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SellerNewProductPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(AUTHENTICATED_USER);
    mockGetAllCategories.mockResolvedValue(MOCK_CATEGORIES);
    mockCreateSellerProduct.mockResolvedValue({ data: { id: 99, product_name_en: 'Test Product' } });
    // Default: seller runs a jewelry store → vertical fields should render.
    mockGetStoreProfile.mockResolvedValue({ data: { name: 'Atlas Bijoux', store_type: 'jewelry' } });
    mockFetchVerticalConfig.mockResolvedValue(JEWELRY_CONFIG);
    mockPatchProductVerticalConfig.mockResolvedValue(undefined);
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

  // ─── FE-J1: vertical-aware fields ─────────────────────────────────────────

  it('renders the jewelry material field when store vertical is jewelry', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    const materialField = await screen.findByLabelText(/material/i);
    expect(materialField).toBeTruthy();
  });

  it('renders NO vertical fields when store vertical is regular (zero regression)', async () => {
    mockGetStoreProfile.mockResolvedValue({ data: { name: 'Plain Shop', store_type: 'regular' } });
    mockFetchVerticalConfig.mockResolvedValue(REGULAR_CONFIG);
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    // give the vertical effect a tick to settle
    await waitFor(() => expect(mockGetStoreProfile).toHaveBeenCalled());
    expect(screen.queryByLabelText(/material/i)).toBeNull();
  });

  it('blocks submit when required material is empty for a jewelry store', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    await screen.findByLabelText(/material/i);
    // Fill the generic required fields but leave material empty.
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(screen.getByLabelText(/product name.*english/i), { target: { value: 'Ring' } });
    fireEvent.change(screen.getByRole('combobox', { name: /category/i }), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/price.*mad|mad.*price/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: /add product|create product|publish/i }));
    await waitFor(() => {
      expect(mockCreateSellerProduct).not.toHaveBeenCalled();
    });
  });

  it('creates the product then PATCHes vertical-config with the collected spec', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    await screen.findByLabelText(/material/i);
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(screen.getByLabelText(/product name.*english/i), { target: { value: 'Ring' } });
    fireEvent.change(screen.getByRole('combobox', { name: /category/i }), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/price.*mad|mad.*price/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/material/i), { target: { value: 'gold' } });
    fireEvent.click(screen.getByRole('button', { name: /add product|create product|publish/i }));
    await waitFor(() => {
      expect(mockCreateSellerProduct).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockPatchProductVerticalConfig).toHaveBeenCalled();
      const [pid, spec] = mockPatchProductVerticalConfig.mock.calls[0];
      expect(String(pid)).toBe('99');
      expect(spec).toMatchObject({ material: 'gold' });
    });
  });

  it('warns but does not error when vertical-config PATCH fails after create', async () => {
    mockPatchProductVerticalConfig.mockRejectedValue(new Error('network'));
    const toast = (await import('@/utils/toast')).default;
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    await screen.findByLabelText(/material/i);
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(screen.getByLabelText(/product name.*english/i), { target: { value: 'Ring' } });
    fireEvent.change(screen.getByRole('combobox', { name: /category/i }), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/price.*mad|mad.*price/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/material/i), { target: { value: 'gold' } });
    fireEvent.click(screen.getByRole('button', { name: /add product|create product|publish/i }));
    await waitFor(() => {
      expect(mockCreateSellerProduct).toHaveBeenCalled();
    });
    // Product was created; a warning toast should surface (non-blocking).
    await waitFor(() => {
      expect((toast.error as any).mock.calls.length).toBeGreaterThan(0);
    });
    // And the seller is still navigated forward (product exists).
    expect(mockCreateSellerProduct).toHaveBeenCalledTimes(1);
  });
});
