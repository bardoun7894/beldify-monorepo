/**
 * Atlas P0/P1 Render Bugs — TDD Red tests
 *
 * These tests assert the specific bugs identified in the P0/P1 fix spec:
 * - FIX A: tailwind.config.js wires 'on-surface', alpha-value placeholders on existing tokens
 * - FIX B: globals.css has .start-3 / .end-3 logical inset utilities
 * - FIX C: MegaOffers.tsx + FeaturedSections.tsx use Atlas tokens not Tailwind built-in palette
 * - FIX D: layout.tsx imports IBM Plex Sans Arabic as the Arabic brand face
 *
 * Token mapping (CSS vars already in globals.css):
 *   text-indigo-700  → text-[hsl(var(--primary))]
 *   bg-amber-500     → bg-[hsl(var(--secondary))]
 *   border-indigo-100/200 → border-[hsl(var(--primary)/0.1)]
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

const tailwindConfig = readFileSync(join(ROOT, 'tailwind.config.js'), 'utf-8');
const globalsCss = readFileSync(join(SRC, 'app/globals.css'), 'utf-8');
const megaOffers = readFileSync(join(SRC, 'components/MegaOffers.tsx'), 'utf-8');
const featuredSections = readFileSync(join(SRC, 'components/home/FeaturedSections.tsx'), 'utf-8');
const layout = readFileSync(join(SRC, 'app/layout.tsx'), 'utf-8');

// ─── FIX A: tailwind.config.js — missing tokens + alpha-value placeholders ────

describe('FIX A — tailwind.config.js Atlas token completeness', () => {
  it('has on-surface token with alpha-value placeholder', () => {
    expect(tailwindConfig).toMatch(/['"]on-surface['"]/);
    expect(tailwindConfig).toMatch(/['"]on-surface['"][\s\S]*<alpha-value>/);
  });

  it('existing on-surface-variant token uses alpha-value placeholder', () => {
    // Allows Tailwind opacity modifiers like text-on-surface-variant/70
    expect(tailwindConfig).toMatch(/['"]on-surface-variant['"][\s\S]*<alpha-value>/);
  });

  it('existing on-secondary token uses alpha-value placeholder', () => {
    expect(tailwindConfig).toMatch(/['"]on-secondary['"][\s\S]*<alpha-value>/);
  });

  it('existing outline token uses alpha-value placeholder', () => {
    // ring-outline/20 and border-outline/10 need this
    expect(tailwindConfig).toMatch(/['"]outline['"][\s\S]*<alpha-value>/);
  });
});

// ─── FIX B: globals.css — logical inset utilities .start-3 / .end-3 ──────────

describe('FIX B — globals.css logical inset utilities', () => {
  it('has .start-3 utility defined', () => {
    expect(globalsCss).toContain('.start-3');
  });

  it('has .end-3 utility with correct value', () => {
    expect(globalsCss).toContain('.end-3');
    expect(globalsCss).toContain('inset-inline-end: 0.75rem');
  });

  it('.start-3 uses inset-inline-start: 0.75rem', () => {
    expect(globalsCss).toContain('inset-inline-start: 0.75rem');
  });
});

// ─── FIX C: MegaOffers.tsx — no storefront-visible Tailwind built-in palette ─

describe('FIX C — MegaOffers.tsx Atlas compliance', () => {
  it('CollectionCard title uses Atlas primary (not text-indigo-700)', () => {
    // text-indigo-700 → text-[hsl(var(--primary))]
    expect(megaOffers).not.toContain('text-indigo-700');
    expect(megaOffers).toContain('hsl(var(--primary))');
  });

  it('CollectionCard border uses primary/10 tint (not border-indigo-100)', () => {
    // border-indigo-100 → border-atlas-primary/[0.1]
    expect(megaOffers).not.toContain('border-indigo-100');
    expect(megaOffers).toMatch(/border-atlas-primary\/\[0\.1\]/);
  });

  it('CollectionCard hover border uses primary/10 tint (not hover:border-indigo-200)', () => {
    expect(megaOffers).not.toContain('hover:border-indigo-200');
  });

  it('CollectionCard badge uses Atlas amber bg (not bg-amber-500)', () => {
    // "UP TO 70% OFF" badge: bg-amber-500 → bg-[hsl(var(--secondary))]
    expect(megaOffers).not.toContain('bg-amber-500');
    expect(megaOffers).toContain('bg-[hsl(var(--secondary))]');
  });

  it('CollectionCard "days left" chip uses Atlas primary text (not text-indigo-700)', () => {
    // text-indigo-700 bg-indigo-50 → text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)]
    expect(megaOffers).not.toContain('bg-indigo-50');
  });

  it('footer divider uses primary/10 (not border-indigo-50)', () => {
    expect(megaOffers).not.toContain('border-indigo-50');
  });

  it('eyebrow dot uses Atlas amber (not bg-amber-500)', () => {
    // Already asserted above via 'not.toContain bg-amber-500'
    expect(megaOffers).not.toContain('bg-amber-500');
  });

  it('eyebrow text uses Atlas amber text (not text-amber-700)', () => {
    expect(megaOffers).not.toContain('text-amber-700');
    expect(megaOffers).toContain('text-[hsl(var(--secondary))]');
  });

  it('"more items" span uses Atlas amber text (not text-amber-600)', () => {
    expect(megaOffers).not.toContain('text-amber-600');
  });
});

// ─── FIX C: FeaturedSections.tsx — no storefront-visible built-in palette ────

describe('FIX C — FeaturedSections.tsx Atlas compliance', () => {
  it('loading spinner uses Atlas primary border (not border-indigo-700)', () => {
    expect(featuredSections).not.toContain('border-indigo-700');
    expect(featuredSections).toMatch(/border-\[hsl\(var\(--primary\)\)\]|border-primary-container/);
  });

  it('"Browse all" link uses Atlas primary text (not text-indigo-700)', () => {
    expect(featuredSections).not.toContain('text-indigo-700');
    expect(featuredSections).toMatch(/text-\[hsl\(var\(--primary\)\)\]/);
  });

  it('"Browse all" hover uses Atlas (not hover:text-indigo-800)', () => {
    expect(featuredSections).not.toContain('hover:text-indigo-800');
  });

  it('"New" badge uses Atlas amber tokens (not bg-amber-100 text-amber-800)', () => {
    expect(featuredSections).not.toContain('bg-amber-100');
    expect(featuredSections).not.toContain('text-amber-800');
  });

  it('seller category badges use Atlas tokens (not bg-amber-50 text-amber-800)', () => {
    // bg-amber-50 text-amber-800 on seller category chips
    expect(featuredSections).not.toContain('bg-amber-50');
  });
});

// ─── FIX D: layout.tsx — IBM Plex Sans Arabic brand face ─────────────────────

describe('FIX D — layout.tsx IBM Plex Sans Arabic font', () => {
  it('imports IBM_Plex_Sans_Arabic from next/font/google', () => {
    expect(layout).toContain('IBM_Plex_Sans_Arabic');
  });

  it('loads IBM Plex Sans Arabic with arabic subset', () => {
    expect(layout).toContain("subset");
    expect(layout).toContain("arabic");
  });

  it('exposes IBM Plex Sans Arabic as a CSS variable', () => {
    // e.g. variable: '--font-ibm-plex-arabic'
    expect(layout).toMatch(/variable.*font-ibm-plex-arabic/);
  });

  it('includes the IBM Plex font variable in the html className', () => {
    // The variable must be applied so CSS can use it
    expect(layout).toMatch(/ibmPlexArabic\.variable|ibmplexarabic\.variable/i);
  });
});
