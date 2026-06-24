/**
 * Storefront Marketplace Overhaul — TDD red tests.
 *
 * Covers:
 *  Fix 3  — products/page.tsx uses i18n.language instead of hardcoded 'en'
 *  Fix 6  — ShopCard hides products_count line when value is null/undefined
 *  Fix 9b/c — products/page.tsx: pagination meta consumed, URL state for filters + page
 *  Fix 10 — shops/page.tsx: windowed pagination + search synced to URL
 *
 * Source-reading tests (no DOM render) — consistent with existing test patterns.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

const productsPage = readFileSync(join(SRC, 'app/products/page.tsx'), 'utf-8');
const shopsPage = readFileSync(join(SRC, 'app/shops/page.tsx'), 'utf-8');
const shopCard = readFileSync(join(SRC, 'components/shops/ShopCard.tsx'), 'utf-8');

// ─── FIX 3: locale bug — no more hardcoded 'en' ──────────────────────────────

describe('Fix 3 — products page uses active i18n language for locale param', () => {
  it('does NOT hardcode locale=en in buildQueryString', () => {
    // The hardcoded string was: params.append('locale', 'en')
    expect(productsPage).not.toContain("params.append('locale', 'en')");
  });

  it('reads language from i18n and passes it as locale', () => {
    // Should use i18n.language (destructured from useTranslation)
    expect(productsPage).toMatch(/i18n\.language/);
    expect(productsPage).toMatch(/params\.append\(['"]locale['"],\s*i18n\.language\)/);
  });

  it('adds i18n.language to the buildQueryString useCallback dep array', () => {
    // Without this dep, the SWR key won't change on language switch.
    // The array also includes currentPage (for pagination URL state).
    expect(productsPage).toMatch(/i18n\.language.*\]/);
    // Confirm i18n.language appears in the useCallback dep array together with debouncedFilters
    expect(productsPage).toMatch(/\[debouncedFilters.*i18n\.language/s);
  });
});

// ─── FIX 6: ShopCard hides count line when products_count is null/undefined ──

describe('Fix 6 — ShopCard products_count visibility', () => {
  it('conditionally renders the count line (null/undefined → hidden)', () => {
    // The old code always rendered with a fallback `|| 0`, masking null.
    // New code must guard with != null (covers null + undefined).
    expect(shopCard).toMatch(/products_count\s*!=\s*null/);
  });

  it('does NOT show "0 products" when products_count is absent', () => {
    // The || 0 fallback was the bug — the guard replaces it
    expect(shopCard).not.toMatch(/shop\.products_count\s*\|\|\s*0/);
  });
});

// ─── FIX 9b/c: Products pagination meta + URL state ──────────────────────────

describe('Fix 9b/c — products page: pagination + URL state', () => {
  it('extracts pagination/meta from the SWR data response', () => {
    // data.meta carries the additive pagination contract when present
    expect(productsPage).toMatch(/data\?\.meta/);
  });

  it('renders a pagination control section when meta is present', () => {
    // Page navigation is wired to a page query param
    expect(productsPage).toMatch(/pagination|currentPage|current_page/);
  });

  it('persists the page query param to the URL', () => {
    // handlePageChange must write to URL searchParams
    expect(productsPage).toMatch(/params\.set\(['"]page['"]/);
  });

  it('persists active filters to the URL (searchParams)', () => {
    // URL persistence for filter state so back-button restores state
    expect(productsPage).toMatch(/router\.(push|replace)/);
  });

  it('includes a comment noting hardcoded filter options are intentional', () => {
    // ProductFilters colors/sizes/fabrics are hardcoded for now — must be documented
    expect(productsPage).toMatch(/hardcoded|intentional/i);
  });

  it('degrades gracefully when meta is absent (existing behavior preserved)', () => {
    // meta may be undefined — guard with optional chaining or null check
    expect(productsPage).toMatch(/data\?\.meta|meta \?\?|meta &&/);
  });

  it('derives filters FROM searchParams (URL is single source of truth — back-button safe)', () => {
    // If filters were local useState initialized once, back-nav would not restore them.
    // The URL-as-source pattern is: read searchParams?.get('category') etc. directly.
    expect(productsPage).toMatch(/searchParams\?\.get\(['"]category['"]\)/);
    expect(productsPage).toMatch(/searchParams\?\.get\(['"]colors['"]\)/);
    // Must NOT have a setFilters call that merges into local state for filter changes
    expect(productsPage).not.toMatch(/setFilters\(/);
  });
});

// ─── FIX 10: Shops windowed pagination + search URL sync ─────────────────────

describe('Fix 10 — shops page: windowed pagination', () => {
  it('does NOT render every page number with Array.from({length: last_page})', () => {
    // This pattern breaks at 100+ pages
    expect(shopsPage).not.toMatch(/Array\.from\(\{\s*length:\s*pagination\.last_page/);
  });

  it('uses a windowed page range (ellipsis pattern)', () => {
    // Windowed range helper generates 1 … 4 5 6 … 20
    expect(shopsPage).toMatch(/window|ellipsis|\.\.\.|getPageRange|buildPageWindow/i);
  });
});

describe('Fix 10 — shops page: search input synced to URL', () => {
  it('initialises searchQuery from the URL search param', () => {
    // Was: useState('') — must be useState(currentSearch)
    expect(shopsPage).toMatch(/useState\(currentSearch\)/);
  });

  it('updates searchQuery state when currentSearch URL param changes', () => {
    // Back-button navigation changes URL → effect must reset local state
    expect(shopsPage).toMatch(/setSearchQuery\(currentSearch\)/);
  });
});
