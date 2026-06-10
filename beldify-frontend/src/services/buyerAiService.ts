/**
 * buyerAiService — buyer-facing AI endpoints
 *
 * Three endpoints (all public, no credits):
 *   GET  /api/products/{id}/review-summary?locale=xx
 *        → 200 ReviewSummaryAI | 204 (no summary yet — hide card entirely)
 *
 *   POST /api/search/assist
 *        → 200 AssistResult (fallback=true = plain keyword search, never error)
 *
 *   POST /api/products/{id}/size-advice
 *        → 200 SizeAdviceResult
 *        → 422 { error:'not_sized' }  → throws NotSizedException
 *        → 503 { error:'ai_unavailable' } → throws AiUnavailableException
 *
 * Conventions:
 *   - Mirrors sellerAiService.ts patterns (import api from '@/lib/api')
 *   - Every endpoint degrades gracefully: network errors return null / fallback
 *     instead of crashing the storefront.
 */
import api from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Shared locale type (mirrors sellerAiService.ts)
// ─────────────────────────────────────────────────────────────────────────────

export type BuyerLocale = 'ar' | 'ma' | 'fr' | 'en' | 'es';

// ─────────────────────────────────────────────────────────────────────────────
// Typed errors
// ─────────────────────────────────────────────────────────────────────────────

/** Thrown when product has no size dimension (422 not_sized). Hide the entry point. */
export class NotSizedException extends Error {
  constructor() {
    super('not_sized');
    this.name = 'NotSizedException';
  }
}

/** Thrown when the AI is temporarily down (503 ai_unavailable). Show fallback. */
export class AiUnavailableException extends Error {
  constructor() {
    super('ai_unavailable');
    this.name = 'AiUnavailableException';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Review summary
// ─────────────────────────────────────────────────────────────────────────────

export interface ReviewSummaryAI {
  summary: string;
  pros: string[];
  cons: string[];
  review_count: number;
  generated_at: string;
  locale: string;
}

/**
 * GET /api/products/{id}/review-summary?locale=xx
 *
 * Returns the AI-generated review summary for a product.
 * Returns null on 204 (too few reviews), non-200, or any network error.
 * The caller must hide the card on null — no skeleton flash.
 */
export async function getReviewSummary(
  productId: string,
  locale: string
): Promise<ReviewSummaryAI | null> {
  try {
    const response = await api.get<ReviewSummaryAI>(
      `/products/${productId}/review-summary`,
      { params: { locale } }
    );
    if (response.status === 204 || !response.data) return null;
    return response.data;
  } catch {
    // Graceful degrade: any error (network, 5xx, 429) → hide the card
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Search assist
// ─────────────────────────────────────────────────────────────────────────────

export interface AssistFilters {
  keywords: string;
  category_id: number | null;
  price_min: number | null;
  price_max: number | null;
}

export interface AssistResult {
  filters: AssistFilters;
  reply: string | null;
  fallback: boolean;
}

/** Fallback result used when the API call fails — runs plain keyword search. */
const FALLBACK_ASSIST: AssistResult = {
  filters: { keywords: '', category_id: null, price_min: null, price_max: null },
  reply: null,
  fallback: true,
};

/**
 * POST /api/search/assist
 *
 * Converts a natural-language query into structured search filters.
 * Always resolves (never throws) — on error returns fallback=true so the
 * caller runs a plain keyword search transparently.
 */
export async function searchAssist(
  query: string,
  locale: string
): Promise<AssistResult> {
  try {
    const response = await api.post<AssistResult>('/search/assist', {
      query,
      locale,
    });
    return response.data;
  } catch {
    return { ...FALLBACK_ASSIST, filters: { ...FALLBACK_ASSIST.filters, keywords: query } };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Size advisor
// ─────────────────────────────────────────────────────────────────────────────

export type FitPreference = 'slim' | 'regular' | 'loose';
export type SizeConfidence = 'high' | 'medium' | 'low';

export interface SizeAdvicePayload {
  height_cm: number;
  weight_kg: number;
  fit_preference?: FitPreference;
  usual_size?: string;
}

export interface SizeAdviceResult {
  recommended_size: string;
  confidence: SizeConfidence;
  note: string;
}

/**
 * POST /api/products/{id}/size-advice
 *
 * Returns size recommendation.
 * Throws NotSizedException on 422 (product has no size dimension — hide the entry point).
 * Throws AiUnavailableException on 503 (show friendly fallback in sheet).
 */
export async function getSizeAdvice(
  productId: string,
  payload: SizeAdvicePayload
): Promise<SizeAdviceResult> {
  try {
    const response = await api.post<SizeAdviceResult>(
      `/products/${productId}/size-advice`,
      payload
    );
    return response.data;
  } catch (err) {
    const axiosErr = err as { response?: { status?: number } };
    if (axiosErr?.response?.status === 422) throw new NotSizedException();
    if (axiosErr?.response?.status === 503) throw new AiUnavailableException();
    throw err;
  }
}
