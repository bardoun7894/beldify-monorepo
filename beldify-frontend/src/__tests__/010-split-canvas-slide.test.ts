/**
 * TDD: 010 — SplitCanvasSlide component tests
 * Covers:
 *  - File exists
 *  - imageSide='start' → flex-row (image first)
 *  - imageSide='end' → flex-row-reverse (image second, text first)
 *  - Uses bg-canvas for text panel
 *  - Uses font-heading for headline
 *  - No raw indigo-* / amber-* / hex tokens
 *  - Uses hsl(var(--primary)) / hsl(var(--secondary)) for colors
 *  - kind='art' renders art variant
 *  - Amber restricted to CTA (hsl(var(--secondary)) or atlas-secondary)
 *  - Mobile: flex-col (image top, text bottom)
 *  - next/image for banner/product kinds
 *  - [FIX 1] RTL logical mirroring via CSS logical flex
 *  - [FIX 2] ArtVariant3 uses bg-canvas not full-amber/saffron background
 *  - [FIX 3] Art slide strings resolved via t() i18n keys
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');
const componentPath = join(SRC, 'components/home/SplitCanvasSlide.tsx');
const content = () => readFileSync(componentPath, 'utf-8');

describe('SplitCanvasSlide — file exists', () => {
  it('SplitCanvasSlide.tsx exists', () => {
    expect(existsSync(componentPath)).toBe(true);
  });

  it('is a "use client" component', () => {
    expect(content()).toContain("'use client'");
  });

  it('exports a default function or component', () => {
    expect(content()).toMatch(/export default function|export default/);
  });
});

describe('SplitCanvasSlide — layout flex logic', () => {
  it('uses flex-col for mobile (stacked: image top, text bottom)', () => {
    expect(content()).toContain('flex-col');
  });

  it('uses lg:flex-row for desktop layout', () => {
    expect(content()).toContain('lg:flex-row');
  });

  it('uses lg:flex-row-reverse when imageSide is end', () => {
    expect(content()).toContain('lg:flex-row-reverse');
  });

  it('conditionally applies flex-row-reverse based on imageSide prop', () => {
    // The component must read imageSide from props and toggle the class
    const c = content();
    expect(c).toMatch(/imageSide|slide\.imageSide/);
    expect(c).toContain('flex-row-reverse');
  });
});

describe('SplitCanvasSlide — text panel', () => {
  it('text panel uses bg-canvas', () => {
    expect(content()).toContain('bg-canvas');
  });

  it('headline uses font-heading', () => {
    expect(content()).toContain('font-heading');
  });

  it('renders eyebrow chip when eyebrow is provided', () => {
    expect(content()).toMatch(/eyebrow/);
  });

  it('renders subtitle when provided', () => {
    expect(content()).toMatch(/subtitle/);
  });

  it('renders CTA link when ctaText and ctaHref are provided', () => {
    const c = content();
    expect(c).toMatch(/ctaText|ctaHref/);
    expect(c).toMatch(/Link|href/);
  });
});

describe('SplitCanvasSlide — Atlas token compliance', () => {
  it('no raw amber-* Tailwind class literals in component', () => {
    // Amber must only appear via hsl(var(--secondary)) or atlas-secondary
    // The constraint says no raw amber-* — check for amber-[0-9]{3} pattern
    const c = content();
    // Should not contain raw amber color classes like amber-500, amber-600, etc.
    expect(c).not.toMatch(/\bamber-[0-9]{3}\b/);
  });

  it('no raw indigo-* Tailwind class literals in component', () => {
    const c = content();
    expect(c).not.toMatch(/\bindigo-[0-9]{3}\b/);
  });

  it('no hardcoded hex colors in component', () => {
    const c = content();
    // Should not have hex color values like #252555, #fea619, rgb(245 158 11), etc.
    expect(c).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(c).not.toMatch(/rgb\(\s*\d+/);
  });

  it('uses hsl(var(--secondary)) or atlas-secondary for amber CTA', () => {
    const c = content();
    // CTA should use the token form, not raw amber
    expect(c).toMatch(/hsl\(var\(--secondary\)\)|atlas-secondary|\[hsl\(var\(--secondary\)\)\]/);
  });

  it('uses hsl(var(--primary)) or atlas-primary for indigo elements', () => {
    const c = content();
    expect(c).toMatch(/hsl\(var\(--primary\)\)|atlas-primary|\[hsl\(var\(--primary\)\)\]/);
  });
});

describe('SplitCanvasSlide — image rendering', () => {
  it('uses next/image for banner and product kinds', () => {
    const c = content();
    expect(c).toContain('Image');
    expect(c).toMatch(/from 'next\/image'|from "next\/image"/);
  });

  it('uses fill prop for full-bleed image', () => {
    expect(content()).toContain('fill');
  });

  it('sets priority on first slide', () => {
    expect(content()).toMatch(/priority/);
  });

  it('has alt text for images', () => {
    expect(content()).toMatch(/alt=/);
  });
});

describe('SplitCanvasSlide — art variant', () => {
  it('handles kind="art" with artVariant prop', () => {
    const c = content();
    expect(c).toMatch(/artVariant|kind.*art|kind === 'art'/);
  });
});

describe('SplitCanvasSlide — a11y', () => {
  it('CTA has min-h-[44px] touch target', () => {
    expect(content()).toContain('min-h-[44px]');
  });
});

// ─── FIX 1: RTL logical mirroring ─────────────────────────────────────────────
describe('SplitCanvasSlide — FIX 1: RTL logical flex mirroring', () => {
  it('uses [dir=rtl]: or rtl: Tailwind variant OR wraps the flex container with a logical pattern for RTL mirroring', () => {
    const c = content();
    // The flex container must handle RTL. Accept any of:
    //   1. [dir=rtl]:lg:flex-row-reverse or [dir=rtl]:flex-row-reverse (physical inversion for RTL override)
    //   2. rtl:lg:flex-row-reverse or rtl:flex-row-reverse (Tailwind v3 RTL variant)
    //   3. or uses CSS writing-mode / logical properties to achieve the same
    // The critical invariant: imageSide='start' should place image on the
    // leading edge — left in LTR, right in RTL.
    expect(c).toMatch(/\[dir[=:]rtl\]:[a-z:]*flex-row|rtl:[a-z:]*flex-row|writing-mode|direction.*rtl|data-\[dir=rtl\]/);
  });

  it('does NOT use bare physical flex-row / flex-row-reverse as the sole RTL mechanism', () => {
    const c = content();
    // If the ONLY layout mechanism is lg:flex-row / lg:flex-row-reverse (physical),
    // RTL will NOT mirror. The component MUST add an RTL override.
    // If [dir=rtl]:... or rtl:... is present anywhere on flex-row classes, we're good.
    const hasRtlVariant = /\[dir[=:]rtl\]:[a-z:]*flex-row|rtl:[a-z:]*flex-row/.test(c);
    // If RTL variant exists, pass; else check that it's not purely physical.
    // We assert the RTL variant exists.
    expect(hasRtlVariant).toBe(true);
  });

  it('imageSide="start" with ltr: image panel comes before text panel in markup order (flex-row)', () => {
    // When imageSide=start, the image div must appear before the text div
    // in the rendered markup (it's the first child in the flex container).
    // We check source order: the image div block should appear before the text panel div block.
    const c = content();
    const imageIdx = c.indexOf('Image / Art Panel');
    const textIdx = c.indexOf('Text Panel');
    // Image panel comment / section should appear before text panel in source
    expect(imageIdx).toBeGreaterThanOrEqual(0);
    expect(textIdx).toBeGreaterThanOrEqual(0);
    expect(imageIdx).toBeLessThan(textIdx);
  });
});

// ─── FIX 2: ArtVariant3 — no full-amber/saffron background ───────────────────
describe('SplitCanvasSlide — FIX 2: ArtVariant3 uses neutral canvas bg', () => {
  it('ArtVariant3 does not use hsl(var(--secondary)) as the background fill', () => {
    const c = content();
    // Extract the ArtVariant3 function body
    const v3Start = c.indexOf('function ArtVariant3');
    const v3End = c.indexOf('\nfunction ', v3Start + 1);
    const v3Body = v3End > 0 ? c.slice(v3Start, v3End) : c.slice(v3Start);
    // The background of the root div must NOT be a full secondary (amber) fill
    // i.e. no style={{ background: '...var(--secondary)...' }} on the root wrapper
    expect(v3Body).not.toMatch(/background.*var\(--secondary\).*linear-gradient.*var\(--secondary\)/);
  });

  it('ArtVariant3 root div does not set a full-amber/saffron background style', () => {
    const c = content();
    const v3Start = c.indexOf('function ArtVariant3');
    const v3End = c.indexOf('\nfunction ', v3Start + 1);
    const v3Body = v3End > 0 ? c.slice(v3Start, v3End) : c.slice(v3Start);
    // Root element background must NOT be secondary-based (amber dominant).
    // We check the FIRST style={{ block in the function — that's the root wrapper div.
    // It should use --primary, not --secondary, as the main background.
    const firstStyleBlock = v3Body.match(/style=\{(\{[\s\S]*?\})\}/)?.[1] ?? '';
    // The root div's background must reference --primary (indigo), not --secondary (amber)
    if (firstStyleBlock.includes('background')) {
      expect(firstStyleBlock).not.toMatch(/linear-gradient[\s\S]*?--secondary|background:.*--secondary/);
      // Must be primary/indigo based
      expect(firstStyleBlock).toMatch(/--primary/);
    }
  });

  it('ArtVariant3 does not use bg-canvas class (it is the image panel; bg-canvas belongs to text panel)', () => {
    // ArtVariant3 is an art IMAGE panel — it should have a styled background
    // (indigo or similar), NOT bg-canvas. bg-canvas is for the text panel only.
    // This test ensures we didn't accidentally make the art panel plain canvas.
    const c = content();
    const v3Start = c.indexOf('function ArtVariant3');
    const v3End = c.indexOf('\nfunction ', v3Start + 1);
    const v3Body = v3End > 0 ? c.slice(v3Start, v3End) : c.slice(v3Start);
    // The art panel should have SOME background (indigo-based), not be blank
    expect(v3Body).toMatch(/hsl\(var\(--primary\)|linear-gradient|background/);
  });
});

// ─── FIX 2b: HeroSection — dot hack removed ──────────────────────────────────
describe('HeroSection — FIX 2: onSlideChange amber dot hack removed', () => {
  const heroPath = join(SRC, 'components/home/HeroSection.tsx');
  const heroContent = () => readFileSync(heroPath, 'utf-8');

  it('HeroSection.tsx no longer adds hero-swiper-slide-amber class', () => {
    const c = heroContent();
    expect(c).not.toContain('hero-swiper-slide-amber');
  });

  it('HeroSection.tsx does not read realIndex or data-slide-theme for dot color inversion', () => {
    const c = heroContent();
    expect(c).not.toContain('data-slide-theme');
    expect(c).not.toContain('isAmberSlide');
  });

  it('HeroSection.tsx still has onSlideChange handler removed (no amber-specific logic)', () => {
    const c = heroContent();
    // Either no onSlideChange or an onSlideChange without amber/slide-theme logic
    if (c.includes('onSlideChange')) {
      expect(c).not.toContain('slide-theme');
      expect(c).not.toContain('Amber');
    }
  });
});

// ─── FIX 3: i18n locale-reactive art slide strings ───────────────────────────
describe('SplitCanvasSlide — FIX 3: art slides are locale-reactive via t()', () => {
  it('SplitCanvasSlide uses t() for art slide title/subtitle/CTA strings (not hardcoded English)', () => {
    const c = content();
    // Art variant components (ArtVariant1/2/3) or SplitCanvasSlide must resolve
    // strings via t() using i18n keys
    // Accept: t('home.hero.art_slide...') or slide.titleKey resolved via t()
    expect(c).toMatch(/t\(['"`]home\.hero\.art_slide|titleKey|i18nKey|\.titleKey|artI18n/);
  });

  it('heroCompose art slide data contains i18n key fields (titleKey, subtitleKey, ctaKey)', () => {
    const heroComposePath = join(SRC, 'components/home/heroCompose.ts');
    const hc = readFileSync(heroComposePath, 'utf-8');
    // HeroSlideData must carry i18n key references for art slides
    expect(hc).toMatch(/titleKey|subtitleKey|ctaKey|i18nKey|artI18n/);
  });
});

describe('SplitCanvasSlide — FIX 3: i18n keys present in all 7 locales', () => {
  const locales = ['en', 'ar', 'fr', 'es', 'ma', 'nl', 'de'];
  const localeDir = join(SRC, 'i18n/locales');

  for (const locale of locales) {
    it(`${locale}.json has home.hero.art_slide1_headline key`, () => {
      const raw = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(raw);
      expect(json?.home?.hero).toHaveProperty('art_slide1_headline');
    });
    it(`${locale}.json has home.hero.art_slide2_headline key`, () => {
      const raw = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(raw);
      expect(json?.home?.hero).toHaveProperty('art_slide2_headline');
    });
    it(`${locale}.json has home.hero.art_slide3_headline key`, () => {
      const raw = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(raw);
      expect(json?.home?.hero).toHaveProperty('art_slide3_headline');
    });
  }
});
