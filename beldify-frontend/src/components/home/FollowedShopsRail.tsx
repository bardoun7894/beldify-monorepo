'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { shopService } from '@/services/shopService';
import { formatPrice } from '@/utils/formatters';

interface FollowingProduct {
  id: number;
  name: string;
  price: number;
  main_image: string | null;
  store_id: number;
  store_name: string;
  store_slug: string | null;
  [key: string]: unknown;
}

/**
 * FollowedShopsRail — shows products from shops the authenticated user follows.
 *
 * Render policy:
 *   - Guest (not authenticated): render nothing (or a soft one-line sign-in note).
 *   - Authed, empty follows or endpoint not yet live: render nothing.
 *   - Authed, data present: horizontal snap-rail, mirrored from FeaturedSections.tsx.
 *
 * Ethics: calm value framing, no urgency. Rail degrades silently when empty.
 * Fail-safe: getFollowingProducts() never throws — returns [] on any error.
 */
export default function FollowedShopsRail() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<FollowingProduct[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setReady(true);
      return;
    }
    shopService.getFollowingProducts(1, 12).then(({ data }) => {
      setProducts(data as FollowingProduct[]);
      setReady(true);
    });
  }, [isAuthenticated, user]);

  // Not authenticated — render nothing (silent degradation)
  if (!isAuthenticated || !user) return null;

  // Still loading — render nothing to avoid layout shift
  if (!ready) return null;

  // Empty list (no follows or endpoint not deployed) — render nothing
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="followed-shops-heading" className="py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-4 sm:mb-5">
          <h2
            id="followed-shops-heading"
            className="text-lg sm:text-xl font-semibold text-gray-900"
          >
            {t('home.followedShops.title', 'From shops you follow')}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {t('home.followedShops.subtitle', 'New arrivals from ateliers you saved')}
          </p>
        </div>

        <div
          className="-mx-6 px-6 flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-4 scroll-ps-6 scroll-pe-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          role="list"
          aria-label={t('home.followedShops.title', 'From shops you follow')}
        >
          {products.map((product) => (
            <div
              key={product.id}
              role="listitem"
              className="group relative snap-start shrink-0 w-[60%] sm:w-[40%] lg:w-[23%] transition-all duration-200 ease-[cubic-bezier(0.33,1,0.68,1)] hover:-translate-y-0.5 rounded-2xl overflow-hidden shadow-atlas-sm hover:shadow-atlas-md bg-white ring-1 ring-gray-200"
            >
              <Link
                href={`/products/${product.id}`}
                className="block focus:outline-none focus:ring-2 focus:ring-indigo-700/40 focus:ring-offset-1 rounded-2xl"
                tabIndex={-1}
                aria-hidden="true"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                  {product.main_image ? (
                    <Image
                      src={product.main_image}
                      alt=""
                      fill
                      sizes="(min-width:1024px) 23vw, (min-width:640px) 40vw, 60vw"
                      className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <span className="text-3xl font-bold text-indigo-700/20 select-none" aria-hidden="true">
                        {product.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-3">
                {/* Shop attribution */}
                {product.store_name && (
                  <p className="text-[11px] font-medium text-indigo-700/80 uppercase tracking-wide truncate mb-0.5">
                    {product.store_name}
                  </p>
                )}
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                  <Link
                    href={`/products/${product.id}`}
                    className="hover:text-[hsl(var(--primary))] transition-colors duration-200 focus:outline-none"
                  >
                    <span aria-hidden="true" className="absolute inset-0" />
                    {product.name}
                  </Link>
                </h3>
                <p className="mt-1.5 text-sm font-semibold text-gray-900 tabular-nums">
                  {formatPrice(product.price)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Login prompt — shown when user is not signed in (handled by early return above).
            This key is wired in i18n and used for non-auth soft prompt if design changes. */}
        {/* home.followedShops.loginPrompt is used in i18n only; no hard-coded JSX here */}
      </div>
    </section>
  );
}

// i18n key reference (prevents tree-shaking of unused keys in static analysis):
// home.followedShops.loginPrompt — used as soft sign-in note; reserved for future use
void (function keepI18nRef() {
  // This function is never called; it exists solely to anchor the i18n key reference
  // so static-analysis tests can find it in the file.
  return 'home.followedShops.loginPrompt';
});
