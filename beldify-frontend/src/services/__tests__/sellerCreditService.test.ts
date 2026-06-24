// @vitest-environment node
/**
 * TDD RED → GREEN — sellerCreditService
 *
 * Tests typed functions for the 4 credit endpoints.
 * Mocks the api module to avoid real HTTP calls.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock api before importing the service
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// ── Types should be importable (type test) ──────────────────────────────────
describe('sellerCreditService — type exports', () => {
  it('exports expected type names without throwing', async () => {
    // dynamic import so the mock above is already in place
    const mod = await import('@/services/sellerCreditService');
    expect(typeof mod.getSellerCredits).toBe('function');
    expect(typeof mod.getSellerCreditPacks).toBe('function');
    expect(typeof mod.purchaseCredits).toBe('function');
    expect(typeof mod.getSellerCreditPurchases).toBe('function');
  });
});

// ── getSellerCredits ─────────────────────────────────────────────────────────
describe('getSellerCredits', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls GET /api/seller/credits and returns the response data', async () => {
    const api = (await import('@/lib/api')).default;
    const mockData = {
      balance: 14,
      costs: { listing_writer: 2, store_creator: 2, translate_listing: 1, marketing_copy: 1 },
      transactions: [],
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockData });

    const { getSellerCredits } = await import('@/services/sellerCreditService');
    const result = await getSellerCredits();

    expect(api.get).toHaveBeenCalledWith('/api/seller/credits');
    expect(result).toEqual(mockData);
  });

  it('propagates errors from the API', async () => {
    const api = (await import('@/lib/api')).default;
    (api.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const { getSellerCredits } = await import('@/services/sellerCreditService');
    await expect(getSellerCredits()).rejects.toThrow('Network error');
  });
});

// ── getSellerCreditPacks ─────────────────────────────────────────────────────
describe('getSellerCreditPacks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls GET /api/seller/credits/packs and returns the response data', async () => {
    const api = (await import('@/lib/api')).default;
    const mockData = {
      packs: [{ id: 1, name: 'Starter', credits: 10, price_mad: 50 }],
      bank_details: 'RIB: 1234567890',
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockData });

    const { getSellerCreditPacks } = await import('@/services/sellerCreditService');
    const result = await getSellerCreditPacks();

    expect(api.get).toHaveBeenCalledWith('/api/seller/credits/packs');
    expect(result.packs).toHaveLength(1);
    expect(result.bank_details).toBe('RIB: 1234567890');
  });
});

// ── purchaseCredits ──────────────────────────────────────────────────────────
describe('purchaseCredits', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls POST /api/seller/credits/purchase with multipart FormData', async () => {
    const api = (await import('@/lib/api')).default;
    const mockResponse = {
      purchase: { id: 1, pack_id: 1, credits: 10, price_mad: 50, status: 'pending', created_at: '2026-06-10T00:00:00Z' },
    };
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockResponse });

    const { purchaseCredits } = await import('@/services/sellerCreditService');
    const file = new File(['fake'], 'receipt.jpg', { type: 'image/jpeg' });
    const result = await purchaseCredits({ pack_id: 1, receipt: file, reference: 'REF123' });

    expect(api.post).toHaveBeenCalledWith(
      '/api/seller/credits/purchase',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
    );
    expect(result.purchase.status).toBe('pending');
  });

  it('sends optional reference only when provided', async () => {
    const api = (await import('@/lib/api')).default;
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { purchase: { id: 2, pack_id: 1, credits: 10, price_mad: 50, status: 'pending', created_at: '2026-06-10T00:00:00Z' } },
    });

    const { purchaseCredits } = await import('@/services/sellerCreditService');
    const file = new File(['fake'], 'receipt.png', { type: 'image/png' });
    await purchaseCredits({ pack_id: 1, receipt: file }); // no reference

    const calledFormData = (api.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as FormData;
    expect(calledFormData.get('reference')).toBeNull();
  });
});

// ── getSellerCreditPurchases ─────────────────────────────────────────────────
describe('getSellerCreditPurchases', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls GET /api/seller/credits/purchases and returns purchases array', async () => {
    const api = (await import('@/lib/api')).default;
    const mockData = {
      purchases: [
        {
          id: 1,
          pack_name: 'Starter',
          credits: 10,
          price_mad: 50,
          status: 'approved',
          notes: null,
          created_at: '2026-06-01T00:00:00Z',
          reviewed_at: '2026-06-02T00:00:00Z',
        },
      ],
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockData });

    const { getSellerCreditPurchases } = await import('@/services/sellerCreditService');
    const result = await getSellerCreditPurchases();

    expect(api.get).toHaveBeenCalledWith('/api/seller/credits/purchases');
    expect(result.purchases).toHaveLength(1);
    expect(result.purchases[0].status).toBe('approved');
  });
});
