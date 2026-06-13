/**
 * sellerPayoutService — Seller payout withdrawal API layer
 *
 * Endpoints:
 *   GET  /api/seller/payouts              — available balance, bank details, requests
 *   POST /api/seller/payouts {amount}     — submit a withdrawal request
 *   PUT  /api/seller/bank-details         — save/update bank account details
 *
 * Mirrors sellerCreditService.ts conventions:
 *   - import api from '@/lib/api'
 *   - async functions returning response.data
 *   - typed return values matching the locked API contract
 */
import api from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Type definitions — exact field names from the API contract
// ─────────────────────────────────────────────────────────────────────────────

export type PayoutStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface BankDetails {
  account_holder: string;
  bank_name: string;
  rib: string;
}

export interface PayoutRequest {
  id: number;
  amount: number;
  status: PayoutStatus;
  reference: string | null;
  reject_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  paid_at: string | null;
}

export interface SellerPayoutsResponse {
  available: number;
  min_amount: number;
  currency: string;
  bank_details: BankDetails | null;
  has_open_request: boolean;
  requests: PayoutRequest[];
}

export interface PayoutRequestResult {
  request: {
    id: number;
    amount: number;
    status: 'pending';
    created_at: string;
  };
}

export interface UpdateBankDetailsResult {
  bank_details: BankDetails;
}

/** Error payload returned by the backend on 422 */
export interface PayoutErrorPayload {
  error: string;
  code: 'below_min' | 'above_available' | 'no_bank_details' | 'open_request_exists';
}

// ─────────────────────────────────────────────────────────────────────────────
// Service functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/seller/payouts
 * Returns withdrawable balance, bank details, open-request flag, and history.
 */
export async function getSellerPayouts(): Promise<SellerPayoutsResponse> {
  const response = await api.get<SellerPayoutsResponse>('/api/seller/payouts');
  return response.data;
}

/**
 * POST /api/seller/payouts
 * Submits a withdrawal request for the given amount (in MAD).
 * Throws with a 422 payload on validation failure.
 */
export async function requestPayout(amount: number): Promise<PayoutRequestResult> {
  const response = await api.post<PayoutRequestResult>('/api/seller/payouts', { amount });
  return response.data;
}

/**
 * PUT /api/seller/bank-details
 * Saves or updates the seller's bank account details.
 */
export async function updateBankDetails(details: BankDetails): Promise<UpdateBankDetailsResult> {
  const response = await api.put<UpdateBankDetailsResult>('/api/seller/bank-details', details);
  return response.data;
}
