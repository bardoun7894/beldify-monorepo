/**
 * openSoukAiService — unit tests (RED → GREEN)
 *
 * Covers:
 *  1. draftProposal — available:true response fills pitch/price/delivery
 *  2. draftProposal — available:false response returns graceful object
 *  3. draftProposal — 403 (seller suspended) re-throws
 *  4. draftProposal — network error re-throws
 *  5. rankProposals — available:true returns ranked list + summary
 *  6. rankProposals — available:false returns graceful object
 *  7. rankProposals — 403 (non-owner) re-throws
 *  8. rankProposals — network error re-throws
 *  9. draftProposal posts to correct endpoint
 * 10. rankProposals posts to correct endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock @/lib/api before any imports ───────────────────────────────────────
const mockPost = vi.fn();

vi.mock('@/lib/api', () => ({
  default: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

import {
  draftProposal,
  rankProposals,
  ProposalDraftAvailable,
  ProposalDraftUnavailable,
  ProposalRankAvailable,
  ProposalRankUnavailable,
} from '../openSoukAiService';

describe('openSoukAiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. draftProposal — available:true ─────────────────────────────────────
  describe('draftProposal', () => {
    it('returns ProposalDraftAvailable when AI is on', async () => {
      const payload: ProposalDraftAvailable = {
        available: true,
        pitch: 'We can craft this in our Tetouani atelier.',
        suggested_price_range: { min: 800, max: 1200 },
        suggested_delivery_days: 14,
      };
      mockPost.mockResolvedValueOnce({ data: payload });

      const result = await draftProposal(42);

      expect(result.available).toBe(true);
      if (result.available) {
        expect(result.pitch).toBe('We can craft this in our Tetouani atelier.');
        expect(result.suggested_price_range).toEqual({ min: 800, max: 1200 });
        expect(result.suggested_delivery_days).toBe(14);
      }
    });

    // ── 2. available:false ───────────────────────────────────────────────────
    it('returns ProposalDraftUnavailable when AI is off', async () => {
      const payload: ProposalDraftUnavailable = { available: false };
      mockPost.mockResolvedValueOnce({ data: payload });

      const result = await draftProposal(42);

      expect(result.available).toBe(false);
    });

    // ── 3. 403 re-throws ─────────────────────────────────────────────────────
    it('re-throws 403 (seller suspended)', async () => {
      const err = { response: { status: 403 } };
      mockPost.mockRejectedValueOnce(err);

      await expect(draftProposal(42)).rejects.toEqual(err);
    });

    // ── 4. network error re-throws ───────────────────────────────────────────
    it('re-throws network error', async () => {
      const err = new Error('Network Error');
      mockPost.mockRejectedValueOnce(err);

      await expect(draftProposal(42)).rejects.toThrow('Network Error');
    });

    // ── 9. posts to correct endpoint ─────────────────────────────────────────
    it('posts to /api/seller/community/{post}/proposal-ai/draft', async () => {
      mockPost.mockResolvedValueOnce({ data: { available: false } });

      await draftProposal(99);

      expect(mockPost).toHaveBeenCalledWith(
        '/api/seller/community/99/proposal-ai/draft'
      );
    });
  });

  // ── 5–8. rankProposals ────────────────────────────────────────────────────
  describe('rankProposals', () => {
    it('returns ProposalRankAvailable when AI is on', async () => {
      const payload: ProposalRankAvailable = {
        available: true,
        ranked: [
          { response_id: 1, fit_score: 85, summary: 'Strong artisan with matching skills.' },
          { response_id: 2, fit_score: 72, summary: 'Good but higher price.' },
        ],
        overall_summary: 'Response #1 is the best fit.',
      };
      mockPost.mockResolvedValueOnce({ data: payload });

      const result = await rankProposals(7);

      expect(result.available).toBe(true);
      if (result.available) {
        expect(result.ranked).toHaveLength(2);
        expect(result.ranked[0].fit_score).toBe(85);
        expect(result.overall_summary).toBe('Response #1 is the best fit.');
      }
    });

    it('returns ProposalRankUnavailable when AI is off', async () => {
      const payload: ProposalRankUnavailable = { available: false };
      mockPost.mockResolvedValueOnce({ data: payload });

      const result = await rankProposals(7);

      expect(result.available).toBe(false);
    });

    it('re-throws 403 (non-owner caller)', async () => {
      const err = { response: { status: 403 } };
      mockPost.mockRejectedValueOnce(err);

      await expect(rankProposals(7)).rejects.toEqual(err);
    });

    it('re-throws network error', async () => {
      const err = new Error('Network Error');
      mockPost.mockRejectedValueOnce(err);

      await expect(rankProposals(7)).rejects.toThrow('Network Error');
    });

    it('posts to /api/v1/community/posts/{post}/proposals/rank', async () => {
      mockPost.mockResolvedValueOnce({ data: { available: false } });

      await rankProposals(55);

      expect(mockPost).toHaveBeenCalledWith(
        '/api/v1/community/posts/55/proposals/rank'
      );
    });
  });
});
