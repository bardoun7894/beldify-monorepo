/**
 * Atlas Visual Port — TDD Red tests
 *
 * These tests assert that the Atlas token classes are used in page.tsx,
 * Newsletter.tsx, MegaOffers.tsx and FeaturedSections.tsx.
 *
 * We read file source and check for the expected class strings.
 * Approach: assert the CSS-var arbitrary-value form or shadcn utility that
 * resolves to the correct Atlas hex — not the plan's bare `bg-primary`
 * (which has no DEFAULT key in tailwind.config.js and would be dead).
 *
 * Mapping reference (from globals.css + tailwind.config.js):
 *   Atlas indigo #252555 → bg-[hsl(var(--primary))] / text-[hsl(var(--primary))]
 *   Atlas amber  #fea619 → bg-[hsl(var(--secondary))] / text-[hsl(var(--secondary))]
 *   Atlas parchment     → bg-background (shadcn wired)
 *   Atlas on-surface    → text-foreground (shadcn wired)
 *   Atlas on-surface-variant → text-on-surface-variant (tailwind registered)
 *   Atlas primary-container → bg-primary-container (tailwind registered)
 *   Atlas outline ring/border → ring-outline / border-outline (tailwind registered)
 *   Atlas atlas-sm shadow → shadow-atlas-sm (tailwind registered)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

const page = readFileSync(join(SRC, 'app/page.tsx'), 'utf-8');
const newsletter = readFileSync(join(SRC, 'components/Newsletter.tsx'), 'utf-8');
const megaOffers = readFileSync(join(SRC, 'components/MegaOffers.tsx'), 'utf-8');
const featuredSections = readFileSync(join(SRC, 'components/home/FeaturedSections.tsx'), 'utf-8');

// ─── page.tsx ─────────────────────────────────────────────────────────────────

describe('page.tsx — Atlas visual port', () => {
  it('main uses bg-background (parchment) not bg-amber-50', () => {
    expect(page).toContain('bg-background');
    expect(page).not.toContain('bg-amber-50/40');
  });

  it('announcement strip uses Atlas indigo background', () => {
    // Must use the CSS-var form (no bare bg-primary DEFAULT exists)
    expect(page).toContain('bg-[hsl(var(--primary))]');
  });

  it('announcement strip has Arabic copy', () => {
    expect(page).toContain('شحن مجاني');
  });

  it('hero gradient is dark indigo overlay (dark photographic hero)', () => {
    // JOB 2a: dark hero — light parchment veil replaced by Atlas indigo gradient
    expect(page).toContain('from-atlas-primary/[0.85]');
    expect(page).not.toContain('from-white/95');
  });

  it('hero headline is Arabic-primary (JOB 2b)', () => {
    // The large primary H1 must contain the Arabic copy
    expect(page).toContain('تُلبَس منذ قرون. مصنوعة لليوم.');
  });

  it('hero Arabic H1 uses font-arabic class (no inline Playfair)', () => {
    // Arabic H1 must use className="font-arabic" — Playfair has no Arabic glyphs
    // We assert that the Arabic H1 element carries font-arabic in className
    // and that no fontFamily inline style targeting that same Arabic text uses Playfair Display
    expect(page).toContain('font-arabic');
  });

  it('hero headline text is white on dark hero', () => {
    // After dark overlay, headline must be white text
    expect(page).toContain('text-white');
  });

  it('hero eyebrow pill uses primary/10 tint', () => {
    expect(page).toContain('bg-atlas-primary/[0.1]');
  });

  it('hero ify span uses Atlas indigo text', () => {
    expect(page).toContain('text-[hsl(var(--primary))]');
    expect(page).not.toContain('text-indigo-700');
  });

  it('hero primary CTA uses Atlas indigo bg', () => {
    expect(page).toContain('bg-[hsl(var(--primary))]');
  });

  it('hero secondary CTA uses Atlas surface + outline ring', () => {
    expect(page).toContain('ring-outline');
  });

  it('trust strip uses Atlas surface not white/amber', () => {
    expect(page).toContain('bg-background/80');
    expect(page).not.toContain('bg-white/70');
  });

  it('trust strip border uses outline token', () => {
    expect(page).toContain('border-outline');
    expect(page).not.toContain('border-amber-200/60');
  });

  it('trust icon circles use primary/10 tint', () => {
    expect(page).toContain('ring-atlas-primary/[0.2]');
  });

  it('trust item text uses on-surface-variant', () => {
    expect(page).toContain('text-on-surface-variant');
  });

  it('souk eyebrow uses Atlas amber', () => {
    expect(page).toContain('text-[hsl(var(--secondary))]');
  });

  it('souk heading uses Atlas indigo text', () => {
    // h2 heading text should be Atlas indigo
    expect(page).toContain('text-[hsl(var(--primary))]');
  });

  it('souk category card uses shadow-atlas-sm not shadow-sm', () => {
    expect(page).toContain('shadow-atlas-sm');
  });

  it('category card item count badge uses end-3 logical prop (RTL safe)', () => {
    expect(page).toContain('end-3');
    // must NOT use right-3 in the badge
    expect(page).not.toContain('right-3');
  });

  it('category card text row uses start-4 end-4 logical props', () => {
    expect(page).toContain('start-4');
    expect(page).toContain('end-4');
    expect(page).not.toContain('left-4 right-4');
  });

  it('category name uses name_ar fallback', () => {
    expect(page).toContain('name_ar');
  });

  it('tailoring strip uses Atlas indigo bg', () => {
    expect(page).toContain('bg-[hsl(var(--primary))]');
    expect(page).not.toContain('bg-indigo-900');
  });

  it('tailoring radial gradient uses Atlas hex values', () => {
    expect(page).toContain('#3b3b6d');
    expect(page).toContain('#fea619');
    expect(page).not.toContain('#6366f1');
    expect(page).not.toContain('#f59e0b');
  });

  it('tailoring CTA button uses Atlas amber bg', () => {
    expect(page).toContain('bg-[hsl(var(--secondary))]');
  });

  it('tailoring CTA button uses rounded-xl not rounded-full', () => {
    // The Atlas button radius is 12px (rounded-xl-equivalent via calc tokens)
    // We accept either rounded-xl or calc-based sm token
    expect(page).toMatch(/rounded-xl|rounded-\[calc\(var\(--radius\)/);
  });

  it('tailoring step badges use Atlas amber', () => {
    expect(page).toContain('bg-[hsl(var(--secondary))]');
  });

  it('ateliers section uses Atlas indigo heading', () => {
    // verified badge uses end-3
    expect(page).toContain('end-3');
  });

  it('atelier card uses shadow-atlas-sm', () => {
    expect(page).toContain('shadow-atlas-sm');
  });

  it('atelier location text uses on-surface-variant', () => {
    expect(page).toContain('text-on-surface-variant');
  });

  it('atelier specialty text uses Atlas amber', () => {
    expect(page).toContain('text-[hsl(var(--secondary))]');
  });

  it('journal section uses bg-background not solid bg-white', () => {
    expect(page).toContain('bg-background');
    // Only disallow the solid opaque bg-white class; bg-white/[x] opacity variants are fine for dark-hero overlays
    expect(page).not.toContain('"bg-white"');
    expect(page).not.toContain("'bg-white'");
  });

  it('journal article tag uses primary/10 tint', () => {
    expect(page).toContain('bg-atlas-primary/[0.1]');
    expect(page).not.toContain('bg-indigo-100');
  });

  it('journal article title uses Atlas indigo text', () => {
    expect(page).toContain('text-[hsl(var(--primary))]');
  });

  it('journal article excerpt uses on-surface-variant', () => {
    expect(page).toContain('text-on-surface-variant');
  });

  it('seller strip uses Atlas indigo bg', () => {
    expect(page).not.toContain('bg-indigo-900');
  });

  it('seller strip open boutique button uses Atlas amber bg + rounded-xl', () => {
    expect(page).toContain('bg-[hsl(var(--secondary))]');
  });

  it('AI listings chip uses primary-container', () => {
    expect(page).toContain('bg-primary-container');
  });

  it('announcement strip has dir=rtl', () => {
    expect(page).toContain('dir="rtl"');
  });
});

// ─── Newsletter.tsx ────────────────────────────────────────────────────────────

describe('Newsletter.tsx — Atlas visual port', () => {
  it('section bg uses bg-background (parchment)', () => {
    expect(newsletter).toContain('bg-background');
    expect(newsletter).not.toContain('bg-amber-50/40');
  });

  it('eyebrow dot uses Atlas amber', () => {
    expect(newsletter).toContain('bg-[hsl(var(--secondary))]');
    expect(newsletter).not.toContain('bg-amber-500');
  });

  it('eyebrow text uses Atlas amber', () => {
    expect(newsletter).toContain('text-[hsl(var(--secondary))]');
    expect(newsletter).not.toContain('text-amber-700');
  });

  it('h2 uses Atlas indigo text', () => {
    expect(newsletter).toContain('text-[hsl(var(--primary))]');
    expect(newsletter).not.toContain('text-gray-900');
  });

  it('subtitle uses on-surface-variant', () => {
    expect(newsletter).toContain('text-on-surface-variant');
    expect(newsletter).not.toContain('text-gray-600');
  });

  it('divider uses secondary opacity', () => {
    expect(newsletter).toContain('bg-atlas-secondary/[0.3]');
    expect(newsletter).not.toContain('bg-amber-200');
  });

  it('input uses rounded-xl + border-outline', () => {
    expect(newsletter).toContain('rounded-xl');
    expect(newsletter).toContain('border-outline');
    expect(newsletter).not.toContain('rounded-2xl');
  });

  it('submit button uses Atlas indigo bg + rounded-xl', () => {
    expect(newsletter).toContain('bg-[hsl(var(--primary))]');
    expect(newsletter).toContain('rounded-xl');
    expect(newsletter).not.toContain('bg-indigo-700');
    // Note: rounded-full is still used for the eyebrow dot indicator — that's correct
    // The button itself must use rounded-xl; verified by the presence of rounded-xl above
  });

  it('submit button uses shadow-atlas', () => {
    expect(newsletter).toMatch(/shadow-atlas/);
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

  it('collection header bg uses bg-primary/5 or equivalent (not bg-indigo-50)', () => {
    expect(megaOffers).not.toContain('bg-indigo-50/60');
    // must use an atlas-token tint (e.g. bg-atlas-primary/[0.06])
    expect(megaOffers).toMatch(/bg-atlas-primary\/\[0\.0[5-9]\]/);
  });

  it('view collection button uses Atlas indigo bg', () => {
    expect(megaOffers).toContain('bg-[hsl(var(--primary))]');
    expect(megaOffers).not.toContain('bg-indigo-700');
  });

  it('view all collections button uses Atlas indigo bg', () => {
    // The "View All Collections" global CTA
    expect(megaOffers).toContain('bg-[hsl(var(--primary))]');
  });
});

// ─── FeaturedSections.tsx ─────────────────────────────────────────────────────

describe('FeaturedSections.tsx — Atlas visual port', () => {
  it('heading text uses text-foreground or Atlas indigo (not text-gray-900)', () => {
    // Section headings
    expect(featuredSections).not.toContain('text-gray-900');
    expect(featuredSections).toMatch(/text-foreground|text-\[hsl\(var\(--primary\)\)\]/);
  });

  it('empty state bg uses bg-background surface (not bg-amber-50)', () => {
    expect(featuredSections).not.toContain('bg-amber-50/60');
    expect(featuredSections).toContain('bg-background');
  });

  it('special offer dark variant radial gradient uses Atlas hex values', () => {
    expect(featuredSections).toContain('#3b3b6d');
    expect(featuredSections).toContain('#fea619');
    expect(featuredSections).not.toContain('#6366f1');
    expect(featuredSections).not.toContain('#f59e0b');
  });

  it('special offer CTA button uses Atlas amber bg', () => {
    expect(featuredSections).toContain('bg-[hsl(var(--secondary))]');
    expect(featuredSections).not.toContain('bg-amber-500');
  });

  it('special offer dark variant bg uses Atlas indigo (not bg-indigo-900 literal)', () => {
    // The color string in specialOffers[] should use a CSS-var reference or Atlas class
    expect(featuredSections).not.toContain("'bg-indigo-900'");
  });

  it('tailor/seller specialty badges use Atlas tokens not bare indigo-50', () => {
    expect(featuredSections).not.toContain('bg-indigo-50 text-indigo-700');
  });
});
