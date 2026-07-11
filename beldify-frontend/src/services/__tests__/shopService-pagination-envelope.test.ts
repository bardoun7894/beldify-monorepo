/**
 * Regression — prod /shops rendered "no shops found" although GET /api/shops
 * returned 2 stores: the backend envelopes page info as `pagination`, but
 * getShops read `response.data.meta.*` → TypeError → caught → empty state.
 * getShops must accept both `pagination` (current) and `meta` (legacy).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const getMock = vi.fn();
vi.mock('@/services/axiosInstance', () => ({
  default: { get: (...args: unknown[]) => getMock(...args) },
}));
vi.mock('@/utils/consoleLogger', () => ({
  default: { error: vi.fn(), log: vi.fn(), warn: vi.fn() },
}));

import { shopService } from '@/services/shopService';

const SHOPS = [{ id: 1, name: 'Fatima Traditional Crafts' }, { id: 3, name: 'Marrakech Premium Designs' }];

describe('shopService.getShops envelope handling', () => {
  beforeEach(() => getMock.mockReset());

  it('parses the current backend envelope ({ data, pagination })', async () => {
    getMock.mockResolvedValue({
      data: {
        status: 'success',
        data: SHOPS,
        pagination: { current_page: 1, last_page: 1, per_page: 12, total: 2 },
      },
    });
    const res = await shopService.getShops({ page: 1 });
    expect(res.error).toBeNull();
    expect(res.data?.shops).toHaveLength(2);
    expect(res.data?.pagination.total).toBe(2);
  });

  it('still parses the legacy { data, meta } envelope', async () => {
    getMock.mockResolvedValue({
      data: {
        data: SHOPS,
        meta: { current_page: 2, last_page: 3, per_page: 12, total: 30 },
      },
    });
    const res = await shopService.getShops({ page: 2 });
    expect(res.error).toBeNull();
    expect(res.data?.pagination.current_page).toBe(2);
    expect(res.data?.pagination.total).toBe(30);
  });

  it('does not error out when page info is missing entirely', async () => {
    getMock.mockResolvedValue({ data: { data: SHOPS } });
    const res = await shopService.getShops({});
    expect(res.error).toBeNull();
    expect(res.data?.shops).toHaveLength(2);
    expect(res.data?.pagination.current_page).toBe(1);
  });
});
