import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const ordersPage = readFileSync(join(ROOT, 'src/app/orders/page.tsx'), 'utf-8');
const detailPage = readFileSync(join(ROOT, 'src/app/orders/[orderNumber]/page.tsx'), 'utf-8');
const filtersComp = readFileSync(join(ROOT, 'src/components/orders/ModernOrderFilters.tsx'), 'utf-8');
const searchComp = readFileSync(join(ROOT, 'src/components/orders/ModernSearchBar.tsx'), 'utf-8');

// ─── Atlas token compliance ────────────────────────────────────────────────────

describe('Orders page — Atlas token compliance', () => {
  it('uses Playfair Display for page title (font family inline style)', () => {
    expect(ordersPage).toContain('Playfair Display');
  });

  it('has no off-palette blue-* colors', () => {
    expect(ordersPage).not.toMatch(/bg-blue-|text-blue-|border-blue-/);
  });

  it('has no off-palette yellow-* colors', () => {
    expect(ordersPage).not.toMatch(/bg-yellow-|text-yellow-/);
  });

  it('uses shadow-atlas-* for card shadows, not generic shadow-md/lg/xl', () => {
    // Should not have bare shadow-md/shadow-lg/shadow-xl/shadow-2xl
    expect(ordersPage).not.toMatch(/[^-]shadow-md\b|[^-]shadow-lg\b|[^-]shadow-xl\b|shadow-2xl\b/);
  });

  it('uses neutral gray hairlines (amber hairlines retired 2026-06-10)', () => {
    expect(ordersPage).toMatch(/divide-gray-(100|200)|border-gray-(100|200)|ring-gray-(100|200)/);
  });

  it('does NOT use backdrop-blur (glassmorphism anti-pattern)', () => {
    expect(ordersPage).not.toMatch(/backdrop-blur/);
  });

  it('does not have animate-pulse on visible icons (attention-seeking pulse)', () => {
    // animate-pulse should not be on icons in loaded state (only on skeletons)
    // We check that animate-pulse is not directly on non-skeleton icon wrappers
    expect(ordersPage).not.toMatch(/animate-pulse.*ShoppingBag|ShoppingBag.*animate-pulse/);
    expect(ordersPage).not.toMatch(/animate-pulse.*Search|Search.*animate-pulse/);
  });
});

// ─── Order detail page — Atlas token compliance ────────────────────────────────

describe('Order detail page — Atlas token compliance', () => {
  it('uses Playfair Display for page/section titles', () => {
    expect(detailPage).toContain('Playfair Display');
  });

  it('has no off-palette blue-* colors', () => {
    expect(detailPage).not.toMatch(/bg-blue-|text-blue-|border-blue-/);
  });

  it('has no off-palette yellow-* colors', () => {
    expect(detailPage).not.toMatch(/bg-yellow-|text-yellow-/);
  });

  it('uses shadow-atlas-* for shadows', () => {
    expect(detailPage).not.toMatch(/[^-]shadow-md\b|[^-]shadow-lg\b|[^-]shadow-xl\b|shadow-2xl\b/);
  });

  it('has no fixed-bottom bar that collides with global MobileBottomNav', () => {
    // The page should NOT render its own fixed bottom action bar since global layout has MobileBottomNav
    expect(detailPage).not.toMatch(/fixed bottom-0 left-0 right-0/);
  });

  it('uses logical CSS properties not physical left/right in className', () => {
    // Physical left- / right- in className are RTL bugs
    // Allow things like "left-1/2" which is centering used with translate, but not positioning for direction-sensitive layout
    expect(detailPage).not.toMatch(/absolute left-5|absolute right-5/);
  });

  it('uses logical gap instead of space-x for RTL-compatible spacing', () => {
    // space-x-N does not flip in RTL unless space-x-reverse is added
    // We expect the page to use gap-* for flexible RTL spacing in key areas
    expect(detailPage).not.toMatch(/space-x-3.*items-center|space-x-4.*items-start/);
  });

  it('does not use mr-2 (physical margin) inline in className', () => {
    expect(detailPage).not.toMatch(/mr-2/);
  });

  it('uses neutral gray hairlines (amber hairlines retired 2026-06-10)', () => {
    expect(detailPage).toMatch(/divide-gray-200|border-gray-200|ring-gray-200/);
  });
});

// ─── ModernSearchBar — Atlas token compliance ──────────────────────────────────

describe('ModernSearchBar — Atlas token compliance', () => {
  it('uses indigo-700/30 focus ring not indigo-500', () => {
    expect(searchComp).not.toMatch(/ring-indigo-500/);
  });

  it('uses logical text-start instead of text-left in RTL contexts', () => {
    expect(searchComp).not.toMatch(/\btext-left\b/);
  });
});

// ─── ModernOrderFilters — Atlas token compliance ───────────────────────────────

describe('ModernOrderFilters — Atlas token compliance', () => {
  it('uses shadow-atlas-md for active pill shadow, not bare shadow-md/shadow-lg', () => {
    expect(filtersComp).not.toMatch(/shadow-md\b|shadow-lg\b|shadow-xl\b/);
  });
});
