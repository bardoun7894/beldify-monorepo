/**
 * Category page — client-side pagination + facet wiring parity with /products
 *
 * Backend reality check (confirmed via CategoryController::getCategoryBySlug):
 * the `/api/categories/{slug}` endpoint returns the FULL products array in one
 * response — no `page`/`per_page` params, no `pagination` meta, no `facets` key,
 * and the mapped product payload does not include `store_id`/`store_name`.
 * True useSWRInfinite + IntersectionObserver infinite scroll (the /products
 * pattern) is therefore not possible without a backend change. This test
 * asserts the documented fallback instead: client-side capped pagination via
 * a "Load more" button, and an explicit, honest facets-unavailable state
 * (no fabricated store facet).
 *
 * Tests read source and pattern-match — quote-agnostic regexes throughout.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const SRC = join(__dirname, '..', '..');
const src = (rel: string) => readFileSync(join(SRC, 'src', rel), 'utf-8');

const pageTsx = src('app/categories/[slug]/page.tsx');

describe('category page — client-side pagination fallback', () => {
  it('defines a page size constant for client-side batching', () => {
    expect(pageTsx).toMatch(/PAGE_SIZE\s*=\s*\d+/);
  });

  it('tracks a visibleCount state to cap rendered products', () => {
    expect(pageTsx).toMatch(/visibleCount[^;]*useState/i);
  });

  it('resets visibleCount back to PAGE_SIZE whenever a new category fetch resolves', () => {
    expect(pageTsx).toMatch(/setVisibleCount\(\s*PAGE_SIZE\s*\)/);
  });

  it('slices the products array by visibleCount before rendering the grid', () => {
    expect(pageTsx).toMatch(/products\.slice\(\s*0\s*,\s*visibleCount\s*\)/);
  });

  it('renders a "load more" trigger with a stable test id', () => {
    expect(pageTsx).toMatch(/data-testid=['"]category-load-more['"]/);
  });

  it('load-more button is gated on visibleCount being smaller than the total product count', () => {
    expect(pageTsx).toMatch(/visibleCount\s*<\s*categoryData(\??)\.products(\??)\.length/);
  });
});

describe('category page — honest facets state (no fabricated store facet)', () => {
  it('documents why facets are unavailable from this endpoint', () => {
    expect(pageTsx).toMatch(/facets? (is|are) not (available|provided|returned)/i);
  });

  it('does not pass a hardcoded/fabricated facets object into ProductFilters', () => {
    // Guard against faking store data — e.g. facets={{ stores: [...] }}
    expect(pageTsx).not.toMatch(/facets=\{\{\s*stores:/);
  });
});
