'use client';

import { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useSWRInfinite from 'swr/infinite';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { formatPrice } from '@/utils/formatters';
import '@/i18n/config';
import WishlistButton from '@/components/products/WishlistButton';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeedProduct {
  id: number;
  name: string;
  name_ar?: string | null;
  price: string | number;
  discount_price?: string | number | null;
  has_discount?: boolean;
  main_image?: string | null;
  images?: string[];
  slug?: string | null;
  rating?: number;
  reviews?: number;
  review_count?: number;
  stock_quantity?: number;
}

interface PageData {
  data: FeedProduct[];
  meta?: { last_page?: number; current_page?: number };
  current_page?: number;
  last_page?: number;
}

// ─── Fetcher ─────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://pro.beldify.com';

async function fetcher(url: string): Promise<PageData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  // Normalise Laravel paginator: { data, meta } or flat { data, last_page }
  return {
    data: json.data ?? [],
    meta: json.meta,
    current_page: json.meta?.current_page ?? json.current_page ?? 1,
    last_page: json.meta?.last_page ?? json.last_page ?? 1,
  };
}

// ─── MarketCard ───────────────────────────────────────────────────────────────
// Compact two-column card built for dense feed layout.

interface MarketCardProps {
  product: FeedProduct;
  isArabicScript: boolean;
}

function MarketCard({ product, isArabicScript }: MarketCardProps) {
  const { t } = useTranslation();

  const name = isArabicScript
    ? product.name_ar || product.name
    : product.name;

  const raw = product.has_discount && product.discount_price
    ? product.discount_price
    : product.price;
  const price = Number(raw) || 0;

  const originalPrice =
    product.has_discount && product.discount_price
      ? Number(product.price) || 0
      : null;

  const reviewCount =
    typeof product.review_count === 'number'
      ? product.review_count
      : typeof product.reviews === 'number'
      ? product.reviews
      : 0;

  const imgSrc =
    product.main_image ||
    product.images?.[0] ||
    '/images/category_1_men.png';

  const href = `/products/${product.slug || product.id}`;

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200 shadow-atlas-sm transition-all duration-200 ease-[cubic-bezier(0.33,1,0.68,1)] hover:-translate-y-0.5 hover:shadow-atlas-md">
      <Link
        href={href}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40 focus-visible:ring-offset-2 rounded-2xl"
        aria-label={name}
      >
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-2xl bg-gray-100">
          <Image
            src={imgSrc}
            alt=""
            fill
            sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          {product.has_discount && originalPrice && (
            <span className="absolute top-2 end-2 inline-flex rounded-full bg-rose-700 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm tabular-nums">
              -{Math.round((1 - price / originalPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-2.5">
          <h3 className="text-xs font-medium text-gray-900 line-clamp-2 leading-snug">
            {name}
          </h3>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-indigo-700 tabular-nums">
              <span className="currency-mad">{formatPrice(price)}</span>
            </span>
            {originalPrice && (
              <span className="text-[10px] text-gray-400 line-through tabular-nums">
                {originalPrice.toLocaleString('ar-MA')}
              </span>
            )}
          </div>
          {typeof product.rating === 'number' && product.rating > 0 && (
            <p className="mt-1 text-[10px] text-amber-600 font-medium">
              {'★'.repeat(Math.round(product.rating))} {product.rating.toFixed(1)}
              {reviewCount > 0 && (
                <span className="text-gray-400 ms-1">({reviewCount})</span>
              )}
            </p>
          )}
        </div>
      </Link>
      {/* Wishlist heart — sits outside the Link to prevent nested interactive elements */}
      <div className="absolute top-2 start-2 z-10">
        <WishlistButton
          productId={product.id}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-gray-200 backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-110"
        />
      </div>
    </article>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl bg-white ring-1 ring-gray-100 shadow-atlas-sm">
      <div className="aspect-[3/4] bg-gray-100" />
      <div className="p-2.5 space-y-2">
        <div className="h-3 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-100" />
      </div>
    </div>
  );
}

// ─── DiscoverFeed ─────────────────────────────────────────────────────────────

export default function DiscoverFeed() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isArabicScript = lang.startsWith('ar') || lang === 'ma';

  const sentinelRef = useRef<HTMLDivElement>(null);

  const getKey = useCallback(
    (pageIndex: number, previousPageData: PageData | null) => {
      // If previous page had no data, we've reached the end
      if (previousPageData && previousPageData.data.length === 0) return null;
      // Stop if we've passed the last page
      if (
        previousPageData &&
        previousPageData.last_page !== undefined &&
        pageIndex + 1 > previousPageData.last_page
      ) {
        return null;
      }
      return `${API_BASE}/api/products/all?locale=${i18n.language}&sort=newest&page=${pageIndex + 1}`;
    },
    [i18n.language],
  );

  const { data: pages, size, setSize, isLoading, isValidating } =
    useSWRInfinite<PageData>(getKey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
    });

  // Flatten all products across pages
  const allProducts: FeedProduct[] = pages?.flatMap((p) => p.data) ?? [];

  // Determine if we've reached the last page
  const lastPage = pages?.[pages.length - 1];
  const isReachingEnd =
    lastPage !== undefined &&
    lastPage.data.length === 0;

  const isEmpty = !isLoading && allProducts.length === 0;

  // IntersectionObserver auto-load on sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isValidating && !isReachingEnd) {
          setSize((s) => s + 1);
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isValidating, isReachingEnd, setSize]);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <section
        className="mx-auto max-w-7xl px-4 py-16"
        aria-label={t('discover.sectionLabel', 'Discover more')}
      >
        <div className="rounded-2xl bg-gray-50 ring-1 ring-gray-200 px-6 py-12 text-center">
          <p className="text-sm text-gray-600">
            {t('discover.empty', 'Produits bientôt disponibles.')}
          </p>
          <Link
            href="/products"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors duration-200"
          >
            {t('discover.viewAll', 'Browse all products')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className="mx-auto max-w-7xl px-4 py-16"
      aria-label={t('discover.sectionLabel', 'Discover more')}
    >
      {/* Section header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2
            className="text-3xl font-bold text-gray-900"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('discover.heading', 'More to love')}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('discover.subheading', 'New pieces added daily by Moroccan artisans')}
          </p>
        </div>
        <Link
          href="/products"
          className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 rounded"
        >
          {t('discover.viewAll', 'Browse all products')}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>

      {/* Product grid — 2-col mobile, 3-col tablet, 4-col desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {allProducts.map((product) => (
          <MarketCard
            key={product.id}
            product={product}
            isArabicScript={isArabicScript}
          />
        ))}

        {/* Skeleton cards while loading next page */}
        {isValidating &&
          Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={`skeleton-${size}-${i}`} />
          ))}
      </div>

      {/* IntersectionObserver sentinel */}
      {!isReachingEnd && (
        <div ref={sentinelRef} className="h-px w-full mt-4" aria-hidden="true" />
      )}

      {/* End of feed */}
      {isReachingEnd && allProducts.length > 0 && (
        <p className="mt-8 text-center text-sm text-gray-400">
          {t('discover.endOfFeed', 'You\'ve seen everything — new arrivals added daily')}
        </p>
      )}
    </section>
  );
}
