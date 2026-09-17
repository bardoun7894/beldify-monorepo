'use client';

/**
 * CurrencyContext — DISPLAY-ONLY currency conversion.
 *
 * Backend contract:
 *   GET /api/currencies (public) →
 *     { status, base: "MAD", data: [{ code, name, symbol, exchange_rate_to_mad, decimal_places, is_default }] }
 *
 * IMPORTANT: orders always settle in MAD. This context only affects what is
 * SHOWN to the buyer — never the amount sent to the server.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api from '@/lib/api';
import logger from '@/utils/consoleLogger';

const STORAGE_KEY = 'beldify_currency';
const BASE_CODE = 'MAD';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_mad: number;
  decimal_places: number;
  is_default: boolean;
}

const DEFAULT_CURRENCY: Currency = {
  code: BASE_CODE,
  name: 'Moroccan Dirham',
  symbol: 'MAD',
  exchange_rate_to_mad: 1,
  decimal_places: 0,
  is_default: true,
};

interface CurrencyContextType {
  currencies: Currency[];
  currency: Currency;
  loading: boolean;
  setCurrencyCode: (code: string) => void;
  /** Converts a MAD amount into the currently selected display currency. */
  convert: (madAmount: number) => number;
  /** Converts + formats a MAD amount as a display-ready string, e.g. "$10.50". */
  format: (madAmount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencies, setCurrencies] = useState<Currency[]>([DEFAULT_CURRENCY]);
  const [code, setCode] = useState<string>(BASE_CODE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const stored =
      typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored) setCode(stored);

    (async () => {
      try {
        const response = await api.get('/currencies');
        const list: Currency[] = response.data?.data ?? [];
        if (!cancelled && Array.isArray(list) && list.length > 0) {
          setCurrencies(list);
        }
      } catch (error) {
        logger.error('Error fetching currencies:', error);
        // Keep the MAD-only fallback — display-only feature, never blocks the app.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrencyCode = useCallback((newCode: string) => {
    setCode(newCode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, newCode);
    }
  }, []);

  const currency = useMemo<Currency>(() => {
    return currencies.find((c) => c.code === code) ?? currencies[0] ?? DEFAULT_CURRENCY;
  }, [currencies, code]);

  const convert = useCallback(
    (madAmount: number): number => {
      const rate = currency.exchange_rate_to_mad || 1;
      return madAmount / rate;
    },
    [currency]
  );

  const format = useCallback(
    (madAmount: number): string => {
      const converted = convert(madAmount);
      const decimals = currency.decimal_places ?? 0;
      const rounded = converted.toFixed(decimals);
      return `${currency.symbol} ${rounded}`;
    },
    [convert, currency]
  );

  const value = useMemo(
    () => ({ currencies, currency, loading, setCurrencyCode, convert, format }),
    [currencies, currency, loading, setCurrencyCode, convert, format]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

// Display-only feature: components rendered outside the provider fall back to
// MAD passthrough instead of crashing the page.
const FALLBACK_CONTEXT: CurrencyContextType = {
  currencies: [DEFAULT_CURRENCY],
  currency: DEFAULT_CURRENCY,
  loading: false,
  setCurrencyCode: () => {},
  convert: (madAmount) => madAmount,
  format: (madAmount) => `${DEFAULT_CURRENCY.symbol} ${madAmount.toFixed(0)}`,
};

export function useCurrency(): CurrencyContextType {
  return useContext(CurrencyContext) ?? FALLBACK_CONTEXT;
}
