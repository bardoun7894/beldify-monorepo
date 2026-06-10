/**
 * P0 Accessibility / RTL fixes — TDD Red then Green
 *
 * Tests for the 5 screens identified in the design review:
 * 1. src/app/products/[id]/page.tsx (PDP)
 * 2. src/app/cart/page.tsx
 * 3. src/components/cart/ShippingCalculator.tsx
 * 4. src/app/services/tailoring/page.tsx
 * 5. src/app/products/page.tsx (verify-only, already passing)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

const pdp = readFileSync(join(SRC, 'app/products/[id]/page.tsx'), 'utf-8');
const cart = readFileSync(join(SRC, 'app/cart/page.tsx'), 'utf-8');
const shippingCalc = readFileSync(join(SRC, 'components/cart/ShippingCalculator.tsx'), 'utf-8');
const tailoring = readFileSync(join(SRC, 'app/services/tailoring/page.tsx'), 'utf-8');
const productsPage = readFileSync(join(SRC, 'app/products/page.tsx'), 'utf-8');

// ─── PDP — products/[id]/page.tsx ─────────────────────────────────────────────

describe('PDP — a11y & RTL P0 fixes', () => {

  it('breadcrumb separators use text-gray-500 not text-gray-400 (contrast fix)', () => {
    // gray-400 on amber-50 fails WCAG AA (~2.8:1); gray-500 is borderline acceptable
    expect(pdp).not.toContain('<span className="text-gray-400">/</span>');
    expect(pdp).toContain('<span className="text-gray-500">/</span>');
  });

  it('struck-through original price uses text-gray-500 not text-gray-400', () => {
    // gray-400 on white fails WCAG AA
    expect(pdp).not.toMatch(/line-through[^"]*text-gray-400|text-gray-400[^"]*line-through/);
    // The strikethrough span should use text-gray-500
    expect(pdp).toMatch(/line-through[^"<]{0,60}text-gray-500|text-gray-500[^"<]{0,60}line-through/);
  });

  it('empty star icons have aria-hidden="true" (decorative)', () => {
    // Stars that show the empty state are decorative; they need aria-hidden
    expect(pdp).toContain('aria-hidden');
  });

  it('journal link ArrowRight has rtl:rotate-180 for RTL mirroring', () => {
    // ArrowRight in description tab should mirror in RTL
    expect(pdp).toMatch(/ArrowRight[^/]{0,200}rtl:rotate-180|rtl:rotate-180[^/]{0,200}ArrowRight/);
  });

  it('bespoke CTA ArrowRight has rtl:rotate-180 for RTL mirroring', () => {
    // ArrowRight in bespoke strip should mirror in RTL
    // There are two ArrowRight usages; ensure at least both get rtl:rotate-180
    const matches = pdp.match(/rtl:rotate-180/g);
    expect(matches).not.toBeNull();
    expect((matches ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('info pane uses bg-white shadow-atlas-sm (not bg-amber-50 on amber-50 page)', () => {
    // bg-amber-50 on bg-amber-50 provides no visual separation
    expect(pdp).not.toMatch(/bg-amber-50 ring-1 ring-amber-200 rounded-lg p-8/);
    expect(pdp).toMatch(/bg-white.*shadow-atlas-sm|shadow-atlas-sm.*bg-white/);
  });

  it('h1 product title adds font-arabic class when isRTL is true', () => {
    // Arabic names with Playfair Display have no Arabic glyphs; need conditional font-arabic
    expect(pdp).toMatch(/isRTL[\s\S]{0,200}font-arabic|font-arabic[\s\S]{0,200}isRTL/);
  });

  it('h1 inline Playfair style is skipped when isRTL', () => {
    // The inline style for Playfair should be conditional so Arabic names use font-arabic
    expect(pdp).toMatch(/isRTL[\s\S]{0,200}fontFamily|fontFamily[\s\S]{0,200}isRTL/);
  });
});

// ─── Cart — app/cart/page.tsx ─────────────────────────────────────────────────

describe('Cart — a11y P0 fixes', () => {

  it('applied-coupon block uses indigo tokens not amber (inside indigo summary card)', () => {
    // amber-50 inside all-indigo card is visually jarring; should be indigo-50
    expect(cart).not.toContain('bg-amber-50 ring-1 ring-amber-200 mb-4');
    expect(cart).toContain('bg-indigo-50');
  });

  it('free-shipping "Free" value uses text-[#855300] for WCAG AA on white', () => {
    // text-amber-600 (~3.1:1 on white) fails WCAG AA; #855300 (~4.7:1) passes
    expect(cart).not.toMatch(/text-amber-600[^}]{0,50}Free|Free[^}]{0,50}text-amber-600/);
    expect(cart).toMatch(/text-\[#855300\]/);
  });

  it('discount amount uses text-[#855300] for WCAG AA (not text-amber-600)', () => {
    // Same contrast fix for the discount line in the order summary
    expect(cart).not.toContain('text-amber-600 font-medium');
    expect(cart).toContain('text-[#855300]');
  });

  it('trash icon uses text-indigo-400 not text-indigo-300 (contrast fix)', () => {
    // text-indigo-300 on white is ~2.4:1 which fails WCAG AA for interactive icons
    expect(cart).not.toContain('text-indigo-300 hover:text-rose-600');
    expect(cart).toContain('text-indigo-400');
  });

  it('cart item h3 product title skips Playfair inline style when isRTL (Arabic glyphs)', () => {
    // Arabic product names must not be forced into Playfair Display which has no Arabic glyphs
    // The h3 style should be conditional: style={isRTL ? undefined : playfair}
    expect(cart).toMatch(/isRTL[\s\S]{0,300}undefined[\s\S]{0,100}playfair|isRTL[\s\S]{0,300}playfair[\s\S]{0,100}undefined/);
  });

  it('cart item h3 adds font-arabic class when isRTL is true', () => {
    // Must apply font-arabic for Arabic names so they render with Arabic-capable font
    expect(cart).toMatch(/isRTL[\s\S]{0,200}font-arabic|font-arabic[\s\S]{0,200}isRTL/);
  });
});

// ─── ShippingCalculator — components/cart/ShippingCalculator.tsx ──────────────

describe('ShippingCalculator — a11y P0 fixes', () => {

  it('free-shipping message uses text-[#855300] not text-amber-600', () => {
    // text-amber-600 on white fails WCAG AA
    expect(shippingCalc).not.toContain('text-amber-600');
    expect(shippingCalc).toContain('text-[#855300]');
  });
});

// ─── Tailoring page — app/services/tailoring/page.tsx ───────────────────────

describe('Tailoring page — a11y P0 fixes', () => {

  it('no faint amber text (amber-600/700) on parchment surfaces', () => {
    // text-amber-700 on bg-amber-50/40 parchment is ~3.4:1 (fails AA for small text).
    // The reference-grade pass dropped the gallery/process eyebrows entirely
    // (anti-slop: no tracked eyebrow above every section), removing the risk.
    expect(tailoring).not.toContain('text-amber-700');
    expect(tailoring).not.toContain('text-amber-600');
  });

  it('drops the slop section eyebrows (gallery "OUR ATELIERS" / "THE PROCESS")', () => {
    expect(tailoring).not.toContain('OUR ATELIERS');
    expect(tailoring).not.toContain('THE PROCESS');
  });
});

// ─── Products listing page — verify amber text not used on white ─────────────

describe('Products listing page — amber text on white (verify)', () => {

  it('has no amber text on white/parchment surfaces (prices use indigo)', () => {
    // Prices are text-indigo-* or text-[#252555]; no text-amber-[5-9]00 on light bg
    expect(productsPage).not.toMatch(/text-amber-[56789]00/);
  });
});
