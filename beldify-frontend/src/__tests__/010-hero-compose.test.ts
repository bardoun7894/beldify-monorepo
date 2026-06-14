/**
 * TDD: 010 — heroCompose unit tests
 * Covers:
 *  - Ordering: banners → products → art
 *  - Cap ≤6 slides
 *  - Always ≥1 slide (art slides guarantee non-empty)
 *  - mode='campaign' with banners maps to kind:'banner'
 *  - Products map to kind:'product'
 *  - Art slides are kind:'art'
 *  - imageSide derivation from text_position
 *  - Dedupe: no duplicate ids
 */
import { describe, it, expect } from 'vitest';
import { heroCompose } from '../components/home/heroCompose';
import type { HeroConfig } from '../components/home/HeroSection';
import type { HeroProductItem } from '../components/home/heroCompose';

const baseBanner = {
  id: 1,
  title: 'Test Banner',
  subtitle: 'Subtitle',
  button_text: 'Shop',
  button_link: '/products',
  image_url: 'https://example.com/img.jpg',
  text_position: 'left',
};

const baseProduct: HeroProductItem = {
  id: 10,
  name: 'Caftan',
  price: 500,
  image: 'https://example.com/product.jpg',
};

// ─────────────────────────────────────────────────────────────────────────────
// heroCompose: exports
// ─────────────────────────────────────────────────────────────────────────────
describe('heroCompose — module', () => {
  it('heroCompose is a function exported from heroCompose.ts', () => {
    expect(typeof heroCompose).toBe('function');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Always ≥1 slide guarantee
// ─────────────────────────────────────────────────────────────────────────────
describe('heroCompose — always ≥1 slide', () => {
  it('returns at least 1 slide when hero is brand mode, no products', () => {
    const hero: HeroConfig = { mode: 'brand', banners: [] };
    const slides = heroCompose(hero, []);
    expect(slides.length).toBeGreaterThanOrEqual(1);
  });

  it('returns art slides when brand mode (no banners)', () => {
    const hero: HeroConfig = { mode: 'brand', banners: [] };
    const slides = heroCompose(hero, []);
    expect(slides.every(s => s.kind === 'art')).toBe(true);
  });

  it('returns at least 1 slide when campaign mode with empty banners and no products', () => {
    const hero: HeroConfig = { mode: 'campaign', banners: [] };
    const slides = heroCompose(hero, []);
    expect(slides.length).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Ordering: banners → products → art
// ─────────────────────────────────────────────────────────────────────────────
describe('heroCompose — ordering', () => {
  it('in campaign mode with banners: banners come first (kind=banner at index 0)', () => {
    const hero: HeroConfig = {
      mode: 'campaign',
      banners: [baseBanner],
    };
    const slides = heroCompose(hero, []);
    expect(slides[0].kind).toBe('banner');
  });

  it('products come after banners', () => {
    const hero: HeroConfig = {
      mode: 'campaign',
      banners: [baseBanner],
    };
    const slides = heroCompose(hero, [baseProduct]);
    const bannerIdx = slides.findIndex(s => s.kind === 'banner');
    const productIdx = slides.findIndex(s => s.kind === 'product');
    expect(bannerIdx).toBeLessThan(productIdx);
  });

  it('art slides come after products', () => {
    const hero: HeroConfig = {
      mode: 'campaign',
      banners: [baseBanner],
    };
    const slides = heroCompose(hero, [baseProduct]);
    const productIdx = slides.findIndex(s => s.kind === 'product');
    const artIdx = slides.findIndex(s => s.kind === 'art');
    expect(productIdx).toBeLessThan(artIdx);
  });

  it('brand mode: no banners, products come before art', () => {
    const hero: HeroConfig = { mode: 'brand', banners: [] };
    const slides = heroCompose(hero, [baseProduct]);
    const productIdx = slides.findIndex(s => s.kind === 'product');
    const artIdx = slides.findIndex(s => s.kind === 'art');
    // product exists and comes before art
    expect(productIdx).toBeGreaterThanOrEqual(0);
    expect(productIdx).toBeLessThan(artIdx);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cap ≤6 total slides
// ─────────────────────────────────────────────────────────────────────────────
describe('heroCompose — cap ≤6 slides', () => {
  it('caps total output at 6 slides even with many banners + products + art', () => {
    const hero: HeroConfig = {
      mode: 'campaign',
      banners: Array.from({ length: 10 }, (_, i) => ({
        ...baseBanner,
        id: i + 1,
        title: `Banner ${i + 1}`,
      })),
    };
    const products: HeroProductItem[] = Array.from({ length: 4 }, (_, i) => ({
      ...baseProduct,
      id: i + 100,
      name: `Product ${i}`,
    }));
    const slides = heroCompose(hero, products);
    expect(slides.length).toBeLessThanOrEqual(6);
  });

  it('with no banners and 4 products, total stays ≤6', () => {
    const hero: HeroConfig = { mode: 'brand', banners: [] };
    const products: HeroProductItem[] = Array.from({ length: 4 }, (_, i) => ({
      ...baseProduct,
      id: i + 100,
    }));
    const slides = heroCompose(hero, products);
    expect(slides.length).toBeLessThanOrEqual(6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// imageSide derivation
// ─────────────────────────────────────────────────────────────────────────────
describe('heroCompose — imageSide derivation', () => {
  it('text_position "right" → imageSide "end"', () => {
    const hero: HeroConfig = {
      mode: 'campaign',
      banners: [{ ...baseBanner, text_position: 'right' }],
    };
    const slides = heroCompose(hero, []);
    const bannerSlide = slides.find(s => s.kind === 'banner');
    expect(bannerSlide?.imageSide).toBe('end');
  });

  it('text_position "left" → imageSide "start"', () => {
    const hero: HeroConfig = {
      mode: 'campaign',
      banners: [{ ...baseBanner, text_position: 'left' }],
    };
    const slides = heroCompose(hero, []);
    const bannerSlide = slides.find(s => s.kind === 'banner');
    expect(bannerSlide?.imageSide).toBe('start');
  });

  it('text_position "center" → imageSide "start" (default fallback)', () => {
    const hero: HeroConfig = {
      mode: 'campaign',
      banners: [{ ...baseBanner, text_position: 'center' }],
    };
    const slides = heroCompose(hero, []);
    const bannerSlide = slides.find(s => s.kind === 'banner');
    expect(bannerSlide?.imageSide).toBe('start');
  });

  it('missing text_position → imageSide "start"', () => {
    const hero: HeroConfig = {
      mode: 'campaign',
      banners: [{ ...baseBanner, text_position: '' }],
    };
    const slides = heroCompose(hero, []);
    const bannerSlide = slides.find(s => s.kind === 'banner');
    expect(bannerSlide?.imageSide).toBe('start');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HeroSlideData interface conformance
// ─────────────────────────────────────────────────────────────────────────────
describe('heroCompose — HeroSlideData shape', () => {
  it('each slide has a string id', () => {
    const hero: HeroConfig = { mode: 'campaign', banners: [baseBanner] };
    const slides = heroCompose(hero, [baseProduct]);
    for (const slide of slides) {
      expect(typeof slide.id).toBe('string');
    }
  });

  it('each slide has kind: banner | product | art', () => {
    const hero: HeroConfig = { mode: 'campaign', banners: [baseBanner] };
    const slides = heroCompose(hero, [baseProduct]);
    for (const slide of slides) {
      expect(['banner', 'product', 'art']).toContain(slide.kind);
    }
  });

  it('each slide has imageSide: start | end', () => {
    const hero: HeroConfig = { mode: 'campaign', banners: [baseBanner] };
    const slides = heroCompose(hero, [baseProduct]);
    for (const slide of slides) {
      expect(['start', 'end']).toContain(slide.imageSide);
    }
  });

  it('each slide has a title string', () => {
    const hero: HeroConfig = { mode: 'campaign', banners: [baseBanner] };
    const slides = heroCompose(hero, [baseProduct]);
    for (const slide of slides) {
      expect(typeof slide.title).toBe('string');
      expect(slide.title.length).toBeGreaterThan(0);
    }
  });

  it('each slide has a ctaHref string', () => {
    const hero: HeroConfig = { mode: 'campaign', banners: [baseBanner] };
    const slides = heroCompose(hero, [baseProduct]);
    for (const slide of slides) {
      expect(typeof slide.ctaHref).toBe('string');
      expect(slide.ctaHref.startsWith('/')).toBe(true);
    }
  });

  it('banner slides have imageUrl', () => {
    const hero: HeroConfig = { mode: 'campaign', banners: [baseBanner] };
    const slides = heroCompose(hero, []);
    const bannerSlide = slides.find(s => s.kind === 'banner');
    expect(bannerSlide?.imageUrl).toBe(baseBanner.image_url);
  });

  it('product slides have imageUrl', () => {
    const hero: HeroConfig = { mode: 'brand', banners: [] };
    const slides = heroCompose(hero, [baseProduct]);
    const productSlide = slides.find(s => s.kind === 'product');
    expect(productSlide?.imageUrl).toBe(baseProduct.image);
  });

  it('art slides have artVariant 1, 2, or 3', () => {
    const hero: HeroConfig = { mode: 'brand', banners: [] };
    const slides = heroCompose(hero, []);
    const artSlides = slides.filter(s => s.kind === 'art');
    for (const slide of artSlides) {
      expect([1, 2, 3]).toContain(slide.artVariant);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Deduplicate
// ─────────────────────────────────────────────────────────────────────────────
describe('heroCompose — dedupe', () => {
  it('no duplicate ids in output', () => {
    const hero: HeroConfig = {
      mode: 'campaign',
      banners: Array.from({ length: 3 }, (_, i) => ({
        ...baseBanner,
        id: i + 1,
      })),
    };
    const slides = heroCompose(hero, [baseProduct]);
    const ids = slides.map(s => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// products cap ≤2 for hero
// ─────────────────────────────────────────────────────────────────────────────
describe('heroCompose — product cap', () => {
  it('maps at most 2 products into the slide array', () => {
    const hero: HeroConfig = { mode: 'brand', banners: [] };
    const products: HeroProductItem[] = Array.from({ length: 4 }, (_, i) => ({
      ...baseProduct,
      id: i + 100,
    }));
    const slides = heroCompose(hero, products);
    const productSlides = slides.filter(s => s.kind === 'product');
    expect(productSlides.length).toBeLessThanOrEqual(2);
  });
});
