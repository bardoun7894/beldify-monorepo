/**
 * SizeAdvisorSheet — component tests
 *
 * Tests:
 *  1. Sheet is not shown when hasSizes is false (product has no size dimension)
 *  2. Entry link is visible when hasSizes is true
 *  3. Submitting form calls getSizeAdvice with correct payload
 *  4. Recommended size is highlighted after result
 *  5. "Use this size" button calls onSelectSize with recommended_size
 *  6. 422 not_sized: entry point hides
 *  7. 503 ai_unavailable: friendly fallback message appears
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
  }),
}));

// ── buyerAiService mock ────────────────────────────────────────────────────────
const mockGetSizeAdvice = vi.fn();
vi.mock('@/services/buyerAiService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/buyerAiService')>();
  return {
    ...actual,
    getSizeAdvice: (...args: unknown[]) => mockGetSizeAdvice(...args),
  };
});

import { SizeAdvisorSheet } from '../SizeAdvisorSheet';
import { NotSizedException, AiUnavailableException } from '@/services/buyerAiService';

const DEFAULT_PROPS = {
  productId: '5',
  hasSizes: true,
  availableSizes: ['S', 'M', 'L', 'XL'],
  onSelectSize: vi.fn(),
};

describe('SizeAdvisorSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render the entry link when hasSizes is false', () => {
    render(<SizeAdvisorSheet {...DEFAULT_PROPS} hasSizes={false} />);
    expect(screen.queryByText(/Find my size/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/لقى قياسك/i)).not.toBeInTheDocument();
  });

  it('renders entry link when hasSizes is true', () => {
    render(<SizeAdvisorSheet {...DEFAULT_PROPS} />);
    expect(screen.getByRole('button', { name: /Find my size/i })).toBeInTheDocument();
  });

  it('opens the sheet when entry link is clicked', async () => {
    render(<SizeAdvisorSheet {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: /Find my size/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/Height/i)).toBeInTheDocument();
    });
  });

  it('calls getSizeAdvice with height and weight on form submit', async () => {
    mockGetSizeAdvice.mockResolvedValueOnce({
      recommended_size: 'L',
      confidence: 'high',
      note: 'L fits best for your measurements.',
    });

    render(<SizeAdvisorSheet {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: /Find my size/i }));

    await waitFor(() => screen.getByLabelText(/Height/i));

    fireEvent.change(screen.getByLabelText(/Height/i), { target: { value: '175' } });
    fireEvent.change(screen.getByLabelText(/Weight/i), { target: { value: '75' } });

    fireEvent.click(screen.getByRole('button', { name: /Get recommendation/i }));

    await waitFor(() => {
      expect(mockGetSizeAdvice).toHaveBeenCalledWith('5', {
        height_cm: 175,
        weight_kg: 75,
        fit_preference: undefined,
        usual_size: undefined,
      });
    });
  });

  it('shows recommended size after successful response', async () => {
    mockGetSizeAdvice.mockResolvedValueOnce({
      recommended_size: 'L',
      confidence: 'high',
      note: 'L fits best for your measurements.',
    });

    render(<SizeAdvisorSheet {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: /Find my size/i }));
    await waitFor(() => screen.getByLabelText(/Height/i));
    fireEvent.change(screen.getByLabelText(/Height/i), { target: { value: '175' } });
    fireEvent.change(screen.getByLabelText(/Weight/i), { target: { value: '75' } });
    fireEvent.click(screen.getByRole('button', { name: /Get recommendation/i }));

    await waitFor(() => {
      expect(screen.getByText(/L fits best for your measurements/i)).toBeInTheDocument();
    });
  });

  it('calls onSelectSize with recommended_size when "Use this size" is clicked', async () => {
    const onSelectSize = vi.fn();
    mockGetSizeAdvice.mockResolvedValueOnce({
      recommended_size: 'L',
      confidence: 'high',
      note: 'L fits best.',
    });

    render(<SizeAdvisorSheet {...DEFAULT_PROPS} onSelectSize={onSelectSize} />);
    fireEvent.click(screen.getByRole('button', { name: /Find my size/i }));
    await waitFor(() => screen.getByLabelText(/Height/i));
    fireEvent.change(screen.getByLabelText(/Height/i), { target: { value: '175' } });
    fireEvent.change(screen.getByLabelText(/Weight/i), { target: { value: '75' } });
    fireEvent.click(screen.getByRole('button', { name: /Get recommendation/i }));

    await waitFor(() => screen.getByRole('button', { name: /Use this size/i }));
    fireEvent.click(screen.getByRole('button', { name: /Use this size/i }));

    expect(onSelectSize).toHaveBeenCalledWith('L');
  });

  it('hides the entry link after receiving a 422 not_sized error', async () => {
    mockGetSizeAdvice.mockRejectedValueOnce(new NotSizedException());

    render(<SizeAdvisorSheet {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: /Find my size/i }));
    await waitFor(() => screen.getByLabelText(/Height/i));
    fireEvent.change(screen.getByLabelText(/Height/i), { target: { value: '170' } });
    fireEvent.change(screen.getByLabelText(/Weight/i), { target: { value: '65' } });
    fireEvent.click(screen.getByRole('button', { name: /Get recommendation/i }));

    await waitFor(() => {
      // Entry link should be gone since product is not sized
      expect(screen.queryByRole('button', { name: /Find my size/i })).not.toBeInTheDocument();
    });
  });

  it('shows friendly fallback message on 503 ai_unavailable', async () => {
    mockGetSizeAdvice.mockRejectedValueOnce(new AiUnavailableException());

    render(<SizeAdvisorSheet {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: /Find my size/i }));
    await waitFor(() => screen.getByLabelText(/Height/i));
    fireEvent.change(screen.getByLabelText(/Height/i), { target: { value: '170' } });
    fireEvent.change(screen.getByLabelText(/Weight/i), { target: { value: '65' } });
    fireEvent.click(screen.getByRole('button', { name: /Get recommendation/i }));

    await waitFor(() => {
      // "size chart" appears in both the paragraph and the link text
      const matches = screen.getAllByText(/size chart/i);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });
});
