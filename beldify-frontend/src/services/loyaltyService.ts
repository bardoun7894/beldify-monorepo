/**
 * loyaltyService — buyer-facing loyalty points endpoints
 *
 *   GET  /api/loyalty
 *        → { status, data: LoyaltyBalance }
 *
 *   POST /api/loyalty/preview  body { points, subtotal }
 *        → { status, data: LoyaltyPreview }
 *
 * Conventions:
 *   - Mirrors buyerAiService.ts patterns (import api from '@/lib/api')
 *   - getBalance() degrades gracefully: any error → null (caller hides the widget)
 *   - previewRedemption() throws a friendly Error on failure (caller shows inline message)
 */
import api from '@/lib/api';
import logger from '@/utils/consoleLogger';

export interface LoyaltyBalance {
  points_balance: number;
  earn_rate: number;
  redeem_value: number;
  min_redeem_points: number;
  max_redeem_value: number;
}

export interface LoyaltyPreview {
  points: number;
  mad_value: number;
  allowed: boolean;
  reason?: string | null;
}

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

class LoyaltyService {
  /**
   * GET /api/loyalty
   * Returns the buyer's current loyalty balance/config, or null on any error
   * (network, 401, 5xx) so the caller can hide the redemption widget silently.
   */
  async getBalance(): Promise<LoyaltyBalance | null> {
    try {
      const response = await api.get<ApiEnvelope<LoyaltyBalance>>('/loyalty');
      return response.data?.data ?? null;
    } catch (error) {
      logger.error('Error fetching loyalty balance:', error);
      return null;
    }
  }

  /**
   * POST /api/loyalty/preview
   * Previews the MAD credit for a given points redemption against a subtotal.
   * Throws on failure — caller should catch and show an inline error.
   */
  async previewRedemption(points: number, subtotal: number): Promise<LoyaltyPreview> {
    try {
      const response = await api.post<ApiEnvelope<LoyaltyPreview>>('/loyalty/preview', {
        points,
        subtotal,
      });
      return response.data.data;
    } catch (error) {
      logger.error('Error previewing loyalty redemption:', error);
      throw error instanceof Error ? error : new Error('Failed to preview loyalty redemption');
    }
  }
}

export const loyaltyService = new LoyaltyService();
export default loyaltyService;
