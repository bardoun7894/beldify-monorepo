// @vitest-environment node
/**
 * TDD RED → GREEN — sellerAiService
 *
 * Tests typed functions for the 4 AI endpoints.
 * Mocks the api module to avoid real HTTP calls.
 * 402 payloads must be surfaced in a typed way.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock api before importing the service
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// ── Type exports ─────────────────────────────────────────────────────────────

describe('sellerAiService — exports', () => {
  it('exports all 4 endpoint functions', async () => {
    const mod = await import('@/services/sellerAiService');
    expect(typeof mod.generateListing).toBe('function');
    expect(typeof mod.generateStoreProfile).toBe('function');
    expect(typeof mod.translateListing).toBe('function');
    expect(typeof mod.generateMarketing).toBe('function');
  });

  it('exports InsufficientCreditsError class', async () => {
    const mod = await import('@/services/sellerAiService');
    expect(typeof mod.InsufficientCreditsError).toBe('function');
  });
});

// ── generateListing ──────────────────────────────────────────────────────────

describe('generateListing', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls POST /api/seller/ai/listing and returns data', async () => {
    const api = (await import('@/lib/api')).default;
    const mockData = {
      credits_charged: 2,
      balance: 8,
      result: {
        en: { title: 'Royal Caftan', description: 'A beautiful caftan', tags: ['moroccan', 'caftan'] },
        ar: { title: 'قفطان ملكي', description: 'قفطان جميل', tags: ['مغربي', 'قفطان'] },
      },
    };
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockData });

    const { generateListing } = await import('@/services/sellerAiService');
    const result = await generateListing({
      product_name: 'Royal Caftan',
      category_id: 1,
      keywords: 'moroccan, caftan, royal',
      locales: ['en', 'ar'],
    });

    expect(api.post).toHaveBeenCalledWith('/api/seller/ai/listing', {
      product_name: 'Royal Caftan',
      category_id: 1,
      keywords: 'moroccan, caftan, royal',
      locales: ['en', 'ar'],
    });
    expect(result.credits_charged).toBe(2);
    expect(result.balance).toBe(8);
    expect(result.result.en!.title).toBe('Royal Caftan');
  });

  it('throws InsufficientCreditsError on 402 response', async () => {
    const api = (await import('@/lib/api')).default;
    const err = Object.assign(new Error('402'), {
      response: {
        status: 402,
        data: { error: 'insufficient_credits', balance: 1, cost: 2, feature: 'listing_writer' },
      },
    });
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    const { generateListing, InsufficientCreditsError } = await import('@/services/sellerAiService');
    await expect(
      generateListing({ product_name: 'Test', locales: ['en'] })
    ).rejects.toThrow(InsufficientCreditsError);
  });

  it('throws InsufficientCreditsError with balance/cost/feature fields from 402', async () => {
    const api = (await import('@/lib/api')).default;
    const err = Object.assign(new Error('402'), {
      response: {
        status: 402,
        data: { error: 'insufficient_credits', balance: 3, cost: 5, feature: 'listing_writer' },
      },
    });
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    const { generateListing, InsufficientCreditsError } = await import('@/services/sellerAiService');
    try {
      await generateListing({ product_name: 'Test', locales: ['en'] });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(InsufficientCreditsError);
      const credErr = e as InstanceType<typeof InsufficientCreditsError>;
      expect(credErr.balance).toBe(3);
      expect(credErr.cost).toBe(5);
      expect(credErr.feature).toBe('listing_writer');
    }
  });

  it('propagates non-402 errors as-is', async () => {
    const api = (await import('@/lib/api')).default;
    const err = Object.assign(new Error('502'), {
      response: { status: 502, data: { error: 'ai_failed' } },
    });
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    const { generateListing, InsufficientCreditsError } = await import('@/services/sellerAiService');
    await expect(
      generateListing({ product_name: 'Test', locales: ['en'] })
    ).rejects.not.toThrow(InsufficientCreditsError);
  });
});

// ── generateStoreProfile ─────────────────────────────────────────────────────

describe('generateStoreProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls POST /api/seller/ai/store-profile and returns data', async () => {
    const api = (await import('@/lib/api')).default;
    const mockData = {
      credits_charged: 2,
      balance: 6,
      result: {
        name_ideas: ['Atlas Bijoux', 'Sahara Gold'],
        slogan: 'Crafted with love in Morocco',
        description: 'A beautiful jewelry store',
        return_policy: 'Returns within 14 days',
        shipping_policy: 'Ships within 3-5 days',
      },
    };
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockData });

    const { generateStoreProfile } = await import('@/services/sellerAiService');
    const result = await generateStoreProfile({
      what_you_sell: 'handmade jewelry',
      city: 'Marrakech',
      style: 'traditional',
      locale: 'en',
    });

    expect(api.post).toHaveBeenCalledWith('/api/seller/ai/store-profile', {
      what_you_sell: 'handmade jewelry',
      city: 'Marrakech',
      style: 'traditional',
      locale: 'en',
    });
    expect(result.result.name_ideas).toHaveLength(2);
    expect(result.result.slogan).toBe('Crafted with love in Morocco');
  });

  it('throws InsufficientCreditsError on 402', async () => {
    const api = (await import('@/lib/api')).default;
    const err = Object.assign(new Error('402'), {
      response: {
        status: 402,
        data: { error: 'insufficient_credits', balance: 0, cost: 2, feature: 'store_creator' },
      },
    });
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    const { generateStoreProfile, InsufficientCreditsError } = await import('@/services/sellerAiService');
    await expect(
      generateStoreProfile({ what_you_sell: 'jewelry', locale: 'en' })
    ).rejects.toThrow(InsufficientCreditsError);
  });
});

// ── translateListing ─────────────────────────────────────────────────────────

describe('translateListing', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls POST /api/seller/ai/translate-listing with name+description', async () => {
    const api = (await import('@/lib/api')).default;
    const mockData = {
      credits_charged: 1,
      balance: 5,
      result: {
        ar: { name: 'قفطان', description: 'وصف' },
        ma: { name: 'قفطان', description: 'وصف' },
        fr: { name: 'Caftan', description: 'Description' },
        en: { name: 'Caftan', description: 'Description' },
        es: { name: 'Caftán', description: 'Descripción' },
      },
    };
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockData });

    const { translateListing } = await import('@/services/sellerAiService');
    const result = await translateListing({ name: 'Caftan', description: 'A nice caftan' });

    expect(api.post).toHaveBeenCalledWith('/api/seller/ai/translate-listing', {
      name: 'Caftan',
      description: 'A nice caftan',
    });
    expect(result.result.ar!.name).toBe('قفطان');
    expect(result.result.fr!.name).toBe('Caftan');
  });

  it('also accepts product_id instead of name/description', async () => {
    const api = (await import('@/lib/api')).default;
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { credits_charged: 1, balance: 4, result: {} },
    });

    const { translateListing } = await import('@/services/sellerAiService');
    await translateListing({ product_id: 42 });

    expect(api.post).toHaveBeenCalledWith('/api/seller/ai/translate-listing', { product_id: 42 });
  });

  it('throws InsufficientCreditsError on 402', async () => {
    const api = (await import('@/lib/api')).default;
    const err = Object.assign(new Error('402'), {
      response: {
        status: 402,
        data: { error: 'insufficient_credits', balance: 0, cost: 1, feature: 'translate_listing' },
      },
    });
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    const { translateListing, InsufficientCreditsError } = await import('@/services/sellerAiService');
    await expect(
      translateListing({ name: 'Caftan' })
    ).rejects.toThrow(InsufficientCreditsError);
  });
});

// ── generateMarketing ────────────────────────────────────────────────────────

describe('generateMarketing', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls POST /api/seller/ai/marketing with product_id', async () => {
    const api = (await import('@/lib/api')).default;
    const mockData = {
      credits_charged: 1,
      balance: 4,
      result: {
        whatsapp_message: 'Check out this amazing product!',
        social_caption: 'Amazing Moroccan crafts',
        product_url: 'https://beldify.com/products/123',
      },
    };
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockData });

    const { generateMarketing } = await import('@/services/sellerAiService');
    const result = await generateMarketing({ product_id: 123 });

    expect(api.post).toHaveBeenCalledWith('/api/seller/ai/marketing', { product_id: 123 });
    expect(result.result.whatsapp_message).toBe('Check out this amazing product!');
    expect(result.result.product_url).toBe('https://beldify.com/products/123');
  });

  it('throws InsufficientCreditsError on 402', async () => {
    const api = (await import('@/lib/api')).default;
    const err = Object.assign(new Error('402'), {
      response: {
        status: 402,
        data: { error: 'insufficient_credits', balance: 0, cost: 1, feature: 'marketing_copy' },
      },
    });
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    const { generateMarketing, InsufficientCreditsError } = await import('@/services/sellerAiService');
    await expect(
      generateMarketing({ product_id: 1 })
    ).rejects.toThrow(InsufficientCreditsError);
  });
});
