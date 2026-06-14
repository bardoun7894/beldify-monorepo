/**
 * openSoukAiService — AI matchmaker endpoints for Open Souk
 *
 * Two endpoints:
 *   POST /api/seller/community/{post}/proposal-ai/draft
 *        (seller-auth + suspended-guard)
 *        → ProposalDraftResult (available:true with pitch/price/delivery, or available:false)
 *
 *   POST /api/v1/community/posts/{post}/proposals/rank
 *        (buyer-auth, post-owner only → 403 for non-owners)
 *        → ProposalRankResult (available:true with ranked list + summary, or available:false)
 *
 * Conventions:
 *   - Mirrors buyerAiService.ts / sellerAiService.ts patterns
 *   - 403 / network errors re-throw (caller handles)
 *   - available:false → callers hide gracefully (never throw on AI-off)
 */
import api from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Endpoint A — Seller proposal draft
// ─────────────────────────────────────────────────────────────────────────────

export interface PriceRange {
  min: number;
  max: number;
}

export interface ProposalDraftAvailable {
  available: true;
  pitch: string;
  suggested_price_range: PriceRange;
  suggested_delivery_days: number;
}

export interface ProposalDraftUnavailable {
  available: false;
}

export type ProposalDraftResult = ProposalDraftAvailable | ProposalDraftUnavailable;

/**
 * POST /api/seller/community/{postId}/proposal-ai/draft
 *
 * Drafts an AI proposal pitch from the brief + seller store context.
 * Returns available:false if AI is off or key is missing.
 * Re-throws 403 (suspended seller) and network errors.
 */
export async function draftProposal(postId: number): Promise<ProposalDraftResult> {
  const response = await api.post<ProposalDraftResult>(
    `/api/seller/community/${postId}/proposal-ai/draft`
  );
  return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoint B — Buyer proposal ranking
// ─────────────────────────────────────────────────────────────────────────────

export interface RankedProposal {
  response_id: number;
  fit_score: number;
  summary: string;
}

export interface ProposalRankAvailable {
  available: true;
  ranked: RankedProposal[];
  overall_summary: string;
}

export interface ProposalRankUnavailable {
  available: false;
}

export type ProposalRankResult = ProposalRankAvailable | ProposalRankUnavailable;

/**
 * POST /api/v1/community/posts/{postId}/proposals/rank
 *
 * Ranks the post's real proposals for the post owner.
 * Returns available:false if AI is off.
 * Re-throws 403 (non-owner caller) and network errors.
 */
export async function rankProposals(postId: number): Promise<ProposalRankResult> {
  const response = await api.post<ProposalRankResult>(
    `/api/v1/community/posts/${postId}/proposals/rank`
  );
  return response.data;
}
