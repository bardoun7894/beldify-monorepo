/**
 * tryonService — Virtual try-on API layer
 *
 * Free-mode endpoints:
 *   GET  /api/tryon/config                — feature flag + paid info (public)
 *   POST /api/tryon                       — submit photo + product_id → task_id
 *   GET  /api/tryon/status/{task_id}      — poll status
 *
 * Paid-mode endpoints (all authed):
 *   GET  /api/tryon/wallet                — balance (lazy-creates wallet)
 *   POST /api/tryon/topup                 — multipart: pack_index + file → 201
 *   GET  /api/tryon/topups                — top-up history
 *
 * Also handles seller AI image generation:
 *   POST /api/seller/products/{id}/ai-image  → task_id
 *   GET  /api/seller/ai-image/status/{task_id}?product_id=N  → status + image
 *
 * Resilience: config fetch errors → { enabled: false } (never throws)
 */
import api from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TryonCreditPack {
  credits: number;
  price_mad: number;
}

export interface TryonConfig {
  enabled: boolean;
  /** When true, the feature is pay-per-use via credits */
  paid?: boolean;
  /** Free credits granted on first wallet creation */
  free_credits?: number;
  /** Available top-up packs */
  packs?: TryonCreditPack[];
  /** RIB for bank transfer */
  rib?: string;
}

export interface TryonWalletResponse {
  balance: number;
}

export interface TryonTopupResponse {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  credits: number;
  price_mad: number;
}

export interface TryonTopupRecord {
  id: string;
  credits: number;
  price_mad: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export type TryonStatus = 'generating' | 'success' | 'fail';

export type TryonTopupStatus = 'pending' | 'approved' | 'rejected';

export interface TryonStatusResponse {
  status: TryonStatus;
  progress: number;
  result_url: string | null;
  error: string | null;
  /** Present when a failed task was automatically refunded */
  refunded?: boolean;
}

export interface TryonSubmitResponse {
  task_id: string;
  /** Updated wallet balance after deduction (paid mode only) */
  balance?: number;
}

export type AiImageStyle = 'studio' | 'lifestyle' | 'white_bg';

export interface AiImageSubmitPayload {
  source_image_id: number;
  style: AiImageStyle;
}

export interface AiImageSubmitResponse {
  task_id: string;
}

export interface AiImageResult {
  id: number;
  url: string;
}

export interface AiImageStatusResponse {
  status: TryonStatus;
  progress?: number;
  error: string | null;
  image?: AiImageResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// Try-on service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/tryon/config
 * Returns { enabled: false } on any error so the PDP degrades gracefully.
 */
export async function fetchTryonConfig(): Promise<TryonConfig> {
  try {
    const res = await api.get<TryonConfig>('/api/tryon/config');
    return res.data;
  } catch {
    return { enabled: false };
  }
}

/**
 * POST /api/tryon
 * Submits the photo + product_id as multipart FormData.
 * Throws on 403 (feature disabled) and 429 (daily limit).
 */
export async function submitTryon(
  productId: string | number,
  photo: File
): Promise<TryonSubmitResponse> {
  const form = new FormData();
  form.append('product_id', String(productId));
  form.append('photo', photo);

  const res = await api.post<TryonSubmitResponse>('/api/tryon', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

/**
 * GET /api/tryon/status/{task_id}
 */
export async function fetchTryonStatus(
  taskId: string
): Promise<TryonStatusResponse> {
  const res = await api.get<TryonStatusResponse>(`/api/tryon/status/${taskId}`);
  return res.data;
}

/**
 * GET /api/tryon/wallet
 * Returns the buyer's try-on credit balance.
 * Lazy-creates the wallet on first call and grants free_credits.
 * Requires: authenticated buyer (Bearer token).
 */
export async function fetchWalletBalance(): Promise<TryonWalletResponse> {
  const res = await api.get<TryonWalletResponse>('/api/tryon/wallet');
  return res.data;
}

/**
 * POST /api/tryon/topup
 * Submits a bank-transfer receipt for credit top-up.
 * @param packIndex  — zero-based index into config.packs
 * @param receiptFile — jpeg/png/webp/pdf ≤8MB
 * Requires: authenticated buyer.
 */
export async function submitTopup(
  packIndex: number,
  receiptFile: File
): Promise<TryonTopupResponse> {
  const form = new FormData();
  form.append('pack_index', String(packIndex));
  form.append('file', receiptFile);
  const res = await api.post<TryonTopupResponse>('/api/tryon/topup', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

/**
 * GET /api/tryon/topups
 * Returns the buyer's top-up history.
 * Requires: authenticated buyer.
 */
export async function fetchTopups(): Promise<TryonTopupRecord[]> {
  const res = await api.get<TryonTopupRecord[]>('/api/tryon/topups');
  return res.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seller AI image service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/seller/products/{id}/ai-image
 * Throws on 403 (disabled / not owner).
 */
export async function submitAiImage(
  productId: string | number,
  payload: AiImageSubmitPayload
): Promise<AiImageSubmitResponse> {
  const res = await api.post<AiImageSubmitResponse>(
    `/api/seller/products/${productId}/ai-image`,
    payload
  );
  return res.data;
}

/**
 * GET /api/seller/ai-image/status/{task_id}?product_id=N
 */
export async function fetchAiImageStatus(
  taskId: string,
  productId: string | number
): Promise<AiImageStatusResponse> {
  const res = await api.get<AiImageStatusResponse>(
    `/api/seller/ai-image/status/${taskId}`,
    { params: { product_id: productId } }
  );
  return res.data;
}
