import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

const pageContent = readFileSync(join(SRC, 'app/page.tsx'), 'utf-8');
// HomeContent.tsx holds the presentational JSX extracted from page.tsx for i18n.
// Visual token tests for homepage check homeContent (the presentational layer).
const homeContent = readFileSync(join(SRC, 'components/home/HomeContent.tsx'), 'utf-8');
// FR5: BrandHeroSlide.tsx has been deleted. Hero-specific token tests now check SplitCanvasSlide.tsx.
const splitCanvasContent = readFileSync(join(SRC, 'components/home/SplitCanvasSlide.tsx'), 'utf-8');
const featuredSectionsContent = readFileSync(join(SRC, 'components/home/FeaturedSections.tsx'), 'utf-8');
const megaOffersContent = readFileSync(join(SRC, 'components/MegaOffers.tsx'), 'utf-8');

describe('Homepage Atlas redesign — page.tsx', () => {
  it('uses indigo-700 for primary brand CTAs (not hsl(var(--primary)) only)', () => {
    expect(homeContent).toContain('indigo-700');
  });

  it('uses amber-500 accent tokens', () => {
    expect(homeContent).toContain('amber-500');
  });

  it('uses shadow-atlas-sm or shadow-atlas-md for cards (not plain shadow-md)', () => {
    expect(homeContent).toContain('shadow-atlas-');
  });

  it('uses rounded-2xl on cards', () => {
    expect(homeContent).toContain('rounded-2xl');
  });

  it('has Playfair Display serif for headline', () => {
    expect(homeContent).toContain('Playfair Display');
  });

  it('uses RTL logical properties (ps-/pe-) not left/right', () => {
    // Should NOT have raw left-N or right-N positional margin/padding in class lists
    // Check that if these classes exist they are isolated (not start-/end- replaceable)
    expect(homeContent).not.toMatch(/className="[^"]*\bpl-\d+\b/);
    expect(homeContent).not.toMatch(/className="[^"]*\bpr-\d+\b/);
  });

  it('has trust strip section with ShieldCheck icon', () => {
    expect(homeContent).toContain('ShieldCheck');
  });

  it('has currency in dirham format (درهم) via the locale-driven range key', () => {
    // The literal moved into the locale files (ar/ma show درهم, Latin locales MAD)
    expect(homeContent).toContain("t('home.seller.stat_range_value'");
    const ar = JSON.parse(
      readFileSync(join(process.cwd(), 'src/i18n/locales/ar.json'), 'utf8')
    );
    expect(ar.home.seller.stat_range_value).toContain('درهم');
  });

  it('uses animate-fade-in-up or motion-safe animation in hero (defined in globals.css)', () => {
    // FR5: CampaignArtSlides.tsx deleted. Animation now lives in SplitCanvasSlide art variants.
    // The art hero uses motion-safe:animate-pulse on decorative icons and CSS transitions.
    expect(splitCanvasContent).toMatch(/animate-|motion-safe|transition/);
  });

  it('does not use gradient text background-clip pattern (AI slop)', () => {
    expect(homeContent).not.toContain('bg-clip-text');
  });

  it('does not have numbered section scaffolding 01/02/03 (AI slop)', () => {
    expect(homeContent).not.toMatch(/["']0[1-9]\/0[1-9]["']/);
  });

  it('uses hover-lift pattern for cards', () => {
    expect(homeContent).toMatch(/hover:-translate-y-0\.5|hover-lift/);
  });

  it('uses next/image for all imagery (not <img>)', () => {
    expect(homeContent).toContain("from 'next/image'");
    expect(homeContent).not.toContain('<img ');
  });

  it('has focus rings on interactive elements', () => {
    expect(homeContent).toContain('focus:ring');
  });

  it('uses max-w-7xl container pattern', () => {
    expect(homeContent).toContain('max-w-7xl');
  });
});

describe('FeaturedSections Atlas redesign', () => {
  it('does NOT render a dollar sign for MAD price (bug fix)', () => {
    // The old code had `$${product.price}` — this must be gone
    expect(featuredSectionsContent).not.toContain('`$${product.price}`');
    expect(featuredSectionsContent).not.toContain("'$'");
  });

  it('uses shadow-atlas pattern', () => {
    expect(featuredSectionsContent).toContain('shadow-atlas-');
  });

  it('uses rounded-2xl on product cards', () => {
    expect(featuredSectionsContent).toContain('rounded-2xl');
  });

  it('uses the Atlas primary token for price (raw indigo-700 retired by atlas-p0 pass)', () => {
    expect(featuredSectionsContent).toContain('hsl(var(--primary))');
  });

  it('uses Playfair Display for section headings', () => {
    expect(featuredSectionsContent).toContain('Playfair Display');
  });
});

describe('MegaOffers Atlas redesign', () => {
  it('uses atlas tokens, not raw hex colors or raw palette classes', () => {
    // The old code had ATLAS_PRIMARY = '#252555' used directly in inline styles,
    // then raw indigo-700 classes; the atlas-p0 pass moved it to CSS-var tokens.
    expect(megaOffersContent).toContain('hsl(var(--primary))');
    expect(megaOffersContent).not.toContain("'#252555'");
  });

  it('uses shadow-atlas pattern for cards', () => {
    expect(megaOffersContent).toContain('shadow-atlas-');
  });

  it('uses rounded-2xl', () => {
    expect(megaOffersContent).toContain('rounded-2xl');
  });
});
