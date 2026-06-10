// @vitest-environment jsdom
/**
 * TDD RED → GREEN — AI actions in product create form
 *
 * Verifies:
 *   - AI generate button appears in the form
 *   - Clicking it calls generateListing and shows review step
 *   - Apply fills form fields; Discard reverts
 *   - 402 opens InsufficientCreditsModal
 *   - Auto-translate button calls translateListing
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

afterEach(() => vi.clearAllMocks());

// ─── Standard mocks ───────────────────────────────────────────────────────────

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
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));

const AUTHENTICATED_USER = { isAuthenticated: true, user: { role: 'seller', is_seller: true } };

const MOCK_CATEGORIES = [
  { id: 1, name_en: 'Jewelry', name_ar: 'مجوهرات', slug: 'jewelry', itemCount: 10 },
];

vi.mock('@/services/categoryService', () => ({
  categoryService: { getAllCategories: () => Promise.resolve(MOCK_CATEGORIES) },
}));

vi.mock('@/services/sellerOnboardingService', () => ({
  createSellerProduct: vi.fn().mockResolvedValue({ data: { id: 99 } }),
  getStoreProfile: vi.fn().mockResolvedValue({ data: { name: 'My Store', store_type: 'regular' } }),
}));

vi.mock('@/services/verticalService', () => ({
  fetchVerticalConfig: vi.fn().mockResolvedValue({ vertical: 'regular', fields: [] }),
  patchProductVerticalConfig: vi.fn().mockResolvedValue(undefined),
}));

// ─── AI-specific mocks ────────────────────────────────────────────────────────

const mockGetSellerCredits = vi.fn();
vi.mock('@/services/sellerCreditService', () => ({
  getSellerCredits: (...args: unknown[]) => mockGetSellerCredits(...args),
}));

const mockGenerateListing = vi.fn();
const mockTranslateListing = vi.fn();
vi.mock('@/services/sellerAiService', () => ({
  generateListing: (...args: unknown[]) => mockGenerateListing(...args),
  translateListing: (...args: unknown[]) => mockTranslateListing(...args),
  generateStoreProfile: vi.fn(),
  generateMarketing: vi.fn(),
  InsufficientCreditsError: class InsufficientCreditsError extends Error {
    balance: number; cost: number; feature: string;
    constructor(balance: number, cost: number, feature: string) {
      super('insufficient_credits');
      this.balance = balance; this.cost = cost; this.feature = feature;
    }
  },
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SellerNewProductPage — AI features', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(AUTHENTICATED_USER);
    mockGetSellerCredits.mockResolvedValue({
      balance: 10,
      costs: { listing_writer: 2, store_creator: 2, translate_listing: 1, marketing_copy: 1 },
      transactions: [],
    });
    mockGenerateListing.mockResolvedValue({
      credits_charged: 2,
      balance: 8,
      result: {
        en: { title: 'Generated Title', description: 'Generated Description', tags: ['moroccan'] },
        ar: { title: 'عنوان', description: 'وصف', tags: ['مغربي'] },
      },
    });
    mockTranslateListing.mockResolvedValue({
      credits_charged: 1,
      balance: 7,
      result: {
        ar: { name: 'اسم', description: 'وصف' },
        ma: { name: 'اسم دارجة', description: 'وصف' },
        fr: { name: 'Nom FR', description: 'Desc FR' },
        en: { name: 'Name EN', description: 'Desc EN' },
        es: { name: 'Nombre ES', description: 'Desc ES' },
      },
    });
  });

  it('renders the AI generate button in the product form', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    // AI generate button should be present
    const aiBtn = await screen.findByRole('button', { name: /generate.*ai|ai.*generate/i });
    expect(aiBtn).toBeTruthy();
  });

  it('shows a review step with generated content when AI generate is clicked', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);

    // Fill the product name to enable the AI button
    fireEvent.change(screen.getByLabelText(/product name.*english/i), {
      target: { value: 'Royal Caftan' },
    });

    const aiBtn = await screen.findByRole('button', { name: /generate.*ai|ai.*generate/i });
    await act(async () => { fireEvent.click(aiBtn); });

    // Wait for review step to appear with generated title
    await waitFor(() => {
      expect(screen.getByText(/Generated Title/)).toBeTruthy();
    });
  });

  it('applies generated content to form fields when Apply is clicked', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);

    fireEvent.change(screen.getByLabelText(/product name.*english/i), {
      target: { value: 'Royal Caftan' },
    });

    const aiBtn = await screen.findByRole('button', { name: /generate.*ai|ai.*generate/i });
    await act(async () => { fireEvent.click(aiBtn); });

    // Wait for review step
    await waitFor(() => expect(screen.getByText(/Generated Title/)).toBeTruthy());

    // Click Apply
    const applyBtn = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyBtn);

    // The name field should now be filled
    await waitFor(() => {
      const nameInput = screen.getByLabelText(/product name.*english/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Generated Title');
    });
  });

  it('discards generated content when Discard is clicked', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);

    const originalName = 'My Original Name';
    fireEvent.change(screen.getByLabelText(/product name.*english/i), {
      target: { value: originalName },
    });

    const aiBtn = await screen.findByRole('button', { name: /generate.*ai|ai.*generate/i });
    await act(async () => { fireEvent.click(aiBtn); });

    await waitFor(() => expect(screen.getByText(/Generated Title/)).toBeTruthy());

    // Click Discard
    const discardBtn = screen.getByRole('button', { name: /discard|cancel/i });
    fireEvent.click(discardBtn);

    // Original name should still be there
    const nameInput = screen.getByLabelText(/product name.*english/i) as HTMLInputElement;
    expect(nameInput.value).toBe(originalName);
    // Review step should be gone
    expect(screen.queryByText(/Generated Title/)).toBeNull();
  });

  it('opens InsufficientCreditsModal on 402 from generateListing', async () => {
    const { InsufficientCreditsError } = await import('@/services/sellerAiService');
    mockGenerateListing.mockRejectedValue(
      new (InsufficientCreditsError as any)(3, 2, 'listing_writer')
    );

    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);

    fireEvent.change(screen.getByLabelText(/product name.*english/i), {
      target: { value: 'Caftan' },
    });

    const aiBtn = await screen.findByRole('button', { name: /generate.*ai|ai.*generate/i });
    await act(async () => { fireEvent.click(aiBtn); });

    // Modal for insufficient credits should appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
    });
  });

  it('renders auto-translate button in the product form', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);
    const translateBtn = await screen.findByRole('button', { name: /translate|auto-translate/i });
    expect(translateBtn).toBeTruthy();
  });

  it('calls translateListing with current name when auto-translate is clicked', async () => {
    const { default: Page } = await import('../page');
    render(<Page />);
    await screen.findByLabelText(/product name.*english/i);

    fireEvent.change(screen.getByLabelText(/product name.*english/i), {
      target: { value: 'Beautiful Caftan' },
    });

    const translateBtn = await screen.findByRole('button', { name: /translate|auto-translate/i });
    await act(async () => { fireEvent.click(translateBtn); });

    await waitFor(() => {
      expect(mockTranslateListing).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Beautiful Caftan' })
      );
    });
  });
});
