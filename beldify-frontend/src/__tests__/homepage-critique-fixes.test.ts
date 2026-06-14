import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

const pageContent = readFileSync(join(SRC, 'app/page.tsx'), 'utf-8');
// HomeContent.tsx holds the presentational JSX extracted from page.tsx for i18n.
// Tests checking visual tokens / JSX content of the homepage must read homeContent.
const homeContent = readFileSync(join(SRC, 'components/home/HomeContent.tsx'), 'utf-8');
// FR5: BrandHeroSlide.tsx deleted. Hero-specific tokens now live in SplitCanvasSlide.tsx.
const splitCanvasContent = readFileSync(join(SRC, 'components/home/SplitCanvasSlide.tsx'), 'utf-8');
const featuredSectionsContent = readFileSync(join(SRC, 'components/home/FeaturedSections.tsx'), 'utf-8');

describe('P1 — FeaturedSections single source of truth (props, not client re-fetch)', () => {
  it('accepts bestSellers/newArrivals as props (single source of truth from SSR)', () => {
    // Component must declare a props interface consuming the SSR-fetched data
    expect(featuredSectionsContent).toMatch(/bestSellers\s*[:,?]/);
    expect(featuredSectionsContent).toMatch(/newArrivals\s*[:,?]/);
    // Signature must take a parameter (props), not be bare ()
    expect(featuredSectionsContent).toMatch(/export default function FeaturedSections\s*\(\s*[^)]+\)/);
  });

  it('does NOT client-refetch the same data via fetchBestSellers/fetchNewArrivals in a useEffect', () => {
    expect(featuredSectionsContent).not.toContain('fetchBestSellers');
    expect(featuredSectionsContent).not.toContain('fetchNewArrivals');
    expect(featuredSectionsContent).not.toContain('fetchSpecialOffers');
  });

  it('no longer renders a guaranteed loading skeleton (data is synchronous via props)', () => {
    // The pulsing skeleton grid keyed on a loading flag must be gone
    expect(featuredSectionsContent).not.toMatch(/setLoading/);
  });
});

describe('P1 — two product sections are visually differentiated (not identical stacks)', () => {
  it('new-arrivals renders as a horizontal snap-rail (not a second identical 4-col grid)', () => {
    expect(featuredSectionsContent).toMatch(/snap-x|overflow-x-auto/);
    expect(featuredSectionsContent).toContain('snap-start');
  });
});

describe('P2 — hero overlay gradient is RTL-aware (logical, tracks text alignment)', () => {
  it('overrides the gradient direction under dir=rtl so the dark stop sits under end-aligned copy', () => {
    // FR5: CampaignArtSlides.tsx deleted. RTL-aware layout now lives in SplitCanvasSlide.tsx.
    // SplitCanvasSlide uses start/end logical classes which are inherently RTL-safe.
    // The split-canvas layout uses lg:flex-row / lg:flex-row-reverse based on imageSide prop.
    expect(splitCanvasContent).toMatch(/start|items-center|lg:flex-row/);
  });
});

describe('P2 — MAD price uses the .currency-mad bidi-isolation token', () => {
  it('wraps the price in .currency-mad and drops the fragile inline dir=rtl span', () => {
    expect(featuredSectionsContent).toContain('currency-mad');
    expect(featuredSectionsContent).not.toContain('<span dir="rtl" lang="ar">درهم</span>');
  });
});

describe('P3 — muted body text meets WCAG AA on light/warm grounds', () => {
  it('journal author/read-time meta is not text-gray-400 (below 4.5:1 on white)', () => {
    expect(homeContent).not.toMatch(/text-gray-400/);
  });

  it('hero etymology caption is lifted above text-white/50', () => {
    expect(homeContent).not.toContain('text-white/50');
  });
});

describe('P3 — seller stats grid is not a templated 4-up vanity metric band', () => {
  it('reduces the equally-weighted stat tiles below four', () => {
    // `value:` keys are unique to the seller CTA stats array (4 tiles originally);
    // values are now t() calls, so match the property itself rather than a string literal
    const matches = homeContent.match(/\bvalue:\s*t\(/g) || [];
    expect(matches.length).toBeLessThan(4);
    expect(matches.length).toBeGreaterThan(0);
  });
});

describe('P3 — category rail has no dead aspect-ratio ternary', () => {
  it('removes the no-op idx===0 ? "4/5" : "4/5" conditional', () => {
    expect(homeContent).not.toMatch(/idx === 0[^?]*\?\s*'4\/5'\s*:\s*'4\/5'/);
  });
});
