'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { categoryService } from '@/services/categoryService';
import { Category } from '@/types/category';
import { Loading } from '@/components/ui/loading';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { SearchX } from 'lucide-react';
import logger from '@/utils/consoleLogger';

export default function CategoriesPage() {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string>('All');

  const isRTL = i18n.language === 'ar';

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
        setError(t('errors.failed_to_fetch_categories', 'تعذّر تحميل التصنيفات.'));
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
          <p className="text-gray-500 animate-pulse text-sm font-arabic">
            {t('common.loading', 'جارٍ التحميل…')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-amber-50/40 flex flex-col items-center justify-center px-4">
        <div className="bg-white border border-amber-200 rounded-2xl p-10 max-w-md w-full text-center shadow-atlas-sm">
          <div className="text-rose-700 mb-4 text-base font-medium">{error}</div>
          <p className="text-gray-500 mb-8 text-sm">
            {t('catalog.categories.error_description', "تعذّر تحميل التصنيفات. يرجى المحاولة مجدداً.")}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-700 px-7 py-3 text-sm font-semibold text-white hover:bg-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2"
            aria-label={t('common.try_again', 'حاول مجدداً')}
          >
            {t('common.try_again', 'حاول مجدداً')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50/40 pb-20">
      {/* ── Editorial hero strip ─────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-indigo-950 text-white">
        {/* Ambient radial light — amber warm left, indigo accent right */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_15%_30%,_#f59e0b_0,_transparent_45%),radial-gradient(ellipse_at_80%_70%,_#6366f1_0,_transparent_50%)]"
        />

        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          {/* Kicker */}
          <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-amber-400 font-medium mb-3">
            {t('catalog.categories.eyebrow', 'تصفّح')}
          </p>
          {/* Headline */}
          <h1
            className="text-balance text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-white"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('catalog.categories.headline', 'السوق، بابٌ بباب.')}
          </h1>
          <p className="mt-5 text-pretty text-indigo-200 max-w-lg text-base sm:text-lg leading-relaxed">
            {t(
              'catalog.categories.subheadline',
              'قفاطين وجلابيب وخياطة على المقاس — مرتّبة حسب التراث والجنس والحرفة.'
            )}
          </p>
        </div>
      </section>

      {/* ── Filter + Grid ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">

        {/* Gender filter pills */}
        <div
          className="mb-8 flex flex-wrap items-center gap-2 md:gap-3"
          role="group"
          aria-label={t('catalog.categories.filter_by_gender', 'تصفية حسب الجنس')}
        >
          {genderFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedGender(filter.value)}
              aria-pressed={selectedGender === filter.value}
              className={[
                'px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-1',
                selectedGender === filter.value
                  ? 'bg-indigo-700 text-white border-indigo-700 shadow-atlas-sm'
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
            <span className="font-semibold text-gray-900">
              {categories.length.toLocaleString(isRTL ? 'ar-MA' : 'fr-MA')}
            </span>{' '}
            {t('categories.collections_found', 'تصنيف')}
          </p>
        )}

        {/* Category tile grid — editorial 2-up mobile, 3-up tablet, 4-up desktop */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((category, index) => {
              const displayName = isRTL
                ? (category.name_ar || category.name_en)
                : (category.name_en || category.name_ar);
              const count = category.itemCount ?? category.productCount;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
                  className="h-full"
                >
                  <Link
                    href={`/categories/${category.slug || category.id}`}
                    className="group relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-amber-200/60 bg-amber-50 shadow-atlas-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-atlas-md block"
                    aria-label={displayName}
                  >
                    {/* Image */}
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={displayName}
                        fill
                        sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                        }}
                      />
                    ) : (
                      /* Amber-tinted placeholder */
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-indigo-100" />
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-indigo-950/10 to-transparent" />

                    {/* Item count badge */}
                    {typeof count === 'number' && count > 0 && (
                      <span className="absolute top-3 end-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-900 shadow-atlas-sm">
                        {count.toLocaleString(isRTL ? 'ar-MA' : 'fr-MA')}
                      </span>
                    )}

                    {/* Category name */}
                    <div className="absolute bottom-0 start-0 end-0 px-4 pb-5">
                      <h3
                        className="text-white text-base sm:text-lg font-semibold leading-tight drop-shadow-sm"
                        style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                      >
                        {displayName}
                      </h3>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="bg-white rounded-2xl border border-amber-200 p-12 text-center max-w-2xl mx-auto mt-8 shadow-atlas-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mb-6 ring-1 ring-amber-200">
              <SearchX className="h-7 w-7 text-amber-400" aria-hidden />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3" style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}>
              {t('categories.no_results_title', 'لا توجد تصنيفات')}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {t('categories.no_results_description', 'جرّب تعديل الفلتر أو تحقّق مجدداً لاحقاً.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
