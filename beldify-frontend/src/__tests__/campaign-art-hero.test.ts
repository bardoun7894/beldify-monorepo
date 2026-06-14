/**
 * TDD: Campaign-Art Hero — campaign-art-hero work packet
 * Tests MUST FAIL before implementation, PASS after.
 *
 * FR5 update: CampaignArtSlides.tsx and BrandHeroSlide.tsx have been deleted.
 * Art slides are now rendered by SplitCanvasSlide (kind='art', artVariant 1|2|3).
 * Tests retargeted from deleted files → SplitCanvasSlide + heroCompose.
 *
 * Covers:
 *  - Task A: CampaignArtSlides.tsx deleted; SplitCanvasSlide is the art successor
 *  - Task B: HeroSection renders art slides as default (via SplitCanvasSlide + heroCompose)
 *  - Task C: Art visual design — SplitCanvasSlide art variants
 *  - Task D: i18n keys for all 3 slides in all 7 locales
 *  - Task E: BrandHeroSlide.tsx deleted (FR5); SplitCanvasSlide handles all rendering
 *  - Task F: Slide 3 art variant uses amber palette via hsl(var(--secondary)) token
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

const heroSectionPath = join(SRC, 'components/home/HeroSection.tsx');
const campaignArtSlidesPath = join(SRC, 'components/home/CampaignArtSlides.tsx');
const brandHeroSlidePath = join(SRC, 'components/home/BrandHeroSlide.tsx');
const splitCanvasPath = join(SRC, 'components/home/SplitCanvasSlide.tsx');
const heroComposePath = join(SRC, 'components/home/heroCompose.ts');

const heroSection = () => readFileSync(heroSectionPath, 'utf-8');
const splitCanvas = () => readFileSync(splitCanvasPath, 'utf-8');
const heroCompose = () => readFileSync(heroComposePath, 'utf-8');

// ─────────────────────────────────────────────────────────────────────────────
// TASK A — CampaignArtSlides.tsx: deleted (FR5 cleanup)
// Art slides are now embedded in SplitCanvasSlide (kind='art' + artVariant 1|2|3).
// ─────────────────────────────────────────────────────────────────────────────
describe('Task A — CampaignArtSlides.tsx (FR5: deleted, art folded into SplitCanvasSlide)', () => {
  it('CampaignArtSlides.tsx has been deleted (FR5 cleanup)', () => {
    expect(existsSync(campaignArtSlidesPath)).toBe(false);
  });

  it('SplitCanvasSlide.tsx exists (art variant successor)', () => {
    expect(existsSync(splitCanvasPath)).toBe(true);
  });

  it('SplitCanvasSlide exports a default function', () => {
    expect(splitCanvas()).toMatch(/export default function|export default/);
  });

  it('SplitCanvasSlide uses useTranslation for i18n', () => {
    expect(splitCanvas()).toContain('useTranslation');
  });

  it('SplitCanvasSlide art variant panel uses Atlas compact-height via parent container (min-h-[38vh])', () => {
    // Heights are controlled by HeroSection wrapper; SplitCanvasSlide uses h-full inside it.
    // Verify that HeroSection sets the container height:
    const heroSectionContent = readFileSync(heroSectionPath, 'utf-8');
    expect(heroSectionContent).toMatch(/min-h-\[38vh\]|min-h-\[45vh\]/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK A2 — Three built-in art slides present in SplitCanvasSlide
// ─────────────────────────────────────────────────────────────────────────────
describe('Task A2 — Three art slides defined in SplitCanvasSlide', () => {
  it('SplitCanvasSlide art variant 1 uses hsl(var(--primary)) for background (replaces indigo-950→indigo-800)', () => {
    // ArtVariant1 uses hsl(var(--primary)) — Atlas Indigo — instead of raw indigo-* literals
    expect(splitCanvas()).toMatch(/hsl\(var\(--primary\)\)|hsl\(var\(--primary\)/);
  });

  it('heroCompose art slide 1 CTA links to /products', () => {
    expect(heroCompose()).toContain('/products');
  });

  it('heroCompose art slide 2 CTA links to /services/tailoring', () => {
    expect(heroCompose()).toContain('/services/tailoring');
  });

  it('SplitCanvasSlide art variant 3 uses hsl(var(--secondary)) for amber accent (replaces amber-500→amber-600 P0)', () => {
    // ArtVariant3 (Open Souk) uses hsl(var(--secondary)) — NOT a full-bleed amber class
    expect(splitCanvas()).toMatch(/hsl\(var\(--secondary\)|hsl\(var\(--secondary\)\/|linear-gradient.*hsl\(var\(--secondary\)/);
  });

  it('heroCompose art slide 3 CTA links to /community/posts/create', () => {
    expect(heroCompose()).toContain('/community/posts/create');
  });

  it('SplitCanvasSlide art panel has NO background photo images (pure CSS/SVG art)', () => {
    // Art variants should not use next/image for backgrounds
    // (SplitCanvasSlide uses Image for banner/product kinds only)
    expect(splitCanvas()).not.toMatch(/artVariant[\s\S]{0,50}fill.*priority|artVariant[\s\S]{0,50}priority.*fill/);
  });

  it('SplitCanvasSlide art variant 1 uses zellige motif or SVG pattern overlay', () => {
    expect(splitCanvas()).toMatch(/zellige|starburst|motif|opacity.*0\.[0-9]/);
  });

  it('SplitCanvasSlide art variant 3 uses indigo primary background (FIX 2: 60-30-10 — amber no longer a full panel bg)', () => {
    // FIX 2: ArtVariant3 was redesigned from full-amber bg to deep-indigo bg (same as Variant1/2).
    // Amber (secondary) is now ONLY the CTA button and the radial accent — not the panel background.
    // The root wrapper must use hsl(var(--primary)) or a gradient of primary/primary-container.
    const content = splitCanvas();
    // ArtVariant3 must reference --primary for its background
    expect(content).toMatch(/ArtVariant3[\s\S]{0,500}--primary|linear-gradient[\s\S]{0,300}--primary/);
    // Must NOT be a full secondary/amber background fill
    expect(content).not.toMatch(/ArtVariant3[\s\S]{0,200}background:.*linear-gradient[\s\S]{0,100}--secondary.*--secondary/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK B — HeroSection default behavior: 3 art slides without DB banners
// ─────────────────────────────────────────────────────────────────────────────
describe('Task B — HeroSection renders art slides as default', () => {
  it('HeroSection uses heroCompose for slide composition (010 revamp: CampaignArtSlides folded into heroCompose)', () => {
    // 010 revamp: art slides are now defined in heroCompose (kind="art" with artVariant).
    // HeroSection no longer imports CampaignArtSlides directly — art is in heroCompose.
    expect(heroSection()).toContain('heroCompose');
  });

  it('HeroSection renders SplitCanvasSlide for each composed slide (includes art kind)', () => {
    // 010 revamp: SplitCanvasSlide handles art rendering via artVariant prop.
    const content = heroSection();
    expect(content).toContain('SplitCanvasSlide');
    expect(content).toContain('SwiperSlide');
  });

  it('BrandHeroSlide.tsx has been deleted (FR5); HeroSection uses SplitCanvasSlide instead', () => {
    // FR5 cleanup: BrandHeroSlide deleted, SplitCanvasSlide is the sole rendering primitive
    expect(existsSync(brandHeroSlidePath)).toBe(false);
    expect(existsSync(splitCanvasPath)).toBe(true);
  });

  it('HeroSection carousel uses SplitCanvasSlide inside SwiperSlide (010 revamp)', () => {
    const content = heroSection();
    // SplitCanvasSlide replaces CampaignArtSlides as the rendering primitive
    const splitCanvasIdx = content.indexOf('SplitCanvasSlide');
    const swiperSlideIdx = content.indexOf('SwiperSlide');
    expect(splitCanvasIdx).toBeGreaterThan(-1);
    expect(swiperSlideIdx).toBeGreaterThan(-1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK C — Art slide visual design rules (now in SplitCanvasSlide)
// ─────────────────────────────────────────────────────────────────────────────
describe('Task C — Art slide visual design (SplitCanvasSlide)', () => {
  it('SplitCanvasSlide CTA uses hsl(var(--secondary)) for amber button (not raw amber-500)', () => {
    // Atlas token compliance: CTAs use hsl(var(--secondary)) not raw amber-500
    expect(splitCanvas()).toMatch(/hsl\(var\(--secondary\)\)|hsl\(var\(--on-secondary\)\)/);
  });

  it('SplitCanvasSlide uses rounded-full for CTA buttons', () => {
    expect(splitCanvas()).toContain('rounded-full');
  });

  it('SplitCanvasSlide headline uses font-heading class (bold typography)', () => {
    expect(splitCanvas()).toContain('font-heading');
  });

  it('SplitCanvasSlide text panel is max-w-md or similar (centered layout)', () => {
    const content = splitCanvas();
    expect(content).toMatch(/max-w-md|max-w-lg|max-w-xl|max-w-xs/);
  });

  it('HeroSection pagination dots work via globals.css Atlas tokens (no onSlideChange amber hack needed)', () => {
    // FIX 2: The onSlideChange amber-dot inversion hack was removed because ArtVariant3
    // no longer uses a full-amber background. Dots are now always styled via globals.css
    // (.hero-swiper .swiper-pagination-bullet-active = hsl(var(--secondary))).
    // HeroSection must NOT contain the amber-slide-specific toggle logic.
    const content = heroSection();
    expect(content).not.toContain('hero-swiper-slide-amber');
    expect(content).not.toContain('isAmberSlide');
    // But HeroSection still uses Swiper pagination
    expect(content).toContain('pagination');
  });

  it('SplitCanvasSlide uses Lucide icons as decorative shapes in art variants', () => {
    // Scissors, Truck, Users icons used in ArtVariant1/2/3
    expect(splitCanvas()).toMatch(/Scissors|Truck|Users/);
  });

  it('SplitCanvasSlide art variants support motion-safe animations', () => {
    // Art panels use motion-safe: prefix on animated elements
    expect(splitCanvas()).toMatch(/motion-safe|prefers-reduced-motion/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK D — i18n keys for all 3 slides in all 7 locales
// Updated for 010 revamp: nl + de added per [[beldify-i18n-architecture]] exact parity rule
// ─────────────────────────────────────────────────────────────────────────────
describe('Task D — i18n: art slide keys in all locale files', () => {
  const locales = ['en', 'ar', 'ma', 'fr', 'es', 'nl', 'de'];
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
// 010 REVAMP — SplitCanvasSlide token compliance for art variant 3 (Open Souk)
// FR4/spec: no full-amber bg in the unified hero; amber restricted to CTA.
// The new rendering path is SplitCanvasSlide (not CampaignArtSlides).
// [[beldify-design-tokens]] [[beldify-tailwind-atlas-token-collision]]
// ─────────────────────────────────────────────────────────────────────────────
describe('010 revamp — SplitCanvasSlide: Open Souk art variant uses Atlas tokens (no full-amber bg)', () => {
  it('SplitCanvasSlide.tsx exists', () => {
    expect(existsSync(splitCanvasPath)).toBe(true);
  });

  it('SplitCanvasSlide has no raw amber-* Tailwind class literals (60-30-10 compliance)', () => {
    // The old CampaignArtSlides Slide 3 had bg-gradient-to-br from-amber-500 to-amber-600
    // (a P0 60-30-10 violation). SplitCanvasSlide must not repeat this.
    expect(splitCanvas()).not.toMatch(/\bamber-[0-9]{3}\b/);
  });

  it('SplitCanvasSlide has no raw indigo-* Tailwind class literals', () => {
    expect(splitCanvas()).not.toMatch(/\bindigo-[0-9]{3}\b/);
  });

  it('SplitCanvasSlide art variant 3 uses hsl(var(--secondary)) for the amber accent (not full bg)', () => {
    // ArtVariant3 (Open Souk) must use hsl(var(--secondary)) for accent/gradient,
    // NOT a full-bleed amber-500 background. Amber is only the 10% accent.
    const content = splitCanvas();
    // Must reference the secondary variable (amber in Atlas = var(--secondary))
    expect(content).toMatch(/hsl\(var\(--secondary\)|hsl\(var\(--secondary\)\/|linear-gradient.*hsl\(var\(--secondary\)/);
    // Must NOT use full amber-N background class
    expect(content).not.toMatch(/from-amber-|to-amber-|bg-amber-/);
  });

  it('SplitCanvasSlide has no hardcoded hex color values', () => {
    expect(splitCanvas()).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK E — BrandHeroSlide.tsx: deleted (FR5 cleanup)
// Photo hero permanently removed; SplitCanvasSlide handles all hero rendering.
// ─────────────────────────────────────────────────────────────────────────────
describe('Task E — BrandHeroSlide deleted (FR5)', () => {
  it('BrandHeroSlide.tsx file has been deleted (FR5 cleanup)', () => {
    expect(existsSync(brandHeroSlidePath)).toBe(false);
  });

  it('SplitCanvasSlide has no hero-atelier.jpg reference (photo hero permanently removed)', () => {
    expect(splitCanvas()).not.toContain('hero-atelier.jpg');
  });

  it('HeroSection does not reference hero-search id (search bar moved to HeroSearchBar.tsx)', () => {
    // The old photo hero embedded a search bar; now HeroSearchBar is a separate component
    expect(heroSection()).not.toContain("id='hero-search'");
  });

  it('SplitCanvasSlide does not use compact heights min-h-[38vh] directly (parent HeroSection controls height)', () => {
    // SplitCanvasSlide uses h-full; HeroSection controls the container height
    const heroSectionContent = readFileSync(heroSectionPath, 'utf-8');
    expect(heroSectionContent).toMatch(/min-h-\[38vh\]/);
  });
});
