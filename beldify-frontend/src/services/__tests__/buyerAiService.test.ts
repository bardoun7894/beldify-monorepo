/**
 * buyerAiService — unit tests (RED → GREEN)
 *
 * Mocks the api module so no real HTTP calls are made.
 * Verifies:
 *  1. getReviewSummary resolves ReviewSummaryAI on 200, returns null on 204
 *  2. searchAssist resolves AssistResult and exposes fallback flag
 *  3. getSizeAdvice resolves SizeAdviceResult, throws typed errors on 422/503
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock api before importing the service ────────────────────────────────────
const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('@/lib/api', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

import {
  getReviewSummary,
  searchAssist,
  getSizeAdvice,
  NotSizedException,
  AiUnavailableException,
} from '../buyerAiService';

describe('buyerAiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. getReviewSummary ────────────────────────────────────────────────────

  describe('getReviewSummary', () => {
    it('returns ReviewSummaryAI object on HTTP 200', async () => {
      const payload = {
        summary: 'Great product',
        pros: ['Quality', 'Fast delivery'],
        cons: ['Pricey'],
        review_count: 12,
        generated_at: '2026-06-10T10:00:00Z',
        locale: 'ar',
      };
      mockGet.mockResolvedValueOnce({ status: 200, data: payload });

      const result = await getReviewSummary('42', 'ar');

      expect(mockGet).toHaveBeenCalledWith('/products/42/review-summary', {
        params: { locale: 'ar' },
      });
      expect(result).toEqual(payload);
    });

    it('returns null on HTTP 204 (no summary available)', async () => {
      mockGet.mockResolvedValueOnce({ status: 204, data: undefined });

      const result = await getReviewSummary('99', 'en');

      expect(result).toBeNull();
    });

    it('returns null on any unexpected error (graceful degrade)', async () => {
      mockGet.mockRejectedValueOnce(new Error('network error'));

      const result = await getReviewSummary('1', 'fr');

      expect(result).toBeNull();
    });
  });

  // ── 2. searchAssist ────────────────────────────────────────────────────────

  describe('searchAssist', () => {
    it('returns AssistResult with filters and reply on 200', async () => {
      const payload = {
        filters: { keywords: 'caftan', category_id: 3, price_min: null, price_max: 800 },
        reply: 'Showing caftans under 800 MAD',
        fallback: false,
      };
      mockPost.mockResolvedValueOnce({ status: 200, data: payload });

      const result = await searchAssist('caftan under 800 dh', 'ar');

      expect(mockPost).toHaveBeenCalledWith('/search/assist', {
        query: 'caftan under 800 dh',
        locale: 'ar',
      });
      expect(result).toEqual(payload);
      expect(result.fallback).toBe(false);
    });

    it('returns fallback=true when AI could not parse the query', async () => {
      const payload = {
        filters: { keywords: 'random', category_id: null, price_min: null, price_max: null },
        reply: null,
        fallback: true,
      };
      mockPost.mockResolvedValueOnce({ status: 200, data: payload });

      const result = await searchAssist('random', 'en');

      expect(result.fallback).toBe(true);
    });

    it('returns fallback=true on network error (graceful degrade)', async () => {
      mockPost.mockRejectedValueOnce(new Error('timeout'));

      const result = await searchAssist('anything', 'ma');

      expect(result.fallback).toBe(true);
    });
  });

  // ── 3. getSizeAdvice ───────────────────────────────────────────────────────

  describe('getSizeAdvice', () => {
    it('returns SizeAdviceResult on 200', async () => {
      const payload = {
        recommended_size: 'L',
        confidence: 'high' as const,
        note: 'Based on your measurements, L fits best.',
      };
      mockPost.mockResolvedValueOnce({ status: 200, data: payload });

      const result = await getSizeAdvice('5', {
        height_cm: 175,
        weight_kg: 75,
        fit_preference: 'regular',
        usual_size: 'M',
      });

      expect(mockPost).toHaveBeenCalledWith('/products/5/size-advice', {
        height_cm: 175,
        weight_kg: 75,
        fit_preference: 'regular',
        usual_size: 'M',
      });
      expect(result).toEqual(payload);
    });

    it('throws NotSizedException on 422', async () => {
      const axiosErr = {
        response: { status: 422, data: { error: 'not_sized' } },
      };
      mockPost.mockRejectedValueOnce(axiosErr);

      await expect(
        getSizeAdvice('99', { height_cm: 170, weight_kg: 65 })
      ).rejects.toThrow(NotSizedException);
    });

    it('throws AiUnavailableException on 503', async () => {
      const axiosErr = {
        response: { status: 503, data: { error: 'ai_unavailable' } },
      };
      mockPost.mockRejectedValueOnce(axiosErr);

      await expect(
        getSizeAdvice('99', { height_cm: 170, weight_kg: 65 })
      ).rejects.toThrow(AiUnavailableException);
    });
  });
});
