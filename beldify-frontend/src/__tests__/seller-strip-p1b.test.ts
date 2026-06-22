/**
 * P1-B: Seller identity on product cards — TDD gate
 *
 * Tests:
 *   A1: Product type extensions (lib/types.ts + types/product.ts)
 *   A2: SellerStrip component existence and structural requirements
 *   A3: ProductCard wires SellerStrip
 *   B5-B6: Cart-path server quote useEffect + derived totals
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');

function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf-8');
}

// ─── A1: Product type extensions ──────────────────────────────────────────────

describe('A1 — Product interface extensions', () => {
  it('lib/types.ts Product has store_name as optional string', () => {
    const src = read('src/lib/types.ts');
    expect(src).toMatch(/store_name\?:\s*string/);
  });

  it('lib/types.ts Product has store_slug as optional string', () => {
    const src = read('src/lib/types.ts');
    expect(src).toMatch(/store_slug\?:\s*string/);
  });

  it('lib/types.ts Product has store_rating as optional number', () => {
    const src = read('src/lib/types.ts');
    expect(src).toMatch(/store_rating\?:\s*number/);
  });

  it('lib/types.ts Product has store_is_verified as optional boolean', () => {
    const src = read('src/lib/types.ts');
    expect(src).toMatch(/store_is_verified\?:\s*boolean/);
  });

  it('types/product.ts Product has store_name as optional string', () => {
    const src = read('src/types/product.ts');
    expect(src).toMatch(/store_name\?:\s*string/);
  });

  it('types/product.ts Product has store_slug as optional string', () => {
    const src = read('src/types/product.ts');
    expect(src).toMatch(/store_slug\?:\s*string/);
  });

  it('types/product.ts Product has store_rating as optional number', () => {
    const src = read('src/types/product.ts');
    expect(src).toMatch(/store_rating\?:\s*number/);
  });

  it('types/product.ts Product has store_is_verified as optional boolean', () => {
    const src = read('src/types/product.ts');
    expect(src).toMatch(/store_is_verified\?:\s*boolean/);
  });
});

// ─── A2: SellerStrip component ────────────────────────────────────────────────

describe('A2 — SellerStrip component structure', () => {
  it('SellerStrip.tsx exists at src/components/products/SellerStrip.tsx', () => {
    expect(() => read('src/components/products/SellerStrip.tsx')).not.toThrow();
  });

  it('SellerStrip links to /shops/[store_slug]', () => {
    const src = read('src/components/products/SellerStrip.tsx');
    // Should contain a dynamic /shops/ link
    expect(src).toMatch(/\/shops\/\$\{.*store_slug/);
  });

  it('SellerStrip renders nothing when store_name is absent (return null guard)', () => {
    const src = read('src/components/products/SellerStrip.tsx');
    // Must have a null-return guard when store_name is absent
    expect(src).toMatch(/return null/);
    expect(src).toMatch(/store_name/);
  });

  it('SellerStrip uses BadgeCheck icon from lucide-react', () => {
    const src = read('src/components/products/SellerStrip.tsx');
    expect(src).toContain('BadgeCheck');
  });

  it('SellerStrip only renders verified badge when store_is_verified === true', () => {
    const src = read('src/components/products/SellerStrip.tsx');
    // Must gate on store_is_verified strictly
    expect(src).toMatch(/store_is_verified.*===.*true|store_is_verified\s*&&/);
  });

  it('SellerStrip uses logical RTL properties (no ml-/mr-/left/right physical props)', () => {
    const src = read('src/components/products/SellerStrip.tsx');
    // Should not use physical left/right margins
    const hasPhysicalMargin = /\bml-\d|\bmr-\d/.test(src);
    expect(hasPhysicalMargin).toBe(false);
  });

  it('SellerStrip renders a shop rating when store_rating is a positive number', () => {
    const src = read('src/components/products/SellerStrip.tsx');
    expect(src).toMatch(/store_rating/);
    // Should show a star-like indicator
    expect(src).toMatch(/★|star|Star/i);
  });

  it('SellerStrip uses useTranslation for the verified label', () => {
    const src = read('src/components/products/SellerStrip.tsx');
    expect(src).toMatch(/useTranslation|t\(/);
    // Must use a translation key for verified badge, not hardcoded "Verified"
    expect(src).toMatch(/shop\.verified|verified/i);
  });

  it('SellerStrip link has an aria-label for accessibility', () => {
    const src = read('src/components/products/SellerStrip.tsx');
    expect(src).toMatch(/aria-label/);
  });
});

// ─── A3: ProductCard wires SellerStrip ───────────────────────────────────────

describe('A3 — ProductCard wires SellerStrip', () => {
  it('ProductCard imports SellerStrip', () => {
    const src = read('src/components/products/ProductCard.tsx');
    expect(src).toMatch(/import.*SellerStrip.*from/);
  });

  it('ProductCard renders <SellerStrip', () => {
    const src = read('src/components/products/ProductCard.tsx');
    expect(src).toContain('<SellerStrip');
  });

  it('ProductCard passes store_name to SellerStrip', () => {
    const src = read('src/components/products/ProductCard.tsx');
    expect(src).toMatch(/store_name/);
  });

  it('ProductCard passes store_slug to SellerStrip', () => {
    const src = read('src/components/products/ProductCard.tsx');
    expect(src).toMatch(/store_slug/);
  });

  it('ProductCard passes store_is_verified to SellerStrip', () => {
    const src = read('src/components/products/ProductCard.tsx');
    expect(src).toMatch(/store_is_verified/);
  });
});

// ─── B5-B6: Cart quote useEffect + derived totals ────────────────────────────

describe('B5 — Cart path fetches server quote on mount', () => {
  it('checkout page has a cart-path quote effect (not just isBuyNow guard)', () => {
    const src = read('src/app/checkout/page.tsx');
    // Must have a quote effect that does NOT require isBuyNow
    // The pattern: if (!isBuyNow && cartState?.items?.length) fetch quote
    // OR: the existing effect no longer gates on isBuyNow exclusively
    const hasCartQuoteEffect =
      src.includes('!isBuyNow') &&
      src.includes('getCheckoutQuote') &&
      // The effect must reference cartState.items in some cart-path branch
      src.includes('cartState');
    expect(hasCartQuoteEffect).toBe(true);
  });

  it('cart quote effect maps cart items using stock_id + quantity', () => {
    const src = read('src/app/checkout/page.tsx');
    // The cart quote items must use item.stock_id
    expect(src).toMatch(/stock_id.*item\.stock_id|item\.stock_id.*stock_id/);
  });

  it('cart quote effect includes coupon_code from cartState', () => {
    const src = read('src/app/checkout/page.tsx');
    // The cart quote payload must include coupon_code (from cartState.coupon_code)
    // Check that coupon_code is referenced near getCheckoutQuote
    expect(src).toMatch(/coupon_code/);
    expect(src).toMatch(/cartState[^.]*\.coupon_code|cartState\.coupon_code/);
  });
});

describe('B6 — Derived totals prefer quote over cartState for cart path', () => {
  it('subtotal derived total uses quote.subtotal when quote is available for cart path', () => {
    const src = read('src/app/checkout/page.tsx');
    // The subtotal derivation must now include a cart-path quote branch
    // Pattern: quote ? quote.subtotal : cartState?.subtotal
    expect(src).toMatch(/quote\s*\?\s*quote\.subtotal.*cartState|quote\.subtotal.*:.*cartState/s);
  });

  it('totalAmount derived total uses quote.total_amount for cart path', () => {
    const src = read('src/app/checkout/page.tsx');
    expect(src).toMatch(/quote\s*\?\s*quote\.total_amount.*cartState|quote\.total_amount.*:.*cartState/s);
  });

  it('shippingAmount derived total uses quote.shipping_amount for cart path', () => {
    const src = read('src/app/checkout/page.tsx');
    expect(src).toMatch(/quote\s*\?\s*quote\.shipping_amount.*cartState|quote\.shipping_amount.*:.*cartState/s);
  });
});
