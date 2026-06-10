'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Flame, RefreshCw } from 'lucide-react';
import '@/i18n/config';
import { megaOfferService, MegaOfferCollection } from '@/services/megaOfferService';
import MegaOfferProductCard from '@/components/products/MegaOfferProductCard';

const getDaysRemaining = (endDate: string): number => {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

function CollectionSkeleton() {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-atlas-sm p-5 animate-pulse">
      <div className="h-6 w-1/3 bg-gray-100 rounded mb-2" />
      <div className="h-4 w-1/2 bg-gray-100 rounded mb-5" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function MegaOffersPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'ma';
  const [collections, setCollections] = useState<MegaOfferCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await megaOfferService.getMegaOffers();
      setCollections(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="min-h-screen bg-[#fcfcfc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav aria-label={t('nav.breadcrumb', 'Breadcrumb')} className="text-sm text-gray-500 mb-3">
            <Link href="/" className="hover:text-[hsl(var(--primary))] transition-colors">
              {t('nav.home', 'Home')}
            </Link>
            <span className="mx-2 text-gray-500" aria-hidden="true">/</span>
            <span className="text-gray-900 font-medium">{t('megaOffers.pageTitle', 'Mega Offers')}</span>
          </nav>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--secondary)/0.15)]">
              <Flame className="h-5 w-5 text-[hsl(var(--secondary))]" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {t('megaOffers.pageTitle', 'Mega Offers')}
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">
                {t('megaOffers.pageSubtitle', 'Limited-time collections with deep discounts')}
              </p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-6" aria-busy="true">
            <CollectionSkeleton />
            <CollectionSkeleton />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl bg-white ring-1 ring-gray-200 px-6 py-16 text-center shadow-atlas-sm">
            <p className="text-gray-700 font-medium mb-4">
              {t('megaOffers.loadError', 'We could not load the offers. Please try again.')}
            </p>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 min-h-[44px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {t('common.retry', 'Retry')}
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && collections.length === 0 && (
          <div className="rounded-2xl bg-white ring-1 ring-gray-200 px-6 py-16 text-center shadow-atlas-sm">
            <p className="text-gray-700 font-medium mb-1">
              {t('megaOffers.emptyTitle', 'No active offers right now')}
            </p>
            <p className="text-sm text-gray-500 mb-5">
              {t('megaOffers.emptySubtitle', 'New collections drop regularly — check back soon.')}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 min-h-[44px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
            >
              {t('common.browse_products', 'Browse all products')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </div>
        )}

        {/* Collections */}
        {!loading && !error && collections.length > 0 && (
          <div className="space-y-8">
            {collections.map((collection) => {
              const daysLeft = getDaysRemaining(collection.end_date);
              return (
                <section
                  key={collection.id}
                  aria-labelledby={`collection-${collection.id}`}
                  className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-atlas-sm overflow-hidden"
                >
                  <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 id={`collection-${collection.id}`} className="text-lg font-bold text-gray-900">
                        {collection.title}
                      </h2>
                      {collection.description && (
                        <p className="text-sm text-gray-600 mt-0.5">{collection.description}</p>
                      )}
                    </div>
                    {daysLeft > 0 && (
                      <span className="text-xs font-medium text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] px-2.5 py-1 rounded-full">
                        {daysLeft} {t('megaOffers.daysLeft', 'days left')}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {collection.featured_products?.slice(0, 8).map((product) => (
                        <MegaOfferProductCard key={product.id} product={product} locale={locale} />
                      ))}
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-100 text-end">
                      <Link
                        href={`/mega-offers/${collection.slug}?locale=${locale}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[hsl(var(--primary))] hover:opacity-90 rounded-xl transition-all duration-200 shadow-atlas-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                      >
                        {t('megaOffers.viewCollection', 'View Collection')}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
