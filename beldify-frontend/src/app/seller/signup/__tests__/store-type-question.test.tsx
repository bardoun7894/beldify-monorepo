// @vitest-environment jsdom
/**
 * seller/signup — "what do you sell?" (store_type_id) behavioral tests.
 * Same fix as seller/register: business_type is legal structure, store_type_id
 * is the vertical. See seller/register/__tests__/store-type-question.test.tsx.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { readFileSync } from 'fs';
import { join } from 'path';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockRegisterSeller = vi.fn();
vi.mock('@/services/sellerService', () => ({
  registerSeller: (...args: any[]) => mockRegisterSeller(...args),
}));

const mockGetStoreTypes = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...args: any[]) => mockGetStoreTypes(...args) },
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { useAuth } from '@/hooks/useAuth';
import SellerSignupPage from '@/app/seller/signup/page';

const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

async function fillRequiredFieldsExceptStoreType() {
  fireEvent.change(screen.getByLabelText(/Full name/i), {
    target: { value: 'Amina Tazi' },
  });
  fireEvent.change(screen.getByLabelText(/Phone number/i), {
    target: { value: '+212612345678' },
  });
  fireEvent.change(screen.getByLabelText(/^Password\s*\*?$/i), {
    target: { value: 'password123' },
  });
  fireEvent.change(screen.getByLabelText(/Confirm password/i), {
    target: { value: 'password123' },
  });
  fireEvent.change(screen.getByLabelText(/Store name/i), {
    target: { value: "Amina's Caftans" },
  });
  fireEvent.change(screen.getByLabelText(/Business type/i), {
    target: { value: 'company' },
  });
  fireEvent.change(screen.getByLabelText(/Country/i), {
    target: { value: 'MA' },
  });
}

describe('seller/signup — store type question', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    mockRegisterSeller.mockResolvedValue({ success: true });
  });

  it('has deleted the hardcoded BUSINESS_TYPE_TO_STORE_TYPE map from source', () => {
    const src = readFileSync(join(__dirname, '..', 'page.tsx'), 'utf-8');
    expect(src).not.toContain('BUSINESS_TYPE_TO_STORE_TYPE');
  });

  it('blocks submission when no store type is chosen', async () => {
    mockGetStoreTypes.mockResolvedValue({
      data: [{ id: 4, slug: 'womenswear', name: "Women's Clothing" }],
    });

    render(<SellerSignupPage />);
    await waitFor(() => expect(mockGetStoreTypes).toHaveBeenCalled());
    await fillRequiredFieldsExceptStoreType();

    fireEvent.click(screen.getByRole('button', { name: /Create seller account/i }));

    await waitFor(() => {
      expect(mockRegisterSeller).not.toHaveBeenCalled();
    });
  });

  it("posts the seller-chosen store_type_id (Women's Clothing -> 4)", async () => {
    mockGetStoreTypes.mockResolvedValue({
      data: [
        { id: 1, slug: 'regular', name: 'Regular Store' },
        { id: 4, slug: 'womenswear', name: "Women's Clothing" },
      ],
    });

    render(<SellerSignupPage />);
    await waitFor(() => expect(mockGetStoreTypes).toHaveBeenCalled());
    await fillRequiredFieldsExceptStoreType();

    fireEvent.click(await screen.findByRole('button', { name: "Women's Clothing" }));
    fireEvent.click(screen.getByRole('button', { name: /Create seller account/i }));

    await waitFor(() => {
      expect(mockRegisterSeller).toHaveBeenCalledTimes(1);
    });
    const payload = mockRegisterSeller.mock.calls[0][0];
    expect(payload.store_type_id).toBe(4);
    expect(payload.business_type).toBe('company');
  });

  it('does not silently default store_type_id when GET /api/store-types fails', async () => {
    mockGetStoreTypes.mockRejectedValue(new Error('Network Error'));

    render(<SellerSignupPage />);
    await waitFor(() => expect(mockGetStoreTypes).toHaveBeenCalled());
    await fillRequiredFieldsExceptStoreType();

    fireEvent.click(screen.getByRole('button', { name: /Create seller account/i }));

    await waitFor(() => {
      expect(mockRegisterSeller).not.toHaveBeenCalled();
    });
  });
});
