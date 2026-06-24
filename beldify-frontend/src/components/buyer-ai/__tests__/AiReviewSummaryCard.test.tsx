/**
 * AiReviewSummaryCard — component tests
 *
 * Tests:
 *  1. Renders summary text, pros chips, cons chips on 200 data
 *  2. Renders nothing (null) when data is null (204 path)
 *  3. Shows AI provenance microcopy
 *  4. Shows review_count
 */

// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ── i18n stub ─────────────────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string | Record<string, unknown>, opts?: Record<string, unknown>) => {
      if (typeof fallback === 'string') return fallback;
      if (typeof _key === 'string' && opts?.count !== undefined) return `${opts.count}`;
      return _key;
    },
  }),
}));

import { AiReviewSummaryCard } from '../AiReviewSummaryCard';
import type { ReviewSummaryAI } from '@/services/buyerAiService';

const SUMMARY: ReviewSummaryAI = {
  summary: 'This caftan is exceptionally well-crafted.',
  pros: ['Great quality', 'Fast delivery'],
  cons: ['Slightly pricey'],
  review_count: 14,
  generated_at: '2026-06-10T10:00:00Z',
  locale: 'en',
};

describe('AiReviewSummaryCard', () => {
  it('renders summary text on 200 data', () => {
    render(<AiReviewSummaryCard data={SUMMARY} />);
    expect(screen.getByText(/This caftan is exceptionally well-crafted./i)).toBeInTheDocument();
  });

  it('renders pros as chips', () => {
    render(<AiReviewSummaryCard data={SUMMARY} />);
    expect(screen.getByText('Great quality')).toBeInTheDocument();
    expect(screen.getByText('Fast delivery')).toBeInTheDocument();
  });

  it('renders cons as chips', () => {
    render(<AiReviewSummaryCard data={SUMMARY} />);
    expect(screen.getByText('Slightly pricey')).toBeInTheDocument();
  });

  it('shows review_count in provenance line', () => {
    render(<AiReviewSummaryCard data={SUMMARY} />);
    // review_count (14) appears inside the provenance text; use a flexible matcher
    const provenanceEl = screen.getByText((text) => text.includes('14'));
    expect(provenanceEl).toBeInTheDocument();
  });

  it('renders nothing when data is null (204 path)', () => {
    const { container } = render(<AiReviewSummaryCard data={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows AI-generated provenance microcopy', () => {
    render(<AiReviewSummaryCard data={SUMMARY} />);
    // The microcopy key is 'buyerAi.reviewSummary.provenance' with fallback
    expect(screen.getByText(/AI-generated from buyer reviews/i)).toBeInTheDocument();
  });
});
