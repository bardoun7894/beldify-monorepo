/**
 * listingAiService — Listing Intelligence AI API layer
 *
 * Endpoint:
 *   POST /api/seller/listing-ai/analyze
 *   Request:  { title (required, ≤200), description? (≤5000), category_id? }
 *   Response (available:true):
 *     { available:true, suggested_category:{id,name}|null,
 *       suggested_vertical:string|null, attributes:{key:value},
 *       quality_score:0-100, tips:string[], flags:[{type,message}] }
 *   Response (AI off/malformed): { available:false }
 *   Error: 403 (suspended), 422 (validation), 401 (unauthenticated)
 *
 * Conventions: mirrors sellerAiService.ts (import api from '@/lib/api')
 * FR6: free endpoint — no credit charging; propagates 403/422 as-is.
 */
import api from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Type definitions — exact field names from API contract
// ─────────────────────────────────────────────────────────────────────────────

export interface SuggestedCategory {
  id: number;
  name: string;
}

export type FlagType = 'policy' | 'duplicate';

export interface ListingFlag {
  type: FlagType;
  message: string;
}

export interface ListingAnalysisAvailable {
  available: true;
  suggested_category: SuggestedCategory | null;
  suggested_vertical: string | null;
  /**
   * Key-value attribute suggestions. The API contract specifies string values;
   * however, the AI model may return arrays/objects before server-side casting
   * is enforced (backend P1 #3). The ListingAiAssistant component coerces values
   * defensively — do not assume all values are strings at runtime.
   */
  attributes: Record<string, unknown>;
  quality_score: number;
  tips: string[];
  flags: ListingFlag[];
}

export interface ListingAnalysisUnavailable {
  available: false;
}

export type ListingAnalysisResult = ListingAnalysisAvailable | ListingAnalysisUnavailable;

export interface AnalyzeListingPayload {
  /** Required. Product title (≤200 characters). */
  title: string;
  /** Optional. Product description (≤5000 characters). */
  description?: string;
  /** Optional. Category id hint for the analysis. */
  category_id?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/seller/listing-ai/analyze
 *
 * Analyzes a listing draft and returns AI suggestions.
 *
 * - On success (AI enabled): returns ListingAnalysisAvailable
 * - On AI off/misconfigured: returns ListingAnalysisUnavailable { available:false }
 * - On 403 (suspended) / 422 (validation) / 401: propagates the error as-is
 *   — caller must handle these (same pattern as sellerAiService).
 */
export async function analyzeListing(
  payload: AnalyzeListingPayload
): Promise<ListingAnalysisResult> {
  const body: Record<string, unknown> = { title: payload.title };
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.category_id !== undefined) body.category_id = payload.category_id;

  const response = await api.post<ListingAnalysisResult>(
    '/api/seller/listing-ai/analyze',
    body
  );
  return response.data;
}
