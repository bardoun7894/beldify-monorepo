/**
 * TDD tests for the enriched CategoryCard component (home page category grid).
 *
 * Red phase: all assertions target the NEW CategoryCard file which does not
 * exist yet, and the new i18n keys which have not been added yet.
 *
 * Spec:
 *  1. Product-count rendered prominently (not just a tiny badge).
 *  2. Subcategory quick-chips (up to 3) with deep-links + "+N more" truncation.
 *  3. Atlas design tokens: indigo-700, amber-500, shadow-atlas-*, rounded-2xl.
 *  4. Playfair Display heading for Latin; font-arabic for Arabic-script locales.
 *  5. RTL logical properties only (no pl-/pr-/left-/right- positional classes).
 *  6. Intentional fallback tile: initial letter on Atlas-tinted bg, never a
 *     broken white box.
 *  7. next/image (not <img>).
 *  8. Focus rings on the card link.
 *  9. i18n parity: new keys present in ALL 7 locale files with exact same key.
 * 10. sub_categories links use /categories/{slug} canonical route tree.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

function read(rel: string) {
  return readFileSync(join(ROOT, rel), 'utf-8');
}

function readJson(rel: string) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf-8'));
}

// ─── CategoryCard component ───────────────────────────────────────────────────

describe('CategoryCard component — rich tile', () => {
  let card: string;
  try {
    card = read('src/components/home/CategoryCard.tsx');
  } catch {
    card = '';
  }

  it('exists as a dedicated component file', () => {
    expect(card.length).toBeGreaterThan(0);
  });

  it('uses Playfair Display for the category title', () => {
    expect(card).toContain('Playfair Display');
  });

  it('renders a prominent product count (not just a tiny badge)', () => {
    // Must reference itemCount and render it with "products" text or i18n key
    const hasCount =
      card.includes('itemCount') &&
      (card.includes('products_count') ||
        card.includes('products') ||
        card.includes('itemCount >'));
    expect(hasCount).toBe(true);
  });

  it('renders subcategory quick-chips linked to /categories/{slug}', () => {
    // sub_categories array is mapped to chip links
    const hasSubChips =
      (card.includes('sub_categories') || card.includes('subCategories') || card.includes('subcategories')) &&
      card.includes('/categories/');
    expect(hasSubChips).toBe(true);
  });

  it('truncates subcategory chips to 3 max with a "+N more" overflow indicator', () => {
    // Must slice/limit to 3 and show overflow
    const hasSlice = card.includes('slice(0, 3)') || card.includes('slice(0,3)');
    const hasMore = card.includes('more') || card.includes('sub_chips_more');
    expect(hasSlice && hasMore).toBe(true);
  });

  it('uses Atlas indigo-700 as primary brand color', () => {
    expect(card).toContain('indigo-700');
  });

  it('uses amber-500 for badge/accent elements', () => {
    expect(card).toContain('amber-500');
  });

  it('uses shadow-atlas-sm and shadow-atlas-md for card depth', () => {
    expect(card).toContain('shadow-atlas-sm');
    expect(card).toContain('shadow-atlas-md');
  });

  it('uses rounded-2xl on the card', () => {
    expect(card).toContain('rounded-2xl');
  });

  it('uses next/image (not <img>)', () => {
    expect(card).toMatch(/from ['"]next\/image['"]/);
    expect(card).not.toContain('<img ');
  });

  it('has a focus ring for keyboard navigation', () => {
    expect(card).toContain('focus:ring');
  });

  it('uses RTL logical properties (no pl-/pr-)', () => {
    expect(card).not.toMatch(/className="[^"]*\bpl-\d+\b/);
    expect(card).not.toMatch(/className="[^"]*\bpr-\d+\b/);
  });

  it('uses RTL logical properties (no left-/right- layout classes)', () => {
    // left- and right- should not appear as positional layout inside classNames
    // (they may appear in string literals inside comments, which is fine)
    const classWithLeft = (card.match(/className="[^"]*\bleft-\d/g) || []).length;
    const classWithRight = (card.match(/className="[^"]*\bright-\d/g) || []).length;
    expect(classWithLeft).toBe(0);
    expect(classWithRight).toBe(0);
  });

  it('has an intentional fallback tile (initial letter + Atlas-tinted bg) for missing images', () => {
    // Fallback must show initial letter and use an Atlas indigo or amber tint
    const hasFallback =
      card.includes('initial') && (card.includes('indigo') || card.includes('bg-gray-100'));
    expect(hasFallback).toBe(true);
  });

  it('uses font-arabic class for Arabic-script locales', () => {
    expect(card).toContain('font-arabic');
  });

  it('uses hover:-translate-y-1 for card lift', () => {
    expect(card).toContain('hover:-translate-y-1');
  });

  it('subcategory chip links use /categories/ canonical route', () => {
    expect(card).toContain('/categories/');
  });
});

// ─── Enriched two-zone tile (image hero + content footer) ────────────────────

describe('CategoryCard component — enriched detail', () => {
  let card: string;
  try {
    card = read('src/components/home/CategoryCard.tsx');
  } catch {
    card = '';
  }

  it('renders a persistent "Shop all {name}" CTA using the shop_all i18n key', () => {
    expect(card).toContain('shop_all');
  });

  it('surfaces each subcategory image as an avatar (uses sub.image)', () => {
    expect(card).toContain('sub.image');
  });

  it('renders per-subcategory item counts (uses sub.itemCount)', () => {
    expect(card).toContain('sub.itemCount');
  });

  it('falls back to a letter avatar when a subcategory has no real image', () => {
    // Helper guards against the shared backend placeholder svg
    expect(card).toContain('placeholder');
  });

  it('is a flex-column tile so the footer CTA can pin to the bottom (mt-auto)', () => {
    expect(card).toContain('flex-col');
    expect(card).toContain('mt-auto');
  });
});

// ─── i18n parity — shop_all across all 7 locales ─────────────────────────────

describe('i18n parity — shop_all key present in all 7 locale files', () => {
  const LOCALES = ['en', 'ar', 'ma', 'fr', 'es', 'de', 'nl'];

  for (const locale of LOCALES) {
    it(`${locale}.json has home.categories.shop_all with the {{name}} placeholder`, () => {
      const json = readJson(`src/i18n/locales/${locale}.json`);
      const val = json?.home?.categories?.shop_all;
      expect(typeof val).toBe('string');
      expect(val).toContain('{{name}}');
    });
  }
});

// ─── HomeContent.tsx integration ─────────────────────────────────────────────

describe('HomeContent.tsx — imports and uses CategoryCard', () => {
  let homeContent: string;
  try {
    homeContent = read('src/components/home/HomeContent.tsx');
  } catch {
    homeContent = '';
  }

  it('imports CategoryCard from the new component file', () => {
    expect(homeContent).toContain('CategoryCard');
  });

  it('passes sub_categories (or subCategories/subcategories) to CategoryCard', () => {
    // CategoryCard receives sub_categories from the category object
    const hasSubProp =
      homeContent.includes('sub_categories') ||
      homeContent.includes('subCategories') ||
      homeContent.includes('subcategories');
    expect(hasSubProp).toBe(true);
  });
});

// ─── i18n parity — new keys across all 7 locales ─────────────────────────────

describe('i18n parity — new category-card keys present in all 7 locale files', () => {
  const LOCALES = ['en', 'ar', 'ma', 'fr', 'es', 'de', 'nl'];
  const NEW_KEYS = ['products_count', 'sub_chips_more'];

  for (const locale of LOCALES) {
    for (const key of NEW_KEYS) {
      it(`${locale}.json has home.categories.${key}`, () => {
        const json = readJson(`src/i18n/locales/${locale}.json`);
        const val = json?.home?.categories?.[key];
        expect(val).toBeDefined();
        expect(typeof val).toBe('string');
        expect(val.length).toBeGreaterThan(0);
      });
    }
  }
});
