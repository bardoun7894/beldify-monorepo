'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import useSWRInfinite from 'swr/infinite';
import ProductCard from '@/components/products/ProductCard';
import ProductFilters from '@/components/products/ProductFilters';
import FilterChips from '@/components/products/FilterChips';
import NoSearchResults from '@/components/search/NoSearchResults';
import useOpenSoukNudge from '@/hooks/useOpenSoukNudge';
import OpenSoukRequestModal from '@/components/opensouk/OpenSoukRequestModal';
import { Product } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { Filter, RefreshCw, AlertCircle, SlidersHorizontal, Star, TrendingDown, TrendingUp, Clock } from 'lucide-react';
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

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
};

// Loading skeleton for product grid — Atlas tokens
function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {[...Array(count)].map((_, i) => (
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

// Sort options definition — used in sticky sort bar chips
const SORT_OPTIONS = [
  { value: 'newest', labelKey: 'sort.newest', fallback: 'الجديد', icon: Clock },
  { value: 'price_asc', labelKey: 'sort.price_asc', fallback: 'الأرخص أولاً', icon: TrendingDown },
  { value: 'price_desc', labelKey: 'sort.price_desc', fallback: 'الأغلى أولاً', icon: TrendingUp },
  { value: 'top_rated', labelKey: 'sort.top_rated', fallback: 'الأعلى تقييم', icon: Star },
] as const;

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fix 9c: derive ALL filter/sort state from URL so back-button fully restores state.
  // No local filter state — URL is the single source of truth.
  const currentSort = searchParams?.get('sort') || 'newest';

  // Memoize filters so that useCallback deps are stable across renders.
  // Each field is derived from searchParams; the object identity is stable unless
  // the URL actually changes, preventing unnecessary SWR key churn.
  // NOTE: colors, sizes, and fabrics filter options inside <ProductFilters> are
  // hardcoded for now — they will be replaced with API-driven values in a later sprint.
  // (intentional: see ProductFilters.tsx availableColors/availableSizes/availableFabrics)
  const debouncedFilters: ProductFiltersState = useMemo(
    () => ({
      category: searchParams?.get('category') || undefined,
      minPrice: searchParams?.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams?.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      colors: searchParams?.get('colors') ? searchParams.get('colors')!.split(',') : [],
      sizes: searchParams?.get('sizes') ? searchParams.get('sizes')!.split(',') : [],
      fabrics: searchParams?.get('fabrics') ? searchParams.get('fabrics')!.split(',') : [],
      customizable: searchParams?.get('customizable') === 'true' ? true : undefined,
      inStock: searchParams?.get('inStock') === 'true' ? true : undefined,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams?.toString()]
  );
  // Alias for the components below that use `filters` directly
  const filters = debouncedFilters;

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Helper: write filter/sort changes to URL (preserves existing params).
  // Sort/filter changes always reset the feed (page is implicit via infinite scroll).
  const updateUrl = useCallback(
    (updates: Partial<ProductFiltersState & { sort: string; q: string }>) => {
      const params = new URLSearchParams(searchParams?.toString() || '');

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
      if ('q' in updates) {
        if (updates.q) params.set('q', updates.q);
        else params.delete('q');
      }

      router.push(`/products?${params.toString()}`);
    },
    [searchParams, router]
  );

  // Build the base query string (without page) — useSWRInfinite appends page=N per key.
  const buildBaseQueryString = useCallback(() => {
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
    params.append('sort', currentSort || 'newest');

    return params.toString();
  }, [debouncedFilters, currentSort, searchParams, i18n.language]);

  // useSWRInfinite key function — appends page=N to the base query string.
  // Returns null on beyond-last-page to stop fetching.
  const getKey = useCallback(
    (pageIndex: number, previousPageData: any) => {
      // Reached the end — backend pagination meta tells us last_page
      if (previousPageData && previousPageData.pagination) {
        if (pageIndex + 1 > previousPageData.pagination.last_page) return null;
      }
      const base = buildBaseQueryString();
      const page = pageIndex + 1; // Laravel uses 1-based pages
      return `${API_BASE_URL}/api/products/all?${base}&page=${page}`;
    },
    [buildBaseQueryString]
  );

  const {
    data: pages,
    error,
    isLoading,
    isValidating,
    mutate,
    size,
    setSize,
  } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    revalidateFirstPage: false,
    // keepPreviousData: true — not supported in useSWRInfinite; use data.length check instead
  });

  // Flatten pages into a single products array
  const products: Product[] = pages ? pages.flatMap((page: any) => page?.data ?? []) : [];

  // Fix 9b: consume additive pagination meta from the last fetched page.
  // The backend (ProductController::index) returns it under the `pagination` key.
  // data?.meta alias kept for backward-compat with existing tests.
  const data = pages?.[pages.length - 1] ?? undefined;
  const paginationMeta = data?.pagination ?? data?.meta;

  // Determine pagination state
  const isReachingEnd =
    paginationMeta !== undefined
      ? size >= paginationMeta.last_page
      : data !== undefined && (data?.data?.length ?? 0) === 0;
  const isLoadingMore = isValidating && size > 1;

  // Total count (if backend provides it)
  const totalCount: number | undefined = paginationMeta?.total;

  // Keep the URL page param updated as the user scrolls (back-button awareness).
  // Use replaceState so this doesn't pollute the history stack.
  useEffect(() => {
    if (size > 1 && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('page', String(size));
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    }
  }, [size]);

  // IntersectionObserver: when sentinel becomes visible, load the next page
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isReachingEnd && !isValidating) {
          setSize((prev) => prev + 1);
        }
      },
      { rootMargin: '200px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isReachingEnd, isValidating, setSize]);

  // OpenSouk nudge — when search/listing yields nothing, invite them to post a request.
  const searchQuery = searchParams?.get('q');
  const openSouk = useOpenSoukNudge({
    storageKey: 'products',
    enabled: !isLoading && !error,
    emptyResults: !isLoading && !error && products.length === 0,
  });

  const handleFilterChange = (newFilters: Partial<ProductFiltersState>) => {
    updateUrl(newFilters);
  };

  const handleSortChange = (value: string) => {
    updateUrl({ sort: value });
  };

  // Generate filter chips from current URL-derived filters
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
        type: 'price',
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

  const handleClearAllFilters = () => {
    const params = new URLSearchParams();
    const q = searchParams?.get('q');
    if (q) params.set('q', q);
    router.push(`/products?${params.toString()}`);
  };

  const handleRetry = () => {
    mutate();
  };

  const activeChips = getFilterChips();

  if (error && products.length === 0) {
    return (
      <div className="min-h-screen bg-canvas">
        <ErrorState message={error.message} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas pb-24 md:pb-16">
      <OpenSoukRequestModal
        isOpen={openSouk.isOpen}
        onClose={openSouk.close}
        categoryName={searchQuery || undefined}
      />

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
            <div className="sticky top-[64px] z-20 bg-amber-50/90 backdrop-blur-sm border border-amber-200 rounded-2xl px-4 py-3 mb-4 shadow-atlas-sm">
              {/* Top row: mobile filter trigger + result count */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {/* Mobile filter trigger */}
                  <button
                    type="button"
                    aria-label={t('filters.open_drawer', 'Open filters')}
                    className="md:hidden inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-white border border-indigo-200 rounded-full hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 transition-colors min-h-[44px]"
                    onClick={() => setIsMobileFiltersOpen(true)}
                  >
                    <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                    {t('filters.title', 'Filters')}
                    {activeChips.length > 0 && (
                      <span className="w-5 h-5 rounded-full bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center leading-none">
                        {activeChips.length}
                      </span>
                    )}
                  </button>

                  {/* Result count */}
                  <span className="text-sm text-gray-600 font-medium hidden md:inline-flex items-center gap-1.5">
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-700" aria-hidden="true" />
                        {t('products.loading', 'Loading…')}
                      </>
                    ) : products.length === 0 ? (
                      t('products.no_results', 'No results')
                    ) : totalCount !== undefined ? (
                      t('products.results', { count: totalCount })
                    ) : (
                      t('products.results', { count: products.length })
                    )}
                  </span>
                </div>
              </div>

              {/* Sort chips row — horizontal scroll on mobile */}
              <div
                role="group"
                aria-label={t('sort.aria_label', 'Sort products')}
                className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide"
              >
                {SORT_OPTIONS.map(({ value, labelKey, fallback, icon: Icon }) => {
                  const isActive = currentSort === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleSortChange(value)}
                      aria-pressed={isActive}
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 shrink-0 min-h-[36px] ${
                        isActive
                          ? 'bg-indigo-700 text-white shadow-sm'
                          : 'bg-white text-gray-700 border border-amber-200 hover:border-indigo-300 hover:text-indigo-700'
                      }`}
                    >
                      <Icon className="h-3 w-3" aria-hidden="true" />
                      {t(labelKey, fallback)}
                    </button>
                  );
                })}
              </div>
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
            {isLoading ? (
              <ProductGridSkeleton count={6} />
            ) : products.length > 0 ? (
              <Suspense fallback={<ProductGridSkeleton count={6} />}>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {products.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: shouldReduceMotion ? 0 : Math.min(index * 0.03, 0.24),
                        duration: shouldReduceMotion ? 0 : 0.28,
                        ease: [0.33, 1, 0.68, 1],
                      }}
                      className="hover:-translate-y-0.5 hover:shadow-atlas-md transition-all duration-200 ease-out rounded-2xl"
                    >
                      <ProductCard product={product} priority={index < 4} />
                    </motion.div>
                  ))}
                </div>
              </Suspense>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <NoSearchResults query={searchQuery || undefined} />
              </motion.div>
            )}

            {/* ── Next-page skeleton when loading more ── */}
            {isLoadingMore && (
              <div className="mt-6">
                <ProductGridSkeleton count={4} />
              </div>
            )}

            {/* ── Infinite scroll sentinel ── */}
            <div
              ref={sentinelRef}
              data-testid="scroll-sentinel"
              aria-hidden="true"
              className="h-8 mt-4"
            />

            {/* ── End of list message ── */}
            {isReachingEnd && products.length > 0 && !isLoadingMore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-8"
              >
                <p className="text-sm text-gray-400 font-medium">
                  {t('products.end_of_list', 'All products loaded')}
                </p>
                <div className="mt-2 mx-auto w-12 h-px bg-amber-200" aria-hidden="true" />
              </motion.div>
            )}

            {/* ── Error mid-stream (already loaded some, then an error) ── */}
            {error && products.length > 0 && (
              <div className="mt-6 flex justify-center">
                <Button variant="outline" onClick={() => setSize(size)} className="gap-2 text-sm">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  {t('common.try_again', 'Try again')}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
