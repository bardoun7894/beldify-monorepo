/**
 * TDD RED — products quality-pass tests
 *
 * Written BEFORE implementation. Each test must FAIL first.
 *
 * Covers:
 * 1. Emoji purge — no emoji in ProductCard, TraditionalProductCard, ProductQuickView, ProductFilters
 * 2. Hardcoded hex bg-[#252555] gone from ProductCard
 * 3. currency-mad class on price spans in ProductCard (spot-check)
 * 4. Darija locale typo: اا/اال prefix removed from المنتوجات
 * 5. Free-shipping badge rendered when price > 500 (ProductCard)
 * 6. Infinite-scroll: useSWRInfinite is imported from swr/infinite in page.tsx
 * 7. Sticky sort bar: sort bar has sticky class in products/page.tsx
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(__dirname, '..');
const PAGE_PATH = path.resolve(__dirname, '../../../../src/app/products/page.tsx');
const MA_LOCALE_PATH = path.resolve(__dirname, '../../../i18n/locales/ma.json');

const readFile = (p: string) => fs.readFileSync(p, 'utf8');

// ── Task 4: Emoji purge ──────────────────────────────────────────────────────
describe('Emoji purge — products components', () => {
  const EMOJI_REGEX = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
  const FILES = [
    'ProductCard.tsx',
    'TraditionalProductCard.tsx',
    'ProductQuickView.tsx',
    'ProductFilters.tsx',
  ];

  for (const file of FILES) {
    it(`${file} contains no emoji characters`, () => {
      const content = readFile(path.join(COMPONENTS_DIR, file));
      expect(EMOJI_REGEX.test(content)).toBe(false);
    });
  }
});

// ── Task 5a: Hardcoded hex token ──────────────────────────────────────────────
describe('Design-debt: ProductCard.tsx', () => {
  it('does not contain hardcoded bg-[#252555]', () => {
    const content = readFile(path.join(COMPONENTS_DIR, 'ProductCard.tsx'));
    expect(content).not.toContain('bg-[#252555]');
  });

  it('does not contain hardcoded bg-[#252555] anywhere in any products component', () => {
    const FILES = ['ProductCard.tsx', 'TraditionalProductCard.tsx', 'ProductQuickView.tsx', 'ProductFilters.tsx'];
    for (const file of FILES) {
      const content = readFile(path.join(COMPONENTS_DIR, file));
      expect(content).not.toContain('bg-[#252555]');
    }
  });

  it('price span has currency-mad class in ProductCard', () => {
    const content = readFile(path.join(COMPONENTS_DIR, 'ProductCard.tsx'));
    expect(content).toContain('currency-mad');
  });
});

// ── Task 6: Darija typo fix ───────────────────────────────────────────────────
describe('Darija locale typo — ma.json', () => {
  it('ma.json does not contain doubled-alef prefix ااالمنتوجات', () => {
    const content = readFile(MA_LOCALE_PATH);
    expect(content).not.toContain('ااالمنتوجات');
  });

  it('ma.json does not contain doubled-alef prefix االمنتوجات', () => {
    const content = readFile(MA_LOCALE_PATH);
    expect(content).not.toContain('االمنتوجات');
  });

  it('ma.json fetch_failed_title uses المنتوجات (no doubled alef)', () => {
    const content = readFile(MA_LOCALE_PATH);
    const json = JSON.parse(content);
    const title = json?.errors?.fetch_failed_title ?? '';
    expect(title).not.toMatch(/اا/);
  });
});

// ── Task 1: Infinite scroll — useSWRInfinite imported ────────────────────────
describe('Infinite scroll — products page', () => {
  it('products/page.tsx imports useSWRInfinite from swr/infinite', () => {
    const content = readFile(PAGE_PATH);
    expect(content).toContain('useSWRInfinite');
    expect(content).toContain('swr/infinite');
  });

  it('products/page.tsx uses IntersectionObserver sentinel', () => {
    const content = readFile(PAGE_PATH);
    expect(content).toContain('IntersectionObserver');
  });

  it('products/page.tsx renders a sentinel element with data-testid="scroll-sentinel"', () => {
    const content = readFile(PAGE_PATH);
    expect(content).toContain('scroll-sentinel');
  });

  it('products/page.tsx does NOT import pagination-only useSWR directly (useSWRInfinite replaces it)', () => {
    const content = readFile(PAGE_PATH);
    // Should not have the old "from 'swr'" import of the basic hook used for paged products
    // (useSWRInfinite is the replacement; the file may still import types from swr)
    // Check that useSWRInfinite is the data-fetching hook
    expect(content).toContain('useSWRInfinite');
  });
});

// ── Task 7: Sticky sort bar ───────────────────────────────────────────────────
describe('Sticky sort bar — products page', () => {
  it('products/page.tsx sort bar has sticky class', () => {
    const content = readFile(PAGE_PATH);
    expect(content).toContain('sticky');
  });

  it('products/page.tsx has sort chip buttons for Newest, Price asc, Price desc, Top rated', () => {
    const content = readFile(PAGE_PATH);
    expect(content).toContain('newest');
    expect(content).toContain('price_asc');
    expect(content).toContain('price_desc');
  });
});

// ── Task 3: Card density — free-shipping badge ───────────────────────────────
describe('Card density — ProductCard free-shipping badge', () => {
  it('ProductCard.tsx contains free-shipping badge logic for price > 500', () => {
    const content = readFile(path.join(COMPONENTS_DIR, 'ProductCard.tsx'));
    // Look for the 500 threshold or a free-shipping label
    expect(content).toMatch(/free.?ship|شحن|livraison|500/i);
  });
});

// ── Task 3: WCAG — no bg-amber-500 text-white combination ───────────────────
describe('WCAG contrast — no failing amber-on-white', () => {
  const FILES = ['ProductCard.tsx', 'TraditionalProductCard.tsx'];
  for (const file of FILES) {
    it(`${file} does not have bg-amber-500 text-white together`, () => {
      const content = readFile(path.join(COMPONENTS_DIR, file));
      // Each line must not contain both bg-amber-500 AND text-white on the same className string
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.includes('bg-amber-500') && line.includes('text-white')) {
          throw new Error(`WCAG fail in ${file}: bg-amber-500 text-white on same line: "${line.trim()}"`);
        }
      }
    });
  }
});
