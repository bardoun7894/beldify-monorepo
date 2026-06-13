/**
 * P2 RTL regression — Moroccan Darija ('ma') omitted from isRTL and content-selection checks
 *
 * TDD Red → Green gate.
 *
 * CLASS 1: isRTL layout checks that omit 'ma'
 *   const isRTL = i18n.language === 'ar'  →  const isRTL = i18n.language === 'ar' || i18n.language === 'ma'
 *
 * CLASS 2: Content-selection ternaries that show English to Darija users
 *   i18n.language === 'ar' ? X_ar : X_en  →  (i18n.language === 'ar' || i18n.language === 'ma') ? X_ar : X_en
 *
 * Also covers CartItemRow, MadeToOrderTimeline, RequestCustomPieceForm (found via grep sweep)
 * and useLanguage hook (dir computed from locale === 'ar' only).
 *
 * Reference canonical patterns:
 *   - src/hooks/useDirection.ts: RTL_LANGUAGES = ['ar','ma']
 *   - src/app/seller/layout.tsx: isRTL includes 'ma'
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

function readSrc(relPath: string): string {
  return readFileSync(join(SRC, relPath), 'utf-8');
}

/**
 * Returns true if the source contains `const isRTL = ...` that correctly includes 'ma'.
 * Accepts both: ar || ma  and  ma || ar.
 */
function hasCorrectIsRTL(source: string): boolean {
  return (
    /i18n\.language\s*===\s*['"]ar['"]\s*\|\|\s*i18n\.language\s*===\s*['"]ma['"]/.test(source) ||
    /i18n\.language\s*===\s*['"]ma['"]\s*\|\|\s*i18n\.language\s*===\s*['"]ar['"]/.test(source)
  );
}

/** Returns true if the broken single-language `const isRTL = i18n.language === 'ar';` is still present. */
function hasBrokenIsRTL(source: string): boolean {
  return /const\s+isRTL\s*=\s*i18n\.language\s*===\s*['"]ar['"];/.test(source);
}

/**
 * Returns true if there are NO remaining bare `i18n.language === 'ar'` content-selection
 * ternaries that do NOT include a `|| i18n.language === 'ma'` guard on the same line.
 *
 * Strategy: count lines matching ternary `=== 'ar' ?` without an `|| ... === 'ma'` on that line.
 */
function contentSelectionsAllGuarded(source: string): boolean {
  const lines = source.split('\n');
  const broken = lines.filter(
    (line) =>
      /i18n\.language\s*===\s*['"]ar['"]\s*\?/.test(line) &&
      !/i18n\.language\s*===\s*['"]ma['"]/.test(line)
  );
  return broken.length === 0;
}

// ─────────────────────────────────────────────────────────────────
// CLASS 1 — isRTL layout checks
// ─────────────────────────────────────────────────────────────────

const CLASS1_FILES = [
  'app/custom-orders/[id]/page.tsx',
  'app/order-confirmation/page.tsx',
  'app/cart/page.tsx',
  'app/orders/page.tsx',
  'app/orders/[orderNumber]/page.tsx',
  'app/categories/page.tsx',
  'app/categories/[slug]/page.tsx',
  'components/seller/VerticalProductForm.tsx',
  'components/seller/CustomOrderTimeline.tsx',
  'components/seller/QuoteForm.tsx',
  'components/home/Hero.tsx',
  'components/products/JewelryFields.tsx',
  'components/products/ProductFilters.tsx',
  'components/checkout/CustomOrderForm.tsx',
  // grep-sweep additions
  'components/cart/CartItemRow.tsx',
  'components/checkout/MadeToOrderTimeline.tsx',
  'components/community/RequestCustomPieceForm.tsx',
];

describe("P2 CLASS 1 — isRTL includes Moroccan Darija ('ma') in layout files", () => {
  for (const relPath of CLASS1_FILES) {
    it(`${relPath}: isRTL includes 'ma'`, () => {
      const source = readSrc(relPath);
      expect(
        hasCorrectIsRTL(source),
        `Expected 'ma' in isRTL of ${relPath}`
      ).toBe(true);
    });

    it(`${relPath}: broken single-language form removed`, () => {
      const source = readSrc(relPath);
      expect(
        hasBrokenIsRTL(source),
        `Broken form still present in ${relPath}: const isRTL = i18n.language === 'ar';`
      ).toBe(false);
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// CLASS 2 — content-selection ternaries
// ─────────────────────────────────────────────────────────────────

const CLASS2_FILES = [
  'app/checkout/page.tsx',
  'app/orders/page.tsx',
  'app/orders/[orderNumber]/page.tsx',
  'components/layout/Navbar.tsx',
  'components/navigation/CategoryDropdown.tsx',
  // grep-sweep additions
  'components/cart/CartItemRow.tsx',
];

describe("P2 CLASS 2 — content-selection ternaries include 'ma' guard", () => {
  for (const relPath of CLASS2_FILES) {
    it(`${relPath}: no bare '=== ar ?' ternaries without 'ma' guard`, () => {
      const source = readSrc(relPath);
      expect(
        contentSelectionsAllGuarded(source),
        `Unguarded 'ar'-only ternaries still present in ${relPath}`
      ).toBe(true);
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// useLanguage hook — dir includes 'ma'
// ─────────────────────────────────────────────────────────────────

describe("P2 — useLanguage hook: dir/isRTL covers 'ma'", () => {
  it('useLanguage.ts: dir includes ma locale', () => {
    const source = readSrc('hooks/useLanguage.ts');
    // Must not have the bare `locale === 'ar' ? 'rtl' : 'ltr'` without 'ma'
    const hasBrokenDir = /locale\s*===\s*['"]ar['"]\s*\?\s*['"]rtl['"]\s*:\s*['"]ltr['"]/.test(source) &&
      !/locale\s*===\s*['"]ma['"]/.test(source);
    expect(
      hasBrokenDir,
      "useLanguage.ts: dir = locale === 'ar' ? 'rtl' : 'ltr' — missing 'ma'"
    ).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// Smoke test: useDirection.ts always has ['ar','ma'] in RTL_LANGUAGES
// (this should already pass — confirms canonical baseline)
// ─────────────────────────────────────────────────────────────────

describe('Canonical baseline — useDirection RTL_LANGUAGES includes both ar and ma', () => {
  it('RTL_LANGUAGES contains ar', () => {
    const source = readSrc('hooks/useDirection.ts');
    expect(source).toMatch(/'ar'/);
  });

  it('RTL_LANGUAGES contains ma', () => {
    const source = readSrc('hooks/useDirection.ts');
    expect(source).toMatch(/'ma'/);
  });
});
