'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import ProductCard from '@/components/products/ProductCard';
import ProductFilters from '@/components/products/ProductFilters';
import ProductSort from '@/components/products/ProductSort';
import CategoryDetailHero from '@/components/category/CategoryDetailHero';
import { Product } from '@/lib/types';
import { RefreshCw, PackageSearch, SlidersHorizontal, Megaphone } from 'lucide-react';
import logger from '@/utils/consoleLogger';
import useOpenSoukNudge from '@/hooks/useOpenSoukNudge';
import OpenSoukRequestModal from '@/components/opensouk/OpenSoukRequestModal';
import { intlLocale } from '@/i18n/config';

interface CategoryInfo {
  id: number;
  category_name_en: string;
  category_name_ar?: string;
  image?: string;
  itemCount: number;
}

interface CategoryData {
  category: CategoryInfo;
  products: Product[];
  subCategories: CategoryInfo[];
}

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

export default function CategoryDetailPage() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const slug = typeof params === 'object' && params !== null ? (params as any).slug : '';
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';
  const numberLocale = intlLocale(i18n.language);

  const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFiltersState>({
    colors: [],
    sizes: [],
    fabrics: [],
  });
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  // Retry counter — bumping triggers the fetch effect again without wiping
  // app contexts (cart, auth, i18n) the way window.location.reload() would.
  const [retryKey, setRetryKey] = useState(0);

  // OpenSouk nudge — invite buyers to post a request when they hit a dead-end
  // (no products & no subcategories) or browse a long time without finding.
  const osDeadEnd =
    !loading &&
    !!categoryData &&
    (categoryData.products?.length ?? 0) === 0 &&
    (categoryData.subCategories?.length ?? 0) === 0;
  const openSouk = useOpenSoukNudge({
    storageKey: 'category',
    enabled: !loading && !!categoryData,
    emptyResults: osDeadEnd,
  });

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        setError(null);

        const qs = new URLSearchParams();
        if (filters.minPrice) qs.append('minPrice', filters.minPrice.toString());
        if (filters.maxPrice) qs.append('maxPrice', filters.maxPrice.toString());
        if (filters.customizable !== undefined) qs.append('customizable', filters.customizable.toString());
        if (filters.inStock !== undefined) qs.append('inStock', filters.inStock.toString());
        if (filters.colors.length > 0) qs.append('colors', filters.colors.join(','));
        if (filters.sizes.length > 0) qs.append('sizes', filters.sizes.join(','));
        if (filters.fabrics.length > 0) qs.append('fabrics', filters.fabrics.join(','));
        qs.append('sort', sortBy || 'newest');

        const response = await axios.get(`/api/categories/${slug}?${qs.toString()}`);
        setCategoryData(response.data);
      } catch (err: any) {
        logger.error('Error fetching category data:', err);
        let errorMessage = t('errors.failed_to_fetch_categories', 'تعذّر تحميل التصنيف');
        if (err.response?.data?.error) errorMessage = err.response.data.error;
        else if (err.response?.data?.message) errorMessage = err.response.data.message;
        else if (typeof err.response?.data === 'string') errorMessage = err.response.data;
        else if (err.message) errorMessage = err.message;
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCategoryData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t is a fresh ref in tests; omitted to avoid render loops
  }, [slug, filters, sortBy, retryKey]);

  const handleFilters = (newFilters: Partial<ProductFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleSort = (value: string) => {
    setSortBy(value);
  };

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-atlas-sm p-10 max-w-md w-full text-center">
          <p className="text-rose-700 mb-4 font-medium">{error}</p>
          <button
            onClick={() => { setError(null); setRetryKey((k) => k + 1); }}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
          >
            {t('common.try_again', 'حاول مجدداً')}
          </button>
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (!categoryData && !loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-atlas-sm p-10 max-w-md w-full text-center">
          <p className="text-gray-500">{t('category.not_found', 'التصنيف غير موجود')}</p>
        </div>
      </div>
    );
  }

  const category = categoryData?.category;
  const productCount = category?.itemCount ?? categoryData?.products?.length ?? 0;
  const categoryName = category
    ? (isRTL && category.category_name_ar ? category.category_name_ar : category.category_name_en)
    : '';

  // BreadcrumbList JSON-LD — Home › Categories › {slug-derived-name}.
  // Slug is available pre-fetch so the schema is emitted even before products load,
  // giving Google a stable rich-result breadcrumb on category SERP entries.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beldify.com';
  const breadcrumbLeafName =
    categoryName ||
    (typeof slug === 'string'
      ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : '');
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('navigation.home', 'Home'), item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: t('navigation.categories', 'Categories'), item: `${siteUrl}/categories` },
      { '@type': 'ListItem', position: 3, name: breadcrumbLeafName, item: `${siteUrl}/categories/${slug}` },
    ],
  };
  // ItemList JSON-LD — exposes the first 24 products as a structured listing
  // so Google can render a product carousel for category SERP entries.
  const productsForLd = categoryData?.products ?? [];
  const itemListJsonLd =
    productsForLd.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: productsForLd.slice(0, 24).map((p, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `${siteUrl}/products/${p.id}`,
            name: p.name,
          })),
        }
      : null;

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <OpenSoukRequestModal
        isOpen={openSouk.isOpen}
        onClose={openSouk.close}
        categoryName={categoryName || undefined}
      />
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <CategoryDetailHero
        name={loading && !category ? '' : categoryName}
        image={category?.image}
        itemCount={productCount}
        loading={loading && !category}
      />

      {/* ── Products + Filters ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-12 gap-4 lg:gap-6">

          {/* Sidebar filters */}
          <motion.aside
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="md:col-span-3 lg:col-span-2"
            aria-label={t('filters.title', 'الفلاتر')}
          >
            <div className="sticky top-24">
              <ProductFilters
                filters={filters}
                onChange={handleFilters}
                isMobileOpen={isMobileFiltersOpen}
                onMobileClose={() => setIsMobileFiltersOpen(false)}
              />
            </div>
          </motion.aside>

          {/* Main product area */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="md:col-span-9 lg:col-span-10"
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-atlas-sm overflow-hidden">
              {/* Sort bar */}
              <div className="px-4 sm:px-6 py-3 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  {/* Mobile filter trigger */}
                  <button
                    type="button"
                    className="md:hidden inline-flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
                    onClick={() => setIsMobileFiltersOpen(true)}
                    aria-label={t('filters.title', 'الفلاتر')}
                  >
                    <SlidersHorizontal className="h-4 w-4" aria-hidden />
                    {t('filters.title', 'الفلاتر')}
                  </button>

                  {/* Products count */}
                  <span className="text-sm text-gray-500 font-medium">
                    {!categoryData?.products ? (
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-700" aria-hidden />
                        {t('products.loading', 'جارٍ التحميل…')}
                      </span>
                    ) : categoryData.products.length === 0 ? (
                      t('products.no_results', 'لا نتائج')
                    ) : (
                      <span>
                        <strong className="text-gray-900">
                          {categoryData.products.length.toLocaleString(numberLocale)}
                        </strong>{' '}
                        {t('products.results_label', 'منتج')}
                      </span>
                    )}
                  </span>
                </div>

                <ProductSort value={sortBy} onChange={handleSort} />
              </div>

              {/* Grid */}
              <div className="p-4 sm:p-6">
                <AnimatePresence mode="wait">
                  {loading ? (
                    /* Loading skeletons */
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                    >
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="bg-gray-100 aspect-[4/5] rounded-2xl mb-3" />
                          <div className="h-3.5 bg-amber-100 rounded-full w-3/4 mb-2" />
                          <div className="h-3.5 bg-amber-100 rounded-full w-1/2" />
                        </div>
                      ))}
                    </motion.div>

                  ) : categoryData?.products && categoryData.products.length > 0 ? (
                    /* Products grid */
                    <motion.div
                      key="products"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                    >
                      {categoryData.products.map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.04, 0.3) }}
                        >
                          <ProductCard product={product} />
                        </motion.div>
                      ))}
                    </motion.div>

                  ) : categoryData?.subCategories && categoryData.subCategories.length > 0 ? (
                    /* Subcategory tiles */
                    <motion.div
                      key="subcategories"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <h3
                        className="text-lg font-semibold text-gray-900 mb-6"
                        style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                      >
                        {t('category.subcategories', 'التصنيفات الفرعية')}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                        {categoryData.subCategories.map((subCategory, index) => (
                          <motion.div
                            key={subCategory.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.04, 0.3) }}
                          >
                            <Link
                              href={`/categories/${subCategory.id}`}
                              className="group flex flex-col gap-2 p-5 bg-gray-50 rounded-2xl ring-1 ring-gray-200 hover:ring-indigo-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-atlas-md"
                            >
                              <h4
                                className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors duration-200 leading-snug"
                                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                              >
                                {isRTL && subCategory.category_name_ar
                                  ? subCategory.category_name_ar
                                  : subCategory.category_name_en}
                              </h4>
                              {subCategory.itemCount > 0 && (
                                <span className="text-xs text-gray-500">
                                  {subCategory.itemCount.toLocaleString(numberLocale)}{' '}
                                  {t('category.items', 'قطعة')}
                                </span>
                              )}
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                  ) : (
                    /* Empty state — intentional, not an error */
                    <motion.div
                      key="no-results"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center justify-center py-20 text-center"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center mb-5 shadow-sm">
                        <PackageSearch className="h-7 w-7 text-amber-400" aria-hidden />
                      </div>
                      <p
                        className="text-gray-800 font-semibold mb-1.5"
                        style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                      >
                        {t('products.empty_title', 'قريباً في المخزون')}
                      </p>
                      <p className="text-gray-500 text-sm mb-6 max-w-[220px] leading-relaxed">
                        {t('products.no_results_hint', 'هذا التصنيف لا يحتوي على منتجات حالياً — ارجع قريباً.')}
                      </p>
                      <button
                        onClick={() => setRetryKey((k) => k + 1)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-700 text-white rounded-full text-sm font-semibold hover:bg-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-700/30 shadow-sm"
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden />
                        {t('common.refresh', 'تحديث')}
                      </button>
                      <Link
                        href="/community"
                        className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 ring-1 ring-indigo-200 rounded-full text-sm font-semibold hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
                      >
                        <Megaphone className="h-4 w-4" aria-hidden />
                        {t('openSouk.nudgeCta', 'Browse requests & post yours')}
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.main>
        </div>
      </div>
    </div>
  );
}
