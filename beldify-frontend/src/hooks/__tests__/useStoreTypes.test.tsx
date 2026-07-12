// @vitest-environment jsdom
/**
 * useStoreTypes — fetches the seller's "what do you sell?" options from
 * GET /api/store-types. Must never silently fall back to a guessed id.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const mockGet = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...args: any[]) => mockGet(...args) },
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { useStoreTypes } from '@/hooks/useStoreTypes';

describe('useStoreTypes', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('starts in a loading state and calls GET /api/store-types', async () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useStoreTypes());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.storeTypes).toEqual([]);
    expect(mockGet).toHaveBeenCalledWith('/api/store-types');
  });

  it('prefers display_name over name, so Arabic sellers never see English labels', async () => {
    // The real API sends BOTH: `name` (raw English, kept for legacy consumers)
    // and `display_name` (locale-resolved). Reading `name` would silently render
    // English on an RTL Arabic form.
    mockGet.mockResolvedValue({
      data: {
        data: [
          { id: 4, slug: 'womenswear', name: "Women's Clothing", display_name: 'ملابس نسائية' },
        ],
      },
    });

    const { result } = renderHook(() => useStoreTypes());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.storeTypes[0].name).toBe('ملابس نسائية');
  });

  it('populates storeTypes from a raw-array response', async () => {
    mockGet.mockResolvedValue({
      data: [
        { id: 4, slug: 'womenswear', name: "Women's Clothing" },
        { id: 5, slug: 'jewelry', name: 'Jewelry' },
      ],
    });

    const { result } = renderHook(() => useStoreTypes());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.storeTypes).toEqual([
      { id: 4, slug: 'womenswear', name: "Women's Clothing" },
      { id: 5, slug: 'jewelry', name: 'Jewelry' },
    ]);
  });

  it('unwraps a { data: [...] } envelope response', async () => {
    mockGet.mockResolvedValue({
      data: { data: [{ id: 1, slug: 'regular', name: 'Regular Store' }] },
    });

    const { result } = renderHook(() => useStoreTypes());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.storeTypes).toEqual([
      { id: 1, slug: 'regular', name: 'Regular Store' },
    ]);
  });

  it('sets an error and an EMPTY storeTypes list on network failure — never a default id', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useStoreTypes());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.storeTypes).toEqual([]);
  });

  it('sets an error when the endpoint 404s (not yet deployed)', async () => {
    const notFound: any = new Error('Request failed with status code 404');
    notFound.response = { status: 404 };
    mockGet.mockRejectedValue(notFound);

    const { result } = renderHook(() => useStoreTypes());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.storeTypes).toEqual([]);
  });
});
