/**
 * Checkout & Order Confirmation — Atlas polish pass (TDD)
 *
 * Presentation-only fixes from the impeccable critique:
 *  - RTL: forward CTAs must flip the ArrowRight glyph under dir=rtl (rtl:rotate-180)
 *  - drift: .currency-mad on every MAD price (grand total + line items + confirmation prices)
 *  - color: muted-warm text bumped to clear WCAG AA (amber-700 / ink, not amber-600)
 *  - drift: single locale-aware currency formatter shared across both screens
 *  - drift: shipping method prices + free-shipping threshold from a single source
 *  - drift: BespokeStrip gradient uses Atlas tokens, not hardcoded hex
 *  - motion: shared .hover-lift utility instead of repeated inline lift utilities
 *  - type: text-balance on editorial display headings
 *  - states: confirmation status pill maps backend enum -> i18n label + tone
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const SRC = join(__dirname, '..', '..');

const checkout = readFileSync(join(SRC, 'src/app/checkout/page.tsx'), 'utf-8');
const confirmation = readFileSync(
  join(SRC, 'src/app/order-confirmation/page.tsx'),
  'utf-8'
);

// Helper: count occurrences of a substring
const count = (haystack: string, needle: string) =>
  haystack.split(needle).length - 1;

// ─── RTL: forward arrows must mirror ────────────────────────────────────────
describe('RTL — forward CTA arrows flip under dir=rtl', () => {
  it('checkout: every ArrowRight carries rtl:rotate-180', () => {
    const arrows = count(checkout, '<ArrowRight');
    const flipped = count(checkout, 'rtl:rotate-180');
    expect(arrows).toBeGreaterThan(0);
    expect(flipped).toBe(arrows);
  });

  it('confirmation: every ArrowRight carries rtl:rotate-180', () => {
    const arrows = count(confirmation, '<ArrowRight');
    const flipped = count(confirmation, 'rtl:rotate-180');
    expect(arrows).toBeGreaterThan(0);
    expect(flipped).toBe(arrows);
  });
});

// ─── drift: currency-mad on every MAD price ─────────────────────────────────
describe('drift — currency-mad on the highest-value numbers', () => {
  it('checkout: line-item price span carries currency-mad', () => {
    // line item: unit_price * quantity rendered with MAD
    expect(checkout).toMatch(
      /currency-mad[^>]*>\s*\{formatAmount\(item\.unit_price \* item\.quantity\)\}/
    );
  });

  it('checkout: grand total carries currency-mad', () => {
    expect(checkout).toMatch(/currency-mad[^>]*style=\{playfair\}/);
  });

  it('confirmation: prices use currency-mad (no bare MAD span)', () => {
    // every MAD-bearing price span should also have currency-mad
    expect(confirmation).toContain('currency-mad');
    // at least 4 price rows: item, subtotal, shipping?, total
    expect(count(confirmation, 'currency-mad')).toBeGreaterThanOrEqual(4);
  });
});

// ─── drift: shared locale-aware formatter ───────────────────────────────────
describe('drift — both screens use a locale-aware formatAmount', () => {
  it('checkout defines formatAmount via Intl.NumberFormat', () => {
    expect(checkout).toContain('Intl.NumberFormat');
    expect(checkout).toContain('formatAmount');
  });

  it('checkout no longer renders raw toFixed(2) in the summary prices', () => {
    // toFixed should not appear adjacent to " MAD" rendering
    expect(checkout).not.toMatch(/\.toFixed\(2\)\}\s*MAD/);
  });
});

// ─── color: WCAG AA on muted warm text ──────────────────────────────────────
describe('color — muted warm text clears AA', () => {
  it('checkout: no text-amber-600 used for normal-size body/label text', () => {
    // amber-600 fails AA on white/parchment for normal text.
    // Trust pills (decorative icons) may keep amber, but text labels must not.
    // Stepper completed label, Free price, discount amount must be bumped.
    expect(checkout).not.toContain('text-amber-600');
  });
});

// ─── drift: single source for shipping prices + threshold ───────────────────
describe('drift — shipping method prices derive from one source', () => {
  it('checkout: no hardcoded "30 MAD" / "70 MAD" string literals', () => {
    expect(checkout).not.toContain("'30 MAD'");
    expect(checkout).not.toContain("'70 MAD'");
  });

  it('checkout: free-shipping threshold is a single named constant', () => {
    expect(checkout).toMatch(/FREE_SHIPPING_THRESHOLD/);
  });
});

// ─── drift: BespokeStrip gradient uses tokens, not hex ───────────────────────
describe('drift — BespokeStrip gradient avoids hardcoded hex', () => {
  it('checkout: no #f59e0b / #6366f1 in the radial gradient', () => {
    expect(checkout).not.toContain('#f59e0b');
    expect(checkout).not.toContain('#6366f1');
  });
});

// ─── motion: shared hover-lift utility ──────────────────────────────────────
describe('motion — CTAs use the .hover-lift token', () => {
  it('checkout: uses hover-lift utility', () => {
    expect(checkout).toContain('hover-lift');
  });

  it('confirmation: uses hover-lift utility', () => {
    expect(confirmation).toContain('hover-lift');
  });

  it('checkout: no longer inlines hover:-translate-y-0.5 + hover:shadow-atlas-md pair', () => {
    expect(checkout).not.toContain('hover:-translate-y-0.5');
  });

  it('confirmation: no longer inlines hover:-translate-y-0.5 + hover:shadow-atlas-md pair', () => {
    expect(confirmation).not.toContain('hover:-translate-y-0.5');
  });
});

// ─── type: text-balance on display headings ─────────────────────────────────
describe('type — editorial headings use text-balance', () => {
  it('checkout: h1 display headings use text-balance', () => {
    expect(checkout).toContain('text-balance');
  });

  it('confirmation: h1 display headings use text-balance', () => {
    expect(confirmation).toContain('text-balance');
  });
});

// ─── states: status pill maps enum -> i18n label + tone ─────────────────────
describe('states — confirmation status pill is designed copy, not a DB value', () => {
  it('confirmation: no longer renders raw order.status with capitalize', () => {
    expect(confirmation).not.toMatch(/capitalize[^>]*>\s*\{order\?\.status\}/);
  });

  it('confirmation: maps status to an i18n label set', () => {
    expect(confirmation).toMatch(/order_confirmation\.status\./);
  });
});
