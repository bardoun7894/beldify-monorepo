// @vitest-environment node
/**
 * TDD RED → GREEN — listingAiService
 *
 * Tests the new listing intelligence analysis endpoint.
 * Mocks the api module to avoid real HTTP calls.
 * Covers: success response (available:true), AI-off response (available:false), error paths.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// ── Exports ──────────────────────────────────────────────────────────────────

describe('listingAiService — exports', () => {
  it('exports analyzeListing function', async () => {
    const mod = await import('@/services/listingAiService');
    expect(typeof mod.analyzeListing).toBe('function');
  });

  it('exports ListingAnalysisResult type-compatible shape via runtime', async () => {
    const mod = await import('@/services/listingAiService');
    // Types are erased at runtime — just verify the function is callable
    expect(mod.analyzeListing).toBeDefined();
  });
});

// ── analyzeListing — success (available:true) ─────────────────────────────────

describe('analyzeListing — available:true response', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls POST /api/seller/listing-ai/analyze with title + description + category_id', async () => {
    const api = (await import('@/lib/api')).default;
    const mockData = {
      available: true,
      suggested_category: { id: 3, name: 'Jewelry' },
      suggested_vertical: 'jewelry',
      attributes: { material: 'Silver', style: 'Traditional' },
      quality_score: 82,
      tips: ['Add more photos', 'Be specific about material'],
      flags: [],
    };
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockData });

    const { analyzeListing } = await import('@/services/listingAiService');
    const result = await analyzeListing({
      title: 'Silver Moroccan Ring',
      description: 'Handcrafted sterling silver ring',
      category_id: 3,
    });

    expect(api.post).toHaveBeenCalledWith(
      '/api/seller/listing-ai/analyze',
      { title: 'Silver Moroccan Ring', description: 'Handcrafted sterling silver ring', category_id: 3 }
    );
    expect(result.available).toBe(true);
  });

  it('returns suggested_category with id and name', async () => {
    const api = (await import('@/lib/api')).default;
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        available: true,
        suggested_category: { id: 5, name: 'Caftans' },
        suggested_vertical: null,
        attributes: {},
        quality_score: 70,
        tips: [],
        flags: [],
      },
    });

    const { analyzeListing } = await import('@/services/listingAiService');
    const result = await analyzeListing({ title: 'Beautiful Caftan' });

    if (result.available) {
      expect(result.suggested_category?.id).toBe(5);
      expect(result.suggested_category?.name).toBe('Caftans');
    }
  });

  it('returns quality_score as number between 0 and 100', async () => {
    const api = (await import('@/lib/api')).default;
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        available: true,
        suggested_category: null,
        suggested_vertical: null,
        attributes: {},
        quality_score: 55,
        tips: ['Improve title', 'Add attributes'],
        flags: [],
      },
    });

    const { analyzeListing } = await import('@/services/listingAiService');
    const result = await analyzeListing({ title: 'Ring' });

    if (result.available) {
      expect(result.quality_score).toBe(55);
      expect(result.quality_score).toBeGreaterThanOrEqual(0);
      expect(result.quality_score).toBeLessThanOrEqual(100);
    }
  });

  it('returns tips array', async () => {
    const api = (await import('@/lib/api')).default;
    const tips = ['Add more photos', 'Include dimensions', 'Specify material'];
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        available: true,
        suggested_category: null,
        suggested_vertical: null,
        attributes: {},
        quality_score: 60,
        tips,
        flags: [],
      },
    });

    const { analyzeListing } = await import('@/services/listingAiService');
    const result = await analyzeListing({ title: 'Necklace' });

    if (result.available) {
      expect(result.tips).toEqual(tips);
    }
  });

  it('returns flags with type and message', async () => {
    const api = (await import('@/lib/api')).default;
    const flags = [
      { type: 'policy', message: 'Phone number detected in description' },
      { type: 'duplicate', message: 'Similar listing found in your store' },
    ];
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        available: true,
        suggested_category: null,
        suggested_vertical: null,
        attributes: {},
        quality_score: 40,
        tips: [],
        flags,
      },
    });

    const { analyzeListing } = await import('@/services/listingAiService');
    const result = await analyzeListing({ title: 'Ring 0612345678' });

    if (result.available) {
      expect(result.flags).toHaveLength(2);
      expect(result.flags[0].type).toBe('policy');
      expect(result.flags[1].type).toBe('duplicate');
    }
  });

  it('returns attributes as key-value record', async () => {
    const api = (await import('@/lib/api')).default;
    const attributes = { material: 'Gold', karat: '18k', style: 'Traditional' };
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        available: true,
        suggested_category: { id: 3, name: 'Jewelry' },
        suggested_vertical: 'jewelry',
        attributes,
        quality_score: 88,
        tips: [],
        flags: [],
      },
    });

    const { analyzeListing } = await import('@/services/listingAiService');
    const result = await analyzeListing({ title: 'Gold Bracelet', category_id: 3 });

    if (result.available) {
      expect(result.attributes).toEqual(attributes);
    }
  });
});

// ── analyzeListing — available:false ─────────────────────────────────────────

describe('analyzeListing — available:false response', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns available:false when AI is off or misconfigured', async () => {
    const api = (await import('@/lib/api')).default;
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { available: false },
    });

    const { analyzeListing } = await import('@/services/listingAiService');
    const result = await analyzeListing({ title: 'Any product' });

    expect(result.available).toBe(false);
  });
});

// ── analyzeListing — error handling ──────────────────────────────────────────

describe('analyzeListing — error handling', () => {
  beforeEach(() => vi.clearAllMocks());

  it('propagates 403 suspended error as-is', async () => {
    const api = (await import('@/lib/api')).default;
    const err = Object.assign(new Error('403'), {
      response: { status: 403, data: { message: 'Store suspended' } },
    });
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    const { analyzeListing } = await import('@/services/listingAiService');
    await expect(analyzeListing({ title: 'Test' })).rejects.toMatchObject({
      response: { status: 403 },
    });
  });

  it('propagates 422 validation error as-is', async () => {
    const api = (await import('@/lib/api')).default;
    const err = Object.assign(new Error('422'), {
      response: { status: 422, data: { errors: { title: ['Title is required'] } } },
    });
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    const { analyzeListing } = await import('@/services/listingAiService');
    await expect(analyzeListing({ title: '' })).rejects.toMatchObject({
      response: { status: 422 },
    });
  });
});
