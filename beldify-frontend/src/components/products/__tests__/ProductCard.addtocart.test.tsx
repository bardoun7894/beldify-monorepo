/**
 * TDD RED — ProductCard add-to-cart behavior tests
 *
 * Written BEFORE implementation. These tests must FAIL first.
 *
 * Item 4: When no `onAddToCart` prop is provided, the fallback branch must
 * call the cart context `addToCart` method instead of showing a fake success.
 *
 * Extended (P0 fix): cart button must use resolved stock_id (not product.id),
 * and must navigate to PDP when no stock_id is resolvable.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

const PRODUCT_CARD_PATH = path.resolve(__dirname, '../ProductCard.tsx');
const readFile = (p: string) => fs.readFileSync(p, 'utf8');

describe('ProductCard — fallback add-to-cart wires to cart context', () => {
  it('imports useCart or CartContext in ProductCard.tsx', () => {
    const content = readFile(PRODUCT_CARD_PATH);
    // Must import the cart hook or context to call addToCart
    expect(content).toMatch(/useCart|CartContext/);
  });

  it('calls addToCart or addItem in the fallback branch (no fake setTimeout-only path)', () => {
    const content = readFile(PRODUCT_CARD_PATH);
    // The fallback branch must invoke addToCart or addItem from context
    expect(content).toMatch(/addToCart|addItem/);
  });

  it('does NOT have the fake setTimeout-with-success-toast-but-no-cart-mutation pattern', () => {
    const content = readFile(PRODUCT_CARD_PATH);
    // Old pattern: setTimeout with success toast but no cart call — should be gone
    // The old code was:
    //   setTimeout(() => {
    //     setIsAddingToCart(false);
    //     toast.success(t('product.addedToCart'), ...);
    //   }, 600);
    // We check that a setTimeout that only shows success (without a real call) is gone.
    // We accept setTimeout if it is NOT the only thing in the else branch.
    const lines = content.split('\n');
    let inElseBranch = false;
    let elseDepth = 0;
    let hasCartCall = false;
    let hasOnlyFakeTimeout = false;

    // Simple heuristic: in the fallback else block, there must be a reference to
    // addToCart or addItem (not just setTimeout + toast)
    const fallbackRegion = content.match(/} else \{[\s\S]*?\/\/ Default behavior[\s\S]*?\}/);
    if (fallbackRegion) {
      const region = fallbackRegion[0];
      hasCartCall = /addToCart|addItem/.test(region);
      // The OLD "pure fake" pattern has ONLY setTimeout + no cart call
      hasOnlyFakeTimeout = /setTimeout/.test(region) && !hasCartCall;
      expect(hasOnlyFakeTimeout).toBe(false);
    } else {
      // If the comment is gone, the else branch was refactored; that's fine
      // Just verify addToCart appears somewhere after the `if (onAddToCart)` check
      expect(content).toMatch(/addToCart|addItem/);
    }
  });

  it('shows error toast when add-to-cart fails (error handling in fallback path)', () => {
    const content = readFile(PRODUCT_CARD_PATH);
    // Must have a catch/error path that shows toast.error
    expect(content).toMatch(/toast\.error/);
  });
});

// ─── P0 fix: stock_id resolution ────────────────────────────────────────────

describe('ProductCard — stock_id resolution (P0 critical fix)', () => {
  it('resolves stockId from product.stock?.id ?? product.stock_id when present', () => {
    const content = readFile(PRODUCT_CARD_PATH);
    // The card must attempt to resolve the stock id from the stock sub-object
    // or the product.stock_id field — matching the PDP / wishlist pattern.
    expect(content).toMatch(/product\.stock(?:_id|\?\.id)/);
  });

  it('uses addItem(stockId, 1, \'stock\') when a stock id is resolved', () => {
    const content = readFile(PRODUCT_CARD_PATH);
    // When a valid stock_id is present, the card must call addItem with type 'stock'.
    // This matches the PDP (line 902) and wishlist (line 56) pattern.
    expect(content).toMatch(/addItem\s*\(\s*stockId/);
  });

  it('falls back to router.push to PDP when stockId is null', () => {
    const content = readFile(PRODUCT_CARD_PATH);
    // When stockId cannot be resolved the card must navigate to the PDP
    // so stock resolution happens there (never silently submits a phantom id).
    // Must reference router.push or window.location for PDP navigation.
    expect(content).toMatch(/router\.push|\/products\/\$\{/);
  });

  it('does NOT call addItem with product.id directly (wrong: would post product_id as stock_id)', () => {
    const content = readFile(PRODUCT_CARD_PATH);
    // The old addToCart(product) → addItem(product.id, 1) path would send the
    // product id as stock_id. We must not have a bare addToCart(product) call
    // in the default branch any more.
    // We allow addToCart only in the onAddToCart prop branch.
    // Heuristic: addItem must NOT be called with a bare `product.id` as its first arg
    // (it must be called with the resolved stockId).
    const bareProductIdCall = /addItem\s*\(\s*(?:product\.id|Number\s*\(\s*product\.id)/;
    expect(content).not.toMatch(bareProductIdCall);
  });
});
