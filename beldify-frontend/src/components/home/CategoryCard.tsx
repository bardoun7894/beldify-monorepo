'use client';

/**
 * CategoryCard — enriched editorial tile for the Home "Shop the souk" grid.
 *
 * Design spec (Atlas 2.0):
 *  - Two-zone tile: full-bleed image HERO (Playfair title + product count over a
 *    dark scrim) stacked on a white CONTENT FOOTER that surfaces real detail.
 *  - Footer carries subcategory AVATAR chips — a tiny round thumbnail (the
 *    subcategory's own image, letter-fallback when missing) + name + per-sub
 *    item count, each deep-linking to /categories/{slug}. Up to 3 + "+N more".
 *  - Persistent "Shop all {name}" CTA row (legible on white, WCAG-AA contrast)
 *    so every tile reads as a browsable department, not a flat banner.
 *  - Playfair Display for Latin titles; font-arabic / Rubik for Arabic-script.
 *  - Intentional fallback hero: indigo-tinted bg + large initial letter so a
 *    blank card never looks broken.
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
  image?: string;
  itemCount?: number;
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

// Backend serves a shared placeholder for category rows that have no real photo.
// Treat it as "no image" so we render the intentional letter fallback instead of
// a generic grey svg inside the avatar chip.
const isRealImage = (src?: string) =>
  Boolean(src) && !src!.includes('placeholder') && !src!.startsWith('data:');

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

  const subName = (sub: SubCategory) =>
    isArabicScript ? sub.name_ar || sub.name_en : sub.name_en || sub.name_ar || '';

  return (
    <Link
      href={href}
      aria-label={t('home.categories.shop_all', 'Shop all {{name}}', { name: displayName })}
      className={[
        'group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white',
        'ring-1 ring-gray-200 shadow-atlas-sm',
        'transition-all duration-300 hover:-translate-y-1 hover:shadow-atlas-md hover:ring-indigo-700/30',
        'focus:outline-none focus:ring-2 focus:ring-indigo-700/40 focus:ring-offset-2',
      ].join(' ')}
    >
      {/* ── HERO zone (image + title overlay) ─────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: featured ? '16 / 10' : '4 / 3' }}
      >
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

        {/* Gradient scrim (image only) so the title stays legible */}
        {hasImage && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        )}

        {/* Title + product count overlay */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4">
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
              fontSize: featured ? '1.75rem' : '1.125rem',
              textShadow: hasImage ? '0 1px 12px rgba(0,0,0,0.6)' : 'none',
            }}
          >
            {displayName}
          </h3>

          {typeof itemCount === 'number' && itemCount > 0 && (
            <p
              className={[
                'inline-flex items-center gap-1.5 text-xs font-medium leading-none',
                hasImage ? 'text-white/85' : 'text-gray-600',
              ].join(' ')}
            >
              <Package className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
              {t('home.categories.products_count', '{{count}} products', { count: itemCount })}
            </p>
          )}
        </div>

        {/* Hover arrow affordance */}
        <span
          className={[
            'absolute top-3 end-3 grid place-items-center h-8 w-8 rounded-full',
            'opacity-0 translate-y-1 transition-all duration-300',
            'group-hover:opacity-100 group-hover:translate-y-0',
            'bg-white/95 text-indigo-700 shadow-atlas-sm',
          ].join(' ')}
          aria-hidden="true"
        >
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </span>
      </div>

      {/* ── CONTENT footer (white) ────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Subcategory avatar chips — real image + name + per-sub item count */}
        {visibleSubs.length > 0 && (
          <ul
            className="flex flex-wrap gap-1.5"
            aria-label={t('home.categories.sub_chips_label', 'Sub-categories')}
          >
            {visibleSubs.map((sub) => {
              const label = subName(sub);
              const subHref = `/categories/${sub.slug || sub.id}`;
              const subHasImage = isRealImage(sub.image);
              return (
                <li key={sub.id}>
                  <Link
                    href={subHref}
                    onClick={(e) => e.stopPropagation()}
                    className={[
                      'inline-flex items-center gap-1.5 rounded-full ps-1 pe-2.5 py-1',
                      'bg-gray-50 ring-1 ring-gray-200 transition-colors duration-150',
                      'hover:bg-indigo-50 hover:ring-indigo-200',
                    ].join(' ')}
                  >
                    <span className="relative grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-full bg-indigo-100">
                      {subHasImage ? (
                        <Image
                          src={sub.image as string}
                          alt=""
                          fill
                          sizes="20px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-indigo-700/70" aria-hidden="true">
                          {label.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span
                      dir={isArabicScript ? 'rtl' : 'ltr'}
                      className={[
                        'max-w-[7.5rem] truncate text-[11px] font-medium text-gray-700',
                        isArabicScript ? 'font-arabic' : '',
                      ].join(' ')}
                    >
                      {label}
                    </span>
                    {typeof sub.itemCount === 'number' && sub.itemCount > 0 && (
                      <span className="text-[10px] font-medium tabular-nums text-gray-500">
                        {sub.itemCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
            {hiddenCount > 0 && (
              <li>
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700 ring-1 ring-indigo-100">
                  {t('home.categories.sub_chips_more', '+{{n}} more', { n: hiddenCount })}
                </span>
              </li>
            )}
          </ul>
        )}

        {/* Shop-all CTA — pinned to the bottom so footers align across the row */}
        <span
          className={[
            'mt-auto inline-flex items-center gap-1 text-sm font-semibold text-indigo-700',
            'transition-colors duration-200 group-hover:text-indigo-800',
            visibleSubs.length > 0 ? 'border-t border-gray-100 pt-3' : '',
          ].join(' ')}
        >
          {t('home.categories.shop_all', 'Shop all {{name}}', { name: displayName })}
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
