// @vitest-environment jsdom
/**
 * TDD — RED phase
 * CurrencySwitcher: minimal header dropdown to pick the display currency.
 *
 * Verifies:
 *  1. Renders the currently selected currency code as the trigger label
 *  2. Opening the menu lists all currencies from context
 *  3. Clicking a currency calls setCurrencyCode with its code
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k: string, fallback: string) => fallback }),
}));

const { mockSetCurrencyCode, mockUseCurrency } = vi.hoisted(() => ({
  mockSetCurrencyCode: vi.fn(),
  mockUseCurrency: vi.fn(),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => mockUseCurrency(),
}));

import CurrencySwitcher from '../CurrencySwitcher';

const CURRENCIES = [
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD', exchange_rate_to_mad: 1, decimal_places: 0, is_default: true },
  { code: 'USD', name: 'US Dollar', symbol: '$', exchange_rate_to_mad: 10, decimal_places: 2, is_default: false },
  { code: 'EUR', name: 'Euro', symbol: '€', exchange_rate_to_mad: 11, decimal_places: 2, is_default: false },
];

describe('CurrencySwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrency.mockReturnValue({
      currencies: CURRENCIES,
      currency: CURRENCIES[0],
      loading: false,
      setCurrencyCode: mockSetCurrencyCode,
      convert: (v: number) => v,
      format: (v: number) => `MAD ${v}`,
    });
  });

  it('renders the currently selected currency code as the trigger label', () => {
    render(<CurrencySwitcher />);
    expect(screen.getByRole('button')).toHaveTextContent('MAD');
  });

  it('lists all currencies when opened', () => {
    render(<CurrencySwitcher />);
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
  });

  it('calls setCurrencyCode with the clicked currency code', () => {
    render(<CurrencySwitcher />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('USD'));

    expect(mockSetCurrencyCode).toHaveBeenCalledWith('USD');
  });
});
