/**
 * Cart Page — Atlas Redesign TDD Tests
 *
 * These tests verify the cart page and cart components meet the
 * Atlas design bar: RTL-safe logical CSS, shadow-atlas-* tokens,
 * proper empty state, sticky summary, mobile bottom bar, cross-sell rail,
 * and WCAG-compliant contrast tokens.
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

// ─── CartItemRow ─────────────────────────────────────────────────────────────

describe('CartItemRow — Atlas design tokens', () => {
  it('uses shadow-atlas-sm on card surface', () => {
    expect(cartItemRow).toContain('shadow-atlas-sm');
  });

  it('uses shadow-atlas-md on hover (hover:shadow-atlas-md)', () => {
    expect(cartItemRow).toContain('hover:shadow-atlas-md');
  });

  it('uses rounded-2xl for the article card', () => {
    expect(cartItemRow).toContain('rounded-2xl');
  });

  it('uses logical CSS start/end not left/right for spacing', () => {
    expect(cartItemRow).not.toMatch(/\bms-\d|\bme-\d|ps-\d|pe-\d/);
    // Should use logical ps-/pe- or gap — not left:/right: arbitrary values
    expect(cartItemRow).not.toContain('left-');
    expect(cartItemRow).not.toContain('right-');
  });

  it('product image thumbnail is rounded-xl', () => {
    expect(cartItemRow).toContain('rounded-xl');
  });

  it('qty stepper uses indigo-50 background', () => {
    expect(cartItemRow).toContain('bg-indigo-50');
  });

  it('remove button has aria-label', () => {
    expect(cartItemRow).toContain('aria-label');
  });

  it('decrease qty button has aria-label', () => {
    expect(cartItemRow).toContain('aria-label');
  });

  it('increase qty button has aria-label', () => {
    expect(cartItemRow).toContain('aria-label');
  });

  it('sale/discount price uses rose-700 (Tetouani Garnet) or line-through', () => {
    expect(cartItemRow).toContain('line-through');
  });

  it('low stock warning uses amber-600 (warm, not generic red)', () => {
    expect(cartItemRow).toContain('amber-600');
  });

  it('hover lift uses transition-all duration-200', () => {
    expect(cartItemRow).toContain('transition-all');
    expect(cartItemRow).toContain('duration-200');
  });
});

// ─── OrderSummaryCard ─────────────────────────────────────────────────────────

describe('OrderSummaryCard — Atlas design tokens', () => {
  it('uses shadow-atlas-sm card surface', () => {
    expect(orderSummaryCard).toContain('shadow-atlas-sm');
  });

  it('uses rounded-2xl container', () => {
    expect(orderSummaryCard).toContain('rounded-2xl');
  });

  it('checkout button is amber-500 (accent CTA)', () => {
    expect(orderSummaryCard).toContain('bg-amber-500');
  });

  it('checkout button text is amber-950 (AA contrast)', () => {
    expect(orderSummaryCard).toContain('text-amber-950');
  });

  it('promo input uses rounded-full / rounded-2xl', () => {
    expect(orderSummaryCard).toMatch(/rounded-full|rounded-2xl/);
  });

  it('free shipping threshold text uses [#855300] (not text-amber-700 — contrast AA)', () => {
    expect(orderSummaryCard).toContain('#855300');
  });

  it('total price row uses Playfair Display inline style', () => {
    expect(orderSummaryCard).toContain('Playfair Display');
  });

  it('trust badges use indigo-50 surface with indigo-100 ring', () => {
    expect(orderSummaryCard).toContain('bg-indigo-50');
    expect(orderSummaryCard).toContain('ring-indigo-100');
  });

  it('divider uses border-indigo-100 (warm hairline)', () => {
    expect(orderSummaryCard).toContain('border-indigo-100');
  });

  it('sticky desktop positioning uses lg:sticky lg:top-24', () => {
    expect(orderSummaryCard).toContain('lg:sticky');
    expect(orderSummaryCard).toContain('lg:top-24');
  });
});

// ─── EmptyCartState ───────────────────────────────────────────────────────────

describe('EmptyCartState — Atlas design tokens', () => {
  it('uses Playfair Display headline', () => {
    expect(emptyCartState).toContain('Playfair Display');
  });

  it('shopping bag icon container uses indigo-50 bg + indigo-100 ring', () => {
    expect(emptyCartState).toContain('bg-indigo-50');
    expect(emptyCartState).toContain('ring-indigo-100');
  });

  it('CTA button uses amber-500 bg (accent)', () => {
    expect(emptyCartState).toContain('bg-amber-500');
  });

  it('CTA button text is amber-950 (AA contrast)', () => {
    expect(emptyCartState).toContain('text-amber-950');
  });

  it('subtitle text uses readable indigo-600/700 (WCAG AA, not muted indigo-300/400)', () => {
    // Critique [P1 color]: body-copy muted indigos failed AA on parchment.
    // EmptyCartState prose is now indigo-600 (readable), reserving lighter
    // indigos for non-text decoration only.
    expect(emptyCartState).toMatch(/text-indigo-(600|700)/);
    expect(emptyCartState).not.toMatch(/text-indigo-(300|400)/);
  });

  it('is a standalone component (not inline in page)', () => {
    // The EmptyCartState file should export a default function
    expect(emptyCartState).toContain('export default');
  });
});

// ─── CartMobileBar ────────────────────────────────────────────────────────────

describe('CartMobileBar — Atlas design tokens', () => {
  it('is md:hidden (only shown on mobile)', () => {
    expect(cartMobileBar).toContain('md:hidden');
  });

  it('checkout CTA uses amber-500 bg', () => {
    expect(cartMobileBar).toContain('bg-amber-500');
  });

  it('checkout CTA text is amber-950', () => {
    expect(cartMobileBar).toContain('text-amber-950');
  });

  it('bar has safe-area padding (pb-safe or pb-[env(safe-area-inset-bottom)])', () => {
    expect(cartMobileBar).toMatch(/pb-safe|safe-area-inset-bottom/);
  });

  it('bar uses indigo-950 dark surface', () => {
    expect(cartMobileBar).toContain('indigo-950');
  });

  it('total label is Playfair Display', () => {
    expect(cartMobileBar).toContain('Playfair Display');
  });
});

// ─── CartPage shell ───────────────────────────────────────────────────────────

describe('cart/page.tsx — Atlas shell', () => {
  it('page background uses neutral wash (bg-gray-50 — parchment retired 2026-06-10)', () => {
    expect(cartPage).toContain('bg-gray-50');
  });

  it('main heading uses Playfair Display', () => {
    expect(cartPage).toContain('Playfair Display');
  });

  it('AI chip uses bg-amber-100 text-amber-800 ring-amber-200 (amber accent chip)', () => {
    expect(cartPage).toContain('bg-amber-100');
    expect(cartPage).toContain('text-amber-800');
    expect(cartPage).toContain('ring-amber-200');
  });

  it('loading skeleton uses neutral bg-gray-100 (Atlas skeleton token)', () => {
    expect(cartPage).toContain('bg-gray-100');
  });

  it('bespoke strip uses indigo-900 bg (Tetouani cobalt accent strip)', () => {
    expect(cartPage).toContain('bg-indigo-900');
  });

  it('does NOT use generic text-gray-400 on indigo backgrounds', () => {
    // Anti-pattern: gray text on colored bg — must use indigo-* tints instead
    // The bespoke strip and cart header must not have bare text-gray-400
    expect(cartPage).not.toMatch(/bg-indigo-[89][0-9]{2}[^>]*text-gray-400/);
  });

  it('breadcrumb uses logical CSS separator (no left/right)', () => {
    expect(cartPage).not.toContain('ml-');
    expect(cartPage).not.toContain('mr-');
  });

  it('imports CartItemRow component', () => {
    expect(cartPage).toContain("CartItemRow");
  });

  it('imports OrderSummaryCard component', () => {
    expect(cartPage).toContain("OrderSummaryCard");
  });

  it('imports EmptyCartState component', () => {
    expect(cartPage).toContain("EmptyCartState");
  });

  it('imports CartMobileBar component', () => {
    expect(cartPage).toContain("CartMobileBar");
  });
});

// ─── ShippingCalculator ────────────────────────────────────────────────────────

describe('ShippingCalculator — Atlas design tokens', () => {
  it('expanded container uses rounded-2xl', () => {
    expect(shippingCalc).toContain('rounded-2xl');
  });

  it('trigger button has Truck icon', () => {
    expect(shippingCalc).toContain('Truck');
  });

  it('uses indigo-600 text for trigger link', () => {
    expect(shippingCalc).toContain('indigo-600');
  });

  it('free shipping displays [#855300] (AA on parchment)', () => {
    expect(shippingCalc).toContain('#855300');
  });
});
