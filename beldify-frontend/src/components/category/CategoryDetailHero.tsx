'use client';

import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { intlLocale } from '@/i18n/config';

interface CategoryDetailHeroProps {
  /** Displayed name (already localised by caller) */
  name: string;
  image?: string;
  itemCount?: number;
  /** True while the parent page is still loading */
  loading?: boolean;
}

/**
 * Shared presentational hero for category-detail pages.
 * Full-bleed image with indigo-950 gradient overlay, Playfair Display title.
 * Used by both /categories/[slug] and /category/[slug].
 */
export default function CategoryDetailHero({
  name,
  image,
  itemCount,
  loading = false,
}: CategoryDetailHeroProps) {
  const { t, i18n } = useTranslation();
  const locale = intlLocale(i18n.language);

  return (
    <div className="relative h-64 sm:h-80 md:h-[420px] bg-indigo-950 overflow-hidden">
      {/* Background image */}
      {loading && !image ? (
        <div className="absolute inset-0 animate-pulse bg-indigo-900" />
      ) : image ? (
        <Image
          src={image}
          alt={name}
          fill
          priority
          sizes="100vw"
          className="object-cover transition duration-700"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/images/hero-atelier.jpg';
          }}
        />
      ) : (
        <Image
          src="/images/hero-atelier.jpg"
          alt={name}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-90"
        />
      )}

      {/* Indigo-950 gradient overlay — editorial dark */}
      <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/90 via-indigo-950/30 to-transparent" />

      {/* Amber product count pill — top-end (RTL-aware) */}
      {typeof itemCount === 'number' && itemCount > 0 && (
        <span className="absolute top-4 end-4 sm:top-6 sm:end-6 inline-flex items-center rounded-full bg-amber-500 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-950 shadow-atlas-sm">
          {itemCount.toLocaleString(locale)} {t('category.items', 'قطعة')}
        </span>
      )}

      {/* Category name — bottom-start (RTL-aware) */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="max-w-7xl mx-auto px-6 pb-8 sm:pb-10">
          {loading && !name ? (
            <div className="h-10 w-64 bg-white/20 rounded-2xl animate-pulse" />
          ) : (
            <h1
              className="text-white text-3xl sm:text-4xl md:text-5xl font-bold leading-tight drop-shadow-md"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {name}
            </h1>
          )}
        </div>
      </div>
    </div>
  );
}
