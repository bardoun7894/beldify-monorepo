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
import { Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
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

export default function ProductsPage() {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [filters, setFilters] = useState<ProductFiltersState>({
    colors: [],
    sizes: [],
    fabrics: [],
  });
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const searchParams = useSearchParams();

  // Debounce filter changes to reduce API calls
  const debouncedFilters = useDebounce(filters, 300);
  const debouncedSortBy = useDebounce(sortBy, 300);

  // Build query parameters
  const buildQueryString = useCallback(() => {
    const searchTerm = searchParams?.get('q');
    const params = new URLSearchParams();

    if (debouncedFilters.category) params.append('category', debouncedFilters.category);
    if (debouncedFilters.minPrice) params.append('minPrice', debouncedFilters.minPrice.toString());
    if (debouncedFilters.maxPrice && debouncedFilters.maxPrice !== Infinity)
      params.append('maxPrice', debouncedFilters.maxPrice.toString());
    if (debouncedFilters.customizable !== undefined)
      params.append('customizable', debouncedFilters.customizable.toString());
    if (debouncedFilters.inStock !== undefined) params.append('inStock', debouncedFilters.inStock.toString());
    if (debouncedFilters.colors.length > 0) params.append('colors', debouncedFilters.colors.join(','));
    if (debouncedFilters.sizes.length > 0) params.append('sizes', debouncedFilters.sizes.join(','));
    if (debouncedFilters.fabrics.length > 0) params.append('fabrics', debouncedFilters.fabrics.join(','));
    if (searchTerm) params.append('q', searchTerm);
    params.append('locale', 'en');
    params.append('sort', debouncedSortBy || 'newest');

    return `${API_BASE_URL}/api/products/all?${params.toString()}`;
  }, [debouncedFilters, debouncedSortBy, searchParams]);

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

  const handleFilterChange = (newFilters: Partial<ProductFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  // Generate filter chips from current filters — MAD currency
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

  // Handle removing a filter chip
  const handleRemoveChip = (chip: { id: string; type: string }) => {
    const newFilters = { ...filters };

    switch (chip.type) {
      case 'color':
        newFilters.colors = filters.colors.filter(c => `color-${c}` !== chip.id);
        break;
      case 'size':
        newFilters.sizes = filters.sizes.filter(s => `size-${s}` !== chip.id);
        break;
      case 'fabric':
        newFilters.fabrics = filters.fabrics.filter(f => `fabric-${f}` !== chip.id);
        break;
      case 'price':
        delete newFilters.minPrice;
        delete newFilters.maxPrice;
        break;
      case 'customizable':
        newFilters.customizable = false;
        break;
      case 'inStock':
        newFilters.inStock = false;
        break;
    }

    setFilters(newFilters);
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setFilters({
      colors: [],
      sizes: [],
      fabrics: [],
    });
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

              <ProductSort value={sortBy} onChange={handleSortChange} />
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
          </motion.div>
        </div>
      </div>

    </div>
  );
}
