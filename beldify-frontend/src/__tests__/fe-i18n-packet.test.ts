/**
 * FE-I18N packet tests — red-green TDD gate.
 *
 * Covers:
 *   1. PDP tab keys present in all 5 locales (product.tab_description/specs/sizing/reviews)
 *   2. /journal dead link removed from PDP description panel
 *   3. jewelry.* keys complete in all 5 locales
 *   4. Prioritized missing keys: notify_me.*, shop.follow.*, orders.reorder.*
 *   5. RTL logical spacing (no bare ml-/mr- in jewelry page)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const LOCALE_DIR = join(ROOT, 'src/i18n/locales');

function readLocale(locale: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(LOCALE_DIR, `${locale}.json`), 'utf-8'));
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

const LOCALES = ['en', 'ar', 'fr', 'es', 'ma'];

// ─── Task 1: PDP tab keys ─────────────────────────────────────────────────────

describe('Task 1 — PDP tab keys in all locales', () => {
  const TAB_KEYS = [
    'product.tab_description',
    'product.tab_specs',
    'product.tab_sizing',
    'product.tab_reviews',
  ];

  for (const locale of LOCALES) {
    for (const key of TAB_KEYS) {
      it(`${locale} has ${key}`, () => {
        const data = readLocale(locale);
        const value = getNestedValue(data, key);
        expect(value, `${locale}.${key} must be a non-empty string`).toBeTruthy();
        expect(typeof value).toBe('string');
      });
    }
  }
});

// ─── Task 2: /journal dead link removed ───────────────────────────────────────

describe('Task 2 — /journal dead link removed from PDP', () => {
  it('PDP page has no /journal/ href', () => {
    const pdp = readFileSync(
      join(ROOT, 'src/app/products/[id]/page.tsx'),
      'utf-8'
    );
    expect(pdp).not.toContain('/journal/');
  });
});

// ─── Task 3: jewelry.* keys in all locales ────────────────────────────────────

describe('Task 3 — jewelry.* keys in all locales', () => {
  const JEWELRY_KEYS = [
    'jewelry.categories_eyebrow',
    'jewelry.title',
    'jewelry.subtitle',
    'jewelry.filter',
    'jewelry.clear_filters',
    'jewelry.loading',
    'jewelry.items',
    'jewelry.material',
    'jewelry.gemstone',
    'jewelry.filter_by_material',
    'jewelry.filter_by_gemstone',
    'jewelry.no_match',
    'jewelry.no_products',
    'jewelry.products_aria',
    'jewelry.cta_eyebrow',
    'jewelry.cta_title',
    'jewelry.cta_sub',
    'jewelry.cta_button',
    'jewelry.load_error',
  ];

  for (const locale of LOCALES) {
    for (const key of JEWELRY_KEYS) {
      it(`${locale} has ${key}`, () => {
        const data = readLocale(locale);
        const value = getNestedValue(data, key);
        expect(value, `${locale}.${key} must be a non-empty string`).toBeTruthy();
        expect(typeof value).toBe('string');
      });
    }
  }
});

// ─── Task 4: notify_me.* keys ─────────────────────────────────────────────────

describe('Task 4 — notify_me.* keys in all locales', () => {
  const NOTIFY_KEYS = [
    'notify_me.back_in_stock',
    'notify_me.price_drop',
    'notify_me.notified',
    'notify_me.saved_push_off',
    'notify_me.unsupported',
    'notify_me.saving',
  ];

  for (const locale of LOCALES) {
    for (const key of NOTIFY_KEYS) {
      it(`${locale} has ${key}`, () => {
        const data = readLocale(locale);
        const value = getNestedValue(data, key);
        expect(value, `${locale}.${key} must be a non-empty string`).toBeTruthy();
        expect(typeof value).toBe('string');
      });
    }
  }
});

// ─── Task 4: shop.follow.* keys ───────────────────────────────────────────────

describe('Task 4 — shop.follow.* keys in all locales', () => {
  const SHOP_FOLLOW_KEYS = [
    'shop.follow.hint',
    'shop.follow.hint_ar',
    'shop.follow.label',
    'shop.follow.label_ar',
    'shop.follow.following',
    'shop.follow.following_ar',
  ];

  for (const locale of LOCALES) {
    for (const key of SHOP_FOLLOW_KEYS) {
      it(`${locale} has ${key}`, () => {
        const data = readLocale(locale);
        const value = getNestedValue(data, key);
        expect(value, `${locale}.${key} must be a non-empty string`).toBeTruthy();
        expect(typeof value).toBe('string');
      });
    }
  }
});

// ─── Task 4: orders.reorder.* keys ───────────────────────────────────────────

describe('Task 4 — orders.reorder.* keys in all locales', () => {
  const REORDER_KEYS = [
    'orders.reorder.all_skipped',
    'orders.reorder.added',
    'orders.reorder.error',
  ];

  for (const locale of LOCALES) {
    for (const key of REORDER_KEYS) {
      it(`${locale} has ${key}`, () => {
        const data = readLocale(locale);
        const value = getNestedValue(data, key);
        expect(value, `${locale}.${key} must be a non-empty string`).toBeTruthy();
        expect(typeof value).toBe('string');
      });
    }
  }
});

// ─── Task 5: RTL — no physical ml-/mr- in jewelry page ───────────────────────

describe('Task 5 — no bare ml-/mr- in jewelry page', () => {
  it('jewelry page uses logical ms-/me- spacing instead of ml-/mr-', () => {
    const source = readFileSync(
      join(ROOT, 'src/app/categories/jewelry/page.tsx'),
      'utf-8'
    );
    // Bare ml-* or mr-* Tailwind classes (not inside comments)
    // Allow matches only in code lines, not in comments
    const codeLines = source
      .split('\n')
      .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'));
    const codeBody = codeLines.join('\n');

    const physicalSpacing = /\b(ml|mr)-\d/.test(codeBody);
    expect(physicalSpacing, 'Found physical ml-/mr- spacing; use ms-/me- instead').toBe(false);
  });
});
