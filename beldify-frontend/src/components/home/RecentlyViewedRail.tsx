'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { getRecentlyViewed, type RecentlyViewedItem } from '@/utils/recentlyViewed';
import { formatPrice } from '@/utils/formatters';

/**
 * RecentlyViewedRail — FE-only, localStorage-backed shelf.
 *
 * Reads viewed products on mount. Renders nothing when the list is empty
 * (no layout shift, no nag). Snap-rail markup mirrors FeaturedSections.tsx.
 * Ethics: calm descriptive heading, no urgency copy.
 */
export default function RecentlyViewedRail() {
  const { t } = useTranslation();
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    setItems(getRecentlyViewed());
  }, []);

  // Silent degradation — render nothing when list is empty
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed-heading" className="py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-4 sm:mb-5">
          <h2
            id="recently-viewed-heading"
            className="text-lg sm:text-xl font-semibold text-gray-900"
          >
            {t('home.recentlyViewed.title', 'Recently viewed')}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {t('home.recentlyViewed.subtitle', 'Items you looked at')}
          </p>
        </div>

        <div
          className="-mx-6 px-6 flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-4 scroll-ps-6 scroll-pe-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          role="list"
          aria-label={t('home.recentlyViewed.title', 'Recently viewed')}
        >
          {items.map((item) => (
            <div
              key={item.id}
              role="listitem"
              className="group relative snap-start shrink-0 w-[60%] sm:w-[40%] lg:w-[23%] transition-all duration-200 ease-[cubic-bezier(0.33,1,0.68,1)] hover:-translate-y-0.5 rounded-2xl overflow-hidden shadow-atlas-sm hover:shadow-atlas-md bg-white ring-1 ring-gray-200"
            >
              <Link
                href={`/products/${item.id}`}
                className="block focus:outline-none focus:ring-2 focus:ring-indigo-700/40 focus:ring-offset-1 rounded-2xl"
                tabIndex={-1}
                aria-hidden="true"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(min-width:1024px) 23vw, (min-width:640px) 40vw, 60vw"
                      className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <span className="text-3xl font-bold text-indigo-700/20 select-none" aria-hidden="true">
                        {item.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                  <Link
                    href={`/products/${item.id}`}
                    className="hover:text-[hsl(var(--primary))] transition-colors duration-200 focus:outline-none"
                  >
                    <span aria-hidden="true" className="absolute inset-0" />
                    {item.name}
                  </Link>
                </h3>
                <p className="mt-1.5 text-sm font-semibold text-gray-900 tabular-nums">
                  {formatPrice(item.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
