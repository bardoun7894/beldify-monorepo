/**
 * ProposalAiRanking — AI ranking panel for buyer brief detail page
 *
 * Tests:
 *  1. Renders "Rank with AI" button for post owner
 *  2. Does NOT render for non-owners (owner-gating)
 *  3. Calls rankProposals with correct postId on button click
 *  4. Renders ranked list when available:true
 *  5. Renders overall_summary text
 *  6. Renders fit_score for each ranked proposal
 *  7. Renders summary text for each proposal
 *  8. Does not render the ranked list when available:false
 *  9. Shows error message on 403
 * 10. Renders link to each real proposal via response_id
 * 11. Loading state disables button
 * 12. aria-live="polite" on results region
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string | Record<string, unknown>, opts?: Record<string, unknown>) => {
      const template = (typeof fallback === 'string' ? fallback : undefined) ?? _key;
      const params = (typeof fallback === 'object' ? fallback : opts) ?? {};
      return template.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) =>
        k in params ? String(params[k]) : `{{${k}}}`
      );
    },
  }),
}));

const mockRankProposals = vi.fn();

vi.mock('@/services/openSoukAiService', () => ({
  rankProposals: (...args: unknown[]) => mockRankProposals(...args),
}));

import { ProposalAiRanking } from '../ProposalAiRanking';

const RANK_AVAILABLE = {
  available: true as const,
  ranked: [
    { response_id: 1, fit_score: 85, summary: 'Strong artisan matching your brief.' },
    { response_id: 2, fit_score: 72, summary: 'Good price but slower delivery.' },
  ],
  overall_summary: 'Response #1 is the best overall fit.',
};

const RANK_UNAVAILABLE = { available: false as const };

describe('ProposalAiRanking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Renders button for post owner ─────────────────────────────────────────
  it('renders "Rank with AI" button when isOwner=true', () => {
    render(<ProposalAiRanking postId={7} isOwner={true} />);
    expect(screen.getByRole('button', { name: /rank.*ai|ai.*rank/i })).toBeInTheDocument();
  });

  // ── 2. Does NOT render for non-owners ────────────────────────────────────────
  it('renders nothing when isOwner=false', () => {
    const { container } = render(<ProposalAiRanking postId={7} isOwner={false} />);
    expect(container.firstChild).toBeNull();
  });

  // ── 3. Calls rankProposals with postId ───────────────────────────────────────
  it('calls rankProposals with the correct postId', async () => {
    mockRankProposals.mockResolvedValueOnce(RANK_UNAVAILABLE);

    render(<ProposalAiRanking postId={55} isOwner={true} />);
    fireEvent.click(screen.getByRole('button', { name: /rank.*ai|ai.*rank/i }));

    await waitFor(() => expect(mockRankProposals).toHaveBeenCalledWith(55));
  });

  // ── 4. Renders ranked list on available:true ──────────────────────────────────
  it('renders ranked proposal list on success', async () => {
    mockRankProposals.mockResolvedValueOnce(RANK_AVAILABLE);

    render(<ProposalAiRanking postId={7} isOwner={true} />);
    fireEvent.click(screen.getByRole('button', { name: /rank.*ai|ai.*rank/i }));

    await waitFor(() =>
      expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(2)
    );
  });

  // ── 5. Renders overall_summary ────────────────────────────────────────────────
  it('renders overall_summary text', async () => {
    mockRankProposals.mockResolvedValueOnce(RANK_AVAILABLE);

    render(<ProposalAiRanking postId={7} isOwner={true} />);
    fireEvent.click(screen.getByRole('button', { name: /rank.*ai|ai.*rank/i }));

    await waitFor(() =>
      expect(screen.getByText('Response #1 is the best overall fit.')).toBeInTheDocument()
    );
  });

  // ── 6. Renders fit_score ──────────────────────────────────────────────────────
  it('renders fit_score for each ranked proposal', async () => {
    mockRankProposals.mockResolvedValueOnce(RANK_AVAILABLE);

    render(<ProposalAiRanking postId={7} isOwner={true} />);
    fireEvent.click(screen.getByRole('button', { name: /rank.*ai|ai.*rank/i }));

    await waitFor(() => {
      expect(screen.getByText(/85/)).toBeInTheDocument();
      expect(screen.getByText(/72/)).toBeInTheDocument();
    });
  });

  // ── 7. Renders proposal summary text ─────────────────────────────────────────
  it('renders summary text for each ranked proposal', async () => {
    mockRankProposals.mockResolvedValueOnce(RANK_AVAILABLE);

    render(<ProposalAiRanking postId={7} isOwner={true} />);
    fireEvent.click(screen.getByRole('button', { name: /rank.*ai|ai.*rank/i }));

    await waitFor(() =>
      expect(
        screen.getByText('Strong artisan matching your brief.')
      ).toBeInTheDocument()
    );
  });

  // ── 8. available:false → no ranking list ─────────────────────────────────────
  it('hides ranking list on available:false', async () => {
    mockRankProposals.mockResolvedValueOnce(RANK_UNAVAILABLE);

    render(<ProposalAiRanking postId={7} isOwner={true} />);
    fireEvent.click(screen.getByRole('button', { name: /rank.*ai|ai.*rank/i }));

    // Button should re-enable when done
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /rank.*ai|ai.*rank/i })).not.toBeDisabled()
    );
    expect(screen.queryByRole('list')).toBeNull();
  });

  // ── 9. 403 → shows error ──────────────────────────────────────────────────────
  it('shows error message on 403 (non-owner)', async () => {
    mockRankProposals.mockRejectedValueOnce({ response: { status: 403 } });

    render(<ProposalAiRanking postId={7} isOwner={true} />);
    fireEvent.click(screen.getByRole('button', { name: /rank.*ai|ai.*rank/i }));

    await waitFor(() => {
      const region = screen.getByRole('region', { name: /ai ranking/i });
      // Error message text (access denied, error, unavailable, etc.)
      expect(region.textContent).toMatch(/error|unavailable|failed|access/i);
    });
  });

  // ── 10. Links to real proposal ────────────────────────────────────────────────
  it('renders a link anchoring each proposal using response_id', async () => {
    mockRankProposals.mockResolvedValueOnce(RANK_AVAILABLE);

    render(<ProposalAiRanking postId={7} isOwner={true} />);
    fireEvent.click(screen.getByRole('button', { name: /rank.*ai|ai.*rank/i }));

    await waitFor(() => {
      const links = screen.getAllByRole('link');
      const hrefs = links.map(l => l.getAttribute('href') ?? '');
      // Each ranked response should link to or anchor its response_id
      expect(hrefs.some(h => h.includes('1'))).toBe(true);
    });
  });

  // ── 11. Loading state disables button ────────────────────────────────────────
  it('disables button while ranking request is in flight', async () => {
    let resolve: (v: typeof RANK_UNAVAILABLE) => void;
    mockRankProposals.mockReturnValueOnce(
      new Promise<typeof RANK_UNAVAILABLE>(r => { resolve = r; })
    );

    render(<ProposalAiRanking postId={7} isOwner={true} />);
    fireEvent.click(screen.getByRole('button', { name: /rank.*ai|ai.*rank/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /ranking/i })).toBeDisabled()
    );

    resolve!(RANK_UNAVAILABLE);
  });

  // ── 12. aria-live region ──────────────────────────────────────────────────────
  it('renders aria-live="polite" region for screen reader updates', () => {
    render(<ProposalAiRanking postId={7} isOwner={true} />);
    const region = screen.getByRole('region', { name: /ai ranking/i });
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  // ── 13. P2 available:false → shows rank_unavailable message ──────────────────
  it('shows rank_unavailable soft message when available:false', async () => {
    mockRankProposals.mockResolvedValueOnce(RANK_UNAVAILABLE);

    render(<ProposalAiRanking postId={7} isOwner={true} />);
    fireEvent.click(screen.getByRole('button', { name: /rank.*ai|ai.*rank/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/ai ranking is currently unavailable/i)
      ).toBeInTheDocument()
    );
  });

  // ── 14. P3 aria-label interpolation uses i18n, not JS template literal ───────
  it('renders view_proposal_aria with interpolated response_id', async () => {
    mockRankProposals.mockResolvedValueOnce(RANK_AVAILABLE);

    render(<ProposalAiRanking postId={7} isOwner={true} />);
    fireEvent.click(screen.getByRole('button', { name: /rank.*ai|ai.*rank/i }));

    await waitFor(() => {
      const links = screen.getAllByRole('link');
      // The aria-label on the first link must include the response_id (1) not a literal ${item.response_id}
      const firstLink = links[0];
      const ariaLabel = firstLink.getAttribute('aria-label') ?? '';
      expect(ariaLabel).toMatch(/1/);
      // Must NOT contain the raw template-literal placeholder text
      expect(ariaLabel).not.toContain('${item.response_id}');
    });
  });
});
