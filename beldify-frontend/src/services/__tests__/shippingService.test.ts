/**
 * TDD — RED phase
 * Tests for shippingService.getMethods(subtotal).
 * Written BEFORE the implementation file exists.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/api', () => ({
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

import api from '@/lib/api';
import { shippingService, ShippingMethod } from '../shippingService';

const mockGet = api.get as ReturnType<typeof vi.fn>;

describe('shippingService.getMethods', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is exported from shippingService', () => {
    expect(typeof shippingService.getMethods).toBe('function');
  });

  it('GETs /api/shipping-methods with subtotal param', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          methods: [
            {
              id: 'standard',
              name: 'Standard Delivery',
              cost: 30,
              free_shipping_threshold: 500,
              delivery_time: '3–5 business days',
              is_free: false,
            },
          ],
        },
      },
    });

    await shippingService.getMethods(350);

    expect(mockGet).toHaveBeenCalledWith('/api/shipping-methods', {
      params: { subtotal: 350 },
    });
  });

  it('returns normalized ShippingMethod array on success', async () => {
    const apiMethod = {
      id: 'express',
      name: 'Express',
      cost: 70,
      free_shipping_threshold: null,
      delivery_time: '1–2 days',
      is_free: false,
    };
    mockGet.mockResolvedValueOnce({
      data: { success: true, data: { methods: [apiMethod] } },
    });

    const result = await shippingService.getMethods(200);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject<ShippingMethod>({
      id: 'express',
      name: 'Express',
      cost: 70,
      free_shipping_threshold: null,
      delivery_time: '1–2 days',
      is_free: false,
    });
  });

  it('returns HARDCODED_FALLBACK when the API call throws (network error)', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network Error'));

    const result = await shippingService.getMethods(200);

    // Must return at least 'standard' and 'express' fallback methods
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(2);
    const ids = result.map((m) => m.id);
    expect(ids).toContain('standard');
    expect(ids).toContain('express');
  });

  it('returns HARDCODED_FALLBACK when success=false', async () => {
    mockGet.mockResolvedValueOnce({ data: { success: false } });

    const result = await shippingService.getMethods(100);

    expect(Array.isArray(result)).toBe(true);
    const ids = result.map((m) => m.id);
    expect(ids).toContain('standard');
  });

  it('returns HARDCODED_FALLBACK when methods array is empty', async () => {
    mockGet.mockResolvedValueOnce({
      data: { success: true, data: { methods: [] } },
    });

    const result = await shippingService.getMethods(100);

    expect(result.length).toBeGreaterThan(0);
  });

  it('marks standard as free when subtotal >= free_shipping_threshold', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          methods: [
            {
              id: 'standard',
              name: 'Standard',
              cost: 0,
              free_shipping_threshold: 500,
              delivery_time: '3–5 days',
              is_free: true,
            },
          ],
        },
      },
    });

    const result = await shippingService.getMethods(600);

    expect(result[0].is_free).toBe(true);
    expect(result[0].cost).toBe(0);
  });
});
