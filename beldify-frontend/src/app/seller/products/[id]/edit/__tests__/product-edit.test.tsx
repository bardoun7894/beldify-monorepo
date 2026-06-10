// @vitest-environment jsdom
/**
 * TDD RED → GREEN — Seller Edit Product page
 *
 * Covers:
 * 1. Prefills product fields via GET /api/seller/products/{id}
 * 2. Shows loading skeleton initially
 * 3. Shows error state when product not found (404)
 * 4. Renders all key form fields with prefilled values
 * 5. Calls PUT /api/seller/products/{id} on submit
 * 6. Shows toast + redirects to /seller/products on success
 * 7. Shows 422 validation errors under inputs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

// ─── Module-level mocks ───────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
  usePathname: () => '/seller/products/42/edit',
  useParams: () => ({ id: '42' }),
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

const MOCK_CATEGORIES = [
  { id: 1, name_en: 'Jewelry', name_ar: 'مجوهرات', slug: 'jewelry', itemCount: 10 },
  { id: 2, name_en: 'Caftan', name_ar: 'قفطان', slug: 'caftan', itemCount: 5 },
];

const MOCK_PRODUCT = {
  id: 42,
  name: 'Caftan Brodé',
  product_name_en: 'Caftan Brodé',
  product_name_ar: 'قفطان مطرز',
  description: 'A beautiful caftan',
  description_ar: 'قفطان جميل',
  category_id: 2,
  current_sale_unit_price: '450.00',
  quantity: 10,
  is_active: true,
  price: '450.00',
};

const mockGetSellerProduct = vi.fn();
const mockUpdateSellerProduct = vi.fn();
const mockGetSellerProducts = vi.fn();

vi.mock('@/services/sellerProductService', () => ({
  getSellerProduct: (...args: unknown[]) => mockGetSellerProduct(...args),
  updateSellerProduct: (...args: unknown[]) => mockUpdateSellerProduct(...args),
}));

const mockGetAllCategories = vi.fn();
vi.mock('@/services/categoryService', () => ({
  categoryService: {
    getAllCategories: () => mockGetAllCategories(),
  },
}));

vi.mock('@/services/sellerOnboardingService', () => ({
  getSellerProducts: (...args: unknown[]) => mockGetSellerProducts(...args),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SellerEditProductPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(AUTHENTICATED_USER);
    mockGetAllCategories.mockResolvedValue(MOCK_CATEGORIES);
    mockGetSellerProduct.mockResolvedValue({ data: MOCK_PRODUCT });
    mockGetSellerProducts.mockResolvedValue({
      data: [MOCK_PRODUCT],
    });
    mockUpdateSellerProduct.mockResolvedValue({ data: MOCK_PRODUCT });
  });

  it('shows a loading skeleton initially', async () => {
    // Don't resolve immediately
    mockGetSellerProduct.mockReturnValue(new Promise(() => {}));
    const { default: Page } = await import('../page');
    render(<Page />);
    // While loading, a loading indicator should be visible
    expect(document.body.innerHTML).not.toBe('');
    // The form should not be visible yet
    expect(screen.queryByLabelText(/product name.*english/i)).toBeNull();
  });

  it('prefills the product name (English) from loaded data', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const nameInput = await screen.findByLabelText(/product name.*english/i);
    expect((nameInput as HTMLInputElement).value).toBe('Caftan Brodé');
  });

  it('prefills the product name (Arabic) from loaded data', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    const nameArInput = await screen.findByLabelText(/product name.*arabic/i);
    expect((nameArInput as HTMLInputElement).value).toBe('قفطان مطرز');
  });

  it('prefills the price field from loaded data', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    const priceInput = screen.getByLabelText(/price.*mad|mad.*price/i) as HTMLInputElement;
    expect(priceInput.value).toBe('450.00');
  });

  it('prefills the quantity field from loaded data', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    const qtyInput = screen.getByLabelText(/quantity/i) as HTMLInputElement;
    expect(qtyInput.value).toBe('10');
  });

  it('prefills the description field from loaded data', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    const descInput = screen.getByLabelText(/^description$/i) as HTMLTextAreaElement;
    expect(descInput.value).toBe('A beautiful caftan');
  });

  it('shows error state when product not found (404) and not in list', async () => {
    const err = Object.assign(new Error('Not found'), { response: { status: 404 } });
    mockGetSellerProduct.mockRejectedValue(err);
    // Empty list so fallback also fails
    mockGetSellerProducts.mockResolvedValue({ data: [] });
    const { default: Page } = await import('../page');
    render(<Page />);
    const errMsg = await screen.findByText(/not found|could not load/i);
    expect(errMsg).toBeTruthy();
  });

  it('renders a submit button for saving the edit', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    const submitBtn = screen.getByRole('button', { name: /save|update|edit/i });
    expect(submitBtn).toBeTruthy();
  });

  it('calls updateSellerProduct with product id and form data on submit', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    const submitBtn = screen.getByRole('button', { name: /save|update|edit/i });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(mockUpdateSellerProduct).toHaveBeenCalled();
      const [id] = mockUpdateSellerProduct.mock.calls[0];
      expect(String(id)).toBe('42');
    });
  });

  it('redirects to /seller/products on successful save', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    const submitBtn = screen.getByRole('button', { name: /save|update|edit/i });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/seller/products');
    });
  });

  it('shows server 422 validation error message', async () => {
    mockUpdateSellerProduct.mockRejectedValue({
      response: {
        status: 422,
        data: { errors: { product_name_en: ['The product name has already been taken.'] } },
      },
    });
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    const submitBtn = screen.getByRole('button', { name: /save|update|edit/i });
    fireEvent.click(submitBtn);
    const errMsg = await screen.findByText(/already been taken|validation|check your input/i);
    expect(errMsg).toBeTruthy();
  });

  it('renders a back link to /seller/products', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    // Back link uses aria-label="Back" (icon-only link)
    const allLinks = screen.getAllByRole('link');
    const backLink = allLinks.find(l => l.getAttribute('href') === '/seller/products');
    expect(backLink).toBeTruthy();
  });
});
