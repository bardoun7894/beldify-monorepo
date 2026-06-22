'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Sparkles } from 'lucide-react';
import { fetchCategories } from '@/lib/api';
import type { Category as CategoryType } from '@/lib/types';
import '@/i18n/config';

interface PopularCategoriesSectionProps {
  maxCategories?: number;
  showViewAll?: boolean;
}

const PopularCategoriesSection: React.FC<PopularCategoriesSectionProps> = ({
  maxCategories = 12,
  showViewAll = true
}) => {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const localeParam = searchParams?.get('locale') ?? null;
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (localeParam) {
      i18n.changeLanguage(localeParam);
    }
  }, [localeParam, i18n]);

  const loadCategories = useCallback(async (signal?: { ignore: boolean }) => {
    try {
      setLoading(true);
      const data = await fetchCategories();
      if (signal?.ignore) return;
      setCategories(data);
      setError(null);
    } catch (err) {
      if (signal?.ignore) return;
      setError(t('common.error'));
    } finally {
      if (!signal?.ignore) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    setMounted(true);
    const signal = { ignore: false };
    loadCategories(signal);
    return () => {
      signal.ignore = true;
    };
  }, [loadCategories]);

  const popularSubcategories = useMemo(() => {
    if (!categories || !Array.isArray(categories)) {
      return [];
    }
    const allSubcategories = categories.flatMap(category => category.subcategories || []);
    return allSubcategories.slice(0, maxCategories);
  }, [categories, maxCategories]);

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <section className="py-16 sm:py-20 bg-amber-50/40">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-8 md:mb-10">
              <div>
                <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"></div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 md:gap-6">
              {Array.from({ length: maxCategories }).map((_, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="mt-3 h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="mt-1 h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 sm:py-20 bg-amber-50/40">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8">
              <p className="text-rose-700 text-sm mb-4">{error}</p>
              <button
                onClick={() => loadCategories()}
                className="px-6 py-2 bg-rose-700 text-white text-sm rounded-full hover:bg-rose-800 transition-colors"
              >
                {t('common.try_again')}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 bg-amber-50/40">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Eyebrow + heading */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-amber-700">
                {t('category.topCategories')}
              </span>
            </div>
            <h2
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('category.popularCategories')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t('category.discoverMostPopular')}
            </p>
            <div className="w-16 h-px bg-amber-200 mx-auto mt-6"></div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 md:gap-6">
            {popularSubcategories.map((subcat, index) => (
              <Link
                href={`/categories/${subcat.slug || subcat.id}?locale=${i18n.language}`}
                key={subcat.id}
                className="group flex flex-col items-center cursor-pointer"
              >
                {/* Category Circle */}
                <div className="relative">
                  {/* Main circle */}
                  <div className="relative bg-white rounded-full border border-gray-100 hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] overflow-hidden w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28">
                    <div className="relative w-full h-full overflow-hidden rounded-full">
                      <Image
                        src={subcat.image || '/placeholder.png'}
                        alt={['ar', 'ma'].includes(i18n.language) ? subcat.name_ar : subcat.name_en}
                        fill
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        priority={index < 6}
                        onError={(e) => {
                          const imgElement = e.target as HTMLImageElement;
                          imgElement.src = '/placeholder.png';
                        }}
                      />

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-indigo-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-[220ms] rounded-full" />

                      {/* Action icon */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-[220ms]">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)]">
                          <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-indigo-700" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Popular badge for top items */}
                  {index < 3 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Category Text */}
                <div className="text-center mt-3 md:mt-4 max-w-[90px] md:max-w-[110px]">
                  <h3 className="text-xs md:text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors duration-[220ms] line-clamp-2 leading-tight mb-1">
                    {['ar', 'ma'].includes(i18n.language) ? subcat.name_ar : subcat.name_en}
                  </h3>

                  {/* Item count */}
                  {subcat.itemCount !== undefined && (
                    <div className="flex items-center justify-center">
                      <span className={`text-[10px] md:text-xs font-medium transition-colors duration-[220ms] px-2 py-0.5 rounded-full ${
                        subcat.itemCount === 0
                          ? 'text-gray-400 bg-gray-100'
                          : 'text-indigo-700 bg-indigo-50'
                      }`}>
                        {subcat.itemCount === 0 ? t('category.comingSoon') : `${subcat.itemCount} ${t('category.items')}`}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* View All Button */}
          {showViewAll && (
            <div className="text-center mt-12">
              <Link
                href={`/categories?locale=${i18n.language}`}
                className="group inline-flex items-center gap-3 bg-indigo-700 hover:bg-indigo-800 text-white px-8 py-4 rounded-full font-semibold transition-all duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <span>{t('category.exploreAllCategories')}</span>
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PopularCategoriesSection;
