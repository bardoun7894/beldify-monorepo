import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * TDD tests for per-seller shipping lines in the checkout order summary (spec 011 W2).
 *
 * RED phase: these must fail before implementation.
 * GREEN phase: pass after updating checkout/page.tsx.
 *
 * Scenarios:
 * 1. When per_seller has >1 entries, per-seller shipping lines appear in order summary
 * 2. When per_seller is absent or has ≤1 entry, renders flat shipping as today
 * 3. Store name resolution: use store name from cart items if available, else "Shop #id"
 * 4. i18n key exists in the checkout page for per-seller shipping label
 */

const CHECKOUT_PATH = path.resolve(
  __dirname,
  '../../checkout/page.tsx'
);

function readCheckout(): string {
  return fs.readFileSync(CHECKOUT_PATH, 'utf-8');
}

describe('checkout/page.tsx — per-seller shipping in order summary', () => {
  it('CheckoutQuote interface includes per_seller array', () => {
    const src = readCheckout();
    // The local CheckoutQuote interface (in checkout/page.tsx) must expose per_seller
    expect(src).toMatch(/per_seller\??:\s*(PerSellerQuote|Array<[^>]+>|\{[^}]+\}\[\])/);
  });

  it('renders per-seller shipping row when per_seller.length > 1', () => {
    const src = readCheckout();
    // Must branch on per_seller length to show individual seller shipping fees
    expect(src).toMatch(/per_seller.*\.length\s*[>!]\s*1|per_seller\?\.length\s*[>!]\s*1|isMultiSeller/);
  });

  it('maps over per_seller to render individual shipping fee rows', () => {
    const src = readCheckout();
    // per_seller must be iterated to render multiple shipping lines
    expect(src).toMatch(/per_seller.*\.map\s*\(/);
  });

  it('shows "Shipping — Shop A: X MAD" style label using t()', () => {
    const src = readCheckout();
    // Must use a t() translation key for the per-seller shipping label
    expect(src).toMatch(/t\(['"]checkout\.summary\.seller_shipping/);
  });

  it('falls back to "Shop #id" when store name is not available', () => {
    const src = readCheckout();
    // Must have fallback label using store_id
    expect(src).toMatch(/Shop #|seller_name.*store_id|store_id.*Shop #/);
  });

  it('uses cart item store field to resolve store name', () => {
    const src = readCheckout();
    // Store name should come from cartState.items.find by store_id, or store.name
    expect(src).toMatch(/store\.name|store_id.*store|find.*store_id/);
  });
});
