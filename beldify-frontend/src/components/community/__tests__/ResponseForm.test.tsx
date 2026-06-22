/**
 * ResponseForm — proposal submission form
 *
 * Tests:
 *  1. P3 catch narrowing: shows error.message when onSubmit throws a plain Error
 *  2. P3 catch narrowing: shows fallback i18n string when onSubmit throws a non-Error
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ isRTL: false, direction: 'ltr' }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock('@/components/common/LoadingSpinner', () => ({
  default: () => React.createElement('span', { 'data-testid': 'spinner' }),
}));

vi.mock('../ProposalAiDraft', () => ({
  ProposalAiDraft: () => React.createElement('div', { 'data-testid': 'ai-draft' }),
}));

import ResponseForm from '../ResponseForm';

describe('ResponseForm — catch narrowing (P3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Plain Error → shows error.message ────────────────────────────────────
  it('shows error.message when onSubmit throws a plain Error', async () => {
    const onSubmit = vi.fn().mockRejectedValueOnce(new Error('Custom error message'));

    render(
      <ResponseForm onSubmit={onSubmit} onCancel={vi.fn()} isLoading={false} />
    );

    // Fill in the required description field
    const textarea = screen.getByLabelText(/cover message/i);
    fireEvent.change(textarea, { target: { value: 'My proposal description' } });

    // Click the submit button directly
    fireEvent.click(screen.getByRole('button', { name: /submit proposal/i }));

    await waitFor(() =>
      expect(screen.getByText('Custom error message')).toBeInTheDocument()
    );
  });

  // ── 2. Non-Error thrown → shows i18n fallback string ────────────────────────
  it('shows i18n fallback when onSubmit throws a non-Error value', async () => {
    const onSubmit = vi.fn().mockRejectedValueOnce('string error');

    render(
      <ResponseForm onSubmit={onSubmit} onCancel={vi.fn()} isLoading={false} />
    );

    const textarea = screen.getByLabelText(/cover message/i);
    fireEvent.change(textarea, { target: { value: 'My proposal description' } });

    fireEvent.click(screen.getByRole('button', { name: /submit proposal/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/failed to submit proposal/i)
      ).toBeInTheDocument()
    );
  });
});
