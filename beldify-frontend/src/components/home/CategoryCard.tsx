'use client';

/**
 * CategoryCard — enriched editorial tile for the Home "Shop the souk" grid.
 *
 * Design spec (Atlas 2.0):
 *  - Playfair Display for Latin titles; font-arabic / Rubik for Arabic-script.
 *  - Full-bleed next/image + from-black/85 gradient scrim when image present.
 *  - Intentional fallback tile: indigo-tinted bg + large initial letter so a
 *    blank card never looks broken.
 *  - Prominent product count below the title.
 *  - Up to 3 subcategory quick-chips that deep-link to /categories/{slug}.
 *    "+N more" indicator when the list is truncated.
 *  - Atlas tokens: indigo-700, amber-500, shadow-atlas-sm/md, rounded-2xl.
 *  - RTL: logical properties only (ps-/pe-/start-/end-). Never pl-/pr-/left-/right-.
 *  - Hover: -translate-y-1 lift + shadow-atlas-md, image scale-110.
 *  - Focus ring for keyboard navigation.
 */

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type SubCategory = {
  id: number;
  name_en: string;
  name_ar?: string;
  slug?: string;
};

type CategoryCardProps = {
  id: number;
  name_en: string;
  name_ar?: string;
  image: string;
  slug?: string;
  itemCount?: number;
  sub_categories?: SubCategory[];
  subCategories?: SubCategory[];
  subcategories?: SubCategory[];
  featured?: boolean;
  isArabicScript?: boolean;
  imgFailed?: boolean;
  onImageError?: (id: number) => void;
};

export default function CategoryCard({
  id,
  name_en,
  name_ar,
  image,
  slug,
  itemCount,
  sub_categories,
  subCategories,
  subcategories,
  featured = false,
  isArabicScript = false,
  imgFailed = false,
  onImageError,
}: CategoryCardProps) {
  const { t } = useTranslation();

  const displayName = isArabicScript ? name_ar || name_en : name_en || name_ar || '';
  const initial = displayName.charAt(0).toUpperCase();
  const href = `/categories/${slug || id}`;

  // Normalise sub_categories from all three possible field shapes the API may
  // return (snake_case from backend, camelCase from some transformations).
  const subs: SubCategory[] = sub_categories ?? subCategories ?? subcategories ?? [];
  const visibleSubs = subs.slice(0, 3);
  const hiddenCount = subs.length - visibleSubs.length;

  const hasImage = !imgFailed && Boolean(image);

  return (
    <Link
      href={href}
      aria-label={displayName}
      className={[
        'group relative flex flex-col overflow-hidden rounded-2xl',
        'ring-1 ring-gray-200 shadow-atlas-sm',
        'transition-all duration-300 hover:-translate-y-1 hover:shadow-atlas-md',
        'focus:outline-none focus:ring-2 focus:ring-indigo-700/40 focus:ring-offset-2',
        hasImage ? 'bg-white' : 'bg-indigo-50',
      ].join(' ')}
      style={{ aspectRatio: featured ? '8/5' : '4/5' }}
    >
      {/* ── Image layer ──────────────────────────────────────────────────── */}
      {hasImage ? (
        <Image
          src={image}
          alt=""
          fill
          sizes={
            featured
              ? '(min-width:1024px) 50vw, (min-width:640px) 66vw, 100vw'
              : '(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw'
          }
          className="object-cover transition duration-500 ease-out group-hover:scale-110"
          onError={() => onImageError?.(id)}
        />
      ) : (
        /* Intentional Atlas-tinted fallback — never a blank broken box */
        <div className="absolute inset-0 flex items-center justify-center bg-indigo-50">
          <span
            className="select-none text-7xl font-bold text-indigo-700/20"
            aria-hidden="true"
          >
            {initial}
          </span>
        </div>
      )}

      {/* ── Gradient scrim (image only) ───────────────────────────────── */}
      {hasImage && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      )}

      {/* ── Content overlay ──────────────────────────────────────────────── */}
      <div
        className={[
          'absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4',
          featured ? 'sm:p-5' : '',
        ].join(' ')}
      >
        {/* Category title */}
        <h3
          dir={isArabicScript ? 'rtl' : 'ltr'}
          className={[
            'font-semibold leading-tight',
            hasImage ? 'text-white' : 'text-gray-900',
            isArabicScript ? 'font-arabic' : '',
          ].join(' ')}
          style={{
            fontFamily: isArabicScript
              ? undefined
              : '"Playfair Display", ui-serif, Georgia, serif',
            fontSize: featured ? '1.625rem' : '1.0625rem',
            textShadow: hasImage ? '0 1px 10px rgba(0,0,0,0.6)' : 'none',
          }}
        >
          {displayName}
        </h3>

        {/* Product count — prominent, below the title */}
        {typeof itemCount === 'number' && itemCount > 0 && (
          <p
            className={[
              'inline-flex items-center gap-1 text-[11px] font-medium leading-none',
              hasImage ? 'text-white/80' : 'text-gray-600',
            ].join(' ')}
          >
            <Package className="h-3 w-3 shrink-0 text-amber-500" aria-hidden="true" />
            {t('home.categories.products_count', '{{count}} products', { count: itemCount })}
          </p>
        )}

        {/* Subcategory quick-chips */}
        {visibleSubs.length > 0 && (
          <div
            className="flex flex-wrap gap-1 mt-0.5"
            aria-label={t('home.categories.sub_chips_label', 'Sub-categories')}
          >
            {visibleSubs.map((sub) => {
              const subName = isArabicScript
                ? sub.name_ar || sub.name_en
                : sub.name_en || sub.name_ar || '';
              const subHref = `/categories/${sub.slug || sub.id}`;
              return (
                <Link
                  key={sub.id}
                  href={subHref}
                  onClick={(e) => e.stopPropagation()}
                  className={[
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                    'transition-colors duration-150',
                    hasImage
                      ? 'bg-white/20 text-white ring-1 ring-white/30 hover:bg-white/35'
                      : 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-200',
                  ].join(' ')}
                >
                  {subName}
                </Link>
              );
            })}
            {hiddenCount > 0 && (
              <span
                className={[
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                  hasImage
                    ? 'bg-white/10 text-white/70 ring-1 ring-white/20'
                    : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
                ].join(' ')}
              >
                {t('home.categories.sub_chips_more', '+{{n}} more', { n: hiddenCount })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Hover arrow affordance ────────────────────────────────────────── */}
      <span
        className={[
          'absolute top-3 end-3 grid place-items-center h-8 w-8 rounded-full',
          'opacity-0 translate-y-1 transition-all duration-300',
          'group-hover:opacity-100 group-hover:translate-y-0',
          hasImage
            ? 'bg-white/0 text-white group-hover:bg-white/95 group-hover:text-indigo-700'
            : 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100',
        ].join(' ')}
        aria-hidden="true"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
      </span>
    </Link>
  );
}
