'use client';

/**
 * SearchSuggestions — T6 header typeahead dropdown
 *
 * Renders a debounced suggestions dropdown below the Navbar search input.
 * Groups results as: recent (auth only) | trending | product suggestions | category suggestions.
 * Keyboard navigable (↑/↓/Enter/Esc), ARIA combobox/listbox, RTL-safe (logical props).
 * Graceful: if endpoint errors/empty, renders nothing.
 */

import { useEffect, useRef, useState, useCallback, useId } from 'react';
import Link from 'next/link';
import { TrendingUp, Clock, Tag, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useDirection } from '@/hooks/useDirection';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Suggestion {
  type: 'product' | 'category';
  label: string;
  slug: string;
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
  trending: string[];
  recent: string[];
}

export interface SearchSuggestionsProps {
  /** Current search query value */
  query: string;
  /** Called when user changes query (e.g. clicking a trending/recent term) */
  onQueryChange: (q: string) => void;
  /** Called when user submits with no selection → routes to /products?q= */
  onSubmit: (q: string) => void;
  /** Called when dropdown should close (Escape, click-outside) */
  onClose?: () => void;
  /** Additional class applied to the dropdown container */
  className?: string;
  /** Override debounce delay (ms) — for testing only, defaults to DEBOUNCE_MS */
  debounceMs?: number;
  /** Override the listbox element id — allows the owning input to set aria-controls */
  listboxId?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 150;
const MIN_QUERY_LEN = 2;
// Maximum stores to show before "show more" — kept in sync with T8 (ProductFilters)
const COLLAPSED_STORE_LIMIT = 5;

// ── Flatten suggestion items for keyboard nav ─────────────────────────────────

type NavItem =
  | { kind: 'suggestion'; item: Suggestion }
  | { kind: 'trending'; term: string }
  | { kind: 'recent'; term: string };

// ─────────────────────────────────────────────────────────────────────────────

export default function SearchSuggestions({
  query,
  onQueryChange,
  onSubmit,
  onClose,
  className,
  debounceMs = DEBOUNCE_MS,
  listboxId: listboxIdProp,
}: SearchSuggestionsProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isRTL } = useDirection();

  const generatedId = useId();
  const listboxId = listboxIdProp ?? generatedId;

  const [data, setData] = useState<SuggestionsResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch suggestions ───────────────────────────────────────────────────────

