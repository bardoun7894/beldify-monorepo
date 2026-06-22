/**
 * ProposalAiDraft — "Draft with AI" button for seller proposal form
 *
 * Tests:
 *  1. Renders "Draft with AI" button
 *  2. Button is disabled while loading
 *  3. Calls draftProposal with correct postId when clicked
 *  4. Calls onApplyDraft with draft data when available:true
 *  5. Does not call onApplyDraft on available:false (shows unavailable message)
 *  6. Shows error state on 403
 *  7. Shows loading spinner during request
 *  8. Button is initially enabled (not loading)
 *  9. Uses aria-live="polite" for screen reader notifications
 * 10. RTL: renders correctly with isRTL=true
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ── i18n mock — must be ABOVE component import ───────────────────────────────
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

// ── openSoukAiService mock ────────────────────────────────────────────────────
const mockDraftProposal = vi.fn();

vi.mock('@/services/openSoukAiService', () => ({
  draftProposal: (...args: unknown[]) => mockDraftProposal(...args),
}));

// ── Component import (mocks hoisted above by vitest) ─────────────────────────
import { ProposalAiDraft } from '../ProposalAiDraft';

// ── Fixture data ──────────────────────────────────────────────────────────────
const DRAFT_AVAILABLE = {
  available: true as const,
  pitch: 'Our atelier specializes in traditional Moroccan embroidery.',
  suggested_price_range: { min: 800, max: 1200 },
  suggested_delivery_days: 14,
};

const DRAFT_UNAVAILABLE = { available: false as const };

// ─────────────────────────────────────────────────────────────────────────────

describe('ProposalAiDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Renders button ────────────────────────────────────────────────────────
  it('renders "Draft with AI" button', () => {
    render(<ProposalAiDraft postId={42} onApplyDraft={vi.fn()} />);
    expect(screen.getByRole('button', { name: /draft with ai/i })).toBeInTheDocument();
  });

  // ── 2. Button disabled while loading ─────────────────────────────────────────
  it('disables the button while the request is in flight', async () => {
    let resolve: (v: typeof DRAFT_UNAVAILABLE) => void;
    mockDraftProposal.mockReturnValueOnce(
      new Promise<typeof DRAFT_UNAVAILABLE>(r => { resolve = r; })
    );

    render(<ProposalAiDraft postId={42} onApplyDraft={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /draft with ai/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /drafting/i })).toBeDisabled()
    );

    resolve!(DRAFT_UNAVAILABLE);
  });

  // ── 3. Calls draftProposal with postId ───────────────────────────────────────
  it('calls draftProposal with the correct postId', async () => {
    mockDraftProposal.mockResolvedValueOnce(DRAFT_UNAVAILABLE);

    render(<ProposalAiDraft postId={99} onApplyDraft={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /draft with ai/i }));

    await waitFor(() => expect(mockDraftProposal).toHaveBeenCalledWith(99));
  });

  // ── 4. Calls onApplyDraft on available:true ──────────────────────────────────
  it('calls onApplyDraft with pitch/price/delivery on success', async () => {
    const onApplyDraft = vi.fn();
    mockDraftProposal.mockResolvedValueOnce(DRAFT_AVAILABLE);

    render(<ProposalAiDraft postId={42} onApplyDraft={onApplyDraft} />);
    fireEvent.click(screen.getByRole('button', { name: /draft with ai/i }));

    await waitFor(() =>
      expect(onApplyDraft).toHaveBeenCalledWith({
        pitch: DRAFT_AVAILABLE.pitch,
        suggested_price_range: DRAFT_AVAILABLE.suggested_price_range,
        suggested_delivery_days: DRAFT_AVAILABLE.suggested_delivery_days,
      })
    );
  });

  // ── 5. available:false → no onApplyDraft call ────────────────────────────────
  it('does not call onApplyDraft on available:false', async () => {
    const onApplyDraft = vi.fn();
    mockDraftProposal.mockResolvedValueOnce(DRAFT_UNAVAILABLE);

    render(<ProposalAiDraft postId={42} onApplyDraft={onApplyDraft} />);
    fireEvent.click(screen.getByRole('button', { name: /draft with ai/i }));

    // Wait for the loading to complete (button re-enables)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /draft with ai/i })).not.toBeDisabled()
    );
    expect(onApplyDraft).not.toHaveBeenCalled();
  });

  // ── 6. 403 → shows error message ─────────────────────────────────────────────
  it('shows error message on 403 (suspended seller)', async () => {
    mockDraftProposal.mockRejectedValueOnce({ response: { status: 403 } });

    render(<ProposalAiDraft postId={42} onApplyDraft={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /draft with ai/i }));

    await waitFor(() =>
      expect(screen.getByRole('region', { name: /ai draft/i })).toHaveTextContent(
        /unavailable|error|failed/i
      )
    );
  });

  // ── 7. Loading spinner shown during request ───────────────────────────────────
  it('shows loading indicator during request', async () => {
    let resolve: (v: typeof DRAFT_UNAVAILABLE) => void;
    mockDraftProposal.mockReturnValueOnce(
      new Promise<typeof DRAFT_UNAVAILABLE>(r => { resolve = r; })
    );

    render(<ProposalAiDraft postId={42} onApplyDraft={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /draft with ai/i }));

    await waitFor(() =>
      expect(screen.getByRole('status')).toBeInTheDocument()
    );

    resolve!(DRAFT_UNAVAILABLE);
  });

  // ── 8. Button initially enabled ───────────────────────────────────────────────
  it('renders button in enabled state initially', () => {
    render(<ProposalAiDraft postId={42} onApplyDraft={vi.fn()} />);
    expect(screen.getByRole('button', { name: /draft with ai/i })).not.toBeDisabled();
  });

  // ── 9. aria-live region ───────────────────────────────────────────────────────
  it('renders aria-live="polite" region for screen reader updates', () => {
    render(<ProposalAiDraft postId={42} onApplyDraft={vi.fn()} />);
    const region = screen.getByRole('region', { name: /ai draft/i });
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  // ── 10. RTL ───────────────────────────────────────────────────────────────────
  it('renders correctly with isRTL=true', () => {
    const { container } = render(
      <ProposalAiDraft postId={42} onApplyDraft={vi.fn()} isRTL={true} />
    );
    expect(container.firstChild).toBeTruthy();
    expect(screen.getByRole('button', { name: /draft with ai/i })).toBeInTheDocument();
  });
});
