'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import '@/i18n/config';
import { megaOfferService, MegaOfferCollection } from '@/services/megaOfferService';
import MegaOfferProductCard from '@/components/products/MegaOfferProductCard';

const getDaysRemaining = (endDate: string): number => {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export default function MegaOfferCollectionPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'ma';

  const [collection, setCollection] = useState<MegaOfferCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(false);
    try {
      const collections = await megaOfferService.getMegaOffers();
      setCollection(collections.find((c) => c.slug === slug) ?? null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const daysLeft = collection ? getDaysRemaining(collection.end_date) : 0;

  return (
    <main className="min-h-screen bg-[#fcfcfc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav aria-label={t('nav.breadcrumb', 'Breadcrumb')} className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-[hsl(var(--primary))] transition-colors">
            {t('nav.home', 'Home')}
          </Link>
          <span className="mx-2 text-gray-500" aria-hidden="true">/</span>
          <Link href="/mega-offers" className="hover:text-[hsl(var(--primary))] transition-colors">
            {t('megaOffers.pageTitle', 'Mega Offers')}
          </Link>
          {collection && (
            <>
              <span className="mx-2 text-gray-500" aria-hidden="true">/</span>
              <span className="text-gray-900 font-medium">{collection.title}</span>
            </>
          )}
        </nav>

        {loading && (
          <div className="animate-pulse" aria-busy="true">
            <div className="h-8 w-1/3 bg-gray-100 rounded mb-3" />
            <div className="h-4 w-1/2 bg-gray-100 rounded mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-100 rounded-2xl" />
              ))}
            </div>
          </div>
        )}

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

        {!loading && !error && !collection && (
          <div className="rounded-2xl bg-white ring-1 ring-gray-200 px-6 py-16 text-center shadow-atlas-sm">
            <p className="text-gray-700 font-medium mb-1">
              {t('megaOffers.notFoundTitle', 'This collection has ended')}
            </p>
            <p className="text-sm text-gray-500 mb-5">
              {t('megaOffers.notFoundSubtitle', 'It may have expired — explore the current offers instead.')}
            </p>
            <Link
              href="/mega-offers"
              className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 min-h-[44px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              {t('megaOffers.backToOffers', 'Back to offers')}
            </Link>
          </div>
        )}

        {!loading && !error && collection && (
          <>
            <header className="mb-8">
              {collection.banner_image && (
                <div className="relative h-40 md:h-56 rounded-2xl overflow-hidden mb-5 bg-gray-100">
                  <Image
                    src={collection.banner_image}
                    alt={collection.title}
                    fill
                    sizes="(max-width: 1280px) 100vw, 1280px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{collection.title}</h1>
                  {collection.description && (
                    <p className="text-sm text-gray-600 mt-1">{collection.description}</p>
                  )}
                </div>
                {daysLeft > 0 && (
                  <span className="text-xs font-medium text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] px-2.5 py-1 rounded-full">
                    {daysLeft} {t('megaOffers.daysLeft', 'days left')}
                  </span>
                )}
              </div>
            </header>

            {collection.featured_products?.length ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {collection.featured_products.map((product) => (
                  <MegaOfferProductCard key={product.id} product={product} locale={locale} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white ring-1 ring-gray-200 px-6 py-12 text-center shadow-atlas-sm">
                <p className="text-sm text-gray-600">
                  {t('megaOffers.collectionEmpty', 'No products in this collection yet.')}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
