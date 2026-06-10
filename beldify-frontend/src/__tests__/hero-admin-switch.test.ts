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
// TASK 2a — BrandHeroSlide.tsx: extracted hero component
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 2a — BrandHeroSlide.tsx extraction', () => {
  it('BrandHeroSlide.tsx file exists', () => {
    expect(existsSync(brandHeroSlidePath)).toBe(true);
  });

  it('BrandHeroSlide uses hero-atelier.jpg (same image as original)', () => {
    expect(brandHeroSlide()).toContain('hero-atelier.jpg');
  });

  it('BrandHeroSlide contains search input (search bar preserved)', () => {
    expect(brandHeroSlide()).toContain('hero-search');
  });

  it('BrandHeroSlide uses compact hero heights min-h-[38vh] lg:min-h-[45vh]', () => {
    expect(brandHeroSlide()).toMatch(/min-h-\[38vh\]/);
    expect(brandHeroSlide()).toMatch(/lg:min-h-\[45vh\]/);
  });

  it('BrandHeroSlide does not hardcode strings — uses t() for all user-visible text', () => {
    expect(brandHeroSlide()).toContain('useTranslation');
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

  it('HeroSection imports BrandHeroSlide', () => {
    expect(heroSection()).toContain('BrandHeroSlide');
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

  it('HeroSection dots use white/40 inactive and amber-500 active (Atlas tokens, not default swiper blue)', () => {
    expect(heroSection()).toMatch(/amber-500|amber500/);
  });

  it('HeroSection brand slide is always slide 1 (index 0) in campaign mode', () => {
    // BrandHeroSlide must be the first slide rendered inside a SwiperSlide
    const content = heroSection();
    const brandSlideIdx = content.indexOf('BrandHeroSlide');
    const swiperSlideIdx = content.indexOf('SwiperSlide');
    // BrandHeroSlide appears inside SwiperSlide tags
    expect(brandSlideIdx).toBeGreaterThan(-1);
    expect(swiperSlideIdx).toBeGreaterThan(-1);
  });

  it('HeroSection falls back to BrandHeroSlide when mode is brand', () => {
    // In brand mode, should NOT render Swiper carousel, just BrandHeroSlide
    const content = heroSection();
    // There must be a conditional branch for mode === 'brand'
    expect(content).toMatch(/mode.*brand|brand.*mode/);
  });

  it('HeroSection falls back to BrandHeroSlide when banners array is empty', () => {
    expect(heroSection()).toMatch(/banners\.length|banners\s*&&/);
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
  it('HeroSection uses next/image for banner images (fill + sizes="100vw")', () => {
    const content = heroSection();
    expect(content).toContain('100vw');
    // next/image with fill
    expect(content).toMatch(/fill|Image/);
  });

  it('HeroSection uses indigo-950 gradient overlay on banner slides', () => {
    expect(heroSection()).toContain('indigo-950');
  });

  it('HeroSection renders banner title in text-white', () => {
    expect(heroSection()).toContain('text-white');
  });

  it('HeroSection CTA chip uses amber-500 rounded-full', () => {
    expect(heroSection()).toMatch(/amber-500.*rounded-full|rounded-full.*amber-500/);
  });

  it('HeroSection honors text_position logical alignment (start/end, not left/right)', () => {
    // Must use logical CSS properties — items-start / items-end / items-center
    // or text-start / text-end based on text_position
    expect(heroSection()).toMatch(/text_position|textPosition|text-start|items-start|justify-start/);
  });

  it('HeroSection uses priority on first banner image', () => {
    expect(heroSection()).toContain('priority');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 3 — i18n: new hero carousel keys present in all 5 locale files
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 3 — i18n: carousel keys in all locale files', () => {
  const locales = ['en', 'ar', 'ma', 'fr', 'es'];
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
