// @vitest-environment jsdom
/**
 * seller/register — "what do you sell?" (store_type_id) behavioral tests.
 *
 * Proves the fix for the business_type -> store_type_id category error:
 *   1. Form does not submit without a store type explicitly chosen.
 *   2. The chosen store type is what gets posted (e.g. Jewelry -> store_type_id 5).
 *   3. A failed GET /api/store-types does NOT result in a silently-defaulted
 *      store_type_id — submission stays blocked.
 *   4. The old BUSINESS_TYPE_TO_STORE_TYPE hardcoded map is gone from source.
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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockSubmitStoreRequest = vi.fn();
vi.mock('@/services/sellerService', () => ({
  submitStoreRequest: (...args: any[]) => mockSubmitStoreRequest(...args),
}));

const mockGetStoreTypes = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...args: any[]) => mockGetStoreTypes(...args) },
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { useAuth } from '@/hooks/useAuth';
import SellerRegisterPage from '@/app/seller/register/page';

const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

async function fillRequiredFieldsExceptStoreType() {
  fireEvent.change(screen.getByLabelText(/Business type/i), {
    target: { value: 'company' },
  });
  fireEvent.change(screen.getByLabelText(/Country/i), {
    target: { value: 'MA' },
  });
}

describe('seller/register — store type question', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'buyer' },
    });
    mockSubmitStoreRequest.mockResolvedValue({ success: true });
  });

  it('has deleted the hardcoded BUSINESS_TYPE_TO_STORE_TYPE map from source', () => {
    const src = readFileSync(
      join(__dirname, '..', 'page.tsx'),
      'utf-8'
    );
    expect(src).not.toContain('BUSINESS_TYPE_TO_STORE_TYPE');
  });

  it('blocks submission when no store type is chosen, even with other fields filled', async () => {
    mockGetStoreTypes.mockResolvedValue({
      data: [{ id: 5, slug: 'jewelry', name: 'Jewelry' }],
    });

    render(<SellerRegisterPage />);
    await waitFor(() => expect(mockGetStoreTypes).toHaveBeenCalled());
    await fillRequiredFieldsExceptStoreType();

    fireEvent.click(screen.getByRole('button', { name: /Apply to sell/i }));

    await waitFor(() => {
      expect(mockSubmitStoreRequest).not.toHaveBeenCalled();
    });
  });

  it('posts the seller-chosen store_type_id (Jewelry -> 5)', async () => {
    mockGetStoreTypes.mockResolvedValue({
      data: [
        { id: 1, slug: 'regular', name: 'Regular Store' },
        { id: 5, slug: 'jewelry', name: 'Jewelry' },
      ],
    });

    render(<SellerRegisterPage />);
    await waitFor(() => expect(mockGetStoreTypes).toHaveBeenCalled());
    await fillRequiredFieldsExceptStoreType();

    fireEvent.click(await screen.findByRole('button', { name: 'Jewelry' }));
    fireEvent.click(screen.getByRole('button', { name: /Apply to sell/i }));

    await waitFor(() => {
      expect(mockSubmitStoreRequest).toHaveBeenCalledTimes(1);
    });
    const payload = mockSubmitStoreRequest.mock.calls[0][0];
    expect(payload.store_type_id).toBe(5);
    expect(payload.business_type).toBe('company');
  });

  it('does not silently default store_type_id when GET /api/store-types fails', async () => {
    mockGetStoreTypes.mockRejectedValue(new Error('Network Error'));

    render(<SellerRegisterPage />);
    await waitFor(() => expect(mockGetStoreTypes).toHaveBeenCalled());
    await fillRequiredFieldsExceptStoreType();

    fireEvent.click(screen.getByRole('button', { name: /Apply to sell/i }));

    await waitFor(() => {
      expect(mockSubmitStoreRequest).not.toHaveBeenCalled();
    });
  });
});
