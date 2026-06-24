/**
 * TDD — FollowedShopsRail static analysis tests
 *
 * Verifies: file exists, 'use client', auth guard, i18n keys, snap-rail,
 * fail-safe contract, shop-name attribution, 7-locale parity.
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

const RAIL_FILE = 'src/components/home/FollowedShopsRail.tsx';

describe('FollowedShopsRail component', () => {
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

  it('uses i18n key home.followedShops.title', () => {
    expect(rail).toContain('home.followedShops.title');
  });

  it('uses i18n key home.followedShops.subtitle', () => {
    expect(rail).toContain('home.followedShops.subtitle');
  });

  it('uses i18n key home.followedShops.loginPrompt', () => {
    expect(rail).toContain('home.followedShops.loginPrompt');
  });

  it('uses useAuth() for authentication state', () => {
    expect(rail).toContain('useAuth');
  });

  it('imports getFollowingProducts from shopService', () => {
    expect(rail).toMatch(/getFollowingProducts/);
  });

  it('uses snap-x snap-mandatory for the rail container', () => {
    expect(rail).toContain('snap-x');
    expect(rail).toContain('snap-mandatory');
  });

  it('uses snap-start shrink-0 for each card', () => {
    expect(rail).toContain('snap-start');
    expect(rail).toContain('shrink-0');
  });

  it('renders nothing when not authenticated (early return or null)', () => {
    // When !user/!isAuthenticated → return null
    expect(rail).toMatch(/!user|!isAuthenticated|isAuthenticated === false/);
  });

  it('renders nothing when product list is empty', () => {
    expect(rail).toMatch(/\.length\s*===\s*0|data\.length.*null|length.*return null/);
  });

  it('includes shop-name attribution per card (store_name)', () => {
    expect(rail).toMatch(/store_name/);
  });

  it('does not use margin-left (ml-) physical classes', () => {
    const codeLines = rail
      .split('\n')
      .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    expect(/\bml-\d/.test(codeLines.join('\n'))).toBe(false);
  });
});

describe('FollowedShopsRail — shopService getFollowingProducts', () => {
  it('shopService.ts exports getFollowingProducts method', () => {
    const service = read('src/services/shopService.ts');
    expect(service).toContain('getFollowingProducts');
  });

  it('getFollowingProducts targets /api/user/following/products', () => {
    const service = read('src/services/shopService.ts');
    expect(service).toContain('/api/user/following/products');
  });

  it('getFollowingProducts returns { data: [], meta: null } on error (fail-safe)', () => {
    const service = read('src/services/shopService.ts');
    // Must have a catch block that returns the empty fallback
    expect(service).toMatch(/data:\s*\[\]/);
  });
});

describe('FollowedShopsRail — HomeContent.tsx wiring', () => {
  it('HomeContent.tsx imports FollowedShopsRail', () => {
    const home = read('src/components/home/HomeContent.tsx');
    expect(home).toContain('FollowedShopsRail');
  });

  it('HomeContent.tsx renders <FollowedShopsRail', () => {
    const home = read('src/components/home/HomeContent.tsx');
    expect(home).toContain('<FollowedShopsRail');
  });
});

// ── i18n parity ────────────────────────────────────────────────────────────────

const FOLLOWED_SHOPS_KEYS = [
  'home.followedShops.title',
  'home.followedShops.subtitle',
  'home.followedShops.empty',
  'home.followedShops.loginPrompt',
];

describe('i18n — followedShops keys in all 7 locales', () => {
  for (const locale of ALL_LOCALES) {
    describe(`Locale: ${locale}`, () => {
      for (const key of FOLLOWED_SHOPS_KEYS) {
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
