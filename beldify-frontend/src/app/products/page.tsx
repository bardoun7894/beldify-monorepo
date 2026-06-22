'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import ProductCard from '@/components/products/ProductCard';
import ProductFilters from '@/components/products/ProductFilters';
import ProductSort from '@/components/products/ProductSort';
import FilterChips from '@/components/products/FilterChips';
import NoSearchResults from '@/components/search/NoSearchResults';
import { Product } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { Filter, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import logger from '@/utils/consoleLogger';
import { API_BASE_URL } from '@/config/constants';

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

// Loading skeleton for product grid
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-amber-100 aspect-square rounded-2xl mb-2"></div>
          <div className="h-4 bg-amber-100 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-amber-100 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

export default function ProductsPage() {
  const { t } = useTranslation();
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

  // Generate filter chips from current filters
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
        label: `$${filters.minPrice} - $${filters.maxPrice}`,
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

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-rose-700">{t('products.error.fetch')}</p>
        <button
          onClick={handleRetry}
          className="mt-4 px-4 py-2 bg-amber-500 text-amber-950 font-semibold rounded-full hover:bg-amber-400 transition-colors"
        >
          {t('common.try_again')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50/40 pb-16">
      {/* Editorial indigo hero strip — Atlas design system */}
      <section className="relative isolate overflow-hidden bg-indigo-900 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_15%_15%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_85%_60%,_#3b3b6d_0,_transparent_50%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-14 lg:py-20">
          <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-amber-300 font-medium">
            {t('catalog.products.eyebrow', 'Marketplace')}
          </p>
          <h1
            className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('catalog.products.headline', 'The Beldify catalog.')}
          </h1>
          <p className="mt-4 text-indigo-100 max-w-lg text-base sm:text-lg">
            Caftans, djellabas, and hand-tailored pieces — sourced directly from verified ateliers across Morocco.
          </p>
        </div>
      </section>

      {/* Filter + grid section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-12 gap-4 lg:gap-6">
          {/* Filters — Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="md:col-span-3 lg:col-span-3"
          >
            <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden sticky top-24">
              <div className="h-1 bg-indigo-700 w-full" />
              <div className="p-4">
                <h2 className="text-base font-semibold text-indigo-900 flex items-center mb-4">
                  <SlidersHorizontal className="h-5 w-5 mr-2" />
                  {t('filters.title')}
                </h2>
                <ProductFilters
                  filters={filters}
                  onChange={handleFilterChange}
                  isMobileOpen={isMobileFiltersOpen}
                  onMobileClose={() => setIsMobileFiltersOpen(false)}
                />
              </div>
            </div>
          </motion.div>

          {/* Products — Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="md:col-span-9 lg:col-span-9"
          >
            <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
              <div className="h-1 bg-indigo-700 w-full" />

              {/* Sort and Results Count */}
              <div className="p-4 border-b border-amber-100 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  {/* Mobile Filter Button */}
                  <button
                    type="button"
                    className="md:hidden flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full hover:bg-indigo-100 transition-colors"
                    onClick={() => setIsMobileFiltersOpen(true)}
                  >
                    <Filter className="h-5 w-5" />
                    {t('filters.title')}
                  </button>

                  {/* Products Count */}
                  <div className="text-gray-600 font-medium">
                    {isLoading ? (
                      <span className="flex items-center">
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {t('products.loading')}
                      </span>
                    ) : products.length === 0 ? (
                      t('products.no_results')
                    ) : (
                      <span>{t('products.results', { count: products.length })}</span>
                    )}
                  </div>
                </div>

                <ProductSort value={sortBy} onChange={handleSortChange} />
              </div>

              {/* Active Filter Chips */}
              {!isLoading && getFilterChips().length > 0 && (
                <div className="px-4 py-3 border-b border-amber-100 bg-amber-50/50">
                  <FilterChips
                    chips={getFilterChips()}
                    onRemove={handleRemoveChip}
                    onClearAll={handleClearAllFilters}
                  />
                </div>
              )}

              {/* Products Grid */}
              <div className="p-4 sm:p-6">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
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
                        transition={{ staggerChildren: 0.05 }}
                        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                      >
                        {products.map((product, index) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="rounded-2xl ring-1 ring-amber-200 overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
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
                    >
                      <NoSearchResults
                        query={searchParams?.get('q') || undefined}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
