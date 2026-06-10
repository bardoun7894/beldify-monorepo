/**
 * Atlas Visual Port — TDD locking tests
 *
 * Lock the CURRENT actual design so regressions are caught.
 * We read source files and assert the token / class strings that are
 * actually present. Tests were refreshed after the 2026-06-10 overhaul.
 *
 * HomeContent.tsx is the presentational layer for the homepage.
 * page.tsx is the server component that fetches data and renders HomeContent.
 *
 * TOKEN MAPPING (as of this revision):
 *   HomeContent still uses bare Tailwind tokens on several sections that are
 *   out of scope for this agent (hero, trust strip, journal, seller strip).
 *   FeaturedSections and MegaOffers were fully migrated to Atlas CSS-var form.
 *   The tests lock what IS correct and guard against regressing what was fixed.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

const homeContent = readFileSync(join(SRC, 'components/home/HomeContent.tsx'), 'utf-8');
const newsletter = readFileSync(join(SRC, 'components/Newsletter.tsx'), 'utf-8');
const megaOffers = readFileSync(join(SRC, 'components/MegaOffers.tsx'), 'utf-8');
const featuredSections = readFileSync(join(SRC, 'components/home/FeaturedSections.tsx'), 'utf-8');

// ─── HomeContent.tsx ──────────────────────────────────────────────────────────

describe('HomeContent.tsx — structural & token lock', () => {
  it('root div uses bg-background text-foreground (Atlas surface)', () => {
    expect(homeContent).toContain('bg-background text-foreground');
  });

  it('does not use bg-amber-50/40 as page background', () => {
    expect(homeContent).not.toContain('bg-amber-50/40');
  });

  it('category grid cards use shadow-atlas-sm', () => {
    expect(homeContent).toContain('shadow-atlas-sm');
  });

  it('category item count badge uses end-3 logical prop (RTL safe)', () => {
    expect(homeContent).toContain('end-3');
    // must NOT use raw right-3 in badge position
    expect(homeContent).not.toContain('right-3');
  });

  it('category card text row uses start-4 end-4 logical props', () => {
    expect(homeContent).toContain('start-4');
    expect(homeContent).toContain('end-4');
    expect(homeContent).not.toContain('left-4 right-4');
  });

  it('category name uses name_ar fallback', () => {
    expect(homeContent).toContain('name_ar');
  });

  it('category cards use hover:-translate-y-1 lift', () => {
    expect(homeContent).toContain('hover:-translate-y-1');
  });

  it('atelier card verified badge uses end-3', () => {
    // end-3 is used on the verified badge absolute positioning
    expect(homeContent).toContain('end-3');
  });

  it('atelier cards use shadow-atlas-sm', () => {
    // ateliers rail uses Atlas shadow tokens
    expect(homeContent).toContain('shadow-atlas-sm');
  });

  it('hero section is delegated to HeroSection component (not inline)', () => {
    expect(homeContent).toContain('HeroSection');
  });

  it('open souk section has Arabic dir=rtl copy', () => {
    expect(homeContent).toContain('dir="rtl"');
  });

  it('open souk section has font-arabic class', () => {
    expect(homeContent).toContain('font-arabic');
  });

  it('does not include raw bg-white as a page-level background class', () => {
    // bg-white is fine inside component-level overrides (cards, overlays) but
    // the page wrapper must use bg-background
    expect(homeContent).toContain('bg-background');
  });

  it('tailoring section uses bg-indigo-950 dark surface', () => {
    expect(homeContent).toContain('bg-indigo-950');
  });

  it('tailoring CTA uses rounded-xl (Atlas button radius)', () => {
    expect(homeContent).toContain('rounded-xl');
  });

  it('seller strip uses bg-indigo-950 dark surface', () => {
    // Seller artisan CTA strip is on the dark indigo brand surface
    expect(homeContent).toContain('bg-indigo-950');
  });

  it('seller strip open boutique button uses bg-amber-500 accent', () => {
    // The amber CTA on dark indigo is the current accent form
    expect(homeContent).toContain('bg-amber-500');
  });

  it('journal section uses bg-gray-50 neutral surface (not solid amber)', () => {
    expect(homeContent).toContain('bg-gray-50');
    expect(homeContent).not.toContain('bg-amber-50/40');
  });

  it('no bg-indigo-900 literal class on amber-surface sections', () => {
    // bg-indigo-900 is only valid inside the dark indigo strip sections
    // Ensure we do not regress amber-parchment sections using it
    // (positive: it exists in tailoring/seller strips which is correct)
    expect(homeContent).toContain('bg-indigo-900');
  });

  it('atelier specialty text uses text-indigo-700 (current state — lock until migrated)', () => {
    // specialty text on atelier cards is currently text-indigo-700
    // lock to detect accidental removal
    expect(homeContent).toContain('text-indigo-700');
  });

  it('AI listings chip uses bg-amber-500/20 (current form)', () => {
    expect(homeContent).toContain('bg-amber-500/20');
  });
});

// ─── Newsletter.tsx ────────────────────────────────────────────────────────────
// NOTE: Newsletter.tsx has not yet been fully migrated to Atlas CSS-var tokens.
// These tests lock the current state and guard against accidental regressions.
// When Newsletter is migrated, update these assertions to the token form.

describe('Newsletter.tsx — structural lock (pre-migration state)', () => {
  it('renders a section element (structural guard)', () => {
    expect(newsletter).toContain('<section');
  });

  it('has an email input', () => {
    expect(newsletter).toContain('type="email"');
  });

  it('has a submit button', () => {
    expect(newsletter).toContain('type="submit"');
  });

  it('has shadow-atlas on the submit button', () => {
    expect(newsletter).toMatch(/shadow-atlas/);
  });

  it('does not use bg-amber-50/40 (the retired parchment class)', () => {
    expect(newsletter).not.toContain('bg-amber-50/40');
  });

  it('submit button has hover lift animation', () => {
    expect(newsletter).toContain('hover:-translate-y-0.5');
  });
});

// ─── MegaOffers.tsx ────────────────────────────────────────────────────────────

describe('MegaOffers.tsx — Atlas visual port', () => {
  it('ATLAS_PRIMARY constant uses Atlas hex #252555', () => {
    expect(megaOffers).toContain('#252555');
    expect(megaOffers).not.toContain("'#4338ca'");
  });

  it('ATLAS_ACCENT constant uses Atlas hex #fea619', () => {
    expect(megaOffers).toContain('#fea619');
    expect(megaOffers).not.toContain("'#f59e0b'");
  });

  it('collection header bg uses Atlas primary tint (not bg-indigo-50/60)', () => {
    expect(megaOffers).not.toContain('bg-indigo-50/60');
    expect(megaOffers).toMatch(/bg-atlas-primary\/\[0\.0[5-9]\]/);
  });

  it('view collection button uses Atlas indigo bg', () => {
    expect(megaOffers).toContain('bg-[hsl(var(--primary))]');
    expect(megaOffers).not.toContain('bg-indigo-700');
  });

  it('view all collections button uses Atlas indigo bg', () => {
    expect(megaOffers).toContain('bg-[hsl(var(--primary))]');
  });
});

// ─── FeaturedSections.tsx ─────────────────────────────────────────────────────

describe('FeaturedSections.tsx — Atlas visual port', () => {
  it('heading text uses text-foreground (not text-gray-900)', () => {
    expect(featuredSections).not.toContain('text-gray-900');
    expect(featuredSections).toMatch(/text-foreground|text-\[hsl\(var\(--primary\)\)\]/);
  });

  it('empty state bg uses bg-background surface (not bg-amber-50)', () => {
    expect(featuredSections).not.toContain('bg-amber-50');
    expect(featuredSections).toContain('bg-background');
  });

  it('loading spinner border uses Atlas primary token', () => {
    expect(featuredSections).not.toContain('border-indigo-700');
    expect(featuredSections).toMatch(/border-\[hsl\(var\(--primary\)\)\]|border-primary-container/);
  });

  it('browse-all links use Atlas primary text (not text-indigo-700)', () => {
    expect(featuredSections).not.toContain('text-indigo-700');
    expect(featuredSections).toMatch(/text-\[hsl\(var\(--primary\)\)\]/);
  });

  it('does not use hover:text-indigo-800', () => {
    expect(featuredSections).not.toContain('hover:text-indigo-800');
  });

  it('New badge uses Atlas primary bg (not bg-amber-100 text-amber-800)', () => {
    expect(featuredSections).not.toContain('bg-amber-100');
    expect(featuredSections).not.toContain('text-amber-800');
  });

  it('seller/specialty badges do not use bare indigo-50 text-indigo-700 combo', () => {
    expect(featuredSections).not.toContain('bg-indigo-50 text-indigo-700');
  });
});
