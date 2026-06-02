/**
 * Orders (list + detail) — reference-grade pass — TDD red tests.
 *
 * Presentation-only fixes against the impeccable critique:
 *  - P2 hierarchy: desktop list uses 12-col width (2-col grid at lg+), not a stretched phone
 *  - P2 rtl:       every MAD price wrapped in .currency-mad (bidi isolation)
 *  - P2 copy:      raw status enum no longer leaks; translated label via t()
 *  - P2 states:    dead "All Status" button removed (pills own status selection)
 *  - P2 motion:    prefers-reduced-motion gating on entrance + whileHover + search scale
 *  - P3 drift:     single shared formatMAD util reused on both screens (no glyph drift)
 *  - P3 hierarchy: redundant 2-of-6 header counters dropped
 *  - P3 slop:      shipping field labels sentence-cased (no uppercase-tracked eyebrow)
 *  - P3 type:      desktop timeline labels bumped to text-sm; active step font-semibold
 *
 * Source-reading tests (Atlas-compliance pattern) — no DOM render needed.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

const ordersPage = readFileSync(join(SRC, 'app/orders/page.tsx'), 'utf-8');
const detailPage = readFileSync(join(SRC, 'app/orders/[orderNumber]/page.tsx'), 'utf-8');
const filtersComp = readFileSync(join(SRC, 'components/orders/ModernOrderFilters.tsx'), 'utf-8');
const searchComp = readFileSync(join(SRC, 'components/orders/ModernSearchBar.tsx'), 'utf-8');

// ─── FIX P3-drift: shared formatMAD util reused on both screens ──────────────

describe('Orders — shared formatMAD util (no currency-glyph drift)', () => {
  it('formatMAD util lives in components/orders scope', () => {
    expect(existsSync(join(SRC, 'components/orders/formatMAD.ts'))).toBe(true);
  });

  it('the util emits a literal "MAD" suffix, not the currency glyph', () => {
    const util = readFileSync(join(SRC, 'components/orders/formatMAD.ts'), 'utf-8');
    // decimal style + literal MAD; never style:'currency' which emits د.م.‏
    expect(util).toMatch(/style:\s*['"]decimal['"]/);
    expect(util).not.toMatch(/style:\s*['"]currency['"]/);
    expect(util).toMatch(/MAD/);
  });

  it('both order screens import formatMAD', () => {
    expect(ordersPage).toMatch(/formatMAD/);
    expect(detailPage).toMatch(/formatMAD/);
  });

  it('detail page no longer uses Intl style:currency (the glyph-emitting outlier)', () => {
    expect(detailPage).not.toMatch(/style:\s*['"]currency['"]/);
  });
});

// ─── FIX P2-rtl: every MAD price bidi-isolated with .currency-mad ────────────

describe('Orders — MAD price labels are bidi-isolated with .currency-mad', () => {
  it('list page wraps prices in currency-mad', () => {
    expect(ordersPage).toContain('currency-mad');
  });

  it('detail page wraps prices in currency-mad', () => {
    expect(detailPage).toContain('currency-mad');
  });

  it('list page no longer renders a bare "{value} MAD" string outside currency-mad', () => {
    // The previous code had `{formatNumber(...)} <span>MAD</span>` and
    // `{formatNumber(item.unit_price)} MAD` with no isolation wrapper.
    expect(ordersPage).not.toMatch(/\{formatNumber\(item\.unit_price\)\}\s*MAD/);
  });
});

// ─── FIX P2-copy: raw status enum no longer leaks to the UI ──────────────────

describe('ModernSearchBar — status enum is translated, not leaked raw', () => {
  it('active-filter status tag renders a translated label, not the raw key', () => {
    // The previous code rendered `Status: {statusFilter}` (the raw 'pending' key).
    expect(searchComp).not.toMatch(/filter_tag_status[^}]*\}\s*:\s*\{statusFilter\}/);
    // It must route through t() with the orders.filter.* namespace.
    expect(searchComp).toMatch(/orders\.filter\.\$\{statusFilter\}/);
  });
});

// ─── FIX P2-states: dead "All Status" button removed ─────────────────────────

describe('ModernSearchBar — dead "All Status" control removed', () => {
  it('no longer renders the non-interactive Filter + ChevronDown status indicator', () => {
    // The button had no onClick and opened nothing — a trust bug. Pills own status.
    expect(searchComp).not.toMatch(/orders\.search\.all_status/);
  });
});

// ─── FIX P2-motion: prefers-reduced-motion honored across all four files ─────

describe('Orders — entrance + hover motion honor prefers-reduced-motion', () => {
  it('list page imports and uses useReducedMotion', () => {
    expect(ordersPage).toContain('useReducedMotion');
    expect(ordersPage).toMatch(/(shouldReduceMotion|prefersReducedMotion)/);
  });

  it('detail page imports and uses useReducedMotion', () => {
    expect(detailPage).toContain('useReducedMotion');
  });

  it('filters component gates motion on reduced-motion preference', () => {
    expect(filtersComp).toContain('useReducedMotion');
  });

  it('search bar gates its focus/hover scale on reduced-motion preference', () => {
    expect(searchComp).toContain('useReducedMotion');
  });

  it('list page collapses the staggered card delay to 0 under reduced motion', () => {
    expect(ordersPage).toMatch(/(shouldReduceMotion|prefersReducedMotion)\s*\?\s*0/);
  });
});

// ─── FIX P2-hierarchy: desktop list uses the 12-col width ─────────────────────

describe('Orders list — desktop uses the width, not a stretched single column', () => {
  it('switches the results stack to a 2-col grid at lg+', () => {
    expect(ordersPage).toMatch(/lg:grid-cols-2/);
  });

  it('aligns variable-height cards to the top of their grid row', () => {
    // grid rows of ragged-height cards need items-start so short cards don't stretch.
    expect(ordersPage).toMatch(/items-start/);
  });
});

// ─── FIX P3-hierarchy: redundant 2-of-6 header counters dropped ───────────────

describe('Orders list — redundant header counters removed', () => {
  it('no longer duplicates the pending/delivered counts the pills already carry', () => {
    // The pills (ModernOrderFilters) already show every count; the header's
    // hidden md:flex Pending+Delivered duo was a redundant 2-of-6 subset.
    expect(ordersPage).not.toMatch(/Quick status counters/);
  });
});

// ─── FIX P3-slop: shipping field labels sentence-cased ───────────────────────

describe('Order detail — shipping field labels are not uppercase-tracked eyebrows', () => {
  it('contact/address field labels drop uppercase tracking-wider', () => {
    // Field labels read more editorial sentence-cased in text-gray-500 than as
    // uppercase tracked kickers.
    expect(detailPage).not.toMatch(/orders\.shipping\.contact[\s\S]{0,120}?uppercase tracking-wider/);
    expect(detailPage).not.toMatch(/uppercase tracking-wider[\s\S]{0,160}?orders\.shipping\.contact/);
  });
});

// ─── FIX P3-type: desktop timeline labels carry a real type step ─────────────

describe('Order detail — desktop timeline labels read at a glance', () => {
  it('no longer renders the active "current" chip at text-[10px]', () => {
    expect(detailPage).not.toMatch(/text-\[10px\]/);
  });
});
