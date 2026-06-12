/**
 * tryonService — Virtual try-on API layer
 *
 * Endpoints:
 *   GET  /api/tryon/config                — feature flag (public)
 *   POST /api/tryon                       — submit photo + product_id → task_id
 *   GET  /api/tryon/status/{task_id}      — poll status
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

export interface TryonConfig {
  enabled: boolean;
}

export type TryonStatus = 'generating' | 'success' | 'fail';

export interface TryonStatusResponse {
  status: TryonStatus;
  progress: number;
  result_url: string | null;
  error: string | null;
}

export interface TryonSubmitResponse {
  task_id: string;
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
