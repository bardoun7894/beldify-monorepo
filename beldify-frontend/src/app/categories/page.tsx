'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { categoryService } from '@/services/categoryService';
import { Category } from '@/types/category';
import { Loading } from '@/components/ui/loading';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { SearchX, ArrowUpRight } from 'lucide-react';
import logger from '@/utils/consoleLogger';
import { intlLocale } from '@/i18n/config';

// Jewel-tone accents cycled across the grid so cards read as a curated set even
// before (or without) photography. Rooted in the Atlas indigo + saffron palette.
const CARD_ACCENTS = [
  'from-indigo-900 via-indigo-800 to-indigo-950',
  'from-amber-700 via-amber-600 to-amber-800',
  'from-violet-900 via-indigo-800 to-indigo-950',
  'from-rose-800 via-rose-700 to-rose-900',
  'from-emerald-800 via-teal-800 to-emerald-950',
  'from-orange-700 via-amber-700 to-amber-900',
];

interface CategoryCardProps {
  href: string;
  image?: string | null;
  name: string;
  count?: number;
  index: number;
  accent: number;
  isRTL: boolean;
}

function CategoryCard({ href, image, name, count, index, accent, isRTL }: CategoryCardProps) {
  const { i18n } = useTranslation();
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const showImage = !!image && !errored;
  const monogram = (name || '?').trim().charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
      className="h-full"
    >
      <Link
        href={href}
        aria-label={name}
        className="group relative block aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-atlas-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-atlas-md hover:ring-indigo-300/70"
      >
        {/* Themed gradient base — always present, so the card never looks empty */}
        <div className={`absolute inset-0 bg-gradient-to-br ${CARD_ACCENTS[accent]}`} />

        {/* Decorative monogram + sheen — visible until a real photo loads */}
        <div
          aria-hidden
          className={`absolute inset-0 transition-opacity duration-500 ${showImage && loaded ? 'opacity-0' : 'opacity-100'}`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,_rgba(255,255,255,0.14),_transparent_55%)]" />
          <span
            className="absolute -bottom-5 end-2 select-none text-[7.5rem] leading-none font-bold text-white/10 transition-transform duration-500 group-hover:scale-110"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {monogram}
          </span>
        </div>

        {/* Real photo overlay (fades in once decoded; falls back to gradient on error) */}
        {showImage && (
          <Image
            src={image as string}
            alt={name}
            fill
            sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
            className={`object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
          />
        )}

        {/* Legibility scrim for the label */}
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/85 via-indigo-950/15 to-transparent" />

        {/* Item-count badge */}
        {typeof count === 'number' && count > 0 && (
          <span className="absolute top-3 end-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-900 shadow-atlas-sm backdrop-blur-sm">
            {count.toLocaleString(intlLocale(i18n.language))}
          </span>
        )}

        {/* Name + hover affordance */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-4 pb-5">
          <h3
            className="text-white text-base sm:text-lg font-semibold leading-tight drop-shadow-sm"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {name}
          </h3>
          <span className="mb-0.5 shrink-0 translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="h-5 w-5 text-amber-300 rtl:-scale-x-100" aria-hidden />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function CategoriesPage() {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [retryKey, setRetryKey] = useState(0);

  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGender, retryKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
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
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 max-w-md w-full text-center shadow-atlas-sm">
          <div className="text-rose-700 mb-4 text-base font-medium">{error}</div>
          <p className="text-gray-500 mb-8 text-sm">
            {t('catalog.categories.error_description', "تعذّر تحميل التصنيفات. يرجى المحاولة مجدداً.")}
          </p>
          <button
            onClick={() => setRetryKey(k => k + 1)}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-700 px-7 py-3 text-sm font-semibold text-white hover:bg-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2"
            aria-label={t('common.try_again', 'حاول مجدداً')}
          >
            {t('common.try_again', 'حاول مجدداً')}
          </button>
        </div>
      </div>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beldify.com';

  const categoriesJsonLd = categories.length > 0 ? {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beldify', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: t('nav.categories', 'Categories'), item: `${siteUrl}/categories` },
        ],
      },
      {
        '@type': 'ItemList',
        name: t('nav.categories', 'Categories'),
        numberOfItems: categories.length,
        itemListElement: categories.slice(0, 20).map((cat, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${siteUrl}/categories/${cat.slug || cat.id}`,
        })),
      },
    ],
  } : null;

  return (
    <div className="min-h-screen bg-canvas pb-20">
      {categoriesJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(categoriesJsonLd) }}
        />
      )}
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
                  : 'bg-white text-gray-700 border-amber-200 hover:bg-amber-50 hover:border-gray-300',
              ].join(' ')}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Result count */}
        {categories.length > 0 && (
          <p className="mb-6 text-sm text-gray-500 border-b border-gray-100 pb-4">
            <span className="font-semibold text-gray-900">
              {categories.length.toLocaleString(intlLocale(i18n.language))}
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
                <CategoryCard
                  key={category.id}
                  href={`/categories/${category.slug || category.id}`}
                  image={category.image}
                  name={displayName}
                  count={typeof count === 'number' ? count : undefined}
                  index={index}
                  accent={index % CARD_ACCENTS.length}
                  isRTL={isRTL}
                />
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-2xl mx-auto mt-8 shadow-atlas-sm">
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
