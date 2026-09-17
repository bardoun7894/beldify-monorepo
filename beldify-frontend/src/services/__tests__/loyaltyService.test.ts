/**
 * loyaltyService — unit tests (RED → GREEN)
 *
 * Mocks @/lib/api so no real HTTP calls are made. Verifies:
 *  1. getBalance() calls GET /loyalty and returns the typed balance payload
 *  2. getBalance() returns null on any error (graceful degrade)
 *  3. previewRedemption() calls POST /loyalty/preview with points+subtotal
 *  4. previewRedemption() propagates a friendly error on failure
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('@/lib/api', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { loyaltyService } from '../loyaltyService';

describe('loyaltyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBalance', () => {
    it('returns the loyalty balance payload on 200', async () => {
      const payload = {
        points_balance: 500,
        earn_rate: 1.0,
        redeem_value: 0.1,
        min_redeem_points: 100,
        max_redeem_value: 200,
      };
      mockGet.mockResolvedValueOnce({ data: { status: 'success', data: payload } });

      const result = await loyaltyService.getBalance();

      expect(mockGet).toHaveBeenCalledWith('/loyalty');
      expect(result).toEqual(payload);
    });

    it('returns null on any error (graceful degrade)', async () => {
      mockGet.mockRejectedValueOnce(new Error('network error'));

      const result = await loyaltyService.getBalance();

      expect(result).toBeNull();
    });
  });

  describe('previewRedemption', () => {
    it('posts points+subtotal and returns the preview payload', async () => {
      const payload = { points: 100, mad_value: 10, allowed: true, reason: null };
      mockPost.mockResolvedValueOnce({ data: { status: 'success', data: payload } });

      const result = await loyaltyService.previewRedemption(100, 500);

      expect(mockPost).toHaveBeenCalledWith('/loyalty/preview', {
        points: 100,
        subtotal: 500,
      });
      expect(result).toEqual(payload);
    });

    it('throws a friendly error when the preview call fails', async () => {
      mockPost.mockRejectedValueOnce(new Error('boom'));

      await expect(loyaltyService.previewRedemption(100, 500)).rejects.toThrow();
    });
  });
});
