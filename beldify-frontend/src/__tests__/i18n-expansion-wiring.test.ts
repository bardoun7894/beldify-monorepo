/**
 * i18n expansion wiring — TDD Red-Green gate (feat/ai-seller-credits)
 *
 * Tasks covered:
 *   1. nl + de registered in i18n config
 *   2. nl + de in middleware LOCALES
 *   3. LanguageSwitcher has nl/de entries, no next/image flag references
 *   4. LanguageSuggestionBanner — suggestLocale pure-function contract
 *   5. locale forwarded in DiscoverFeed (no hardcoded locale=ma)
 *   6. products/page SORT_OPTIONS use products.sort.* keys
 *   7. sort-keys.json cache artifact produced with 7 locales
 *   8. axiosInstance has Accept-Language interceptor
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { suggestLocale } from '@/utils/suggestLocale';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf-8');
}

// ─── Task 1: nl + de in i18n config ──────────────────────────────────────────

describe('Task 1 — nl + de registered in i18n/config.ts', () => {
  const config = read('src/i18n/config.ts');

  it('imports nl locale JSON', () => {
    expect(config).toMatch(/import\s+nl\s+from\s+['"]\.\/locales\/nl\.json['"]/);
  });

  it('imports de locale JSON', () => {
    expect(config).toMatch(/import\s+de\s+from\s+['"]\.\/locales\/de\.json['"]/);
  });

  it('adds nl to resources', () => {
    expect(config).toMatch(/nl\s*:/);
  });

  it('adds de to resources', () => {
    expect(config).toMatch(/de\s*:/);
  });

  it('uses object form for fallbackLng (not array)', () => {
    // Object form: fallbackLng: { ... }  vs array form: fallbackLng: [...]
    expect(config).toMatch(/fallbackLng\s*:\s*\{/);
    // Should NOT have the bare array form
    expect(config).not.toMatch(/fallbackLng\s*:\s*\[/);
  });

  it('nl falls back to en', () => {
    expect(config).toMatch(/nl\s*:\s*\[\s*['"]en['"]\s*\]/);
  });

  it('de falls back to en', () => {
    expect(config).toMatch(/de\s*:\s*\[\s*['"]en['"]\s*\]/);
  });

  it('lng stays ma (Darija default preserved)', () => {
    expect(config).toMatch(/lng\s*:\s*'ma'/);
  });

  it('RTL_LANGUAGES still only ar and ma', () => {
    // RTL_LANGUAGES should NOT include nl or de
    const m = config.match(/RTL_LANGUAGES\s*=\s*\[([^\]]*)\]/);
    expect(m).toBeTruthy();
    const langs = m![1];
    expect(langs).not.toContain('nl');
    expect(langs).not.toContain('de');
    expect(langs).toContain('ar');
    expect(langs).toContain('ma');
  });
});

// ─── Task 2: middleware LOCALES includes nl + de ──────────────────────────────

describe('Task 2 — middleware LOCALES includes nl and de', () => {
  const mw = read('src/middleware.ts');

  it("includes 'nl' in LOCALES", () => {
    expect(mw).toMatch(/'nl'/);
  });

  it("includes 'de' in LOCALES", () => {
    expect(mw).toMatch(/'de'/);
  });
});

// ─── Task 3: LanguageSwitcher — nl/de entries, no next/image flags ────────────

describe('Task 3 — LanguageSwitcher has nl/de and no next/image flag', () => {
  const switcher = read('src/components/common/LanguageSwitcher.tsx');

  it("has nl entry with name 'Nederlands'", () => {
    expect(switcher).toContain('Nederlands');
  });

  it("has de entry with name 'Deutsch'", () => {
    expect(switcher).toContain('Deutsch');
  });

  it('does not import next/image', () => {
    expect(switcher).not.toMatch(/from\s+['"]next\/image['"]/);
  });

  it('does not reference /images/flags/', () => {
    expect(switcher).not.toContain('/images/flags/');
  });

  it('renders a typographic chip (uppercase 2-letter code) rather than an image', () => {
    // Must contain toUpperCase() or the 2-letter codes as static strings
    const hasUpperCode =
      switcher.includes('toUpperCase') ||
      switcher.includes('.toLocaleUpperCase') ||
      // OR static uppercase codes rendered directly
      (switcher.includes('"MA"') || switcher.includes('"EN"') ||
       switcher.includes("'MA'") || switcher.includes("'EN'") ||
       switcher.includes('.toUpperCase()'));
    expect(hasUpperCode).toBe(true);
  });

  it('uses hsl(var(--secondary)) or Atlas indigo token for chip background', () => {
    expect(switcher).toMatch(/hsl\(var\(--secondary/);
  });
});

// ─── Task 4: LanguageSuggestionBanner — suggestLocale pure function ────────────

describe('Task 4 — LanguageSuggestionBanner suggestLocale function', () => {
  // Pure function imported directly from utility module (no React/browser deps).

  it('exports suggestLocale as a function', () => {
    expect(typeof suggestLocale).toBe('function');
  });

  it('maps ar-MA to ma', () => {
    expect(suggestLocale(['ar-MA', 'ar'], 'en')).toBe('ma');
  });

  it('maps nl-NL to nl', () => {
    expect(suggestLocale(['nl-NL', 'en'], 'en')).toBe('nl');
  });

  it('maps de-DE to de', () => {
    expect(suggestLocale(['de-DE', 'fr'], 'en')).toBe('de');
  });

  it('maps fr-FR to fr', () => {
    expect(suggestLocale(['fr-FR'], 'en')).toBe('fr');
  });

  it('maps en-US to en', () => {
    expect(suggestLocale(['en-US'], 'ma')).toBe('en');
  });

  it('returns null when suggestion matches current language', () => {
    expect(suggestLocale(['nl'], 'nl')).toBeNull();
  });

  it('returns null for unsupported language', () => {
    expect(suggestLocale(['ja-JP', 'zh-CN'], 'ma')).toBeNull();
  });

  it('returns null for empty navigator.languages', () => {
    expect(suggestLocale([], 'ma')).toBeNull();
  });
});

// ─── Task 4: LanguageSuggestionBanner file structure ─────────────────────────

describe('Task 4 — LanguageSuggestionBanner file exists and is wired into layout-client', () => {
  it('LanguageSuggestionBanner.tsx file exists', () => {
    const exists = existsSync(join(SRC, 'components/common/LanguageSuggestionBanner.tsx'));
    expect(exists).toBe(true);
  });

  it('layout-client.tsx imports LanguageSuggestionBanner', () => {
    const layout = read('src/app/layout-client.tsx');
    expect(layout).toContain('LanguageSuggestionBanner');
  });

  it('LanguageSuggestionBanner renders above Navbar in layout-client', () => {
    const layout = read('src/app/layout-client.tsx');
    const bannerIdx = layout.indexOf('LanguageSuggestionBanner');
    const navbarIdx = layout.indexOf('<Navbar');
    expect(bannerIdx).toBeGreaterThan(-1);
    expect(navbarIdx).toBeGreaterThan(-1);
    expect(bannerIdx).toBeLessThan(navbarIdx);
  });
});

// ─── Task 5: locale param forwarded in DiscoverFeed ───────────────────────────

describe('Task 5 — DiscoverFeed uses dynamic i18n language (not hardcoded ma)', () => {
  const feed = read('src/components/home/DiscoverFeed.tsx');

  it('does not hardcode locale=ma in the SWR key', () => {
    // Should not have the literal string locale=ma in the URL template
    expect(feed).not.toContain('locale=ma');
  });

  it('uses i18n.language in the URL', () => {
    expect(feed).toMatch(/i18n\.language/);
  });
});

// ─── Task 5: axiosInstance Accept-Language interceptor ───────────────────────

describe('Task 5 — axiosInstance sets Accept-Language from i18n', () => {
  const axios = read('src/services/axiosInstance.ts');

  it('imports i18n instance', () => {
    expect(axios).toMatch(/from\s+['"]@\/i18n\/config['"]/);
  });

  it("sets 'Accept-Language' header in interceptor", () => {
    expect(axios).toContain('Accept-Language');
  });

  it('guards typeof window before reading i18n language', () => {
    expect(axios).toContain("typeof window !== 'undefined'");
  });
});

// ─── Task 6: SORT_OPTIONS use products.sort.* keys ───────────────────────────

describe('Task 6 — SORT_OPTIONS use products.sort.* keys', () => {
  const page = read('src/app/products/page.tsx');

  it("uses 'products.sort.newest' key", () => {
    expect(page).toContain('products.sort.newest');
  });

  it("uses 'products.sort.price_low' or 'products.sort.price_asc' key", () => {
    const hasPriceLow = page.includes('products.sort.price_low') || page.includes('products.sort.price_asc');
    expect(hasPriceLow).toBe(true);
  });

  it("uses 'products.sort.price_high' or 'products.sort.price_desc' key", () => {
    const hasPriceHigh = page.includes('products.sort.price_high') || page.includes('products.sort.price_desc');
    expect(hasPriceHigh).toBe(true);
  });

  it("uses 'products.sort.popular' or 'products.sort.top_rated' key", () => {
    const hasPopular = page.includes('products.sort.popular') || page.includes('products.sort.top_rated');
    expect(hasPopular).toBe(true);
  });

  it('does NOT use old bare sort.* keys at top level', () => {
    // The old keys were 'sort.newest', 'sort.price_asc', etc. — they should be replaced
    expect(page).not.toMatch(/'sort\.newest'/);
    expect(page).not.toMatch(/'sort\.price_asc'/);
    expect(page).not.toMatch(/'sort\.price_desc'/);
    expect(page).not.toMatch(/'sort\.top_rated'/);
  });
});

// ─── Task 7: sort-keys.json cache artifact ───────────────────────────────────

describe('Task 7 — .cache/i18n-work/extra/sort-keys.json', () => {
  it('sort-keys.json file exists', () => {
    const exists = existsSync(join(ROOT, '.cache/i18n-work/extra/sort-keys.json'));
    expect(exists).toBe(true);
  });

  it('contains all 7 locales', () => {
    const raw = read('.cache/i18n-work/extra/sort-keys.json');
    const data = JSON.parse(raw);
    const locales = ['en', 'ar', 'fr', 'es', 'ma', 'nl', 'de'];
    for (const loc of locales) {
      expect(data, `missing locale: ${loc}`).toHaveProperty(loc);
    }
  });

  it('each locale has all 4 sort keys in dot-notation', () => {
    const raw = read('.cache/i18n-work/extra/sort-keys.json');
    const data = JSON.parse(raw);
    const expectedKeys = [
      'products.sort.newest',
      'products.sort.price_low',
      'products.sort.price_high',
      'products.sort.popular',
    ];
    for (const [, keys] of Object.entries(data)) {
      for (const k of expectedKeys) {
        expect(keys as Record<string, string>).toHaveProperty(k);
        expect(typeof (keys as Record<string, string>)[k]).toBe('string');
        expect((keys as Record<string, string>)[k].length).toBeGreaterThan(0);
      }
    }
  });
});
