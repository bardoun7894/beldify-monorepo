/**
 * sellerAiService — AI tools API layer for sellers
 *
 * Endpoints:
 *   POST /api/seller/ai/listing          — AI listing writer (en + ar + other locales)
 *   POST /api/seller/ai/store-profile    — AI store profile generator
 *   POST /api/seller/ai/translate-listing — Auto-translate listing to all 5 locales
 *   POST /api/seller/ai/marketing        — Marketing copy (WhatsApp + social)
 *
 * Conventions:
 *   - Follows sellerCreditService.ts patterns (import api from '@/lib/api')
 *   - 402 responses → InsufficientCreditsError with balance/cost/feature fields
 *   - 502 responses → re-thrown as-is (credits auto-refunded server-side)
 */
import api from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Typed 402 error
// ─────────────────────────────────────────────────────────────────────────────

export class InsufficientCreditsError extends Error {
  readonly balance: number;
  readonly cost: number;
  readonly feature: string;

  constructor(balance: number, cost: number, feature: string) {
    super('insufficient_credits');
    this.name = 'InsufficientCreditsError';
    this.balance = balance;
    this.cost = cost;
    this.feature = feature;
  }
}

/** Intercept 402 errors and re-throw as InsufficientCreditsError. */
function handle402(err: unknown): never {
  const axiosErr = err as { response?: { status?: number; data?: Record<string, unknown> } };
  if (axiosErr?.response?.status === 402) {
    const d = axiosErr.response.data ?? {};
    throw new InsufficientCreditsError(
      (d.balance as number) ?? 0,
      (d.cost as number) ?? 0,
      (d.feature as string) ?? '',
    );
  }
  throw err;
}

// ─────────────────────────────────────────────────────────────────────────────
// Listing writer
// ─────────────────────────────────────────────────────────────────────────────

export type SupportedLocale = 'ar' | 'ma' | 'fr' | 'en' | 'es';

export interface ListingLocaleResult {
  title: string;
  description: string;
  tags: string[];
}

export interface GenerateListingPayload {
  product_name: string;
  category_id?: number | string;
  keywords?: string;
  locales: SupportedLocale[];
}

export interface GenerateListingResponse {
  credits_charged: number;
  balance: number;
  result: Partial<Record<SupportedLocale, ListingLocaleResult>>;
}

/**
 * POST /api/seller/ai/listing
 * Generates locale-specific listing copy (title, description, tags).
 * Throws InsufficientCreditsError on 402.
 */
export async function generateListing(
  payload: GenerateListingPayload
): Promise<GenerateListingResponse> {
  try {
    const response = await api.post<GenerateListingResponse>('/api/seller/ai/listing', payload);
    return response.data;
  } catch (err) {
    return handle402(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Store profile generator
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateStoreProfilePayload {
  what_you_sell: string;
  city?: string;
  style?: string;
  locale: SupportedLocale;
}

export interface StoreProfileResult {
  name_ideas: string[];
  slogan: string;
  description: string;
  return_policy: string;
  shipping_policy: string;
}

export interface GenerateStoreProfileResponse {
  credits_charged: number;
  balance: number;
  result: StoreProfileResult;
}

/**
 * POST /api/seller/ai/store-profile
 * Generates store name ideas, slogan, description, and policies.
 * Throws InsufficientCreditsError on 402.
 */
export async function generateStoreProfile(
  payload: GenerateStoreProfilePayload
): Promise<GenerateStoreProfileResponse> {
  try {
    const response = await api.post<GenerateStoreProfileResponse>(
      '/api/seller/ai/store-profile',
      payload
    );
    return response.data;
  } catch (err) {
    return handle402(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Listing auto-translate
// ─────────────────────────────────────────────────────────────────────────────

export interface TranslateListingByText {
  name: string;
  description?: string;
}

export interface TranslateListingByProductId {
  product_id: number;
}

export type TranslateListingPayload = TranslateListingByText | TranslateListingByProductId;

export interface TranslateLocaleResult {
  name: string;
  description?: string;
}

export interface TranslateListingResponse {
  credits_charged: number;
  balance: number;
  result: Partial<Record<SupportedLocale, TranslateLocaleResult>>;
}

/**
 * POST /api/seller/ai/translate-listing
 * Accepts {name, description?} or {product_id}.
 * Returns translations for all 5 locales.
 * Throws InsufficientCreditsError on 402.
 */
export async function translateListing(
  payload: TranslateListingPayload
): Promise<TranslateListingResponse> {
  try {
    const response = await api.post<TranslateListingResponse>(
      '/api/seller/ai/translate-listing',
      payload
    );
    return response.data;
  } catch (err) {
    return handle402(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Marketing copy
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateMarketingPayload {
  product_id: number;
}

export interface MarketingResult {
  whatsapp_message: string;
  social_caption: string;
  product_url: string;
}

export interface GenerateMarketingResponse {
  credits_charged: number;
  balance: number;
  result: MarketingResult;
}

/**
 * POST /api/seller/ai/marketing
 * Generates WhatsApp message + social caption for a product.
 * Never includes seller phone (WhatsApp-never-checkout rule).
 * Throws InsufficientCreditsError on 402.
 */
export async function generateMarketing(
  payload: GenerateMarketingPayload
): Promise<GenerateMarketingResponse> {
  try {
    const response = await api.post<GenerateMarketingResponse>('/api/seller/ai/marketing', payload);
    return response.data;
  } catch (err) {
    return handle402(err);
  }
}
