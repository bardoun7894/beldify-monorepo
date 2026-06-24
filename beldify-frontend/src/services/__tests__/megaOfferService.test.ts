/**
 * TDD RED phase — megaOfferService
 * Tests written BEFORE any implementation to verify correct endpoints + return shapes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../axiosInstance', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import axiosInstance from '../axiosInstance';
import { megaOfferService } from '../megaOfferService';

const mockGet = axiosInstance.get as ReturnType<typeof vi.fn>;

describe('megaOfferService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMegaOffers', () => {
    it('GETs /api/products/mega-offers', async () => {
      mockGet.mockResolvedValueOnce({ data: { success: true, data: [] } });

      await megaOfferService.getMegaOffers();

      expect(mockGet).toHaveBeenCalledTimes(1);
      const url: string = mockGet.mock.calls[0][0];
      expect(url).toBe('/api/products/mega-offers');
    });

    it('returns the data array on success', async () => {
      const fakeOffer = { id: 1, title: 'Eid Sale', featured_products: [] };
      mockGet.mockResolvedValueOnce({ data: { success: true, data: [fakeOffer] } });

      const result = await megaOfferService.getMegaOffers();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('returns empty array when API returns empty data', async () => {
      mockGet.mockResolvedValueOnce({ data: { success: true, data: [] } });

      const result = await megaOfferService.getMegaOffers();

      expect(result).toEqual([]);
    });

    it('throws on HTTP error (no silent swallow)', async () => {
      const err = new Error('Network Error');
      mockGet.mockRejectedValueOnce(err);

      await expect(megaOfferService.getMegaOffers()).rejects.toThrow();
    });
  });
});
