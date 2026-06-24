/**
 * TDD — RecentlyViewedRail static analysis tests
 *
 * Verifies: file exists, 'use client', i18n key usage, snap-rail classes,
 * link pattern, and 7-locale parity for recentlyViewed keys.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');
const LOCALE_DIR = join(SRC, 'i18n/locales');

function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf-8');
}

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

const ALL_LOCALES = ['en', 'ar', 'fr', 'es', 'ma', 'nl', 'de'];

const RAIL_FILE = 'src/components/home/RecentlyViewedRail.tsx';

describe('RecentlyViewedRail component', () => {
  let rail: string;

  beforeAll(() => {
    rail = read(RAIL_FILE);
  });

  it('exists at the expected path', () => {
    expect(() => read(RAIL_FILE)).not.toThrow();
  });

  it("has 'use client' directive", () => {
    expect(rail).toContain("'use client'");
  });

  it('uses i18n key home.recentlyViewed.title', () => {
    expect(rail).toContain('home.recentlyViewed.title');
  });

  it('uses i18n key home.recentlyViewed.subtitle', () => {
    expect(rail).toContain('home.recentlyViewed.subtitle');
  });

  it('imports getRecentlyViewed from @/utils/recentlyViewed', () => {
    expect(rail).toMatch(/from\s+['"]@\/utils\/recentlyViewed['"]/);
    expect(rail).toContain('getRecentlyViewed');
  });

  it('uses snap-x snap-mandatory for the rail container', () => {
    expect(rail).toContain('snap-x');
    expect(rail).toContain('snap-mandatory');
  });

  it('uses snap-start shrink-0 for each card', () => {
    expect(rail).toContain('snap-start');
    expect(rail).toContain('shrink-0');
  });

  it('links cards to /products/${item.id} pattern', () => {
    expect(rail).toMatch(/\/products\/\$\{.*\.id\}/);
  });

  it('renders nothing when list is empty (early return or conditional)', () => {
    // The component must have a guard: if empty => return null or nothing
    expect(rail).toMatch(/\.length\s*===\s*0|items\.length.*null|length.*return null/);
  });

  it('does not use margin-left (ml-) physical classes', () => {
    const codeLines = rail
      .split('\n')
      .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    expect(/\bml-\d/.test(codeLines.join('\n'))).toBe(false);
  });
});

describe('RecentlyViewedRail — HomeContent.tsx wiring', () => {
  it('HomeContent.tsx imports RecentlyViewedRail', () => {
    const home = read('src/components/home/HomeContent.tsx');
    expect(home).toContain('RecentlyViewedRail');
  });

  it('HomeContent.tsx renders <RecentlyViewedRail', () => {
    const home = read('src/components/home/HomeContent.tsx');
    expect(home).toContain('<RecentlyViewedRail');
  });
});

// ── i18n parity ────────────────────────────────────────────────────────────────

const RECENTLY_VIEWED_KEYS = [
  'home.recentlyViewed.title',
  'home.recentlyViewed.subtitle',
];

describe('i18n — recentlyViewed keys in all 7 locales', () => {
  for (const locale of ALL_LOCALES) {
    describe(`Locale: ${locale}`, () => {
      for (const key of RECENTLY_VIEWED_KEYS) {
        it(`has key ${key}`, () => {
          const data = readLocale(locale);
          const value = getNestedValue(data, key);
          expect(value, `${locale}.${key} must be a non-empty string`).toBeTruthy();
          expect(typeof value, `${locale}.${key} must be a string`).toBe('string');
        });
      }
    });
  }
});
