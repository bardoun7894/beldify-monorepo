'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/products/ProductCard';
import ProductFilters from '@/components/products/ProductFilters';
import ProductSort from '@/components/products/ProductSort';
import { Product } from '@/lib/types';
// expect: @heroicons removed; lucide-react provides SlidersHorizontal, Settings2, RefreshCw (delta 2.4)
import { SlidersHorizontal, Settings2, RefreshCw } from 'lucide-react';
import logger from '@/utils/consoleLogger';
interface Category {
  id: number;
  category_name_en: string;
  itemCount: number;
}

interface CategoryData {
  category: Category;
  products: Product[];
  subCategories: Category[];
}

interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  colors: string[];
  sizes: string[];
  fabrics: string[];
  customizable?: boolean;
  inStock?: boolean;
}

type Params = { slug: string };

export default function CategoryPage() {
  const { t } = useTranslation();
  const params = useParams();

  // Handle params safely without using React.use()
  // This approach works with both Promise and non-Promise params
  const slug = typeof params === 'object' && params !== null ? (params as any).slug : '';

  const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({
    colors: [],
    sizes: [],
    fabrics: [],
  });
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
        if (filters.customizable !== undefined)
          params.append('customizable', filters.customizable.toString());
        if (filters.inStock !== undefined) params.append('inStock', filters.inStock.toString());
        if (filters.colors.length > 0) params.append('colors', filters.colors.join(','));
        if (filters.sizes.length > 0) params.append('sizes', filters.sizes.join(','));
        if (filters.fabrics.length > 0) params.append('fabrics', filters.fabrics.join(','));
        params.append('sort', sortBy || 'newest');

        const response = await axios.get(`/api/categories/${slug}?${params.toString()}`);
        setCategoryData(response.data);
      } catch (err: any) {
        logger.error('Error fetching category data:', err);
        let errorMessage = 'Failed to load category';
        if (err.response) {
          // Handle different error response formats
          if (err.response.data?.error) {
            errorMessage = err.response.data.error;
          } else if (err.response.data?.message) {
            errorMessage = err.response.data.message;
          } else if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCategoryData();
    }
  }, [slug, filters, sortBy]);

  const handleFilters = (newFilters: Partial<ProductFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleSort = (value: string) => {
    setSortBy(value);
  };

  // expect: error state uses text-rose-700 (Tetouani Garnet), not text-red-500 (delta 2.3)
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-rose-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600"
        >
          {t('common.try_again')}
        </button>
      </div>
    );
  }

  if (!categoryData && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('category.not_found')}</p>
      </div>
    );
  }

  // expect: editorial hero band — bg-indigo-700 strip with Playfair Display H1 (delta 2.6)
  const categoryName = categoryData?.category?.category_name_en ?? '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Editorial hero band — replaces the former white card header (delta 2.6 + 2.1 instance 1) */}
      {/* expect: indigo-700 editorial band with Playfair H1 opens the page */}
      <div className="bg-indigo-700 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-300 font-medium mb-2">
            {t('category.eyebrow', 'Beldify Souk')}
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {categoryName}
          </h1>
          {categoryData?.category && categoryData.category.itemCount > 0 && (
            <p className="mt-3 text-indigo-200 text-sm">
              {t('products.results', { count: categoryData.category.itemCount })}
            </p>
          )}
        </div>
      </div>

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-4 lg:gap-6">
            {/* Filters - Sidebar */}
            {/* expect: bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 replaces bg-white card (delta 2.1 instance 2) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="md:col-span-3 lg:col-span-2"
            >
              <div className="bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 overflow-hidden sticky top-24">
                {/* Sidebar Accent - Amber */}
                <div className="h-px bg-amber-200 my-4" />
                <div className="p-4">
                  {/* expect: Settings2 (lucide) replaces AdjustmentsHorizontalIcon (heroicons); text-gray-900 replaces text-indigo-800 (delta 2.4 + 2.5) */}
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                    <Settings2 className="h-5 w-5 mr-2" />
                    {t('filters.title')}
                  </h2>
                  <ProductFilters
                    filters={filters}
                    onChange={handleFilters}
                    isMobileOpen={isMobileFiltersOpen}
                    onMobileClose={() => setIsMobileFiltersOpen(false)}
                  />
                </div>
              </div>
            </motion.div>

            {/* Products - Main Content */}
            {/* expect: bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 replaces bg-white card (delta 2.1 instance 3) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="md:col-span-9 lg:col-span-10"
            >
              <div className="bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 overflow-hidden">
                {/* Main Content Accent - Amber */}
                <div className="h-px bg-amber-200 my-4" />
                {/* Sort and Results Count */}
                <div className="p-4 border-b border-amber-200 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    {/* Mobile Filter Button — min-h-[44px] for touch target compliance */}
                    <button
                      type="button"
                      className="md:hidden flex items-center gap-2 px-4 min-h-[44px] text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                      onClick={() => setIsMobileFiltersOpen(true)}
                    >
                      {/* expect: SlidersHorizontal (lucide) replaces FunnelIcon (heroicons) (delta 2.4) */}
                      <SlidersHorizontal className="h-5 w-5" />
                      {t('filters.title')}
                    </button>

                    {/* Products Count */}
                    <div className="text-gray-600 font-medium">
                      {!categoryData?.products ? (
                        <span className="flex items-center">
                          {/* expect: RefreshCw (lucide) replaces ArrowPathIcon (heroicons) (delta 2.4) */}
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          {t('products.loading')}
                        </span>
                      ) : categoryData.products.length === 0 ? (
                        t('products.no_results')
                      ) : (
                        <span>{t('products.results', { count: categoryData.products.length })}</span>
                      )}
                    </div>
                  </div>

                  <ProductSort value={sortBy} onChange={handleSort} />
                </div>

                {/* Products Grid */}
                <div className="p-4 sm:p-6">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                      >
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        ))}
                      </motion.div>
                    ) : (categoryData && categoryData.products && categoryData.products.length > 0) ? (
                      <motion.div
                        key="products"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ staggerChildren: 0.05 }}
                        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                      >
                        {categoryData!.products.map((product, index) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <ProductCard product={product} />
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (categoryData && categoryData.subCategories && categoryData.subCategories.length > 0) ? (
                      <motion.div
                        key="subcategories"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {/* expect: text-gray-900 replaces text-indigo-800 on subcategory heading (delta 2.5) */}
                        <h3 className="text-lg font-medium text-gray-900 mb-6">{t('category.subcategories')}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                          {categoryData.subCategories.map((subCategory, index) => (
                            <motion.div
                              key={subCategory.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <a
                                href={`/category/${subCategory.id}`}
                                className="group block bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 hover:ring-amber-300 p-6 transition-all duration-200"
                              >
                                <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-700 transition-colors duration-200">
                                  {subCategory.category_name_en}
                                </h3>
                                {subCategory.itemCount > 0 && (
                                  <p className="mt-2 text-sm text-gray-500">
                                    {t('products.results', { count: subCategory.itemCount })}
                                  </p>
                                )}
                              </a>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="no-results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-12"
                      >
                        <p className="text-gray-500">{t('products.no_results')}</p>
                        <button
                          onClick={() => window.location.reload()}
                          className="mt-4 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
                        >
                          {/* expect: RefreshCw (lucide) replaces ArrowPathIcon (heroicons) (delta 2.4) */}
                          <RefreshCw className="h-5 w-5 inline mr-2" />
                          {t('common.refresh')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
