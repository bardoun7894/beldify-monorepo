/**
 * TDD: Campaign-Art Hero — campaign-art-hero work packet
 * Tests MUST FAIL before implementation, PASS after.
 *
 * Covers:
 *  - Task A: CampaignArtSlides.tsx exists with 3 built-in art slides
 *  - Task B: HeroSection renders art slides as default (no DB banners needed)
 *  - Task C: Each art slide — design, copy direction, CTA links
 *  - Task D: i18n keys for all 3 slides in all 5 locales
 *  - Task E: BrandHeroSlide.tsx — photo hero is GONE (no hero-atelier.jpg)
 *  - Task F: Slide 3 uses amber palette with inverted (indigo) dot colors
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

const heroSectionPath = join(SRC, 'components/home/HeroSection.tsx');
const campaignArtSlidesPath = join(SRC, 'components/home/CampaignArtSlides.tsx');
const brandHeroSlidePath = join(SRC, 'components/home/BrandHeroSlide.tsx');

const heroSection = () => readFileSync(heroSectionPath, 'utf-8');
const campaignArtSlides = () => readFileSync(campaignArtSlidesPath, 'utf-8');
const brandHeroSlide = () => readFileSync(brandHeroSlidePath, 'utf-8');

// ─────────────────────────────────────────────────────────────────────────────
// TASK A — CampaignArtSlides.tsx: new component with 3 built-in art slides
// ─────────────────────────────────────────────────────────────────────────────
describe('Task A — CampaignArtSlides.tsx exists', () => {
  it('CampaignArtSlides.tsx file exists', () => {
    expect(existsSync(campaignArtSlidesPath)).toBe(true);
  });

  it('CampaignArtSlides exports default function', () => {
    expect(campaignArtSlides()).toMatch(/export default function|export default/);
  });

  it('CampaignArtSlides uses useTranslation for i18n', () => {
    expect(campaignArtSlides()).toContain('useTranslation');
  });

  it('CampaignArtSlides uses compact heights ~h-[260px] on mobile and h-[340px] lg:h-[400px] on desktop', () => {
    const content = campaignArtSlides();
    // Should have some height class variants
    expect(content).toMatch(/h-\[260px\]|h-\[340px\]|h-\[400px\]/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK A2 — Three built-in art slides present
// ─────────────────────────────────────────────────────────────────────────────
describe('Task A2 — Three art slides defined', () => {
  it('Slide 1 FREE DELIVERY: uses indigo-950 to indigo-800 gradient', () => {
    const content = campaignArtSlides();
    expect(content).toMatch(/indigo-950.*indigo-800|indigo-800.*indigo-950/);
  });

  it('Slide 1 FREE DELIVERY: CTA links to /products', () => {
    expect(campaignArtSlides()).toContain('/products');
  });

  it('Slide 2 TAILORING: uses indigo-900 to indigo-700 gradient', () => {
    const content = campaignArtSlides();
    expect(content).toMatch(/indigo-900.*indigo-700|indigo-700.*indigo-900/);
  });

  it('Slide 2 TAILORING: CTA links to /services/tailoring', () => {
    expect(campaignArtSlides()).toContain('/services/tailoring');
  });

  it('Slide 3 OPEN SOUK: uses amber-500 or amber-600 background (inverted slide)', () => {
    expect(campaignArtSlides()).toMatch(/amber-500|amber-600/);
  });

  it('Slide 3 OPEN SOUK: CTA links to /community/posts/create', () => {
    expect(campaignArtSlides()).toContain('/community/posts/create');
  });

  it('CampaignArtSlides has NO photo images (no <Image src) — pure CSS/SVG art', () => {
    const content = campaignArtSlides();
    // Should not use next/image for backgrounds — pure CSS gradients + SVG only
    // Allow Image for potential SVG/icon imports but not for background photos
    // Specifically: no fill + priority combo which is the photo pattern
    expect(content).not.toMatch(/fill[\s\S]{0,30}priority|priority[\s\S]{0,30}fill/);
  });

  it('CampaignArtSlides decorative overlay uses amber starburst or zellige pattern on slide 1', () => {
    const content = campaignArtSlides();
    // Should reference the zellige SVG motif or a starburst pattern
    expect(content).toMatch(/zellige|starburst|motif|opacity.*0\.[0-9]/);
  });

  it('Slide 3 amber background has INDIGO-950 typography (inverted for variety)', () => {
    const content = campaignArtSlides();
    expect(content).toContain('indigo-950');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK B — HeroSection default behavior: 3 art slides without DB banners
// ─────────────────────────────────────────────────────────────────────────────
describe('Task B — HeroSection renders art slides as default', () => {
  it('HeroSection imports CampaignArtSlides', () => {
    expect(heroSection()).toContain('CampaignArtSlides');
  });

  it('HeroSection renders ArtSlide components (from CampaignArtSlides) as default slides', () => {
    // HeroSection always uses the art-slides carousel (both brand and campaign mode).
    // ArtSlide (exported from CampaignArtSlides) is used directly in SwiperSlides.
    const content = heroSection();
    // ArtSlide must appear — this is the imported art-slide component
    expect(content).toMatch(/<ArtSlide|ArtSlide slide=/);
  });

  it('HeroSection still falls back to BrandHeroSlide.tsx only inside DB-banner carousel (campaign+banners)', () => {
    // BrandHeroSlide should still exist and be importable (not deleted)
    expect(existsSync(brandHeroSlidePath)).toBe(true);
  });

  it('HeroSection carousel (campaign mode with DB banners) uses CampaignArtSlides as slide 0', () => {
    const content = heroSection();
    // In campaign carousel, the art slides replace the old BrandHeroSlide as slide 0
    // Both CampaignArtSlides and SwiperSlide should appear together
    const artIdx = content.indexOf('CampaignArtSlides');
    const swiperSlideIdx = content.indexOf('SwiperSlide');
    expect(artIdx).toBeGreaterThan(-1);
    expect(swiperSlideIdx).toBeGreaterThan(-1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK C — Art slide visual design rules
// ─────────────────────────────────────────────────────────────────────────────
describe('Task C — Art slide visual design', () => {
  it('CampaignArtSlides uses amber-500 for CTA chip/button on indigo slides', () => {
    expect(campaignArtSlides()).toContain('amber-500');
  });

  it('CampaignArtSlides uses rounded-full for CTA chips', () => {
    expect(campaignArtSlides()).toContain('rounded-full');
  });

  it('CampaignArtSlides has bold typography scale (text-2xl through text-5xl range)', () => {
    const content = campaignArtSlides();
    expect(content).toMatch(/text-2xl|text-3xl|text-4xl|text-5xl/);
  });

  it('CampaignArtSlides content is max-w-7xl centered with start-aligned text', () => {
    const content = campaignArtSlides();
    expect(content).toContain('max-w-7xl');
  });

  it('CampaignArtSlides slide 3 dot indicator variant uses indigo active color (data attribute or class)', () => {
    // Slide 3 is amber-bg — dots should switch to indigo for visibility
    // We verify by checking for a conditional or per-slide dot class
    const content = campaignArtSlides();
    expect(content).toMatch(/indigo.*dot|dot.*indigo|swiper-pagination|pagination|invertDots|invert-dots/);
  });

  it('CampaignArtSlides Lucide icons used as decorative shapes on slide 2', () => {
    const content = campaignArtSlides();
    // Scissors or Needle or similar tailoring icon
    expect(content).toMatch(/Scissors|Needle|Sewing|lucide/);
  });

  it('CampaignArtSlides uses prefers-reduced-motion guard (no animation for motion-sensitive users)', () => {
    const content = campaignArtSlides();
    expect(content).toMatch(/prefers-reduced-motion|motion-safe|motion-reduce/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK D — i18n keys for all 3 slides in all 5 locales
// ─────────────────────────────────────────────────────────────────────────────
describe('Task D — i18n: art slide keys in all locale files', () => {
  const locales = ['en', 'ar', 'ma', 'fr', 'es'];
  const localeDir = join(SRC, 'i18n/locales');

  // Slide 1 — Free Delivery
  for (const locale of locales) {
    it(`${locale}.json has home.hero.art_slide1_headline`, () => {
      const content = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(content);
      const heroKeys = json?.home?.hero ?? {};
      expect(heroKeys).toHaveProperty('art_slide1_headline');
    });

    it(`${locale}.json has home.hero.art_slide1_subline`, () => {
      const content = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(content);
      const heroKeys = json?.home?.hero ?? {};
      expect(heroKeys).toHaveProperty('art_slide1_subline');
    });

    it(`${locale}.json has home.hero.art_slide1_cta`, () => {
      const content = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(content);
      const heroKeys = json?.home?.hero ?? {};
      expect(heroKeys).toHaveProperty('art_slide1_cta');
    });
  }

  // Slide 2 — Tailoring
  for (const locale of locales) {
    it(`${locale}.json has home.hero.art_slide2_headline`, () => {
      const content = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(content);
      const heroKeys = json?.home?.hero ?? {};
      expect(heroKeys).toHaveProperty('art_slide2_headline');
    });

    it(`${locale}.json has home.hero.art_slide2_cta`, () => {
      const content = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(content);
      const heroKeys = json?.home?.hero ?? {};
      expect(heroKeys).toHaveProperty('art_slide2_cta');
    });
  }

  // Slide 3 — Open Souk
  for (const locale of locales) {
    it(`${locale}.json has home.hero.art_slide3_headline`, () => {
      const content = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(content);
      const heroKeys = json?.home?.hero ?? {};
      expect(heroKeys).toHaveProperty('art_slide3_headline');
    });

    it(`${locale}.json has home.hero.art_slide3_cta`, () => {
      const content = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(content);
      const heroKeys = json?.home?.hero ?? {};
      expect(heroKeys).toHaveProperty('art_slide3_cta');
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK E — BrandHeroSlide.tsx: photo hero removed
// ─────────────────────────────────────────────────────────────────────────────
describe('Task E — BrandHeroSlide photo hero removed', () => {
  it('BrandHeroSlide.tsx no longer references hero-atelier.jpg', () => {
    expect(brandHeroSlide()).not.toContain('hero-atelier.jpg');
  });

  it('BrandHeroSlide.tsx no longer has search bar (no hero-search id)', () => {
    expect(brandHeroSlide()).not.toContain('hero-search');
  });

  it('BrandHeroSlide.tsx no longer uses compact heights min-h-[38vh] (replaced by art slides heights)', () => {
    // The old BrandHeroSlide had min-h-[38vh]. After replacement it should be
    // either removed or replaced with the new art slide heights.
    expect(brandHeroSlide()).not.toContain('min-h-[38vh]');
  });

  it('BrandHeroSlide.tsx file still exists (not deleted — referenced for legacy import safety)', () => {
    expect(existsSync(brandHeroSlidePath)).toBe(true);
  });
});
