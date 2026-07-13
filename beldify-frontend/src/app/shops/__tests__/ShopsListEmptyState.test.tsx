// @vitest-environment jsdom
/**
 * TDD — sparse-state coverage for the shops LIST page.
 *
 * Covers requirement #6: when a filter/search returns zero shops, the page
 * must render a proper empty state with a way back — not an empty grid or
 * a spinner stuck forever.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import ShopsPage from '../page';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOpts?: any, maybeOpts?: any) => {
      const fallback = typeof fallbackOrOpts === 'string' ? fallbackOrOpts : undefined;
      const opts = typeof fallbackOrOpts === 'object' ? fallbackOrOpts : maybeOpts;
      let str = fallback ?? key;
      if (opts) {
        Object.keys(opts).forEach((k) => {
          str = str.replace(`{{${k}}}`, String(opts[k]));
        });
      }
      return str;
    },
  }),
}));

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams('search=zzzznonexistent'),
}));

vi.mock('@/services/shopService', () => ({
  shopService: {
    getShops: vi.fn(async () => ({
      data: { shops: [], pagination: { current_page: 1, last_page: 1, per_page: 12, total: 0 } },
      error: null,
    })),
  },
}));

describe('Shops list page — empty filter result', () => {
  afterEach(() => cleanup());

  it('renders a designed empty state with a way back instead of an empty grid', async () => {
    render(<ShopsPage />);
    await waitFor(() => expect(screen.getByText(/no sellers found/i)).toBeTruthy());
    // "Way back" — a clear-filters action must be present and actionable.
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeTruthy();
  });
});
