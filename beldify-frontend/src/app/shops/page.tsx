'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { shopService } from '@/services/shopService';
import type { Shop } from '@/lib/types/shop';
import { Loading } from '@/components/ui/loading';
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

export default function ShopsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [shops, setShops] = useState<Shop[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get current filter values from URL
  const currentPage = Number(searchParams?.get('page')) || 1;
  const currentSearch = searchParams?.get('search') || '';
  const currentType = searchParams?.get('type') || '';
  const currentSort = searchParams?.get('sort') || 'latest';
  const [validSort, setValidSort] = useState<SortOption>(
    ['name_asc', 'name_desc', 'products_count', 'latest'].includes(currentSort) ? (currentSort as SortOption) : 'latest'
  );

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

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900">{t('shops.error.title')}</h2>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <Button onClick={fetchShops} className="mt-4">
          {t('common.actions.tryAgain')}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50/40 pb-16">
      {/* Editorial hero — matches homepage Stitch palette */}
      <section className="relative isolate overflow-hidden bg-indigo-900 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_15%_15%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_85%_60%,_#6366f1_0,_transparent_50%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-14 lg:py-20">
          <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-amber-300 font-medium">Marketplace</p>
          <h1
            className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            Hand-picked ateliers.
          </h1>
          <p className="mt-4 text-indigo-100 max-w-lg text-base sm:text-lg">
            Browse verified Moroccan sellers and tailors across Fez, Marrakech, Casablanca and Tetouan — every one is curated by the Beldify team.
          </p>
        </div>
      </section>

      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto">
          {/* Title and Search Bar */}
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-indigo-900">
                {t('shops.title')}
              </h1>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('shops.search.placeholder')}
                    className="pl-10 w-full text-sm sm:text-base"
                  />
                </div>
                <Button type="submit" className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base">
                  <span className="hidden sm:inline">{t('common.actions.search')}</span>
                  <MagnifyingGlassIcon className="h-4 w-4 sm:hidden" />
                </Button>
              </form>
            </div>
          </div>

          {/* Filter Bar - Mobile Scroll */}
          <div className="md:border-t md:border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <ShopFilterBar
                  selectedType={currentType}
                  onTypeChange={handleFilterChange}
                  onOpenFilters={() => setShowFilters(true)}
                />
              </div>
              <div className="hidden md:block px-4">
                <ShopSort value={currentSort} onChange={handleSortChange} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Sort - Shown only on mobile */}
        <div className="mb-4 md:hidden">
          <ShopSort value={currentSort} onChange={handleSortChange} />
        </div>

        {/* Shop Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>

        {/* Empty State */}
        {shops.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all my-8">
            <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <ShoppingBagIcon className="h-8 w-8 text-indigo-500" />
            </div>
            <h3 className="text-xl font-medium text-indigo-700">{t('shops.noResults')}</h3>
            <p className="mt-2 text-sm text-gray-600">{t('shops.tryDifferentSearch')}</p>
            <div className="mt-6">
              <Button
                onClick={() => router.push('/shops')}
                className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg">
                {t('common.actions.clearFilters')}
              </Button>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="mt-8">
            <div className="flex items-center justify-center gap-2">
              <Button
                className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={pagination.current_page === 1}
                onClick={() => handlePageChange(pagination.current_page - 1)}
              >
                {t('common.pagination.previous')}
              </Button>

              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    className={page === pagination.current_page
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 p-0 rounded-lg"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50 w-10 h-10 p-0 rounded-lg"}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <div className="sm:hidden">
                <span className="text-sm text-gray-600 font-medium">
                  {t('common.pagination.page', {
                    current: pagination.current_page,
                    total: pagination.last_page,
                  })}
                </span>
              </div>

              <Button
                className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => handlePageChange(pagination.current_page + 1)}
              >
                {t('common.pagination.next')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Filters Drawer */}
      <ShopFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        selectedType={currentType}
        onTypeChange={handleFilterChange}
      />
    </div>
  );
}
