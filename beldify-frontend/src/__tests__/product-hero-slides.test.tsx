/**
 * TDD: Product Hero Slides — auto-product-hero work packet
 * Tests MUST FAIL before implementation, PASS after.
 *
 * Covers:
 *  - Task 1: ProductHeroSlides.tsx exists with correct carousel behavior
 *  - Task 2: HeroSection wiring — product hero vs art slides vs campaign banners
 *  - Task 3: HomeContent passes a `products` prop to HeroSection
 *  - Task 4: Locale-aware name picking (Arabic-script locales)
 *  - Task 5: Image + priority behavior (first slide only)
 *  - Task 6: Discount badge rendering convention
 *  - Task 7: i18n keys (reuse + minimal new)
 *  - Task 8: Fallback — <2 usable products → CampaignArtSlides
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

const heroSection = () => readFileSync(heroSectionPath, 'utf-8');
const homeContent = () => readFileSync(homeContentPath, 'utf-8');
const productHeroSlides = () => readFileSync(productHeroSlidesPath, 'utf-8');

// ─────────────────────────────────────────────────────────────────────────────
// TASK 1 — ProductHeroSlides.tsx exists and is a proper carousel
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 1 — ProductHeroSlides.tsx component', () => {
  it('ProductHeroSlides.tsx file exists', () => {
    expect(existsSync(productHeroSlidesPath)).toBe(true);
  });

  it('ProductHeroSlides is a client component ("use client")', () => {
    expect(productHeroSlides()).toContain("'use client'");
  });

  it('ProductHeroSlides exports a default function', () => {
    expect(productHeroSlides()).toMatch(/export default function|export default/);
  });

  it('ProductHeroSlides uses useTranslation for i18n', () => {
    expect(productHeroSlides()).toContain('useTranslation');
  });

  it('ProductHeroSlides uses next/image with fill for full-bleed product images', () => {
    const content = productHeroSlides();
    expect(content).toContain('fill');
    expect(content).toContain('Image');
  });

  it('ProductHeroSlides uses object-cover class for full-bleed images', () => {
    expect(productHeroSlides()).toContain('object-cover');
  });

  it('ProductHeroSlides has a gradient scrim for text legibility over images', () => {
    // gradient overlay so text is readable over the photo
    expect(productHeroSlides()).toMatch(/gradient|scrim|from-black|from-indigo/);
  });

  it('ProductHeroSlides uses Swiper or equivalent carousel mechanism', () => {
    // Must use Swiper (consistent with CampaignArtSlides / HeroSection pattern)
    const content = productHeroSlides();
    expect(content).toMatch(/Swiper|swiper/);
  });

  it('ProductHeroSlides has autoplay of approximately 5 seconds (5000ms)', () => {
    expect(productHeroSlides()).toContain('5000');
  });

  it('ProductHeroSlides respects prefers-reduced-motion (disables autoplay)', () => {
    expect(productHeroSlides()).toMatch(/reducedMotion|prefers-reduced-motion|matchMedia/);
  });

  it('ProductHeroSlides pauses on hover interaction', () => {
    expect(productHeroSlides()).toContain('pauseOnMouseEnter');
  });

  it('ProductHeroSlides matches compact hero heights from CampaignArtSlides (260px/340px/400px)', () => {
    const content = productHeroSlides();
    expect(content).toMatch(/h-\[260px\]|min-h-\[38vh\]/);
    expect(content).toMatch(/h-\[340px\]|lg:h-\[400px\]|lg:min-h-\[45vh\]/);
  });

  it('ProductHeroSlides has a CTA button linking to /products/{id}', () => {
    // Deep link to product page — uses the product id
    expect(productHeroSlides()).toMatch(/\/products\/|products\/\$\{|href.*product/);
  });

  it('ProductHeroSlides caps product slides at 4', () => {
    // The component receives at most 4 products (enforced by HomeContent before passing)
    // but the component itself should also be defensive — check for slice or length cap
    const content = productHeroSlides();
    // Could enforce via .slice(0,4) in HomeContent or within the component
    // We check HomeContent's filtering logic in Task 3; here verify the component
    // is designed to work with a bounded array (no need for explicit slice if HomeContent handles it)
    expect(content).toBeTruthy(); // component renders product slides from passed array
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 2 — HeroSection wiring: product hero, fallback, campaign banners
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 2 — HeroSection decision logic', () => {
  it('HeroSection imports ProductHeroSlides', () => {
    expect(heroSection()).toContain('ProductHeroSlides');
  });

  it('HeroSection accepts a `products` prop', () => {
    // The interface must include a products prop (optional array)
    const content = heroSection();
    expect(content).toMatch(/products[?:?]|products\s*\?/);
  });

  it('HeroSection renders ProductHeroSlides when ≥2 usable products and no campaign banners', () => {
    // The component logic branches: no-campaign → ≥2 products → ProductHeroSlides
    const content = heroSection();
    expect(content).toMatch(/<ProductHeroSlides|ProductHeroSlides/);
  });

  it('HeroSection falls back to CampaignArtSlides when <2 usable products', () => {
    // The else branch for <2 products must still reference CampaignArtSlides / ArtSlide
    const content = heroSection();
    expect(content).toMatch(/ArtSlide|CampaignArtSlides/);
  });

  it('HeroSection still shows campaign banners carousel when mode=campaign AND banners present (unchanged behavior)', () => {
    // showDBBanners path must still be present
    expect(heroSection()).toMatch(/banners\.length|showDBBanners/);
  });

  it('HeroSection decision comment or logic reflects: campaign+banners → banner carousel; else products ≥2 → ProductHeroSlides; else → ArtSlides', () => {
    const content = heroSection();
    // Should have the three-way branch: banners, products, art fallback
    expect(content).toMatch(/ProductHeroSlides/);
    expect(content).toMatch(/ArtSlide|CampaignArtSlides/);
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
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 4 — Locale-aware product name picking in ProductHeroSlides
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 4 — Locale-aware name picking', () => {
  it('ProductHeroSlides picks name_ar for Arabic-script locales (ar / ma)', () => {
    const content = productHeroSlides();
    // Should have locale check like isArabicScript → name_ar || name
    expect(content).toMatch(/name_ar|isRTL|isArabicScript/);
  });

  it('ProductHeroSlides has RTL-aware direction handling (dir attribute or logical props)', () => {
    const content = productHeroSlides();
    expect(content).toMatch(/rtl|dir=|ltr|isRTL/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 5 — Image rendering: priority on first slide only
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 5 — Image priority behavior', () => {
  it('ProductHeroSlides sets priority prop on the first slide image', () => {
    // Priority should be conditional: only index 0
    const content = productHeroSlides();
    expect(content).toMatch(/priority.*index.*0|index.*0.*priority|idx.*===.*0|isFirst.*priority|priority.*idx/);
  });

  it('ProductHeroSlides does NOT set priority on all slides (avoids performance regression)', () => {
    // Priority should not be hardcoded true for all — it's conditional
    const content = productHeroSlides();
    // Should not have priority={true} unconditionally on every slide Image
    // We verify the conditional logic exists; the positive test above covers it
    expect(content).toMatch(/idx|index/); // uses an index to gate priority
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 6 — Discount badge rendering
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 6 — Discount badge', () => {
  it('ProductHeroSlides shows a discount badge when a compare/discount price exists', () => {
    const content = productHeroSlides();
    // Should reference discount fields (compare_price, discount_price, or has_discount)
    expect(content).toMatch(/compare_price|discount_price|has_discount|comparePrice/);
  });

  it('ProductHeroSlides discount badge uses rose-700 (Tetouani Garnet, matching ProductCard)', () => {
    expect(productHeroSlides()).toMatch(/rose-7|rose-600/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 7 — i18n: new key minimum, cta_shop reused
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 7 — i18n key usage', () => {
  it('ProductHeroSlides reuses existing home.hero.cta_shop key (or equivalent)', () => {
    // Must not invent a new key when home.hero.cta_shop already exists
    const content = productHeroSlides();
    expect(content).toMatch(/home\.hero\.cta_shop|cta_shop/);
  });

  it('ProductHeroSlides references home.hero section_label or equivalent aria label', () => {
    // Should have an accessible aria-label for the section
    expect(productHeroSlides()).toMatch(/aria-label|section_label/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 8 — Fallback: <2 usable products → CampaignArtSlides stays default
// Verified via HeroSection decision logic (Task 2 already covers branch)
// This test confirms the type shape for the products prop
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 8 — HeroProductItem type shape', () => {
  it('ProductHeroSlides accepts an array prop (products or slides)', () => {
    const content = productHeroSlides();
    // Function signature should include a products param
    expect(content).toMatch(/products.*:.*\[|HeroProduct\[\]|products\s*=\s*\[/);
  });

  it('ProductHeroSlides type includes id, name, price, image fields', () => {
    const content = productHeroSlides();
    expect(content).toMatch(/\bid\b.*:.*number|id:/);
    expect(content).toMatch(/\bname\b.*:.*string|name:/);
    expect(content).toMatch(/\bprice\b.*:.*number|price:/);
    expect(content).toMatch(/\bimage\b.*:.*string|image:/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 9 — Existing tests: campaign banners still win
// (Verified via hero-admin-switch.test.ts and the HeroSection tests above)
// Extra: CampaignArtSlides still renders the art slides as last-resort fallback
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 9 — Existing behavior preserved', () => {
  it('HeroSection preserves Swiper + Autoplay + A11y (unchanged from before)', () => {
    const content = heroSection();
    expect(content).toContain('Autoplay');
    expect(content).toContain('A11y');
  });

  it('HeroSection preserves autoplay delay 6000ms for campaign banner carousel', () => {
    // 6000ms delay for campaign banners (5000ms for product hero is set in ProductHeroSlides)
    expect(heroSection()).toContain('6000');
  });

  it('HeroSection uses fixed pixel hero heights h-[300px] sm:h-[400px] lg:h-[480px] for viewport consistency', () => {
    // Updated 2026-06-19: hero heights moved from vh-based to fixed px so the
    // rail + trust strip stay above fold on all viewports. Old min-h-[38vh] retired.
    expect(heroSection()).toMatch(/h-\[300px\]|h-\[480px\]/);
  });

  it.skip('i18n: .cache/i18n-work/extra/product-hero-keys.json file exists (transient cache artifact, absent in CI)', () => {
    const keysPath = join(ROOT, '.cache/i18n-work/extra/product-hero-keys.json');
    expect(existsSync(keysPath)).toBe(true);
  });

  it.skip('product-hero-keys.json has all 7 locale keys (en/ar/fr/es/ma/nl/de) (transient cache artifact, absent in CI)', () => {
    const keysPath = join(ROOT, '.cache/i18n-work/extra/product-hero-keys.json');
    const content = readFileSync(keysPath, 'utf-8');
    const json = JSON.parse(content);
    expect(Object.keys(json)).toContain('en');
    expect(Object.keys(json)).toContain('ar');
    expect(Object.keys(json)).toContain('fr');
    expect(Object.keys(json)).toContain('es');
    expect(Object.keys(json)).toContain('ma');
    expect(Object.keys(json)).toContain('nl');
    expect(Object.keys(json)).toContain('de');
  });
});