  const fetchSuggestions = useCallback(async (q: string) => {
    // Cancel prior in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        setData(null);
        return;
      }
      const json: SuggestionsResponse = await res.json();
      setData(json);
    } catch {
      // AbortError or network failure — show nothing
      setData(null);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (query.length < MIN_QUERY_LEN) {
      // For empty/short query: don't fetch, keep existing data to show trending
      setActiveIndex(-1);
      return;
    }

    timerRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, fetchSuggestions, debounceMs]);

  // Reset active index when data changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [data]);

  // ── Build nav items list ────────────────────────────────────────────────────

  const recentTerms = user && data?.recent?.length ? data.recent : [];
  const trendingTerms = data?.trending ?? [];
  const productSuggestions = data?.suggestions?.filter((s) => s.type === 'product') ?? [];
  const categorySuggestions = data?.suggestions?.filter((s) => s.type === 'category') ?? [];

  // Flatten for keyboard navigation
  const navItems: NavItem[] = [
    ...recentTerms.map((term): NavItem => ({ kind: 'recent', term })),
    ...trendingTerms.map((term): NavItem => ({ kind: 'trending', term })),
    ...productSuggestions.map((item): NavItem => ({ kind: 'suggestion', item })),
    ...categorySuggestions.map((item): NavItem => ({ kind: 'suggestion', item })),
  ];

  // ── Determine if dropdown should show ───────────────────────────────────────

  const hasContent =
    recentTerms.length > 0 ||
    trendingTerms.length > 0 ||
    productSuggestions.length > 0 ||
    categorySuggestions.length > 0;

  if (!hasContent) return null;

  // ── Keyboard handler ────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, navItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, -1));
        break;
      case 'Enter': {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < navItems.length) {
          const item = navItems[activeIndex];
          if (item.kind === 'suggestion') {
            // Navigate to the suggestion href — let the link handle it
          } else {
            // trending or recent — submit that term
            const term = item.kind === 'trending' ? item.term : item.term;
            onQueryChange(term);
            onSubmit(term);
            onClose?.();
          }
        } else {
          // No selection — submit current query
          onSubmit(query);
        }
        break;
      }
      case 'Escape':
        e.preventDefault();
        onClose?.();
        break;
    }
  };

  // ── Build option id helper for aria-activedescendant ─────────────────────

  const optionId = (index: number) => `${listboxId}-option-${index}`;
  let globalIndex = 0;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      role="listbox"
      id={listboxId}
      aria-label={t('search_typeahead.suggestions_label', 'Search suggestions')}
      aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      className={cn(
        'absolute top-full inset-x-0 mt-1 z-50',
        'bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden',
        'max-h-[420px] overflow-y-auto',
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ── Recent searches (auth + non-empty) ─────────────────────────── */}
      {recentTerms.length > 0 && (
        <section aria-label={t('search_typeahead.recent', 'Recent searches')}>
          <div className="px-4 pt-3 pb-1">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {t('search_typeahead.recent', 'Recent')}
            </span>
          </div>
          {recentTerms.map((term) => {
            const idx = globalIndex++;
            const isActive = activeIndex === idx;
            return (
              <button
                key={`recent-${term}`}
                id={optionId(idx)}
                role="option"
                aria-selected={isActive}
                type="button"
                onClick={() => {
                  onQueryChange(term);
                  onSubmit(term);
                  onClose?.();
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-4 py-2 text-sm text-start transition-colors',
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" aria-hidden="true" />
                {term}
              </button>
            );
          })}
        </section>
      )}

      {/* ── Trending ────────────────────────────────────────────────────── */}
      {trendingTerms.length > 0 && (
        <section aria-label={t('search_typeahead.trending', 'Trending searches')}>
          <div className="px-4 pt-3 pb-1">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-600">
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
              {t('search_typeahead.trending', 'Trending')}
            </span>
          </div>
          {trendingTerms.map((term) => {
            const idx = globalIndex++;
            const isActive = activeIndex === idx;
            return (
              <button
                key={`trending-${term}`}
                id={optionId(idx)}
                role="option"
                aria-selected={isActive}
                type="button"
                onClick={() => {
                  onQueryChange(term);
                  onSubmit(term);
                  onClose?.();
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-4 py-2 text-sm text-start transition-colors',
                  isActive ? 'bg-amber-50 text-amber-700' : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <TrendingUp className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                {term}
              </button>
            );
          })}
        </section>
      )}

      {/* ── Product suggestions ──────────────────────────────────────────── */}
      {productSuggestions.length > 0 && (
        <section aria-label={t('search_typeahead.products', 'Products')}>
          <div className="px-4 pt-3 pb-1">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              <Package className="h-3 w-3" aria-hidden="true" />
              {t('search_typeahead.products', 'Products')}
            </span>
          </div>
          {productSuggestions.map((suggestion) => {
            const idx = globalIndex++;
            const isActive = activeIndex === idx;
            return (
              <Link
                key={`product-${suggestion.slug}`}
                id={optionId(idx)}
                role="option"
                aria-selected={isActive}
                href={`/products/${suggestion.slug}`}
                onClick={() => onClose?.()}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Package className="h-3.5 w-3.5 text-gray-400 shrink-0" aria-hidden="true" />
                {suggestion.label}
              </Link>
            );
          })}
        </section>
      )}

      {/* ── Category suggestions ─────────────────────────────────────────── */}
      {categorySuggestions.length > 0 && (
        <section aria-label={t('search_typeahead.categories', 'Categories')}>
          <div className="px-4 pt-3 pb-1">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              <Tag className="h-3 w-3" aria-hidden="true" />
              {t('search_typeahead.categories', 'Categories')}
            </span>
          </div>
          {categorySuggestions.map((suggestion) => {
            const idx = globalIndex++;
            const isActive = activeIndex === idx;
            return (
              <Link
                key={`category-${suggestion.slug}`}
                id={optionId(idx)}
                role="option"
                aria-selected={isActive}
                href={`/categories/${suggestion.slug}`}
                onClick={() => onClose?.()}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Tag className="h-3.5 w-3.5 text-gray-400 shrink-0" aria-hidden="true" />
                {suggestion.label}
              </Link>
            );
          })}
        </section>
      )}

      {/* Trailing spacer */}
      <div className="h-2" aria-hidden="true" />
    </div>
  );
}
