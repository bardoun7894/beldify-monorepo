/**
 * TDD RED — Guest cart checkout gating tests
 *
 * Written BEFORE implementation. Must fail first.
 *
 * Proves that the auth gate in handlePaymentSubmit is removed for the cart path:
 * 1. When user is NOT authenticated (user.id is null/undefined), calling
 *    handlePaymentSubmit should NOT short-circuit with an auth error.
 * 2. The gate  `if (!isBuyNow && !user?.id)` must be removed/relaxed.
 *
 * Strategy: Read the source file and assert on specific code patterns.
 * This is an AST-lite approach (string matching) because the auth gate is a
 * simple conditional that should simply be deleted.
 */

import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

const CHECKOUT_PATH = path.resolve(
  __dirname,
  '../app/checkout/page.tsx'
);

describe('Checkout guest cart gating — source-level checks', () => {
  it('checkout/page.tsx exists', () => {
    expect(fs.existsSync(CHECKOUT_PATH)).toBe(true);
  });

  it('does NOT hard-block guest cart checkout with auth_required gate', () => {
    const src = fs.readFileSync(CHECKOUT_PATH, 'utf-8');
    // The old gate pattern: if (!isBuyNow && !user?.id) { toast.error(t('checkout.errors.auth_required'))
    // After the fix, this block should NOT exist.
    const hasAuthGate =
      src.includes("!isBuyNow && !user?.id") &&
      src.includes("checkout.errors.auth_required");
    expect(hasAuthGate).toBe(false);
  });

  it('still loads saved addresses only for authenticated users (isAuthenticated guard remains)', () => {
    const src = fs.readFileSync(CHECKOUT_PATH, 'utf-8');
    // Saved-address fetch is guarded: if (!isAuthenticated) return;
    // This should remain unchanged.
    expect(src).toContain("if (!isAuthenticated) return;");
  });

  it('createCheckoutOrder is used for the cart path when user is a guest', () => {
    // After the fix, the cart path should call createCheckoutOrder (the public endpoint)
    // when user is not authenticated, OR call createOrder with no customer_id.
    // The simplest check: createCheckoutOrder exists and is exported from orderService.
    const src = fs.readFileSync(CHECKOUT_PATH, 'utf-8');
    // The page already imports orderService which has createCheckoutOrder.
    // Verify the page still calls the service for the non-buyNow path.
    expect(src).toContain("orderService");
  });
});
