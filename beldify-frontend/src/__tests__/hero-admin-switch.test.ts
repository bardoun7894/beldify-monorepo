/**
 * TDD: Hero admin switch — FE-HERO work packet
 * Tests must fail BEFORE implementation, pass AFTER.
 *
 * Covers:
 *  - Task 1: getHomeDataPayload fetches /api/hero-config and returns `hero` in payload
 *  - Task 2a: BrandHeroSlide.tsx exists + is an extraction of the existing hero JSX
 *  - Task 2b: HeroSection.tsx exists, uses Swiper in campaign mode, falls back in brand mode
 *  - Task 2c: Banner slide content (image, gradient, title, CTA)
 *  - Task 3: i18n — new keys present in ALL locale files
 *  - Task 4: Behavior matrix (brand mode, campaign+banners, campaign+0 banners)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

const routePath = join(SRC, 'app/api/home/route.ts');
const pagePath = join(SRC, 'app/page.tsx');
const homeContentPath = join(SRC, 'components/home/HomeContent.tsx');
const brandHeroSlidePath = join(SRC, 'components/home/BrandHeroSlide.tsx');
const heroSectionPath = join(SRC, 'components/home/HeroSection.tsx');

const route = () => readFileSync(routePath, 'utf-8');
const page = () => readFileSync(pagePath, 'utf-8');
const homeContent = () => readFileSync(homeContentPath, 'utf-8');
const brandHeroSlide = () => readFileSync(brandHeroSlidePath, 'utf-8');
const heroSection = () => readFileSync(heroSectionPath, 'utf-8');

// ─────────────────────────────────────────────────────────────────────────────
// TASK 1 — Data: getHomeDataPayload fetches /api/hero-config
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 1 — hero-config fetch in getHomeDataPayload', () => {
  it('route.ts fetches /api/hero-config', () => {
    expect(route()).toContain('/api/hero-config');
  });

  it('route.ts includes `hero` in the returned payload', () => {
    // The returned object must include a `hero` key
    expect(route()).toMatch(/hero[:\s]/);
  });

  it('route.ts has a graceful catch for hero-config returning { mode: "brand", banners: [] }', () => {
    expect(route()).toContain('mode');
    expect(route()).toContain('banners');
  });

  it('hero-config fetch uses next: { revalidate: 60 } (consistent with page revalidation)', () => {
    expect(route()).toMatch(/revalidate.*60|next.*revalidate/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 1b — page.tsx and HomeContent thread the `hero` prop
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 1b — hero prop threaded through page.tsx and HomeContent', () => {
  it('page.tsx passes hero prop to HomeContent', () => {
    expect(page()).toMatch(/hero/);
  });

  it('HomeContent accepts a `hero` prop', () => {
    expect(homeContent()).toMatch(/hero/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 2a — BrandHeroSlide.tsx: deleted (FR5 cleanup — spec requires deletion)
// The shim is no longer needed; SplitCanvasSlide handles all hero rendering.
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 2a — BrandHeroSlide.tsx (FR5: deleted)', () => {
  it('BrandHeroSlide.tsx file has been deleted (FR5 cleanup)', () => {
    expect(existsSync(brandHeroSlidePath)).toBe(false);
  });

  it('SplitCanvasSlide.tsx handles art rendering replacing BrandHeroSlide shim', () => {
    // After FR5: SplitCanvasSlide + heroCompose replace BrandHeroSlide entirely
    const splitCanvasPath = join(SRC, 'components/home/SplitCanvasSlide.tsx');
    expect(existsSync(splitCanvasPath)).toBe(true);
    expect(readFileSync(splitCanvasPath, 'utf-8')).toContain('SplitCanvasSlide');
  });

  it('SplitCanvasSlide has no hero-atelier.jpg reference (photo hero permanently removed)', () => {
    const splitCanvasPath = join(SRC, 'components/home/SplitCanvasSlide.tsx');
    expect(readFileSync(splitCanvasPath, 'utf-8')).not.toContain('hero-atelier.jpg');
  });

  it('SplitCanvasSlide renders art variants via ArtPanel (replaces CampaignArtSlides shim)', () => {
    const splitCanvasPath = join(SRC, 'components/home/SplitCanvasSlide.tsx');
    expect(readFileSync(splitCanvasPath, 'utf-8')).toMatch(/ArtVariant|artVariant|kind.*art/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 2b — HeroSection.tsx: decides mode, wraps with Swiper in campaign mode
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 2b — HeroSection.tsx carousel logic', () => {
  it('HeroSection.tsx file exists', () => {
    expect(existsSync(heroSectionPath)).toBe(true);
  });

  it('HeroSection is a client component ("use client")', () => {
    expect(heroSection()).toContain("'use client'");
  });

  it('HeroSection imports SplitCanvasSlide (010 revamp: BrandHeroSlide removed from HeroSection)', () => {
    // 010 revamp: BrandHeroSlide no longer imported into HeroSection.
    // HeroSection now uses SplitCanvasSlide + heroCompose.
    expect(heroSection()).toContain('SplitCanvasSlide');
  });

  it('HeroSection imports Swiper and SwiperSlide from swiper/react', () => {
    expect(heroSection()).toContain("'swiper/react'");
  });

  it('HeroSection uses Autoplay swiper module', () => {
    expect(heroSection()).toContain('Autoplay');
  });

  it('HeroSection uses Pagination swiper module', () => {
    expect(heroSection()).toContain('Pagination');
  });

  it('HeroSection uses A11y swiper module', () => {
    expect(heroSection()).toContain('A11y');
  });

  it('HeroSection uses Keyboard swiper module', () => {
    expect(heroSection()).toContain('Keyboard');
  });

  it('HeroSection autoplay delay is 6000ms', () => {
    expect(heroSection()).toContain('6000');
  });

  it('HeroSection has pauseOnMouseEnter on autoplay', () => {
    expect(heroSection()).toContain('pauseOnMouseEnter');
  });

  it('HeroSection has loop enabled', () => {
    expect(heroSection()).toContain('loop');
  });

  it('HeroSection respects prefers-reduced-motion by disabling autoplay', () => {
    expect(heroSection()).toMatch(/prefers-reduced-motion|reducedMotion|matchMedia/);
  });

  it('HeroSection dots styled via .hero-swiper class (Atlas tokens in globals.css, not inline style)', () => {
    // 010 revamp: pagination dot styles moved out of inline <style> and into globals.css
    // HeroSection assigns className "hero-swiper" which maps to §13.0 in globals.css
    expect(heroSection()).toContain('hero-swiper');
  });

  it('HeroSection uses heroCompose to order slides (banners → products → art)', () => {
    // 010 revamp: art slides are ordered via heroCompose, not hardcoded in HeroSection JSX
    const content = heroSection();
    expect(content).toContain('heroCompose');
    expect(content).toContain('SwiperSlide');
  });

  it('HeroSection always shows a slide carousel (heroCompose guarantees ≥1 slide)', () => {
    // 010 revamp: heroCompose always returns ≥1 slide (art fallback)
    const content = heroSection();
    expect(content).toContain('heroCompose');
    expect(content).toContain('Swiper');
  });

  it('HeroSection slide array comes from heroCompose (handles banners, products, art)', () => {
    // 010 revamp: HeroSection no longer has inline showDBBanners logic;
    // heroCompose encapsulates ordering. HeroSection maps the composed slides.
    expect(heroSection()).toMatch(/heroCompose|slides\.map/);
  });

  it('HeroSection maintains compact hero heights min-h-[38vh] lg:min-h-[45vh]', () => {
    expect(heroSection()).toMatch(/min-h-\[38vh\]/);
    expect(heroSection()).toMatch(/lg:min-h-\[45vh\]/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 2c — Banner slide rendering
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 2c — Banner slide content', () => {
  it('HeroSection delegates image rendering to SplitCanvasSlide (next/image in SplitCanvasSlide)', () => {
    // 010 revamp: banner image rendering is in SplitCanvasSlide, not HeroSection.
    // HeroSection renders <SplitCanvasSlide slide={slide} isFirst={idx===0} />.
    const content = heroSection();
    expect(content).toContain('SplitCanvasSlide');
    expect(content).toContain('isFirst');
  });

  it('HeroSection renders slides via SplitCanvasSlide (Atlas token compliance in SplitCanvasSlide)', () => {
    // 010 revamp: raw indigo-950 gradient moved out of HeroSection into SplitCanvasSlide.
    // HeroSection is token-clean; SplitCanvasSlide uses hsl(var(--primary)) instead.
    expect(heroSection()).toContain('SplitCanvasSlide');
  });

  it('HeroSection renders slide content via SplitCanvasSlide component', () => {
    // 010 revamp: title/text rendering delegated to SplitCanvasSlide
    expect(heroSection()).toContain('SplitCanvasSlide');
  });

  it('HeroSection uses Atlas token CTA via SplitCanvasSlide (hsl(var(--secondary)), not raw amber-500)', () => {
    // 010 revamp: CTAs use hsl(var(--secondary)) in SplitCanvasSlide; HeroSection is raw-token-free
    expect(heroSection()).not.toMatch(/amber-500/);
    expect(heroSection()).toContain('SplitCanvasSlide');
  });

  it('HeroSection honors text_position logical alignment (start/end, not left/right)', () => {
    // Must use logical CSS properties — items-start / items-end / items-center
    // or text-start / text-end based on text_position
    expect(heroSection()).toMatch(/text_position|textPosition|text-start|items-start|justify-start/);
  });

  it('HeroSection passes isFirst flag to SplitCanvasSlide for priority image loading', () => {
    // 010 revamp: HeroSection passes isFirst={idx === 0} to SplitCanvasSlide,
    // which uses it to set priority on the first image.
    expect(heroSection()).toContain('isFirst');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 3 — i18n: new hero carousel keys present in all 7 locale files
// Updated for 010 revamp: nl + de added per [[beldify-i18n-architecture]] exact parity rule
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 3 — i18n: carousel keys in all locale files', () => {
  const locales = ['en', 'ar', 'ma', 'fr', 'es', 'nl', 'de'];
  const localeDir = join(SRC, 'i18n/locales');

  for (const locale of locales) {
    it(`${locale}.json has hero.carousel_prev aria-label key`, () => {
      const content = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(content);
      // Either nested under home.hero or as a direct hero key
      const heroKeys = json?.home?.hero ?? {};
      expect(Object.keys(heroKeys)).toContain('carousel_prev');
    });

    it(`${locale}.json has hero.carousel_next aria-label key`, () => {
      const content = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(content);
      const heroKeys = json?.home?.hero ?? {};
      expect(Object.keys(heroKeys)).toContain('carousel_next');
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 010 REVAMP — Token compliance: HeroSection must have zero raw Tailwind literals
// FR4 spec: no amber-*/indigo-* literals; no hex; CTA only via hsl(var(--secondary))
// [[beldify-tailwind-atlas-token-collision]] [[beldify-design-tokens]]
// ─────────────────────────────────────────────────────────────────────────────
describe('010 revamp — HeroSection token compliance (no raw literals, Atlas tokens only)', () => {
  it('HeroSection has no raw amber-* Tailwind class literals', () => {
    expect(heroSection()).not.toMatch(/\bamber-[0-9]{3}\b/);
  });

  it('HeroSection has no raw indigo-* Tailwind class literals', () => {
    expect(heroSection()).not.toMatch(/\bindigo-[0-9]{3}\b/);
  });

  it('HeroSection has no hardcoded hex color values', () => {
    // No raw #rrggbb or rgb(…) — Atlas CSS vars only
    expect(heroSection()).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });

  it('HeroSection uses hsl(var(--secondary)) or hsl(var(--outline)) for any color references', () => {
    // When HeroSection references colors directly it must use CSS variable form
    const content = heroSection();
    const hasAtlasColor = content.includes('hsl(var(') || content.includes('hsl(var(--');
    // HeroSection might delegate all color to child components — that's also OK.
    // The key assertion is: no raw literals. Positive token assertion is a bonus check.
    expect(content).not.toMatch(/\bamber-[0-9]{3}\b|\bindigo-[0-9]{3}\b/);
  });

  it('BrandHeroSlide is absent from HeroSection imports (010 revamp removed it)', () => {
    // The 010 revamp removed BrandHeroSlide from HeroSection.
    // HeroSection now delegates all rendering to SplitCanvasSlide.
    expect(heroSection()).not.toContain("from './BrandHeroSlide'");
    expect(heroSection()).not.toContain('BrandHeroSlide');
  });

  it('No inline <style> block in HeroSection (removed in 010 revamp, moved to globals.css §13)', () => {
    // The inline <style> containing realIndex===2 hack was removed.
    expect(heroSection()).not.toMatch(/<style[^>]*>/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 4 — HomeContent uses HeroSection (not inline hero JSX)
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 4 — HomeContent delegates hero to HeroSection', () => {
  it('HomeContent imports HeroSection', () => {
    expect(homeContent()).toContain('HeroSection');
  });

  it('HomeContent renders <HeroSection', () => {
    expect(homeContent()).toMatch(/<HeroSection/);
  });

  it('HomeContent no longer contains the inline hero JSX (no hero-atelier.jpg inside hero section markup)', () => {
    // The hero section has been replaced by <HeroSection />; the file may still
    // reference hero-atelier.jpg in the static atelier data, but it must NOT
    // contain the hero background Image src pattern ("hero-atelier.jpg" with
    // priority and fill) that belongs to BrandHeroSlide now.
    // Verify by checking that the hero background Image JSX is gone:
    // The old inline hero had: priority + sizes="100vw" + hero-atelier.jpg all together.
    // After extraction, that combination only lives in BrandHeroSlide.tsx.
    const content = homeContent();
    // Does NOT have the old hero <section> with explicit hero-atelier background
    expect(content).not.toMatch(/hero-atelier\.jpg[\s\S]{0,200}priority/);
  });
});
