import { Star, TrendingDown, TrendingUp, Clock, Sparkles, type LucideIcon } from 'lucide-react';

/**
 * Storefront sort vocabulary.
 *
 * The emitted tokens MUST stay in lockstep with the backend
 * `ProductController` sort handling. Spec 010 T1 aligned the backend to accept
 * `price_asc / price_desc / top_rated / relevance / newest`; this module is the
 * frontend half of that contract (T2). Keep `VALID_SORT_VALUES` and the backend
 * switch in sync — the regression test in `__tests__/sortConfig.test.ts` guards it.
 *
 * Label keys live under the `products.sort.*` namespace; inline `fallback`
 * strings keep the chips functional even if a locale merge lags behind.
 */
export interface SortOption {
  value: string;
  labelKey: string;
  fallback: string;
  icon: LucideIcon;
}

/** Always-available sort options, in display order. */
export const BASE_SORT_OPTIONS: readonly SortOption[] = [
  { value: 'newest', labelKey: 'products.sort.newest', fallback: 'الجديد', icon: Clock },
  { value: 'price_asc', labelKey: 'products.sort.price_low', fallback: 'الأرخص أولاً', icon: TrendingDown },
  { value: 'price_desc', labelKey: 'products.sort.price_high', fallback: 'الأغلى أولاً', icon: TrendingUp },
  { value: 'top_rated', labelKey: 'products.sort.popular', fallback: 'الأعلى تقييم', icon: Star },
];

/**
 * Relevance ranks by FULLTEXT score, so it is only meaningful when the user is
 * actually searching. It is the default sort while a query is present.
 */
export const RELEVANCE_SORT_OPTION: SortOption = {
  value: 'relevance',
  labelKey: 'products.sort.relevance',
  fallback: 'الأكثر صلة',
  icon: Sparkles,
};

/** The complete set of sort tokens the frontend may send to the backend. */
export const VALID_SORT_VALUES = [
  'relevance',
  'newest',
  'price_asc',
  'price_desc',
  'top_rated',
] as const;
export type SortValue = (typeof VALID_SORT_VALUES)[number];

/** Default sort: relevance while searching, newest otherwise. */
export function defaultSortForQuery(hasQuery: boolean): SortValue {
  return hasQuery ? 'relevance' : 'newest';
}

/** Sort options to display — relevance is prepended (and default) only when searching. */
export function sortOptionsForQuery(hasQuery: boolean): SortOption[] {
  return hasQuery ? [RELEVANCE_SORT_OPTION, ...BASE_SORT_OPTIONS] : [...BASE_SORT_OPTIONS];
}

/**
 * Resolve the effective sort from the URL `?sort=` param and query presence.
 * Unknown / legacy tokens never reach the backend — they coerce to the
 * query-aware default.
 */
export function resolveSort(sortParam: string | null | undefined, hasQuery: boolean): SortValue {
  const value = sortParam ?? '';
  if ((VALID_SORT_VALUES as readonly string[]).includes(value)) {
    return value as SortValue;
  }
  return defaultSortForQuery(hasQuery);
}
