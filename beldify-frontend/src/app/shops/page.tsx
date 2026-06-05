'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { shopService } from '@/services/shopService';
import type { Shop } from '@/lib/types/shop';
import ShopCard from '@/components/shops/ShopCard';
import ShopFilters from '@/components/shops/ShopFilters';
import ShopSort from '@/components/shops/ShopSort';
import ShopFilterBar from '@/components/shops/ShopFilterBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MagnifyingGlassIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

type SortOption = 'name_asc' | 'name_desc' | 'products_count' | 'latest';

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/**
 * buildPageWindow — windowed pagination helper.
 * Returns page numbers with '...' ellipsis sentinels to avoid rendering 100+ buttons.
 * Example (current=5, last=20): [1, '...', 4, 5, 6, '...', 20]
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

// ─── Skeleton Grid ────────────────────────────────────────────────────────────
function ShopGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl ring-1 ring-amber-200 bg-white overflow-hidden animate-pulse"
          aria-hidden="true"
        >
          {/* Square cover — mirrors ShopCard's pt-[100%] image to avoid CLS */}
          <div className="aspect-square bg-amber-100/70" />
          {/* Footer block — title + meta lines */}
          <div className="p-4 space-y-2.5">
            <div className="h-4 w-2/3 rounded bg-amber-100/70" />
            <div className="h-3 w-1/2 rounded bg-amber-100/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ShopsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current filter values from URL (derived before state so we can init from URL)
  const currentPage = Number(searchParams?.get('page')) || 1;
  const currentSearch = searchParams?.get('search') || '';
  const currentType = searchParams?.get('type') || '';
  const currentSort = searchParams?.get('sort') || 'latest';

  const [shops, setShops] = useState<Shop[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  // Fix 10: initialise from URL so the input is populated on back-navigation
  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [validSort, setValidSort] = useState<SortOption>(
    ['name_asc', 'name_desc', 'products_count', 'latest'].includes(currentSort) ? (currentSort as SortOption) : 'latest'
  );

  // Fix 10: sync local searchQuery when the URL search param changes (back-button)
  useEffect(() => {
    setSearchQuery(currentSearch);
  }, [currentSearch]);

  const fetchShops = async () => {
    setLoading(true);
    const result = await shopService.getShops({
      page: currentPage,
      search: currentSearch,
      type: currentType,
      sort: validSort,
      per_page: 12,
    });

    if (result.error) {
      setError(result.error.message);
    } else {
      setShops(result.data.shops);
      setPagination(result.data.pagination);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchShops();
  }, [currentPage, currentSearch, currentType, currentSort, validSort]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('page', page.toString());
    router.push(`/shops?${params.toString()}`);
  };

  const handleFilterChange = (type: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('type', type);
    params.delete('page'); // Reset to first page
    router.push(`/shops?${params.toString()}`);
  };

  const handleSortChange = (sort: string) => {
    if (['name_asc', 'name_desc', 'products_count', 'latest'].includes(sort)) {
      const sortOption = sort as SortOption;
      setValidSort(sortOption);
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('sort', sortOption);
      router.push(`/shops?${params.toString()}`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('search', searchQuery);
    params.delete('page'); // Reset to first page
    router.push(`/shops?${params.toString()}`);
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas gap-5 px-6">
        <div className="rounded-2xl bg-white ring-1 ring-rose-200 shadow-atlas-sm px-10 py-10 flex flex-col items-center gap-4 max-w-sm w-full text-center">
          <div className="h-14 w-14 rounded-full bg-rose-50 ring-1 ring-rose-200 flex items-center justify-center">
            <ShoppingBagIcon className="h-7 w-7 text-rose-700" aria-hidden="true" />
          </div>
          <h2
            className="text-xl font-bold text-gray-900"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('shops.error.title', 'Something went wrong')}
          </h2>
          <p className="text-sm text-gray-600">{error}</p>
          <Button onClick={fetchShops} className="rounded-full bg-indigo-700 hover:bg-indigo-800 text-white px-6">
            {t('common.actions.tryAgain', 'Try again')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas pb-16">
      {/* Editorial hero — indigo-950 surface, no eyebrow kicker */}
      <section className="relative isolate overflow-hidden bg-indigo-950">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 55% at 5% 85%, hsl(38 92% 50% / 0.16) 0%, transparent 60%), radial-gradient(ellipse 50% 45% at 90% 15%, hsl(243 75% 51% / 0.20) 0%, transparent 55%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-14 lg:py-20">
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('shops.list.headline', 'Hand-picked ateliers.')}
          </h1>
          <p className="mt-4 text-indigo-200 max-w-lg text-base sm:text-lg">
            {t(
              'shops.list.sub',
              'Browse verified Moroccan sellers and tailors across Fez, Marrakech, Casablanca and Tetouan — every one curated by the Beldify team.'
            )}
          </p>
        </div>
      </section>

      {/* Sticky search + filter bar */}
      <div className="bg-white border-b border-amber-200/60 sticky top-16 z-30 shadow-atlas-sm">
        <div className="max-w-7xl mx-auto">
          {/* Search row */}
          <div className="px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-indigo-900">
                {t('shops.title', 'Sellers')}
              </h2>

              <form onSubmit={handleSearch} className="flex w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </div>
                  <Input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('shops.search.placeholder', 'Search sellers...')}
                    className="ps-9 w-full text-sm"
                    aria-label={t('shops.search.label', 'Search sellers')}
                  />
                </div>
                <Button
                  type="submit"
                  className="ms-2 bg-indigo-700 hover:bg-indigo-800 text-white px-3 sm:px-4 py-2 rounded-full text-sm"
                  aria-label={t('common.actions.search', 'Search')}
                >
                  <span className="hidden sm:inline">{t('common.actions.search', 'Search')}</span>
                  <MagnifyingGlassIcon className="h-4 w-4 sm:hidden" aria-hidden="true" />
                </Button>
              </form>
            </div>
          </div>

          {/* Filter / sort bar */}
          <div className="md:border-t md:border-amber-200/60">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <ShopFilterBar
                  selectedType={currentType}
                  onTypeChange={handleFilterChange}
                  onOpenFilters={() => setShowFilters(true)}
                />
              </div>
              <div className="hidden md:block px-4">
                <ShopSort value={currentSort as SortOption} onChange={handleSortChange} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile sort */}
        <div className="mb-4 md:hidden">
          <ShopSort value={currentSort as SortOption} onChange={handleSortChange} />
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <ShopGridSkeleton />
        ) : (
          <>
            {/* Shop grid */}
            {shops.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {shops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl ring-1 ring-amber-200 shadow-atlas-sm my-8 text-center px-6">
                <div className="h-16 w-16 rounded-full bg-indigo-50 ring-1 ring-indigo-100 flex items-center justify-center mb-5">
                  <ShoppingBagIcon className="h-8 w-8 text-indigo-700" aria-hidden="true" />
                </div>
                <h3
                  className="text-xl font-bold text-gray-900"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {t('shops.noResults', 'No sellers found')}
                </h3>
                <p className="mt-2 text-sm text-gray-600 max-w-xs">
                  {t('shops.tryDifferentSearch', 'Try adjusting your search or filters to find what you\'re looking for.')}
                </p>
                <Button
                  onClick={() => router.push('/shops')}
                  variant="outline"
                  className="mt-6 rounded-full border-indigo-700 text-indigo-700 hover:bg-indigo-50 px-6"
                >
                  {t('common.actions.clearFilters', 'Clear filters')}
                </Button>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
              <nav
                aria-label={t('common.pagination.label', 'Page navigation')}
                className="mt-10"
              >
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-5 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={pagination.current_page === 1}
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    aria-label={t('common.pagination.previous', 'Previous page')}
                  >
                    {t('common.pagination.previous', 'Previous')}
                  </Button>

                  {/* Fix 10: windowed range — safe at 100+ pages */}
                  <div className="hidden sm:flex items-center gap-1">
                    {buildPageWindow(pagination.current_page, pagination.last_page).map((entry, idx) =>
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
                          aria-current={entry === pagination.current_page ? 'page' : undefined}
                          aria-label={t('common.pagination.goToPage', 'Go to page {{page}}', { page: entry })}
                          onClick={() => handlePageChange(entry as number)}
                          className={`w-10 h-10 rounded-full text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-1 ${
                            entry === pagination.current_page
                              ? 'bg-indigo-700 text-white shadow-atlas-sm'
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
                        current: pagination.current_page,
                        total: pagination.last_page,
                      })}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    className="rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-5 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={pagination.current_page === pagination.last_page}
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    aria-label={t('common.pagination.next', 'Next page')}
                  >
                    {t('common.pagination.next', 'Next')}
                  </Button>
                </div>
              </nav>
            )}
          </>
        )}
      </div>

      {/* Filters drawer */}
      <ShopFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        selectedType={currentType}
        onTypeChange={handleFilterChange}
      />
    </div>
  );
}
