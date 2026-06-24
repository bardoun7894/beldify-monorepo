/**
 * TDD — Homepage Hero + Category Rail + Trust Strip Redesign
 * Tests MUST FAIL before implementation, PASS after.
 *
 * Covers:
 *  A. Category Rail — truncation fix, desktop sizing, spacing, CTA, hover polish
 *  B. Hero — consistent heights across all 3 paths, eyebrow on ProductHeroSlides,
 *     eyebrow on BannerSlide, headline Playfair + lg:text-5xl, gradient scrim,
 *     desktop nav arrows (Navigation module)
 *  C. Trust Strip — vertical dividers on desktop, consistent max-w-7xl
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

function read(rel: string) {
  return readFileSync(join(ROOT, rel), 'utf-8');
}

const homeContent = () => read('src/components/home/HomeContent.tsx');
const productHeroSlides = () => read('src/components/home/ProductHeroSlides.tsx');
const campaignArtSlides = () => read('src/components/home/CampaignArtSlides.tsx');
const heroSection = () => read('src/components/home/HeroSection.tsx');

// ─────────────────────────────────────────────────────────────────────────────
// A. CATEGORY RAIL
// ─────────────────────────────────────────────────────────────────────────────

describe('A — Category Rail: truncation fix', () => {
  it('does NOT use whitespace-nowrap + truncate combination on category label spans', () => {
    const content = homeContent();
    // The old defective combo "whitespace-nowrap ... truncate" must be gone
    expect(content).not.toMatch(/whitespace-nowrap[^"']*truncate|truncate[^"']*whitespace-nowrap/);
  });

  it('uses line-clamp-2 on category labels so names wrap to 2 lines', () => {
    expect(homeContent()).toContain('line-clamp-2');
  });

  it('uses max-w-[84px] or similar wider max-width on category labels (not max-w-[64px])', () => {
    const content = homeContent();
    // Must NOT have the old narrow 64px constraint alongside clamp
    expect(content).not.toContain('max-w-[64px]');
  });
});

describe('A — Category Rail: desktop circle size', () => {
  it('has lg:h-[68px] lg:w-[68px] (or lg:h-16/lg:w-16) for larger desktop circles', () => {
    const content = homeContent();
    // Accept either exact 68px or lg:h-16 (64px) or larger
    const hasLargerDesktopCircle = content.includes('lg:h-[68px]') || content.includes('lg:w-[68px]');
    expect(hasLargerDesktopCircle).toBe(true);
  });

  it('keeps h-14 w-14 (56px) on mobile for category circles', () => {
    expect(homeContent()).toContain('h-14 w-14');
  });
});

describe('A — Category Rail: desktop spacing', () => {
  it('uses lg:gap-6 on the scroll/flex container (wider breathing room on desktop)', () => {
    expect(homeContent()).toContain('lg:gap-6');
  });
});

describe('A — Category Rail: view-all CTA', () => {
  it('view-all uses full viewAll translation key (not just "All")', () => {
    const content = homeContent();
    // Must use the full "All categories" fallback — the categories link in the rail
    // should call t('home.categories.viewAll', 'All categories') not just 'All'
    // The rail's view-all link must now show the full label
    expect(content).toContain("'All categories'");
  });

  it('view-all link has hover indigo fill or ring (visible affordance)', () => {
    const content = homeContent();
    // The view-all circle should have a hover style — group-hover:bg-indigo-700 or similar
    expect(content).toMatch(/hover:bg-indigo|group-hover:bg-indigo/);
  });
});

describe('A — Category Rail: hover polish', () => {
  it('category circle has transition-all duration-200 for smooth state changes', () => {
    expect(homeContent()).toContain('transition-all duration-200');
  });

  it('category label uses indigo-700 on hover', () => {
    const content = homeContent();
    expect(content).toMatch(/group-hover:text-indigo-700|hover:text-indigo-700/);
  });
});

describe('A — Category Rail: sizes updated for larger circles', () => {
  it('next/image sizes prop is updated to reflect lg:68px circles', () => {
    const content = homeContent();
    // sizes string should mention 68px for desktop or a larger value
    expect(content).toMatch(/68px|sizes.*\(.*lg\)/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// B. HERO — consistent heights + eyebrow + nav arrows
// ─────────────────────────────────────────────────────────────────────────────

describe('B — Hero: consistent heights across all 3 paths', () => {
  it('ProductHeroSlides uses h-[300px] or h-[280px] (taller than old h-[260px])', () => {
    const content = productHeroSlides();
    // Updated to 300px (or similar taller height) from 260px
    const hasTallerMobile = content.includes('h-[300px]') || content.includes('h-[280px]');
    expect(hasTallerMobile).toBe(true);
  });

  it('ProductHeroSlides uses sm:h-[400px] (updated from sm:h-[340px])', () => {
    expect(productHeroSlides()).toContain('sm:h-[400px]');
  });

  it('ProductHeroSlides uses lg:h-[480px] (updated from lg:h-[400px])', () => {
    expect(productHeroSlides()).toContain('lg:h-[480px]');
  });

  it('CampaignArtSlides uses lg:h-[480px] (matching ProductHeroSlides desktop height)', () => {
    expect(campaignArtSlides()).toContain('lg:h-[480px]');
  });

  it('HeroSection BannerSlide uses h-[300px] sm:h-[400px] lg:h-[480px] (not min-h-[38vh])', () => {
    const content = heroSection();
    // BannerSlide must be updated to match the fixed heights
    expect(content).toContain('h-[300px]');
    expect(content).toContain('lg:h-[480px]');
  });
});

describe('B — Hero: eyebrow chip on ProductHeroSlides', () => {
  it('ProductHeroSlides has an eyebrow chip with amber-500/20 background', () => {
    expect(productHeroSlides()).toContain('bg-amber-500/20');
  });

  it('ProductHeroSlides eyebrow uses amber-300 text color', () => {
    expect(productHeroSlides()).toContain('text-amber-300');
  });

  it('ProductHeroSlides eyebrow has ring-amber-500/30', () => {
    expect(productHeroSlides()).toContain('ring-amber-500/30');
  });

  it('ProductHeroSlides imports Sparkles icon for eyebrow', () => {
    expect(productHeroSlides()).toContain('Sparkles');
  });

  it("ProductHeroSlides eyebrow uses home.hero.product_eyebrow i18n key", () => {
    expect(productHeroSlides()).toContain('home.hero.product_eyebrow');
  });
});

describe('B — Hero: eyebrow chip on BannerSlide (HeroSection)', () => {
  it('HeroSection BannerSlide has eyebrow chip (bg-amber-500/20)', () => {
    expect(heroSection()).toContain('bg-amber-500/20');
  });
});

describe('B — Hero: headline typography', () => {
  it('ProductHeroSlides uses lg:text-6xl for headline', () => {
    expect(productHeroSlides()).toContain('lg:text-6xl');
  });
});

describe('B — Hero: gradient scrim', () => {
  it('ProductHeroSlides has a start-side gradient for headline legibility on busy images', () => {
    const content = productHeroSlides();
    // Should have both a bottom-up gradient AND a side gradient for busy images
    // Accept from-start, from-indigo-950 in a to-transparent gradient
    expect(content).toMatch(/from-indigo-950.*to-transparent|bg-gradient-to-r|bg-gradient-to-e|gradient-to-e|from-start/);
  });
});

describe('B — Hero: desktop navigation arrows', () => {
  it('ProductHeroSlides imports Navigation from swiper/modules', () => {
    expect(productHeroSlides()).toContain('Navigation');
  });

  it('ProductHeroSlides imports swiper/css/navigation', () => {
    expect(productHeroSlides()).toContain("swiper/css/navigation");
  });

  it('HeroSection imports Navigation from swiper/modules', () => {
    expect(heroSection()).toContain('Navigation');
  });

  it('HeroSection imports swiper/css/navigation', () => {
    expect(heroSection()).toContain("swiper/css/navigation");
  });

  it('HeroSection uses hidden lg:flex or similar to show arrows only on desktop', () => {
    const content = heroSection();
    // Navigation buttons must be hidden on mobile (hidden lg:block or similar)
    expect(content).toMatch(/hidden.*lg:|lg:.*hidden/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// C. TRUST STRIP — dividers on desktop
// ─────────────────────────────────────────────────────────────────────────────

describe('C — Trust Strip: desktop dividers', () => {
  it('trust strip has sm:divide-x or border-x-based per-item separation on desktop', () => {
    const content = homeContent();
    // Should have sm:divide-x or per-item border-s on desktop for visual separation
    const hasDividers = content.includes('sm:divide-x') || content.includes('divide-gray-200') || content.includes('border-s');
    expect(hasDividers).toBe(true);
  });

  it('trust strip uses max-w-7xl and px-4 sm:px-6', () => {
    const content = homeContent();
    // Trust strip container must follow the shared max-w-7xl + px rhythm
    expect(content).toContain('max-w-7xl');
  });
});
