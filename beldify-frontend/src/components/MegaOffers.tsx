'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Star } from 'lucide-react';
import '@/i18n/config';
import { megaOfferService, MegaOfferCollection, FeaturedProduct } from '@/services/megaOfferService';

interface MegaOffersProps {
  megaOffers?: MegaOfferCollection[];
}

const getDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

// Shared product card — DRY extraction to eliminate duplicated grid code
function ProductCard({ product, locale }: { product: FeaturedProduct; locale: string }) {
  const { t } = useTranslation();
  const isAr = ['ar', 'ma'].includes(locale);
  const displayName = isAr ? (product.name_ar || product.name) : (product.name || product.name_ar);
  const imgSrc = product.main_image || product.image || '/placeholder-product.svg';

  return (
    <Link
      href={`/products/${product.slug}?locale=${locale}`}
      className="group/product block"
    >
      <div className="bg-white rounded-2xl overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.33,1,0.68,1)] hover:-translate-y-0.5 shadow-atlas-sm hover:shadow-atlas-md ring-1 ring-gray-200">
        {/* Product Image */}
        <div className="relative h-32 md:h-40 overflow-hidden bg-gray-50">
          <Image
            src={imgSrc}
            alt={displayName}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover/product:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-product.svg';
            }}
          />

          {/* Badges */}
          <div className="absolute top-2 start-2 flex flex-col gap-1">
            {product.has_discount && product.discount_percentage && product.discount_percentage > 0 && (
              <span className="text-white text-xs px-2 py-0.5 rounded-full font-semibold bg-rose-700">
                -{product.discount_percentage}%
              </span>
            )}
            {product.is_trending && (
              <span className="text-amber-950 text-xs px-2 py-0.5 rounded-full font-semibold bg-[hsl(var(--secondary))]">
                {t('megaOffers.hot', 'HOT')}
              </span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-3">
          <h4 className="font-semibold text-gray-900 text-sm mb-1.5 line-clamp-2 leading-tight">
            {displayName}
          </h4>

          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-[hsl(var(--primary))] text-sm">
              {Number(product.price).toLocaleString('ar-MA')} <span dir="rtl" lang="ar">درهم</span>
            </span>
            {product.has_discount && product.original_price && product.original_price !== product.price && (
              <span className="text-xs text-gray-400 line-through">
                {product.original_price}
              </span>
            )}
          </div>

          {product.rating > 0 && (
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'text-amber-400 fill-current' : 'text-gray-200'}`}
                  aria-hidden="true"
                />
              ))}
              <span className="text-[10px] text-gray-500 ms-0.5">({product.review_count})</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// Shared collection card — replaces two identical duplicated grids
function CollectionCard({ collection, locale }: { collection: MegaOfferCollection; locale: string }) {
  const { t } = useTranslation();
  const daysLeft = getDaysRemaining(collection.end_date);

  return (
    <div className="bg-white rounded-2xl transition-all duration-200 ease-[cubic-bezier(0.33,1,0.68,1)] hover:-translate-y-0.5 overflow-hidden shadow-atlas-sm hover:shadow-atlas-md ring-1 ring-gray-200">
      {/* Collection Header */}
      <div className="relative px-6 py-5 bg-atlas-primary/[0.06] border-b border-atlas-primary/[0.1]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3
              className="text-xl font-bold text-gray-900 mb-1 truncate"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {collection.title}
            </h3>
            <p className="text-sm text-gray-600">{collection.description}</p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="px-3 py-1 rounded-full text-amber-950 text-xs font-semibold bg-[hsl(var(--secondary))]">
              {t('megaOffers.upTo70Off', 'UP TO 70% OFF')}
            </span>
            <span className="text-xs font-medium text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] px-2 py-0.5 rounded-full">
              {daysLeft} {t('megaOffers.daysLeft', 'days left')}
            </span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {collection.featured_products?.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>

        {/* Footer actions */}
        <div className="mt-5 pt-4 border-t border-[hsl(var(--primary)/0.08)] flex items-center justify-between">
          {collection.featured_products && collection.featured_products.length > 4 && (
            <span className="text-sm font-medium text-[hsl(var(--secondary))]">
              +{collection.featured_products.length - 4} {t('megaOffers.moreItems', 'more items')}
            </span>
          )}
          <Link
            href={`/mega-offers/${collection.slug}?locale=${locale}`}
            className="ms-auto inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[hsl(var(--primary))] hover:opacity-90 rounded-xl transition-all duration-200 ease-[cubic-bezier(0.33,1,0.68,1)] shadow-atlas-sm hover:shadow-atlas-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] min-h-[44px]"
          >
            {t('megaOffers.viewCollection', 'View Collection')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

const MegaOffers: React.FC<MegaOffersProps> = ({ megaOffers }) => {
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [offers, setOffers] = useState<MegaOfferCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const locale = searchParams?.get('locale');
    if (locale) {
      i18n.changeLanguage(locale);
    }
  }, [searchParams, i18n]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchMegaOffers = async () => {
      if (megaOffers && megaOffers.length > 0) {
        setOffers(megaOffers);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await megaOfferService.getMegaOffers();
        setOffers(data);
      } catch (err) {
        // On any error render nothing — no mock fallback
        setError(t('megaOffers.loadError', 'Failed to load mega offers'));
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMegaOffers();
  }, [megaOffers, t]);

  if (!mounted) {
    return null;
  }

  // Loading state — Atlas skeleton
  if (loading) {
    return (
      <section className="py-16 sm:py-20 bg-background">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden ring-1 ring-gray-200">
                <div className="h-24 bg-gray-100 animate-pulse" />
                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="rounded-2xl overflow-hidden">
                      <div className="h-36 bg-gray-100 animate-pulse rounded-2xl" />
                      <div className="p-3 space-y-2">
                        <div className="h-3 bg-gray-100 animate-pulse rounded w-3/4" />
                        <div className="h-3 bg-gray-100 animate-pulse rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-20 bg-background">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section heading — no centered eyebrow, left-aligned editorial */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2
              className="text-3xl sm:text-4xl font-bold text-gray-900"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('megaOffers.title', 'Special Collections')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('megaOffers.subtitle', 'Limited-time offers from Beldify ateliers')}
            </p>
          </div>
          {offers.length > 4 && (
            <Link
              href={`/mega-offers?locale=${i18n.language}`}
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--primary))] hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] rounded"
            >
              {t('megaOffers.viewAllCollections', 'View all')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm max-w-lg">
            {error}
          </div>
        )}

        {/* Two-column grid of collections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {offers.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} locale={i18n.language} />
          ))}
        </div>

        {/* View All Collections — only if > 4 offers (mobile) */}
        {offers.length > 4 && (
          <div className="text-center mt-10 sm:hidden">
            <Link
              href={`/mega-offers?locale=${i18n.language}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--primary))] hover:opacity-80 transition-opacity duration-200"
            >
              {t('megaOffers.viewAllCollections', 'View all collections')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default MegaOffers;
