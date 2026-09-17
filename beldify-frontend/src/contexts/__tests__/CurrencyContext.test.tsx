/**
 * TDD — RED phase
 * CurrencyContext: display-only currency conversion.
 *
 * Verifies:
 *  1. Fetches /api/currencies once on mount and exposes the list
 *  2. Defaults to MAD when no preference stored
 *  3. convert(mad) divides by the selected currency's exchange_rate_to_mad
 *  4. format(mad) rounds to decimal_places and prefixes/suffixes the symbol
 *  5. setCurrency persists the chosen code to localStorage
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

const mockGet = vi.fn();

vi.mock('@/lib/api', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { CurrencyProvider, useCurrency } from '../CurrencyContext';

const CURRENCIES = {
  status: 'success',
  base: 'MAD',
  data: [
    { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD', exchange_rate_to_mad: 1, decimal_places: 0, is_default: true },
    { code: 'USD', name: 'US Dollar', symbol: '$', exchange_rate_to_mad: 10, decimal_places: 2, is_default: false },
  ],
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <CurrencyProvider>{children}</CurrencyProvider>;
}

describe('CurrencyContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGet.mockResolvedValue({ data: CURRENCIES });
  });

  it('fetches /api/currencies once and exposes the list', async () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });

    await waitFor(() => expect(result.current.currencies.length).toBe(2));

    expect(mockGet).toHaveBeenCalledWith('/currencies');
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('defaults to MAD when nothing stored', async () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });

    await waitFor(() => expect(result.current.currencies.length).toBe(2));

    expect(result.current.currency.code).toBe('MAD');
  });

  it('convert(mad) divides by the selected currency exchange rate', async () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });
    await waitFor(() => expect(result.current.currencies.length).toBe(2));

    act(() => result.current.setCurrencyCode('USD'));
    await waitFor(() => expect(result.current.currency.code).toBe('USD'));

    expect(result.current.convert(100)).toBeCloseTo(10);
  });

  it('format(mad) rounds to decimal_places and includes the symbol', async () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });
    await waitFor(() => expect(result.current.currencies.length).toBe(2));

    act(() => result.current.setCurrencyCode('USD'));
    await waitFor(() => expect(result.current.currency.code).toBe('USD'));

    expect(result.current.format(105)).toContain('10.50');
    expect(result.current.format(105)).toContain('$');
  });

  it('persists the selected currency code to localStorage', async () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });
    await waitFor(() => expect(result.current.currencies.length).toBe(2));

    act(() => result.current.setCurrencyCode('USD'));

    await waitFor(() => expect(localStorage.getItem('beldify_currency')).toBe('USD'));
  });
});
