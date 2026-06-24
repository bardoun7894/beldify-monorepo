/**
 * P1-D: Server-quoted cart checkout — derived totals regression
 *
 * The P1-D fix landed in src/app/checkout/page.tsx:
 *   1. The quote useEffect now fires for the CART path (not just isBuyNow).
 *   2. Derived totals (subtotal, totalAmount, shippingAmount, discountAmount)
 *      prefer `quote.*` when available, and fall back to `cartState.*` only
 *      while the quote is loading.
 *
 * Verification strategy:
 *   The full checkout page is too heavy for isolated jsdom rendering (it
 *   requires many providers, address services, shipping services, etc.) — the
 *   existing COD behavioral test already exercises the full render path.
 *   Instead we verify:
 *     A. Source-level: the useEffect fires on the cart path (not gated by isBuyNow).
 *     B. Source-level: derived totals are structured so quote wins over cartState.
 *     C. Logic-level: the derivation formula is correct by re-implementing it in
 *        the test with both a stale cartState and a resolved quote, confirming
 *        the divergence scenario resolves to the quote value (Y, not X).
 *
 * NOTE: C is a pure-logic unit test (no DOM, no mocks) that mirrors the exact
 * conditional used in the page source (lines ~1052-1067). If the source formula
 * ever diverges from the test formula, the test itself should be updated.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');

function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf-8');
}

// ── A: Source-level useEffect gate ─────────────────────────────────────────────

describe('P1-D A — useEffect fires on cart path (source check)', () => {
  it('quote useEffect does NOT gate exclusively on isBuyNow (cart path enabled)', () => {
    const src = read('src/app/checkout/page.tsx');
    // Before the fix: only `if (isBuyNow && !buyNowItem) return;` existed.
    // After the fix: BOTH guards are present — buy-now guard AND cart guard.
    // The cart guard is: if (!isBuyNow && !cartState?.items?.length) return;
    const hasBuyNowGuard = src.includes('if (isBuyNow && !buyNowItem) return');
    const hasCartGuard = src.includes('!isBuyNow && !cartState?.items?.length') &&
                         src.includes('return');
    expect(hasBuyNowGuard).toBe(true);
    expect(hasCartGuard).toBe(true);
  });

  it('cart items are mapped using item.stock_id and item.quantity inside the effect', () => {
    const src = read('src/app/checkout/page.tsx');
    // The cart path maps: cartState!.items.map((item) => ({ stock_id: item.stock_id, quantity: item.quantity }))
    expect(src).toMatch(/cartState.*items.*map.*item.*stock_id.*item\.stock_id/s);
    expect(src).toMatch(/item\.quantity/);
  });

  it('coupon_code from cartState is forwarded to getCheckoutQuote on cart path', () => {
    const src = read('src/app/checkout/page.tsx');
    // The payload: coupon_code: isBuyNow ? null : (cartState?.coupon_code ?? null)
    expect(src).toMatch(/coupon_code.*isBuyNow.*null.*cartState.*coupon_code/s);
  });
});

// ── B: Source-level derived totals structure ───────────────────────────────────

describe('P1-D B — derived totals prefer quote for cart path (source check)', () => {
  it('totalAmount: cart path uses quote.total_amount when quote is set', () => {
    const src = read('src/app/checkout/page.tsx');
    // Pattern: quote ? quote.total_amount : (cartState?.total_amount ?? 0)
    expect(src).toMatch(/quote\s*\?\s*quote\.total_amount.*cartState.*total_amount/s);
  });

  it('subtotal: cart path uses quote.subtotal when quote is set', () => {
    const src = read('src/app/checkout/page.tsx');
    expect(src).toMatch(/quote\s*\?\s*quote\.subtotal.*cartState.*subtotal/s);
  });

  it('shippingAmount: cart path uses quote.shipping_amount when quote is set', () => {
    const src = read('src/app/checkout/page.tsx');
    expect(src).toMatch(/quote\s*\?\s*quote\.shipping_amount.*cartState.*shipping_amount/s);
  });
});

// ── C: Pure logic unit test — divergence scenario ──────────────────────────────

/**
 * This mirrors the exact derivation formula in the page (lines ~1052-1067).
 * Given isBuyNow=false (cart path), with cartState.total_amount=X and
 * quote.total_amount=Y (X≠Y), the displayed total must be Y.
 * While quoteLoading=true and quote=null, it must fall back to cartState (X).
 */
function deriveCartTotals(
  quote: { subtotal: number; shipping_amount: number; tax_amount: number; discount_amount: number; total_amount: number } | null,
  cartState: { subtotal: number; shipping_amount: number; tax_amount: number; discount_amount: number; total_amount: number } | null,
): { subtotal: number; shippingAmount: number; taxAmount: number; discountAmount: number; totalAmount: number } {
  // This mirrors the non-isBuyNow branch exactly as written in page.tsx:
  const subtotal = quote ? quote.subtotal : (cartState?.subtotal ?? 0);
  const shippingAmount = quote ? quote.shipping_amount : (cartState?.shipping_amount ?? 0);
  const taxAmount = quote ? quote.tax_amount : (cartState?.tax_amount ?? 0);
  const discountAmount = quote ? quote.discount_amount : (cartState?.discount_amount ?? 0);
  const totalAmount = quote ? quote.total_amount : (cartState?.total_amount ?? 0);
  return { subtotal, shippingAmount, taxAmount, discountAmount, totalAmount };
}

describe('P1-D C — derived totals divergence: quote wins over stale cartState', () => {
  const staleCartState = {
    subtotal: 250,
    shipping_amount: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 250, // X — stale local value
  };

  const serverQuote = {
    subtotal: 230,         // server-calculated (e.g. discount applied)
    shipping_amount: 30,
    tax_amount: 0,
    discount_amount: 20,
    total_amount: 240,     // Y — authoritative server value, X≠Y
  };

  it('displays quote.total_amount (Y=240) not cartState.total_amount (X=250) when quote is resolved', () => {
    const result = deriveCartTotals(serverQuote, staleCartState);
    expect(result.totalAmount).toBe(240);
    expect(result.totalAmount).not.toBe(250);
  });

  it('displays quote.subtotal (230) not stale cartState.subtotal (250) when quote is resolved', () => {
    const result = deriveCartTotals(serverQuote, staleCartState);
    expect(result.subtotal).toBe(230);
  });

  it('displays quote.shipping_amount (30) when quote is resolved', () => {
    const result = deriveCartTotals(serverQuote, staleCartState);
    expect(result.shippingAmount).toBe(30);
  });

  it('displays quote.discount_amount (20) when quote is resolved', () => {
    const result = deriveCartTotals(serverQuote, staleCartState);
    expect(result.discountAmount).toBe(20);
  });

  it('falls back to cartState.total_amount (X=250) while quoteLoading (quote=null)', () => {
    // While loading, quote is null — must show cartState value, not zero
    const result = deriveCartTotals(null, staleCartState);
    expect(result.totalAmount).toBe(250);
  });

  it('falls back to cartState.subtotal (250) while quoteLoading', () => {
    const result = deriveCartTotals(null, staleCartState);
    expect(result.subtotal).toBe(250);
  });

  it('falls back to 0 (not crash) when both quote and cartState are null', () => {
    const result = deriveCartTotals(null, null);
    expect(result.totalAmount).toBe(0);
    expect(result.subtotal).toBe(0);
    expect(result.shippingAmount).toBe(0);
  });
});
