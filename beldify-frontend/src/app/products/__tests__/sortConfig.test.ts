/**
 * Spec 010 — T3 (frontend half): sort option ↔ request mapping.
 *
 * Guards the P0 regression where the storefront shipped sort tokens
 * (price_asc / price_desc / top_rated) that the backend did not accept, so
 * 3 of 4 sorts silently fell back to "newest". This locks the frontend's
 * emitted sort vocabulary to the backend contract and verifies the new
 * `relevance` default-on-query behaviour (T2).
 */
import { describe, it, expect } from 'vitest';
import {
  BASE_SORT_OPTIONS,
  RELEVANCE_SORT_OPTION,
  VALID_SORT_VALUES,
  defaultSortForQuery,
  sortOptionsForQuery,
  resolveSort,
} from '../sortConfig';

describe('sortConfig — emitted sort vocabulary', () => {
  it('emits exactly the tokens the backend ProductController accepts', () => {
    // Backend contract (post-T1, live-verified): relevance/newest/price_asc/price_desc/top_rated
    expect([...VALID_SORT_VALUES].sort()).toEqual(
      ['newest', 'price_asc', 'price_desc', 'relevance', 'top_rated'].sort(),
    );
  });

  it('every displayed option maps to a valid backend token', () => {
    const displayed = [RELEVANCE_SORT_OPTION, ...BASE_SORT_OPTIONS];
    for (const opt of displayed) {
      expect(VALID_SORT_VALUES).toContain(opt.value as (typeof VALID_SORT_VALUES)[number]);
    }
  });

  it('keeps the four pre-existing values intact', () => {
    expect(BASE_SORT_OPTIONS.map((o) => o.value)).toEqual([
      'newest',
      'price_asc',
      'price_desc',
      'top_rated',
    ]);
  });
});

describe('sortConfig — relevance is query-scoped', () => {
  it('defaults to relevance while searching, newest otherwise', () => {
    expect(defaultSortForQuery(true)).toBe('relevance');
    expect(defaultSortForQuery(false)).toBe('newest');
  });

  it('prepends the relevance chip only when a query is present', () => {
    expect(sortOptionsForQuery(true)[0].value).toBe('relevance');
    expect(sortOptionsForQuery(false).some((o) => o.value === 'relevance')).toBe(false);
  });

  it('every relevance option carries an i18n key + fallback', () => {
    expect(RELEVANCE_SORT_OPTION.labelKey).toBe('products.sort.relevance');
    expect(RELEVANCE_SORT_OPTION.fallback.length).toBeGreaterThan(0);
  });
});

describe('sortConfig — resolveSort (URL ?sort= → effective sort)', () => {
  it('honours an explicit, valid ?sort= param', () => {
    expect(resolveSort('price_asc', false)).toBe('price_asc');
    expect(resolveSort('top_rated', true)).toBe('top_rated');
  });

  it('falls back to the query-aware default when ?sort= is absent', () => {
    expect(resolveSort(null, true)).toBe('relevance');
    expect(resolveSort(undefined, false)).toBe('newest');
    expect(resolveSort('', false)).toBe('newest');
  });

  it('never forwards an unknown token to the backend', () => {
    expect(resolveSort('garbage', false)).toBe('newest');
    expect(resolveSort('price_low', true)).toBe('relevance'); // legacy backend-only token rejected
  });
});
