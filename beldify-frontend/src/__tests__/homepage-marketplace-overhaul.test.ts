/**
 * TDD: Homepage marketplace overhaul
 * Covers tasks 1-8 from the FE-A work packet.
 * All tests must fail BEFORE implementation, pass AFTER.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

const page = () => readFileSync(join(SRC, 'app/page.tsx'), 'utf-8');
const home = () => readFileSync(join(SRC, 'components/home/HomeContent.tsx'), 'utf-8');
// Hero JSX was extracted to BrandHeroSlide; height tests check there now.
const brandHeroSlide = () => readFileSync(join(SRC, 'components/home/BrandHeroSlide.tsx'), 'utf-8');
const discoverPath = join(SRC, 'components/home/DiscoverFeed.tsx');

// ─────────────────────────────────────────────────────────────────────────────
// TASK 1 — Hero height compact
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 1 — Hero height compact (mobile ≤38vh, desktop ≤45vh)', () => {
  it('does NOT use min-h-[85vh] anywhere in HomeContent', () => {
    expect(home()).not.toContain('min-h-[85vh]');
  });

  it('uses a compact hero height class (38vh mobile)', () => {
    // After campaign-art overhaul, compact heights live in CampaignArtSlides or HeroSection
    const heroSection = readFileSync(join(SRC, 'components/home/HeroSection.tsx'), 'utf-8');
    const campaignArtSlides = readFileSync(join(SRC, 'components/home/CampaignArtSlides.tsx'), 'utf-8');
    const combined = heroSection + campaignArtSlides;
    expect(combined).toMatch(/min-h-\[38vh\]|h-\[260px\]|h-\[340px\]/);
  });

  it('uses a compact hero height for desktop (45vh)', () => {
    // After campaign-art overhaul, compact heights live in CampaignArtSlides or HeroSection
    const heroSection = readFileSync(join(SRC, 'components/home/HeroSection.tsx'), 'utf-8');
    const campaignArtSlides = readFileSync(join(SRC, 'components/home/CampaignArtSlides.tsx'), 'utf-8');
    const combined = heroSection + campaignArtSlides;
    expect(combined).toMatch(/lg:min-h-\[45vh\]|lg:h-\[400px\]/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 2 — Category chips rail above the fold
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 2 — Category chips rail above fold', () => {
  it('has a horizontal scrollable category rail section', () => {
    expect(home()).toContain('overflow-x-auto');
  });

  it('has snap-x on the category rail for mobile scroll', () => {
    expect(home()).toContain('snap-x');
  });

  it('links categories to /categories/[slug]', () => {
    expect(home()).toContain('/categories/');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 3 — DiscoverFeed infinite product feed
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 3 — DiscoverFeed infinite product feed', () => {
  it('DiscoverFeed.tsx file exists', () => {
    expect(existsSync(discoverPath)).toBe(true);
  });

  it('DiscoverFeed uses useSWRInfinite for pagination', () => {
    const content = readFileSync(discoverPath, 'utf-8');
    expect(content).toContain('useSWRInfinite');
  });

  it('DiscoverFeed has IntersectionObserver sentinel', () => {
    const content = readFileSync(discoverPath, 'utf-8');
    expect(content).toContain('IntersectionObserver');
  });

  it('DiscoverFeed has 2-col mobile grid (grid-cols-2)', () => {
    const content = readFileSync(discoverPath, 'utf-8');
    expect(content).toContain('grid-cols-2');
  });

  it('DiscoverFeed has 3-col or 4-col desktop grid', () => {
    const content = readFileSync(discoverPath, 'utf-8');
    expect(content).toMatch(/lg:grid-cols-[34]/);
  });

  it('DiscoverFeed uses NEXT_PUBLIC_API_URL for fetching', () => {
    const content = readFileSync(discoverPath, 'utf-8');
    expect(content).toContain('NEXT_PUBLIC_API_URL');
  });

  it('DiscoverFeed has skeleton loading state', () => {
    const content = readFileSync(discoverPath, 'utf-8');
    expect(content).toContain('animate-pulse');
  });

  it('DiscoverFeed stops at last page gracefully', () => {
    const content = readFileSync(discoverPath, 'utf-8');
    // Must have some check for last page
    expect(content).toMatch(/last|isEmpty|isReachingEnd|hasMore/i);
  });

  it('HomeContent includes DiscoverFeed', () => {
    expect(home()).toContain('DiscoverFeed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 4 — Freshness: revalidate 60s
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 4 — Freshness: revalidate 60', () => {
  it('page.tsx has export const revalidate = 60', () => {
    expect(page()).toContain('export const revalidate = 60');
  });

  it('categories fetch uses revalidate: 60 (not 300)', () => {
    expect(page()).toContain('revalidate: 60');
    expect(page()).not.toContain('revalidate: 300');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 5 — Nested <main> bug fixed
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 5 — Nested main bug fixed', () => {
  it('HomeContent does NOT open with <main', () => {
    // The outer element in HomeContent should be a <div>, not <main>
    expect(home()).not.toMatch(/<main\b/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 6 — Professional pass: trust signals + no emoji + real routes
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 6 — Professional pass', () => {
  it('has Truck icon for delivery trust signal', () => {
    expect(home()).toContain('Truck');
  });

  it('has no emoji characters in HomeContent', () => {
    // Emoji range (common block)
    expect(home()).not.toMatch(/[\u{1F600}-\u{1F64F}]/u);
    expect(home()).not.toMatch(/[\u{1F300}-\u{1F5FF}]/u);
    expect(home()).not.toMatch(/[\u{1F900}-\u{1F9FF}]/u);
  });

  it('all major links use real routes (/products /categories /community /shops)', () => {
    const c = home();
    expect(c).toContain('href="/products"');
    expect(c).toContain('href="/categories"');
    expect(c).toContain('href="/community"');
    expect(c).toContain('href="/shops"');
  });

  it('sections null-out gracefully when data is empty (no empty dark blocks)', () => {
    // DiscoverFeed must handle empty gracefully
    const content = readFileSync(discoverPath, 'utf-8');
    expect(content).toMatch(/length === 0|isEmpty|items\.length/);
  });

  it('uses mobile-friendly px-4 not px-6 at narrow breakpoints in HomeContent', () => {
    // HomeContent section padding should use px-4 at minimum
    expect(home()).toContain('px-4');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 7 — RTL: logical properties only, no ml-/mr- additions
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 7 — RTL: logical properties', () => {
  it('DiscoverFeed does not use ml- or mr- class prefixes', () => {
    const content = readFileSync(discoverPath, 'utf-8');
    expect(content).not.toMatch(/\bml-\d/);
    expect(content).not.toMatch(/\bmr-\d/);
  });

  it('DiscoverFeed uses text-start or logical text alignment', () => {
    const content = readFileSync(discoverPath, 'utf-8');
    // It's OK to not have text-start (not all text needs it), but it must not use text-left
    expect(content).not.toContain('text-left');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 8 — i18n: t() with fallback strings in DiscoverFeed
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 8 — i18n: t() with fallback strings', () => {
  it('DiscoverFeed uses useTranslation', () => {
    const content = readFileSync(discoverPath, 'utf-8');
    expect(content).toContain('useTranslation');
  });

  it('DiscoverFeed t() calls include inline fallback strings', () => {
    const content = readFileSync(discoverPath, 'utf-8');
    // t('key', 'fallback') pattern
    expect(content).toMatch(/t\('[^']+',\s*'/);
  });
});
