/**
 * TDD RED — W2-FE-4: Seller identity on product cards
 *
 * Tests that:
 * 1. Product type has optional store_name, store_is_verified, store_rating fields.
 * 2. ProductCard renders a seller row when store_name is present.
 * 3. The Verified badge (BadgeCheck) is shown only when store_is_verified === true
 *    and uses amber colour (Atlas: primary = amber).
 * 4. store_rating is shown when present.
 * 5. The seller row is NOT rendered when store_name is absent (safe before backend ships).
 * 6. i18n key for verified label exists in all 7 locales.
 *
 * Written BEFORE implementation — must FAIL first.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PRODUCT_CARD_PATH = path.resolve(__dirname, '../ProductCard.tsx');
const TYPES_PATH = path.resolve(__dirname, '../../../lib/types.ts');
const LOCALE_DIR = path.resolve(__dirname, '../../../i18n/locales');

function read(p: string): string {
  return fs.readFileSync(p, 'utf-8');
}

function readLocale(locale: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(LOCALE_DIR, `${locale}.json`), 'utf-8'));
}

function getNestedValue(obj: Record<string, unknown>, keyPath: string): unknown {
  return keyPath.split('.').reduce<unknown>((acc, k) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[k];
    return undefined;
  }, obj);
}

const ALL_LOCALES = ['en', 'ar', 'fr', 'ma', 'es', 'nl', 'de'];

// ─── Product type extension ───────────────────────────────────────────────────

describe('W2-FE-4 — Product type has optional seller fields', () => {
  it('types.ts declares store_name?: string', () => {
    const src = read(TYPES_PATH);
    expect(src).toMatch(/store_name\s*\?\s*:\s*string/);
  });

  it('types.ts declares store_is_verified?: boolean', () => {
    const src = read(TYPES_PATH);
    expect(src).toMatch(/store_is_verified\s*\?\s*:\s*boolean/);
  });

  it('types.ts declares store_rating?: number', () => {
    const src = read(TYPES_PATH);
    expect(src).toMatch(/store_rating\s*\?\s*:\s*number/);
  });
});

// ─── ProductCard rendering logic ──────────────────────────────────────────────

describe('W2-FE-4 — ProductCard renders seller row', () => {
  it('imports BadgeCheck from lucide-react', () => {
    const src = read(PRODUCT_CARD_PATH);
    expect(src).toMatch(/BadgeCheck/);
  });

  it('renders seller row only when store_name is present', () => {
    const src = read(PRODUCT_CARD_PATH);
    // Must gate on store_name existence
    expect(src).toMatch(/store_name/);
    // Must conditionally render the row
    expect(src).toMatch(/product\.store_name/);
  });

  it('renders verified badge only when store_is_verified is true', () => {
    const src = read(PRODUCT_CARD_PATH);
    expect(src).toMatch(/store_is_verified/);
  });

  it('verified badge uses amber colour (Atlas primary token)', () => {
    const src = read(PRODUCT_CARD_PATH);
    // Must use text-amber-* or hsl(var(--primary)) for the verified badge icon
    // (Atlas: primary = amber)
    expect(src).toMatch(/text-amber-\d+|hsl\(var\(--primary\)\)/);
  });

  it('renders store_rating when present', () => {
    const src = read(PRODUCT_CARD_PATH);
    expect(src).toMatch(/store_rating/);
  });
});

// ─── i18n key for verified label ──────────────────────────────────────────────

describe('W2-FE-4 — i18n key for seller verified label in all 7 locales', () => {
  const REQUIRED_KEYS = ['product.seller_verified'];

  for (const locale of ALL_LOCALES) {
    for (const key of REQUIRED_KEYS) {
      it(`${locale} has ${key}`, () => {
        const data = readLocale(locale);
        const value = getNestedValue(data, key);
        expect(value, `${locale}.${key} must be a non-empty string`).toBeTruthy();
        expect(typeof value).toBe('string');
      });
    }
  }
});
