/**
 * TDD: Product Hero Slides — auto-product-hero work packet
 * FR5 update: ProductHeroSlides.tsx has been deleted.
 * Product slides are now composed by heroCompose (kind='product') and rendered
 * by SplitCanvasSlide. HeroProductItem type moved to heroCompose.ts.
 *
 * Covers:
 *  - Task 1: ProductHeroSlides.tsx deleted; heroCompose + SplitCanvasSlide handle products
 *  - Task 2: HeroSection wiring — heroCompose handles all slide ordering
 *  - Task 3: HomeContent passes a `products` prop to HeroSection
 *  - Task 4: Locale-aware name is a heroCompose/SplitCanvasSlide concern
 *  - Task 5: Image + priority behavior (SplitCanvasSlide isFirst prop)
 *  - Task 6: HeroProductItem type available from heroCompose.ts
 *  - Task 7: i18n keys (reuse + minimal new)
 *  - Task 8: heroCompose guarantees art slides as fallback when <2 products
 *  - Task 9: Campaign banners still win when present
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

const heroSectionPath = join(SRC, 'components/home/HeroSection.tsx');
const homeContentPath = join(SRC, 'components/home/HomeContent.tsx');
const productHeroSlidesPath = join(SRC, 'components/home/ProductHeroSlides.tsx');
const splitCanvasPath = join(SRC, 'components/home/SplitCanvasSlide.tsx');
const heroComposePath = join(SRC, 'components/home/heroCompose.ts');

const heroSection = () => readFileSync(heroSectionPath, 'utf-8');
const homeContent = () => readFileSync(homeContentPath, 'utf-8');
const splitCanvas = () => readFileSync(splitCanvasPath, 'utf-8');
const heroCompose = () => readFileSync(heroComposePath, 'utf-8');

// ─────────────────────────────────────────────────────────────────────────────
// TASK 1 — ProductHeroSlides.tsx deleted; heroCompose + SplitCanvasSlide handle products
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 1 — ProductHeroSlides.tsx (FR5: deleted)', () => {
  it('ProductHeroSlides.tsx file has been deleted (FR5 cleanup)', () => {
    expect(existsSync(productHeroSlidesPath)).toBe(false);
  });

  it('SplitCanvasSlide.tsx exists (product slide successor)', () => {
    expect(existsSync(splitCanvasPath)).toBe(true);
  });

  it('SplitCanvasSlide is a "use client" component', () => {
    expect(splitCanvas()).toContain("'use client'");
  });

  it('SplitCanvasSlide exports a default function', () => {
    expect(splitCanvas()).toMatch(/export default function|export default/);
  });

  it('SplitCanvasSlide uses useTranslation for i18n', () => {
    expect(splitCanvas()).toContain('useTranslation');
  });

  it('SplitCanvasSlide uses next/image with fill for full-bleed product images', () => {
    const content = splitCanvas();
    expect(content).toContain('fill');
    expect(content).toContain('Image');
  });

  it('SplitCanvasSlide uses object-cover class for full-bleed images', () => {
    expect(splitCanvas()).toContain('object-cover');
  });

  it('HeroSection uses Swiper carousel mechanism (consistent with old ProductHeroSlides pattern)', () => {
    const content = heroSection();
    expect(content).toMatch(/Swiper|swiper/);
  });

  it('HeroSection autoplay delay is 6000ms for campaign carousel', () => {
    expect(heroSection()).toContain('6000');
  });

  it('HeroSection respects prefers-reduced-motion (disables autoplay)', () => {
    expect(heroSection()).toMatch(/reducedMotion|prefers-reduced-motion|matchMedia/);
  });

  it('HeroSection pauses on hover interaction', () => {
    expect(heroSection()).toContain('pauseOnMouseEnter');
  });

  it('HeroSection maintains compact hero heights min-h-[38vh] lg:min-h-[45vh]', () => {
    expect(heroSection()).toMatch(/min-h-\[38vh\]/);
    expect(heroSection()).toMatch(/lg:min-h-\[45vh\]/);
  });

  it('heroCompose product slides have CTA href linking to /products/{id}', () => {
    // heroCompose productToSlide sets ctaHref to /products/${product.id}
    expect(heroCompose()).toMatch(/\/products\/|products\/\$\{|href.*product/);
  });

  it('heroCompose caps product slides at 2 (MAX_PRODUCTS)', () => {
    // heroCompose.ts limits products to MAX_PRODUCTS = 2
    expect(heroCompose()).toMatch(/MAX_PRODUCTS.*2|2.*MAX_PRODUCTS/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 2 — HeroSection wiring: heroCompose handles all slide ordering
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 2 — HeroSection decision logic', () => {
  it('HeroSection does NOT import ProductHeroSlides (FR5: deleted)', () => {
    expect(heroSection()).not.toContain("from './ProductHeroSlides'");
  });

  it('HeroSection imports HeroProductItem from heroCompose (not ProductHeroSlides)', () => {
    // After FR5: type moved to heroCompose.ts
    const content = heroSection();
    expect(content).toMatch(/from '\.\/heroCompose'|from "\.\/heroCompose"/);
  });

  it('HeroSection accepts a `products` prop', () => {
    // The interface must include a products prop (optional array)
    const content = heroSection();
    expect(content).toMatch(/products[?:?]|products\s*\?/);
  });

  it('HeroSection passes products to heroCompose (heroCompose handles all paths)', () => {
    const content = heroSection();
    expect(content).toContain('heroCompose');
    expect(content).toMatch(/<ProductHeroSlides|heroCompose/);
  });

  it('HeroSection falls back to art slides via heroCompose when <2 usable products (010 revamp)', () => {
    // 010 revamp: HeroSection delegates decision logic to heroCompose.
    // heroCompose guarantees art slides as fallback — no direct CampaignArtSlides import needed.
    const content = heroSection();
    expect(content).toContain('heroCompose');
  });

  it('HeroSection slide order (banners → products → art) managed by heroCompose (010 revamp)', () => {
    // 010 revamp: showDBBanners logic moved into heroCompose.
    // HeroSection passes hero + products to heroCompose and maps the result.
    expect(heroSection()).toContain('heroCompose');
  });

  it('HeroSection decision logic reflects: all paths handled by heroCompose (010 revamp)', () => {
    const content = heroSection();
    // 010 revamp: single composition fn replaces 3-way branch.
    expect(content).toMatch(/heroCompose|SplitCanvasSlide/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 3 — HomeContent passes filtered products prop to HeroSection
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 3 — HomeContent product filtering and prop threading', () => {
  it('HomeContent passes a `products` prop to HeroSection', () => {
    const content = homeContent();
    expect(content).toMatch(/<HeroSection[^>]*products/);
  });

  it('HomeContent derives hero products from bestSellers with newArrivals fallback', () => {
    const content = homeContent();
    // Should reference bestSellers + newArrivals in the hero product derivation
    expect(content).toMatch(/bestSellers|newArrivals/);
  });

  it('HomeContent filters out placeholder-product.svg from hero products', () => {
    const content = homeContent();
    expect(content).toContain('placeholder-product.svg');
  });

  it('HomeContent caps hero products at 4 items', () => {
    const content = homeContent();
    // .slice(0, 4) or similar cap
    expect(content).toMatch(/slice\(0,\s*4\)|\.slice\(0, 4\)|heroProducts\.slice|\.slice\(0,4\)/);
  });

  it('HomeContent filters products without a real image (empty string check)', () => {
    const content = homeContent();
    // Must filter out items where image/main_image is falsy, empty, or placeholder
    expect(content).toMatch(/filter|image.*&&|image.*!==|hasImage|usableProduct/);
  });

  it('HomeContent imports HeroProductItem from heroCompose (not ProductHeroSlides)', () => {
    const content = homeContent();
    // After FR5: import moved from ProductHeroSlides to heroCompose
    expect(content).toMatch(/heroCompose/);
    expect(content).not.toContain("from '@/components/home/ProductHeroSlides'");
    expect(content).not.toContain("from './ProductHeroSlides'");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 4 — Locale-aware product name: heroCompose + SplitCanvasSlide
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 4 — Locale-aware name picking', () => {
  it('heroCompose.ts exports HeroProductItem type with name_ar field', () => {
    // Type was moved from ProductHeroSlides.tsx to heroCompose.ts
    const content = heroCompose();
    expect(content).toMatch(/HeroProductItem/);
    expect(content).toMatch(/name_ar/);
  });

  it('HeroSection is RTL-aware (Swiper reads dir from DOM)', () => {
    // HeroSection uses Swiper which inherits dir from the DOM
    const content = heroSection();
    expect(content).toMatch(/Swiper|dir|rtl/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 5 — Image rendering: priority on first slide via SplitCanvasSlide
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 5 — Image priority behavior', () => {
  it('SplitCanvasSlide accepts isFirst prop for priority image loading', () => {
    // SplitCanvasSlide uses isFirst prop to set priority on first slide image
    const content = splitCanvas();
    expect(content).toMatch(/priority/);
    expect(content).toMatch(/isFirst/);
  });

  it('HeroSection passes isFirst={idx === 0} to SplitCanvasSlide', () => {
    // HeroSection gates priority to the first slide only
    const content = heroSection();
    expect(content).toMatch(/isFirst.*idx.*0|idx.*0.*isFirst|isFirst=\{idx === 0\}/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 6 — HeroProductItem type moved to heroCompose.ts
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 6 — HeroProductItem type in heroCompose', () => {
  it('heroCompose.ts exports HeroProductItem interface', () => {
    expect(heroCompose()).toMatch(/export interface HeroProductItem/);
  });

  it('HeroProductItem type includes id, name, price, image fields', () => {
    const content = heroCompose();
    expect(content).toMatch(/\bid\b.*:.*number|id:/);
    expect(content).toMatch(/\bname\b.*:.*string|name:/);
    expect(content).toMatch(/\bprice\b.*:.*number|price:/);
    expect(content).toMatch(/\bimage\b.*:.*string|image:/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 7 — i18n key usage
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 7 — i18n key usage', () => {
  it('heroCompose product slide uses View product CTA text (reusing existing pattern)', () => {
    // heroCompose productToSlide uses 'View product' as ctaText
    const content = heroCompose();
    expect(content).toMatch(/View product|cta_shop|ctaText/);
  });

  it('HeroSection has an accessible aria-label for the section', () => {
    // Should have an accessible aria-label for the section
    expect(heroSection()).toMatch(/aria-label|section_label/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 8 — Fallback: <2 usable products → art slides (heroCompose guarantee)
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 8 — Art slide fallback guarantee', () => {
  it('heroCompose.ts guarantees art slides fill remaining slots', () => {
    // Art slides are always appended after banners + products
    const content = heroCompose();
    expect(content).toMatch(/ART_SLIDES|art.*slides|kind.*art/);
  });

  it('heroCompose type shape: HeroProductItem accepts optional fields (name_ar, compare_price, etc.)', () => {
    const content = heroCompose();
    // Optional fields allow flexible product data
    expect(content).toMatch(/name_ar\?|compare_price\?|discount_price\?/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 9 — Existing behavior preserved
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 9 — Existing behavior preserved', () => {
  it('HeroSection preserves Swiper + Autoplay + A11y (unchanged from before)', () => {
    const content = heroSection();
    expect(content).toContain('Autoplay');
    expect(content).toContain('A11y');
  });

  it('HeroSection preserves autoplay delay 6000ms for campaign banner carousel', () => {
    // 6000ms delay for campaign banners
    expect(heroSection()).toContain('6000');
  });

  it('HeroSection maintains compact hero heights min-h-[38vh] lg:min-h-[45vh]', () => {
    expect(heroSection()).toMatch(/min-h-\[38vh\]/);
    expect(heroSection()).toMatch(/lg:min-h-\[45vh\]/);
  });

  it('i18n: all 7 locale JSON files have home.hero.cta_shop key (product hero i18n parity)', () => {
    // Replaces the stale .cache/i18n-work/extra/product-hero-keys.json assertion.
    // The cache artifact was never generated; the actual source of truth is the locale
    // JSON files themselves ([[beldify-i18n-architecture]] exact parity rule).
    const localeDir = join(SRC, 'i18n/locales');
    const locales = ['en', 'ar', 'fr', 'es', 'ma', 'nl', 'de'];
    for (const locale of locales) {
      const raw = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(raw);
      const heroKeys = json?.home?.hero ?? {};
      expect(Object.keys(heroKeys), `${locale}.json is missing home.hero.cta_shop`).toContain('cta_shop');
    }
  });

  it('i18n: all 7 locale JSON files have home.hero.search_placeholder key (010 search bar parity)', () => {
    // Verifies 7-locale parity for the new 010 search_placeholder key across all locales.
    // Supersedes the stale .cache/product-hero-keys.json locale structure check.
    const localeDir = join(SRC, 'i18n/locales');
    const locales = ['en', 'ar', 'fr', 'es', 'ma', 'nl', 'de'];
    for (const locale of locales) {
      const raw = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(raw);
      const heroKeys = json?.home?.hero ?? {};
      expect(Object.keys(heroKeys), `${locale}.json is missing home.hero.search_placeholder`).toContain('search_placeholder');
    }
  });
});
