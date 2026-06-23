/**
 * TDD tests for UI quick-win fixes (audit packet).
 * All tests read source files directly — no jsdom overhead.
 *
 * Fixes covered:
 *   1. Currency locale bug — OrderSummaryCard must use i18n.language, not 'ar-MA'
 *   2. Rating crash guard — ProductCard rating/stock_quantity must handle undefined
 *   3. RTL arrow flips — ArrowRight in EmptyCartState & OrderSummaryCard must have rtl:rotate-180
 *   4. Remove debug logging — no [CARTDBG] console.warn in products/[id]/page.tsx
 *   5. Unify returns copy — all return-window strings must say "14-day returns"
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8');

// ── Fix 1 — Currency locale bug ───────────────────────────────────────────────
describe('Fix 1 — Currency locale in OrderSummaryCard', () => {
  const src = read('src/components/cart/OrderSummaryCard.tsx');

  it('does NOT hardcode ar-MA locale in fmt()', () => {
    expect(src).not.toContain("'ar-MA'");
    expect(src).not.toContain('"ar-MA"');
  });

  it('uses i18n.language for the locale in fmt()', () => {
    // Must destructure i18n from useTranslation and use it in toLocaleString/Intl.NumberFormat
    expect(src).toMatch(/i18n/);
    // The fmt function must reference i18n.language (not a hardcoded locale string)
    expect(src).toMatch(/i18n\.language/);
  });
});

// ── Fix 2 — Rating crash guard ────────────────────────────────────────────────
describe('Fix 2 — Rating null-guard in ProductCard', () => {
  const card = read('src/components/products/ProductCard.tsx');

  it('uses nullish coalescing to default rating to 0', () => {
    // Either inline `product.rating ?? 0` or via a renamed destructured alias like `rawRating ?? 0`
    expect(card).toMatch(/\?\?\s*0/);
    // And the safe const named `rating` must exist
    expect(card).toMatch(/const rating\s*=/);
  });

  it('does NOT call rating.toFixed without first ensuring rating is defined', () => {
    // After the fix, `rating` is a const defaulted to 0, so toFixed is safe.
    // We verify the guard exists:
    expect(card).toMatch(/const rating\s*=/);
  });
});

describe('Fix 2 — Optional fields in Product type', () => {
  const types = read('src/lib/types.ts');

  it('marks rating as optional (?:) in the Product interface', () => {
    expect(types).toMatch(/rating\s*\?:/);
  });

  it('marks stock_quantity as optional (?:) in the Product interface', () => {
    expect(types).toMatch(/stock_quantity\s*\?:/);
  });

  it('marks reviews_count as optional (?:) in the Product interface', () => {
    expect(types).toMatch(/reviews_count\s*\?:/);
  });
});

// ── Fix 3 — RTL arrow flips ───────────────────────────────────────────────────
describe('Fix 3 — RTL rotate-180 on CTA arrows', () => {
  const emptyCart = read('src/components/cart/EmptyCartState.tsx');
  const orderSummary = read('src/components/cart/OrderSummaryCard.tsx');

  it('EmptyCartState ArrowRight has rtl:rotate-180', () => {
    // The ArrowRight CTA must include rtl:rotate-180 in its className
    expect(emptyCart).toMatch(/ArrowRight[^/]*rtl:rotate-180|rtl:rotate-180[^/]*ArrowRight/s);
  });

  it('OrderSummaryCard checkout ArrowRight has rtl:rotate-180', () => {
    expect(orderSummary).toMatch(/ArrowRight[^/]*rtl:rotate-180|rtl:rotate-180[^/]*ArrowRight/s);
  });
});

// ── Fix 4 — Remove debug logging ─────────────────────────────────────────────
describe('Fix 4 — No CARTDBG console.warn in products page', () => {
  const pdp = read('src/app/products/[id]/page.tsx');

  it('does not contain [CARTDBG] debug blocks', () => {
    expect(pdp).not.toContain('[CARTDBG]');
  });

  it('does not contain console.warn CARTDBG calls', () => {
    expect(pdp).not.toMatch(/console\.warn\s*\(\s*[`'"][^`'"]*CARTDBG/);
  });
});

// ── Fix 5 — Unify returns copy ────────────────────────────────────────────────
describe('Fix 5 — Consistent "14-day returns" wording', () => {
  const orderSummary = read('src/components/cart/OrderSummaryCard.tsx');
  const emptyCart = read('src/components/cart/EmptyCartState.tsx');
  const pdp = read('src/app/products/[id]/page.tsx');

  it('OrderSummaryCard uses "14-day returns" wording (not bare "Free returns")', () => {
    // Must contain "14-day" somewhere in the returns trust badge
    expect(orderSummary).toMatch(/14.day returns/i);
  });

  it('EmptyCartState uses "14-day returns" wording', () => {
    expect(emptyCart).toMatch(/14.day returns/i);
  });

  it('products/[id]/page.tsx uses "14-day returns" wording (not bare "Free returns")', () => {
    expect(pdp).toMatch(/14.day returns/i);
  });

  it('products/[id]/page.tsx does NOT have bare "Free returns" without "14-day"', () => {
    // After fix, "Free returns" (without "14") should not appear in trust badge
    // We check the trust.returns translation key no longer has bare 'Free returns' as fallback
    expect(pdp).not.toMatch(/['"](Free returns)['"]/);
  });
});
