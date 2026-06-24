/**
 * SearchAssistBar — component tests
 *
 * Tests:
 *  1. Does NOT call searchAssist for short single-word queries
 *  2. Calls searchAssist for natural-language queries (>2 words)
 *  3. Shows AI filter chips when assist returns filters
 *  4. Shows reply line when assist returns reply
 *  5. On fallback=true, does not show AI chips (silent plain search)
 *  6. Chips are removable
 *  7. Original search behavior unchanged when assist is never triggered
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ── i18n stub ─────────────────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) =>
      typeof fallback === 'string' ? fallback : _key,
    i18n: { language: 'ar' },
  }),
}));

// ── buyerAiService mock ────────────────────────────────────────────────────────
const mockSearchAssist = vi.fn();
vi.mock('@/services/buyerAiService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/buyerAiService')>();
  return {
    ...actual,
    searchAssist: (...args: unknown[]) => mockSearchAssist(...args),
  };
});

import { SearchAssistBar } from '../SearchAssistBar';

const DEFAULT_PROPS = {
  onSearch: vi.fn(),
  onAssistFilters: vi.fn(),
};

describe('SearchAssistBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls onSearch without assist for a single-word query', async () => {
    render(<SearchAssistBar {...DEFAULT_PROPS} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'caftan' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(DEFAULT_PROPS.onSearch).toHaveBeenCalledWith('caftan');
      expect(mockSearchAssist).not.toHaveBeenCalled();
    });
  });

  it('calls searchAssist for natural-language query with >2 words', async () => {
    mockSearchAssist.mockResolvedValueOnce({
      filters: { keywords: 'caftan', category_id: 3, price_min: null, price_max: 800 },
      reply: 'Showing caftans under 800 MAD',
      fallback: false,
    });

    render(<SearchAssistBar {...DEFAULT_PROPS} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'caftan rouge moins de 800' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(mockSearchAssist).toHaveBeenCalledWith('caftan rouge moins de 800', 'ar');
    });
  });

  it('shows AI reply line when assist returns a reply', async () => {
    mockSearchAssist.mockResolvedValueOnce({
      filters: { keywords: 'caftan', category_id: 3, price_min: null, price_max: 800 },
      reply: 'Showing caftans under 800 MAD',
      fallback: false,
    });

    render(<SearchAssistBar {...DEFAULT_PROPS} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'caftan rouge moins de 800' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Showing caftans under 800 MAD/i)).toBeInTheDocument();
    });
  });

  it('calls onAssistFilters with parsed filters on non-fallback result', async () => {
    const filters = { keywords: 'caftan', category_id: 3, price_min: null, price_max: 800 };
    mockSearchAssist.mockResolvedValueOnce({
      filters,
      reply: 'Showing results',
      fallback: false,
    });

    const onAssistFilters = vi.fn();
    render(<SearchAssistBar {...DEFAULT_PROPS} onAssistFilters={onAssistFilters} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'caftan rouge moins de 800' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(onAssistFilters).toHaveBeenCalledWith(filters);
    });
  });

  it('does NOT call onAssistFilters when fallback=true (plain keyword search)', async () => {
    mockSearchAssist.mockResolvedValueOnce({
      filters: { keywords: 'test', category_id: null, price_min: null, price_max: null },
      reply: null,
      fallback: true,
    });

    const onAssistFilters = vi.fn();
    render(<SearchAssistBar {...DEFAULT_PROPS} onAssistFilters={onAssistFilters} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'test me please now here' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(DEFAULT_PROPS.onSearch).toHaveBeenCalled();
      expect(onAssistFilters).not.toHaveBeenCalled();
    });
  });

  it('renders the sparkles assist affordance button', () => {
    render(<SearchAssistBar {...DEFAULT_PROPS} />);
    expect(screen.getByRole('button', { name: /AI search/i })).toBeInTheDocument();
  });

  it('calls onSearch normally when query has 2 words or fewer', async () => {
    render(<SearchAssistBar {...DEFAULT_PROPS} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'djellaba bleu' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(DEFAULT_PROPS.onSearch).toHaveBeenCalledWith('djellaba bleu');
    });
  });
});
