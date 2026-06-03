'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import useSWR from 'swr';
import ProductCard from '@/components/products/ProductCard';
import ProductFilters from '@/components/products/ProductFilters';
import ProductSort from '@/components/products/ProductSort';
import FilterChips from '@/components/products/FilterChips';
import NoSearchResults from '@/components/search/NoSearchResults';
import { Product } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { Filter, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/config/constants';
import { Button } from '@/components/ui/button';

interface ProductFiltersState {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  colors: string[];
  sizes: string[];
  fabrics: string[];
  customizable?: boolean;
  inStock?: boolean;
}

// Debounce hook for filter changes
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
};

/**
 * buildPageWindow — windowed pagination helper.
 * Returns an array of page numbers and '...' ellipsis sentinels.
 * Example: [1, '...', 4, 5, 6, '...', 20]
 */
function buildPageWindow(current: number, last: number, wing = 1): (number | '...')[] {
  const pages: (number | '...')[] = [];
  const lo = Math.max(2, current - wing);
  const hi = Math.min(last - 1, current + wing);

  pages.push(1);
  if (lo > 2) pages.push('...');
  for (let i = lo; i <= hi; i++) pages.push(i);
  if (hi < last - 1) pages.push('...');
  if (last > 1) pages.push(last);

  return pages;
}

// Loading skeleton for product grid — Atlas tokens
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-amber-100/70 aspect-square rounded-2xl mb-3" />
          <div className="h-3.5 bg-amber-100/70 rounded-full w-3/4 mb-2" />
          <div className="h-3 bg-amber-100/70 rounded-full w-1/2 mb-3" />
          <div className="h-3 bg-amber-100/70 rounded-full w-1/3" />
        </div>
      ))}
    </div>
  );
}

// Designed error state
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center mb-5">
        <AlertCircle className="h-8 w-8 text-rose-700" aria-hidden="true" />
      </div>
      <h3
        className="text-xl font-semibold text-gray-900 mb-2"
        style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
      >
        {t('errors.fetch_failed_title', 'Unable to load products')}
      </h3>
      <p className="text-gray-500 text-sm max-w-xs mb-6">
        {message || t('errors.fetch_failed_body', 'Something went wrong. Please try again.')}
      </p>
      <Button variant="default" onClick={onRetry} className="gap-2">
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        {t('common.try_again', 'Try again')}
      </Button>
    </div>
  );
}

