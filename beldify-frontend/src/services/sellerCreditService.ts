/**
 * sellerCreditService — AI seller credit billing API layer
 *
 * Endpoints:
 *   GET  /api/seller/credits          — balance, costs, transactions
 *   GET  /api/seller/credits/packs    — available packs + bank details
 *   POST /api/seller/credits/purchase — multipart: pack_id + receipt file + optional reference
 *   GET  /api/seller/credits/purchases — purchase history
 *
 * Mirrors sellerDashboardService.ts conventions:
 *   - import api from '@/lib/api'
 *   - async functions returning response.data
 *   - typed return values matching backend contracts
 */
import api from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Type definitions — exact field names from API contract
// ─────────────────────────────────────────────────────────────────────────────

export type CreditTransactionType =
  | 'purchase'
  | 'bonus'
  | 'consumption'
  | 'refund'
  | 'adjustment';

export interface CreditTransaction {
  id: number;
  type: CreditTransactionType;
  /** Signed integer: positive = credit added, negative = credit consumed */
  amount: number;
  balance_after: number;
  feature: string | null;
  created_at: string;
}

export interface FeatureCosts {
  listing_writer: number;
  store_creator: number;
  translate_listing: number;
  marketing_copy: number;
}

export interface SellerCreditsResponse {
  balance: number;
  costs: FeatureCosts;
  transactions: CreditTransaction[];
}

export interface CreditPack {
  id: number;
  name: string;
  credits: number;
  price_mad: number;
}

export interface SellerCreditPacksResponse {
  packs: CreditPack[];
  /** RIB text shown to seller; may be empty string when not yet configured */
  bank_details: string;
}

export type PurchaseStatus = 'pending' | 'approved' | 'rejected';

export interface CreditPurchaseRecord {
  id: number;
  pack_name: string;
  credits: number;
  price_mad: number;
  status: PurchaseStatus;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface SellerCreditPurchasesResponse {
  purchases: CreditPurchaseRecord[];
}

export interface PurchaseCreditsPayload {
  pack_id: number;
  receipt: File;
  reference?: string;
}

export interface PurchaseCreditsResult {
  purchase: {
    id: number;
    pack_id: number;
    credits: number;
    price_mad: number;
    status: PurchaseStatus;
    created_at: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Service functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/seller/credits
 * Returns current balance, per-feature costs, and recent transactions.
 */
export async function getSellerCredits(): Promise<SellerCreditsResponse> {
  const response = await api.get<SellerCreditsResponse>('/api/seller/credits');
  return response.data;
}

/**
 * GET /api/seller/credits/packs
 * Returns active credit packs and the bank_details RIB string.
 */
export async function getSellerCreditPacks(): Promise<SellerCreditPacksResponse> {
  const response = await api.get<SellerCreditPacksResponse>('/api/seller/credits/packs');
  return response.data;
}

/**
 * POST /api/seller/credits/purchase
 * Submits a purchase request with a receipt file (multipart/form-data).
 * reference is optional — only appended to FormData when provided.
 */
export async function purchaseCredits(
  payload: PurchaseCreditsPayload
): Promise<PurchaseCreditsResult> {
  const form = new FormData();
  form.append('pack_id', String(payload.pack_id));
  form.append('receipt', payload.receipt);
  if (payload.reference) {
    form.append('reference', payload.reference);
  }

  const response = await api.post<PurchaseCreditsResult>(
    '/api/seller/credits/purchase',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
}

/**
 * GET /api/seller/credits/purchases
 * Returns the seller's purchase history with status and admin notes.
 */
export async function getSellerCreditPurchases(): Promise<SellerCreditPurchasesResponse> {
  const response = await api.get<SellerCreditPurchasesResponse>(
    '/api/seller/credits/purchases'
  );
  return response.data;
}
