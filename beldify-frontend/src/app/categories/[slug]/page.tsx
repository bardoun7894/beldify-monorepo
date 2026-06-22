'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/products/ProductCard';
import ProductFilters from '@/components/products/ProductFilters';
import ProductSort from '@/components/products/ProductSort';
import { Product } from '@/lib/types';
import { FunnelIcon, AdjustmentsHorizontalIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import logger from '@/utils/consoleLogger';

interface CategoryInfo {
  id: number;
  category_name_en: string;
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
  const { t } = useTranslation();
  const params = useParams();
  const slug = typeof params === 'object' && params !== null ? (params as any).slug : '';

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

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        setError(null);

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
        setError(t('errors.general', 'An error occurred'));
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCategoryData();
    }
  }, [slug, filters, sortBy]);

  const handleFilters = (newFilters: Partial<ProductFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleSort = (value: string) => {
    setSortBy(value);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-amber-50/40 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-indigo-700 text-white rounded-full text-sm font-semibold hover:bg-indigo-800 transition-colors"
          >
            {t('common.try_again')}
          </button>
        </div>
      </div>
    );
  }

  if (!categoryData && !loading) {
    return (
      <div className="min-h-screen bg-amber-50/40 flex items-center justify-center">
        <p className="text-gray-500">{t('category.not_found')}</p>
      </div>
    );
  }

  const category = categoryData?.category;
  const productCount = category?.itemCount ?? categoryData?.products?.length ?? 0;

  return (
    <div className="min-h-screen bg-amber-50/40 pb-16">
      {/* Full-bleed cover hero — same recipe as shop detail */}
      <div className="relative h-64 sm:h-80 md:h-96 bg-indigo-900 overflow-hidden">
        {loading && !category ? (
          /* Loading shimmer while we wait for category data */
          <div className="absolute inset-0 animate-pulse bg-indigo-800" />
        ) : category?.image ? (
          <Image
            src={category.image}
            alt={category.category_name_en}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/hero-atelier.jpg'; }}
          />
        ) : (
          <Image
            src="/images/hero-atelier.jpg"
            alt={category?.category_name_en || 'Category'}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-90"
          />
        )}

        {/* Indigo gradient overlay matching shop detail */}
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/85 via-indigo-900/40 to-transparent" />

        {/* Amber product count pill — top-right */}
        {productCount > 0 && (
          <span className="absolute top-4 right-4 sm:top-6 sm:right-6 inline-flex items-center rounded-full bg-amber-400/95 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-900 shadow-sm">
            {productCount} products
          </span>
        )}

        {/* Category name — bottom-left */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="max-w-7xl mx-auto px-6 pb-8">
            {category && (
              <h1
                className="text-white text-3xl sm:text-4xl md:text-5xl font-bold leading-tight drop-shadow-md"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {category.category_name_en}
              </h1>
            )}
            {loading && !category && (
              <div className="h-10 w-64 bg-white/20 rounded animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Products section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-12 gap-4 lg:gap-6">
          {/* Filters — Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="md:col-span-3 lg:col-span-2"
          >
            <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden sticky top-24">
              <div className="h-1 bg-indigo-700 w-full" />
              <div className="p-4">
                <h2 className="text-base font-semibold text-indigo-900 flex items-center mb-4">
                  <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
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

          {/* Products — Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="md:col-span-9 lg:col-span-10"
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
                    <FunnelIcon className="h-5 w-5" />
                    {t('filters.title')}
                  </button>

                  {/* Products Count */}
                  <div className="text-gray-600 font-medium">
                    {!categoryData?.products ? (
                      <span className="flex items-center">
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
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
                          <div className="bg-amber-100 aspect-square rounded-2xl mb-2" />
                          <div className="h-4 bg-amber-100 rounded w-3/4 mb-2" />
                          <div className="h-4 bg-amber-100 rounded w-1/2" />
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
                          className="rounded-2xl ring-1 ring-amber-200 overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
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
                      <h3 className="text-base font-medium text-indigo-900 mb-6">
                        {t('category.subcategories')}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                        {categoryData.subCategories.map((subCategory, index) => (
                          <motion.div
                            key={subCategory.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <a
                              href={`/category/${subCategory.id}`}
                              className="group block bg-white rounded-2xl border border-amber-200 p-5 transition hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200"
                            >
                              <h3
                                className="text-base font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors"
                                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                              >
                                {subCategory.category_name_en}
                              </h3>
                              {subCategory.itemCount > 0 && (
                                <p className="mt-1.5 text-sm text-gray-500">
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
                        className="mt-4 px-5 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors"
                      >
                        <ArrowPathIcon className="h-4 w-4 inline mr-2" />
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
  );
}