// Pagination meta from the backend additive contract (absent = graceful degrade)
interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fix 9c: derive ALL filter/sort/page state from URL so back-button fully restores state.
  // No local filter state — URL is the single source of truth.
  const currentPage = Number(searchParams?.get('page')) || 1;
  const currentSort = searchParams?.get('sort') || 'newest';

  const filters: ProductFiltersState = {
    category: searchParams?.get('category') || undefined,
    minPrice: searchParams?.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams?.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    colors: searchParams?.get('colors') ? searchParams.get('colors')!.split(',') : [],
    sizes: searchParams?.get('sizes') ? searchParams.get('sizes')!.split(',') : [],
    fabrics: searchParams?.get('fabrics') ? searchParams.get('fabrics')!.split(',') : [],
    customizable: searchParams?.get('customizable') === 'true' ? true : undefined,
    inStock: searchParams?.get('inStock') === 'true' ? true : undefined,
  };

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Debounce is still used for the API key so we avoid a fetch on every keystroke;
  // the URL is written immediately but the SWR key is debounced.
  const debouncedFilters = useDebounce(filters, 300);
  const debouncedSortBy = useDebounce(currentSort, 300);

  // Helper: write filter/sort/page changes to URL (preserves existing params)
  const updateUrl = useCallback(
    (updates: Partial<ProductFiltersState & { sort: string; page: number; q: string }>) => {
      const params = new URLSearchParams(searchParams?.toString() || '');

      // Always reset to page 1 on filter or sort changes unless page is explicit
      if (!('page' in updates)) params.delete('page');

      if ('category' in updates) {
        if (updates.category) params.set('category', updates.category);
        else params.delete('category');
      }
      if ('minPrice' in updates) {
        if (updates.minPrice != null) params.set('minPrice', updates.minPrice.toString());
        else params.delete('minPrice');
      }
      if ('maxPrice' in updates) {
        if (updates.maxPrice != null && updates.maxPrice !== Infinity) params.set('maxPrice', updates.maxPrice.toString());
        else params.delete('maxPrice');
      }
      if ('colors' in updates) {
        if (updates.colors && updates.colors.length > 0) params.set('colors', updates.colors.join(','));
        else params.delete('colors');
      }
      if ('sizes' in updates) {
        if (updates.sizes && updates.sizes.length > 0) params.set('sizes', updates.sizes.join(','));
        else params.delete('sizes');
      }
      if ('fabrics' in updates) {
        if (updates.fabrics && updates.fabrics.length > 0) params.set('fabrics', updates.fabrics.join(','));
        else params.delete('fabrics');
      }
      if ('customizable' in updates) {
        if (updates.customizable) params.set('customizable', 'true');
        else params.delete('customizable');
      }
      if ('inStock' in updates) {
        if (updates.inStock) params.set('inStock', 'true');
        else params.delete('inStock');
      }
      if ('sort' in updates) {
        if (updates.sort && updates.sort !== 'newest') params.set('sort', updates.sort);
        else params.delete('sort');
      }
      if ('page' in updates) {
        if (updates.page && updates.page > 1) params.set('page', updates.page.toString());
        else params.delete('page');
      }
      if ('q' in updates) {
        if (updates.q) params.set('q', updates.q);
        else params.delete('q');
      }

      router.push(`/products?${params.toString()}`);
    },
    [searchParams, router]
  );

  // Build query parameters
  // NOTE: colors, sizes, and fabrics filter options inside <ProductFilters> are
  // hardcoded for now — they will be replaced with API-driven values in a later sprint.
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();

    if (debouncedFilters.category) params.append('category', debouncedFilters.category);
    if (debouncedFilters.minPrice) params.append('minPrice', debouncedFilters.minPrice.toString());
    if (debouncedFilters.maxPrice && debouncedFilters.maxPrice !== Infinity)
      params.append('maxPrice', debouncedFilters.maxPrice.toString());
    if (debouncedFilters.customizable) params.append('customizable', 'true');
    if (debouncedFilters.inStock) params.append('inStock', 'true');
    if (debouncedFilters.colors.length > 0) params.append('colors', debouncedFilters.colors.join(','));
    if (debouncedFilters.sizes.length > 0) params.append('sizes', debouncedFilters.sizes.join(','));
    if (debouncedFilters.fabrics.length > 0) params.append('fabrics', debouncedFilters.fabrics.join(','));
    const searchTerm = searchParams?.get('q');
    if (searchTerm) params.append('q', searchTerm);
    // Fix 3: use the active i18n language so Arabic users receive Arabic product data
    params.append('locale', i18n.language);
    params.append('sort', debouncedSortBy || 'newest');
    // Fix 9b: pass page param to the backend when pagination meta is available
    if (currentPage > 1) params.append('page', currentPage.toString());

    return `${API_BASE_URL}/api/products/all?${params.toString()}`;
  }, [debouncedFilters, debouncedSortBy, searchParams, i18n.language, currentPage]);

  // Use SWR for data fetching with caching and deduplication
  const { data, error, isLoading, mutate } = useSWR(
    buildQueryString(),
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      keepPreviousData: true,
    }
  );

  const products: Product[] = data?.data || [];
  // Fix 9b: consume additive pagination meta; degrade gracefully when absent.
  // Backend (ProductController::index) returns it under the `pagination` key.
  const paginationMeta: PaginationMeta | undefined = data?.pagination;

  const handleFilterChange = (newFilters: Partial<ProductFiltersState>) => {
    updateUrl(newFilters);
  };

  const handleSortChange = (value: string) => {
    updateUrl({ sort: value });
  };

  const handlePageChange = (page: number) => {
    updateUrl({ page });
    // Scroll to top on page change
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate filter chips from current URL-derived filters — MAD currency
  const getFilterChips = () => {
    const chips: Array<{ id: string; label: string; type: any }> = [];

    if (filters.colors.length > 0) {
      filters.colors.forEach(color => {
        chips.push({ id: `color-${color}`, label: color, type: 'color' });
      });
    }

    if (filters.sizes.length > 0) {
      filters.sizes.forEach(size => {
        chips.push({ id: `size-${size}`, label: size.toUpperCase(), type: 'size' });
      });
    }

    if (filters.fabrics.length > 0) {
      filters.fabrics.forEach(fabric => {
        chips.push({ id: `fabric-${fabric}`, label: fabric, type: 'fabric' });
      });
    }

    if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
      chips.push({
        id: 'price-range',
        label: `${filters.minPrice.toLocaleString()} – ${filters.maxPrice.toLocaleString()} ${t('product.currency', 'MAD')}`,
        type: 'price'
      });
    }

    if (filters.customizable) {
      chips.push({ id: 'customizable', label: t('filters.customizable'), type: 'customizable' });
    }

    if (filters.inStock) {
      chips.push({ id: 'inStock', label: t('filters.in_stock'), type: 'inStock' });
    }

    return chips;
  };

  // Handle removing a filter chip — writes to URL
  const handleRemoveChip = (chip: { id: string; type: string }) => {
    switch (chip.type) {
      case 'color':
        updateUrl({ colors: filters.colors.filter(c => `color-${c}` !== chip.id) });
        break;
      case 'size':
        updateUrl({ sizes: filters.sizes.filter(s => `size-${s}` !== chip.id) });
        break;
      case 'fabric':
        updateUrl({ fabrics: filters.fabrics.filter(f => `fabric-${f}` !== chip.id) });
        break;
      case 'price':
        updateUrl({ minPrice: undefined, maxPrice: undefined });
        break;
      case 'customizable':
        updateUrl({ customizable: false });
        break;
      case 'inStock':
        updateUrl({ inStock: false });
        break;
    }
  };

  // Clear all filters — navigate to base URL preserving only search + sort + locale
  const handleClearAllFilters = () => {
    const params = new URLSearchParams();
    const q = searchParams?.get('q');
    if (q) params.set('q', q);
    router.push(`/products?${params.toString()}`);
  };

  const handleRetry = () => {
    mutate();
  };

  const searchQuery = searchParams?.get('q');
  const activeChips = getFilterChips();

  if (error) {
    return (
      <div className="min-h-screen bg-amber-50/40">
        <ErrorState message={error.message} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50/40 pb-24 md:pb-16">

      {/* ── Editorial indigo hero — Atlas §6.4 ── */}
      <section className="relative isolate overflow-hidden bg-indigo-950 text-white">
        {/* Radial ambient overlay — §6.4 pattern */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-25"
          style={{
            background:
              'radial-gradient(circle at 15% 15%, #f59e0b 0, transparent 45%), radial-gradient(circle at 85% 60%, #6366f1 0, transparent 50%)',
          }}
        />
        {/* Zellige motif at very low opacity for cultural anchoring */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1'%3E%3Cpolygon points='30,4 56,18 56,42 30,56 4,42 4,18'/%3E%3Cpolygon points='30,14 46,22 46,38 30,46 14,38 14,22'/%3E%3C/g%3E%3C/svg%3E\")",
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-14 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
          >
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {searchQuery
                ? t('catalog.search.headline', '"{{query}}"', { query: searchQuery })
                : t('catalog.products.headline', 'The Beldify catalog.')}
            </h1>
            <p className="mt-4 text-indigo-200 max-w-lg text-base sm:text-lg leading-relaxed">
              {searchQuery
                ? t('catalog.search.subheading', 'Browsing results across all verified ateliers.')
                : t('catalog.products.subheading', 'Caftans, djellabas, hand-tailored pieces — sourced directly from verified Moroccan ateliers.')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Main grid — filter sidebar + results ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="flex flex-col md:grid md:grid-cols-12 gap-6 lg:gap-8">

          {/* ── Filter Sidebar (desktop) ── */}
          <motion.aside
            initial={shouldReduceMotion ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: [0.33, 1, 0.68, 1] }}
            className="md:col-span-3"
            aria-label={t('filters.title', 'Filters')}
          >
            <div className="md:sticky md:top-24">
              <ProductFilters
                filters={filters}
                onChange={handleFilterChange}
                isMobileOpen={isMobileFiltersOpen}
                onMobileClose={() => setIsMobileFiltersOpen(false)}
              />
            </div>
          </motion.aside>

          {/* ── Results pane ── */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.14, ease: [0.33, 1, 0.68, 1] }}
            className="md:col-span-9"
          >
            {/* ── Sticky sort / control bar ── */}
            <div className="sticky top-[64px] z-20 bg-amber-50/90 backdrop-blur-sm border border-amber-200 rounded-2xl px-4 py-3 mb-4 flex flex-wrap justify-between items-center gap-3 shadow-atlas-sm">
              <div className="flex items-center gap-3">
                {/* Mobile filter trigger */}
                <button
                  type="button"
                  aria-label={t('filters.open_drawer', 'Open filters')}
                  className="md:hidden inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-white border border-indigo-200 rounded-full hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 transition-colors"
                  onClick={() => setIsMobileFiltersOpen(true)}
                >
                  <Filter className="h-4 w-4" aria-hidden="true" />
                  {t('filters.title', 'Filters')}
                  {activeChips.length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center leading-none">
                      {activeChips.length}
                    </span>
                  )}
                </button>

                {/* Result count */}
                <span className="text-sm text-gray-600 font-medium">
                  {isLoading ? (
                    <span className="inline-flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-700" aria-hidden="true" />
                      {t('products.loading', 'Loading…')}
                    </span>
                  ) : products.length === 0 ? (
                    t('products.no_results', 'No results')
                  ) : (
                    <span>
                      {t('products.results', { count: products.length })}
                    </span>
                  )}
                </span>
              </div>

              <ProductSort value={currentSort} onChange={handleSortChange} />
            </div>

            {/* ── Active filter chips row ── */}
            <AnimatePresence>
              {!isLoading && activeChips.length > 0 && (
                <motion.div
                  key="filter-chips"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
                  className="mb-4 overflow-hidden"
                >
                  <FilterChips
                    chips={activeChips}
                    onRemove={handleRemoveChip}
                    onClearAll={handleClearAllFilters}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Product grid ── */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <ProductGridSkeleton />
                </motion.div>
              ) : products.length > 0 ? (
                <Suspense fallback={<ProductGridSkeleton />}>
                  <motion.div
                    key="products"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
                  >
                    {products.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: shouldReduceMotion ? 0 : Math.min(index * 0.04, 0.32),
                          duration: shouldReduceMotion ? 0 : 0.3,
                          ease: [0.33, 1, 0.68, 1],
                        }}
                        className="hover:-translate-y-0.5 hover:shadow-atlas-md transition-all duration-200 ease-out rounded-2xl"
                      >
                        <ProductCard product={product} priority={index < 4} />
                      </motion.div>
                    ))}
                  </motion.div>
                </Suspense>
              ) : (
                <motion.div
                  key="no-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <NoSearchResults query={searchQuery || undefined} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Pagination — only shown when backend supplies meta ── */}
            {paginationMeta && paginationMeta.last_page > 1 && (
              <nav
                aria-label={t('common.pagination.label', 'Page navigation')}
                className="mt-10"
              >
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={paginationMeta.current_page === 1}
                    onClick={() => handlePageChange(paginationMeta.current_page - 1)}
                    aria-label={t('common.pagination.previous', 'Previous page')}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">{t('common.pagination.previous', 'Previous')}</span>
                  </Button>

                  <div className="hidden sm:flex items-center gap-1">
                    {buildPageWindow(paginationMeta.current_page, paginationMeta.last_page).map((entry, idx) =>
                      entry === '...' ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="w-10 h-10 flex items-center justify-center text-gray-400 text-sm select-none"
                          aria-hidden="true"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={entry}
                          aria-current={entry === paginationMeta.current_page ? 'page' : undefined}
                          aria-label={t('common.pagination.goToPage', 'Go to page {{page}}', { page: entry })}
                          onClick={() => handlePageChange(entry as number)}
                          className={`w-10 h-10 rounded-full text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-1 ${
                            entry === paginationMeta.current_page
                              ? 'bg-indigo-700 text-white shadow-sm'
                              : 'ring-1 ring-amber-200 text-gray-700 hover:bg-amber-50'
                          }`}
                        >
                          {entry}
                        </button>
                      )
                    )}
                  </div>

                  <div className="sm:hidden">
                    <span className="text-sm text-gray-600 font-medium">
                      {t('common.pagination.page', 'Page {{current}} of {{total}}', {
                        current: paginationMeta.current_page,
                        total: paginationMeta.last_page,
                      })}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    className="rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={paginationMeta.current_page === paginationMeta.last_page}
                    onClick={() => handlePageChange(paginationMeta.current_page + 1)}
                    aria-label={t('common.pagination.next', 'Next page')}
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">{t('common.pagination.next', 'Next')}</span>
                  </Button>
                </div>
              </nav>
            )}
          </motion.div>
        </div>
      </div>

    </div>
  );
}
