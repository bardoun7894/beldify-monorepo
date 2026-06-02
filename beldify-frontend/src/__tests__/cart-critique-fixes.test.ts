/**
 * Cart — Impeccable Critique Fixes (TDD)
 *
 * Source-reading tests that encode the reference-grade critique applied to the
 * Cart screen (register: product). One assertion per critique item.
 *
 *  - [P1] rtl: every rendered MAD price+unit wrapped in span.currency-mad
 *  - [P1] slop: no literal em dash in user-facing prose (EmptyCartState)
 *  - [P1] color: body-copy muted indigos bumped to indigo-600/700 (WCAG AA)
 *  - [P2] rtl: continue-shopping arrow is RTL-aware (no physical -translate-x)
 *  - [P2] drift: total uses a scale step (text-2xl) not arbitrary text-[1.375rem]
 *  - [P3] states: ShippingCalculator t() calls carry English fallbacks
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const SRC = join(__dirname, '..', '..');

const cartPage = readFileSync(join(SRC, 'src/app/cart/page.tsx'), 'utf-8');
const shippingCalc = readFileSync(join(SRC, 'src/components/cart/ShippingCalculator.tsx'), 'utf-8');
const cartItemRow = readFileSync(join(SRC, 'src/components/cart/CartItemRow.tsx'), 'utf-8');
const orderSummaryCard = readFileSync(join(SRC, 'src/components/cart/OrderSummaryCard.tsx'), 'utf-8');
const emptyCartState = readFileSync(join(SRC, 'src/components/cart/EmptyCartState.tsx'), 'utf-8');
const cartMobileBar = readFileSync(join(SRC, 'src/components/cart/CartMobileBar.tsx'), 'utf-8');

const count = (haystack: string, needle: string) =>
  haystack.split(needle).length - 1;

// ─── [P1] rtl — currency-mad on every MAD price ──────────────────────────────

describe('[P1] rtl — every MAD price is bidi-isolated with .currency-mad', () => {
  it('CartItemRow wraps line total, unit price and original price (>=3 spans)', () => {
    expect(count(cartItemRow, 'currency-mad')).toBeGreaterThanOrEqual(3);
  });

  it('OrderSummaryCard wraps subtotal/shipping/tax/discount/total rows', () => {
    // subtotal, shipping value, tax, discount, free-shipping hint, total = 6 price strings
    expect(count(orderSummaryCard, 'currency-mad')).toBeGreaterThanOrEqual(5);
  });

  it('CartMobileBar wraps the bar total', () => {
    expect(cartMobileBar).toContain('currency-mad');
  });
});

// ─── [P1] slop — no em dash in user-facing prose ─────────────────────────────

describe('[P1] slop — no literal em dash in EmptyCartState prose strings', () => {
  it('empty-state subtitle does not contain an em dash', () => {
    // The subtitle string previously read "...craft — find something..."
    expect(emptyCartState).not.toContain('craft —');
    expect(emptyCartState).not.toContain('— find');
  });
});

// ─── [P1] color — body-copy muted indigos meet WCAG AA ───────────────────────

describe('[P1] color — readable muted text bumped to indigo-600/700', () => {
  it('cart page subtitle is not text-indigo-400', () => {
    expect(cartPage).not.toContain('text-indigo-400 text-base');
  });

  it('EmptyCartState subtitle is not text-indigo-400 (readable prose)', () => {
    // subtitle paragraph must use indigo-600/700, not failing indigo-400
    expect(emptyCartState).not.toMatch(/text-indigo-400 text-base/);
  });

  it('EmptyCartState trust hint is not text-indigo-300 (readable prose)', () => {
    expect(emptyCartState).not.toMatch(/mt-6 text-xs text-indigo-300/);
  });

  it('OrderSummaryCard payment-methods line is not text-indigo-300 (readable prose)', () => {
    expect(orderSummaryCard).not.toMatch(/text-center text-xs text-indigo-300/);
  });

  it('CartItemRow color/size meta is not text-indigo-400 (readable prose)', () => {
    expect(cartItemRow).not.toContain('text-xs text-indigo-400 mt-0.5');
  });
});

// ─── [P2] rtl — continue-shopping arrow is RTL-aware ─────────────────────────

describe('[P2] rtl — continue-shopping link is logical/RTL-aware', () => {
  it('swaps the arrow glyph on isRTL so it points start-ward in both directions', () => {
    // The hover nudge must be direction-aware: a leftward (-translate-x) nudge
    // is only allowed inside the LTR branch, paired with a rightward
    // (translate-x) nudge inside the RTL branch. A bare/unconditional
    // -translate-x with no RTL counterpart is the bug.
    expect(cartPage).toContain('isRTL ? (');
    expect(cartPage).toContain('group-hover:translate-x-0.5');
    expect(cartPage).toContain('group-hover:-translate-x-0.5');
  });
});

// ─── [P2] drift — total uses a scale step not arbitrary value ────────────────

describe('[P2] drift — order-summary total uses a type-scale step', () => {
  it('does not use arbitrary text-[1.375rem]', () => {
    expect(orderSummaryCard).not.toContain('text-[1.375rem]');
  });
});

// ─── [P3] states — ShippingCalculator t() calls carry fallbacks ──────────────

describe('[P3] states — ShippingCalculator t() calls have English fallbacks', () => {
  it('calculate trigger has a fallback string', () => {
    expect(shippingCalc).toMatch(/t\(\s*'cart\.shipping\.calculate'\s*,/);
  });

  it('enter_location has a fallback string', () => {
    expect(shippingCalc).toMatch(/t\(\s*'cart\.shipping\.enter_location'\s*,/);
  });

  it('select_city has a fallback string', () => {
    expect(shippingCalc).toMatch(/t\(\s*'cart\.shipping\.select_city'\s*,/);
  });

  it('cost has a fallback string', () => {
    expect(shippingCalc).toMatch(/t\(\s*'cart\.shipping\.cost'\s*,/);
  });

  it('hide has a fallback string', () => {
    expect(shippingCalc).toMatch(/t\(\s*'common\.hide'\s*,/);
  });
});
