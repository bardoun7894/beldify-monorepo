'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { categoryService } from '@/services/categoryService';
import { Category } from '@/types/category';
import { Loading } from '@/components/ui/loading';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRightIcon } from 'lucide-react';
import logger from '@/utils/consoleLogger';

export default function CategoriesPage() {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string>('All');

  const genderFilters = [
    { label: t('common.all'), value: 'All' },
    { label: t('genders.men'), value: 'Men' },
    { label: t('genders.women'), value: 'Women' },
    { label: t('genders.children'), value: 'Children' },
  ];

  useEffect(() => {
    const fetchFilteredCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedCategories = await categoryService.getAllCategories(selectedGender);
        if (!Array.isArray(fetchedCategories)) {
          throw new Error('Invalid categories data received');
        }
        setCategories(fetchedCategories);
        setError(null);
      } catch (err: any) {
        logger.error('Error fetching categories:', err);
        setError(t('errors.failed_to_fetch_categories', 'Failed to load categories.'));
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredCategories();
  }, [t, selectedGender]);

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loading size="lg" />
          <p className="text-gray-500 animate-pulse text-sm">Loading categories…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-amber-50/40 flex flex-col items-center justify-center px-4">
        <div className="bg-white border border-amber-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="text-red-500 mb-4 text-base font-medium">{error}</div>
          <p className="text-gray-500 mb-6 text-sm">
            {t('catalog.categories.error_description', "We couldn't load the categories. Please try again.")}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 transition-colors"
          >
            {t('common.try_again', 'Try Again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50/40 pb-16">
      {/* Editorial indigo hero strip */}
      <section className="relative isolate overflow-hidden bg-indigo-900 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_15%_15%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_85%_60%,_#6366f1_0,_transparent_50%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-14 lg:py-20">
          <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-amber-300 font-medium">
            {t('catalog.categories.eyebrow', 'Browse')}
          </p>
          <h1
            className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('catalog.categories.headline', 'The souk, room by room.')}
          </h1>
          <p className="mt-4 text-indigo-100 max-w-lg text-base sm:text-lg">
            Explore caftans, djellabas, and bespoke tailoring — organised by tradition, gender, and craft.
          </p>
        </div>
      </section>

      {/* Filter + Grid */}
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Gender filter pills */}
        <div className="mb-8 flex flex-wrap items-center gap-2 md:gap-3">
          {genderFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedGender(filter.value)}
              className={[
                'px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200 border',
                selectedGender === filter.value
                  ? 'bg-indigo-700 text-white border-indigo-700'
                  : 'bg-white text-gray-700 border-amber-200 hover:bg-amber-50 hover:border-amber-300',
              ].join(' ')}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Result count */}
        {categories.length > 0 && (
          <p className="mb-6 text-sm text-gray-500 border-b border-amber-100 pb-4">
            <span className="font-medium text-gray-900">{categories.length}</span>{' '}
            {t('categories.collections_found', 'collections')}
          </p>
        )}

        {/* Category grid — matches homepage souk pattern exactly */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((subcategory, index) => (
              <motion.div
                key={subcategory.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="h-full"
              >
                <Link
                  href={`/categories/${subcategory.slug || subcategory.id}`}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-amber-200/60 bg-amber-50 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md block"
                >
                  {subcategory.image ? (
                    <Image
                      src={subcategory.image}
                      alt={(i18n.language === 'ar' || i18n.language === 'ma') ? subcategory.name_ar : subcategory.name_en || `Category ${subcategory.id}`}
                      fill
                      sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.png'; }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-amber-100" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {typeof subcategory.itemCount === 'number' && subcategory.itemCount > 0 && (
                    <span className="absolute top-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-900 shadow-sm">
                      {subcategory.itemCount} items
                    </span>
                  )}

                  <div className="absolute bottom-4 left-4 right-4">
                    <h3
                      className="text-white text-lg sm:text-xl font-semibold leading-tight drop-shadow-sm"
                      style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                    >
                      {(i18n.language === 'ar' || i18n.language === 'ma') ? subcategory.name_ar : subcategory.name_en}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-amber-200 p-12 text-center max-w-2xl mx-auto mt-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mb-6 ring-1 ring-amber-200">
              <ChevronRightIcon className="h-8 w-8 text-amber-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-3">
              {t('categories.no_results_title', 'No Collections Found')}
            </h3>
            <p className="text-gray-500 text-sm">
              {t('categories.no_results_description', 'Try adjusting the filter or check back later.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
