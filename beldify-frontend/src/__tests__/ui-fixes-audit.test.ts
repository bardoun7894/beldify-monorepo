/**
 * UI Fixes Audit — TDD red-green gate
 *
 * Covers all 9 audit items:
 *  1. NaN guard in invoice/page.tsx
 *  2. NaN guard in order-confirmation/page.tsx
 *  3. Wishlist sale_price non-null assertion guarded
 *  4. formatDate in lib/utils.ts accepts optional locale param
 *  5. orders/page.tsx uses BCP-47 map (not 'ma' fallback)
 *  6. orders/[orderNumber]/page.tsx uses BCP-47 map (not 'ma' fallback)
 *  7. mega-offers/page.tsx uses BCP-47 locale (not 'ma' fallback)
 *  8. seller/page.tsx fmtMAD i18n-threaded / sub-labels translated
 *  9. seller/orders/[id]/page.tsx fmtDate/fmtMAD i18n-threaded
 * 10. seller/payouts/page.tsx fmtDate/fmtMAD i18n-threaded
 * 11. seller/credits/page.tsx fmtDate i18n-threaded
 * 12. seller/page.tsx KPI sub-labels wrapped in t()
 * 13. login/page.tsx debug logger.log removed
 * 14. register/page.tsx debug logger.log removed
 * 15. orders/page.tsx debug logger.log removed
 * 16. community/messages/page.tsx ChevronRight has rtl:rotate-180
 * 17. seller/products/[id]/edit required asterisks on Category/Price/Qty
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');

function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf-8');
}

// ── 1. NaN guard — invoice/page.tsx ──────────────────────────────────────────
describe('Fix 1 — NaN guard in invoice reduce', () => {
  it('invoice reduce uses Number() guard on unit_price', () => {
    const src = read('src/app/orders/[orderNumber]/invoice/page.tsx');
    // Must coerce unit_price through Number() or explicit fallback
    expect(src).toMatch(/Number\s*\(\s*item\.unit_price\s*\)/);
  });

  it('invoice reduce uses Number() guard on quantity', () => {
    const src = read('src/app/orders/[orderNumber]/invoice/page.tsx');
    expect(src).toMatch(/Number\s*\(\s*item\.quantity\s*\)/);
  });
});

// ── 2. NaN guard — order-confirmation/page.tsx ───────────────────────────────
describe('Fix 2 — NaN guard in order-confirmation reduce', () => {
  it('order-confirmation reduce uses Number() guard on unit_price', () => {
    const src = read('src/app/order-confirmation/page.tsx');
    expect(src).toMatch(/Number\s*\(\s*item\.unit_price\s*\)/);
  });

  it('order-confirmation reduce uses Number() guard on quantity', () => {
    const src = read('src/app/order-confirmation/page.tsx');
    expect(src).toMatch(/Number\s*\(\s*item\.quantity\s*\)/);
  });
});

// ── 3. Wishlist sale_price guarded ───────────────────────────────────────────
describe('Fix 3 — Wishlist sale_price guard', () => {
  it('wishlist does NOT use sale_price! non-null assertion', () => {
    const src = read('src/app/wishlist/page.tsx');
    // The bang assertion on sale_price should be gone
    expect(src).not.toMatch(/sale_price!/);
  });

  it('wishlist uses nullish coalescing guard for sale_price', () => {
    const src = read('src/app/wishlist/page.tsx');
    // Should use nullish coalescing ?? to guard against null sale_price
    expect(src).toMatch(/sale_price\s*\?\?/);
  });
});

// ── 4. formatDate in lib/utils.ts accepts optional locale ────────────────────
describe('Fix 4 — formatDate in utils.ts accepts locale param', () => {
  it('formatDate signature has an optional locale parameter', () => {
    const src = read('src/lib/utils.ts');
    // Function should accept locale param (optional)
    expect(src).toMatch(/formatDate\s*\([^)]*locale/);
  });

  it('formatDate uses a BCP-47 locale map, not hardcoded en-US', () => {
    const src = read('src/lib/utils.ts');
    // Should no longer have the raw hardcoded 'en-US' as the only locale
    // (it can still appear in a map as default, but must have ar-MA or fr-FR)
    expect(src).toMatch(/ar-MA/);
  });
});

// ── 5. orders/page.tsx BCP-47 map ────────────────────────────────────────────
describe('Fix 5 — orders/page.tsx locale-aware date formatting', () => {
  it('orders page uses fr-FR locale for French', () => {
    const src = read('src/app/orders/page.tsx');
    expect(src).toMatch(/fr-FR/);
  });

  it('orders page does NOT use raw "ma" locale string (invalid BCP-47)', () => {
    const src = read('src/app/orders/page.tsx');
    // Should not have 'ma' as a BCP-47 locale
    // (The string 'ma' as a locale fallback — e.g. i18n.language || 'ma')
    expect(src).not.toMatch(/Intl\.[A-Za-z]+Format\(['"]ma['"]/);
  });
});

// ── 6. orders/[orderNumber]/page.tsx BCP-47 map ──────────────────────────────
describe('Fix 6 — orders/[orderNumber]/page.tsx locale-aware date formatting', () => {
  it('order detail page uses fr-FR locale for French', () => {
    const src = read('src/app/orders/[orderNumber]/page.tsx');
    expect(src).toMatch(/fr-FR/);
  });
});

// ── 7. mega-offers/page.tsx BCP-47 locale ────────────────────────────────────
describe('Fix 7 — mega-offers page valid BCP-47 locale', () => {
  it('mega-offers locale fallback is not "ma" (invalid BCP-47)', () => {
    const src = read('src/app/mega-offers/page.tsx');
    // Should not use || 'ma' as a locale fallback
    expect(src).not.toMatch(/i18n\.language\s*\|\|\s*['"]ma['"]/);
  });
});

// ── 8. seller/page.tsx sub-labels use t() ────────────────────────────────────
describe('Fix 8 — seller/page.tsx KPI sub-labels translated', () => {
  it('seller dashboard "Last X days" sub uses t()', () => {
    const src = read('src/app/seller/page.tsx');
    // The "Last ${earnings.period} days" must now be wrapped in t(...)
    expect(src).toMatch(/t\(['"]seller\.dashboard\.kpi_gross_sub/);
  });

  it('seller dashboard commission sub uses t()', () => {
    const src = read('src/app/seller/page.tsx');
    expect(src).toMatch(/t\(['"]seller\.dashboard\.kpi_net_sub/);
  });

  it('seller dashboard avg order sub uses t()', () => {
    const src = read('src/app/seller/page.tsx');
    expect(src).toMatch(/t\(['"]seller\.dashboard\.kpi_orders_sub/);
  });

  it('seller dashboard commission rate sub uses t()', () => {
    const src = read('src/app/seller/page.tsx');
    expect(src).toMatch(/t\(['"]seller\.dashboard\.kpi_commission_sub/);
  });

  it('seller dashboard "Store suspended" text uses t()', () => {
    const src = read('src/app/seller/page.tsx');
    // Should NOT have bare hardcoded English "Store suspended"
    expect(src).not.toMatch(/>Store suspended — contact support</);
  });

  it('seller dashboard "Track progress" link uses t()', () => {
    const src = read('src/app/seller/page.tsx');
    // Should wrap 'Track progress' inside a t() call, not as a bare JSX expression
    // Valid: t('seller.onboarding_banner.track_progress', 'Track progress')
    // Invalid: {isPending ? 'Track progress' : ...} with no t() wrapper
    expect(src).toMatch(/t\(['"]seller\.onboarding_banner\.track_progress/);
  });
});

// ── 9. seller/orders/[id]/page.tsx i18n-threaded ─────────────────────────────
describe('Fix 9 — seller/orders/[id]/page.tsx locale-aware formatters', () => {
  it('seller order detail fmtDate does not hardcode fr-MA', () => {
    const src = read('src/app/seller/orders/[id]/page.tsx');
    // Should not have hardcoded 'fr-MA' in fmtDate
    expect(src).not.toMatch(/toLocaleDateString\s*\(\s*['"]fr-MA['"]/);
  });

  it('seller order detail fmtMAD accepts locale param or uses i18n', () => {
    const src = read('src/app/seller/orders/[id]/page.tsx');
    // fmtMAD should not hardcode 'fr-MA' alone; should thread i18n
    expect(src).not.toMatch(/toLocaleString\s*\(\s*['"]fr-MA['"]/);
  });
});

// ── 10. seller/payouts/page.tsx i18n-threaded ────────────────────────────────
describe('Fix 10 — seller/payouts/page.tsx locale-aware formatters', () => {
  it('seller payouts fmtMAD does not hardcode fr-MA', () => {
    const src = read('src/app/seller/payouts/page.tsx');
    expect(src).not.toMatch(/toLocaleString\s*\(\s*['"]fr-MA['"]/);
  });
});

// ── 11. seller/credits/page.tsx i18n-threaded ────────────────────────────────
describe('Fix 11 — seller/credits/page.tsx locale-aware formatters', () => {
  it('seller credits fmtDate does not use undefined locale', () => {
    const src = read('src/app/seller/credits/page.tsx');
    // Currently uses toLocaleDateString(undefined, ...) — should use a real locale
    expect(src).not.toMatch(/toLocaleDateString\s*\(\s*undefined\s*,/);
  });
});

// ── 12. Debug logs removed ────────────────────────────────────────────────────
describe('Fix 12 — debug logger.log calls removed', () => {
  it('login/page.tsx has no logger.log debug call', () => {
    const src = read('src/app/login/page.tsx');
    expect(src).not.toMatch(/logger\.log\s*\(/);
  });

  it('register/page.tsx has no logger.log debug call', () => {
    const src = read('src/app/register/page.tsx');
    expect(src).not.toMatch(/logger\.log\s*\(/);
  });

  it('orders/page.tsx has no logger.log debug call', () => {
    const src = read('src/app/orders/page.tsx');
    expect(src).not.toMatch(/logger\.log\s*\(/);
  });
});

// ── 13. RTL chevron ──────────────────────────────────────────────────────────
describe('Fix 13 — RTL chevron in community/messages/page.tsx', () => {
  it('ChevronRight in messages list has rtl:rotate-180', () => {
    const src = read('src/app/community/messages/page.tsx');
    // ChevronRight must have the RTL rotation class
    expect(src).toMatch(/ChevronRight[\s\S]{0,200}rtl:rotate-180/);
  });
});

// ── 14. Edit-product required asterisks ──────────────────────────────────────
describe('Fix 14 — seller/products/[id]/edit required asterisks', () => {
  it('Category label has required asterisk span', () => {
    const src = read('src/app/seller/products/[id]/edit/page.tsx');
    // After the Category label t() call, there must be a rose-500 asterisk span within 150 chars
    expect(src).toMatch(/category_label[\s\S]{0,150}text-rose-500[\s\S]{0,60}\*/);
  });

  it('Price label has required asterisk span', () => {
    const src = read('src/app/seller/products/[id]/edit/page.tsx');
    expect(src).toMatch(/price_mad_label[\s\S]{0,150}text-rose-500[\s\S]{0,60}\*/);
  });

  it('Quantity label has required asterisk span', () => {
    const src = read('src/app/seller/products/[id]/edit/page.tsx');
    expect(src).toMatch(/quantity_label[\s\S]{0,150}text-rose-500[\s\S]{0,60}\*/);
  });
});
