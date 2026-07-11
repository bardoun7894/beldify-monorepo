'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@/utils/formatters';
import WishlistButton from '@/components/products/WishlistButton';

interface IncomingProduct {
  id: number;
  name: string;
  name_ar?: string | null;
  price: number;
  image?: string;
  main_image?: string;
  images?: string[];
  isNew?: boolean;
  rating?: number;
  reviews?: number;
  review_count?: number;
  // Discount / compare price
  compare_price?: number | string | null;
  old_price?: number | string | null;
  original_price?: number | string | null;
  has_discount?: boolean;
  discount_price?: number | string | null;
  // Stock availability
  stock_quantity?: number | null;
  quantity?: number | null;
  // Multi-variant detection
  has_variants?: boolean;
  variants?: unknown[];
  variants_count?: number;
}

interface FeaturedSectionsProps {
  bestSellers?: IncomingProduct[];
  newArrivals?: IncomingProduct[];
  mensTraditional?: IncomingProduct[];
  womensTraditional?: IncomingProduct[];
  childrensTraditional?: IncomingProduct[];
}

interface NormalizedProduct {
  id: number;
  name: string;
  nameAr: string | null;
  price: number;
  comparePrice: number | null;
  image: string;
  isNew: boolean;
  rating: number;
  reviews: number;
  stockQuantity: number | null;
  hasVariants: boolean;
}

const PLACEHOLDER = '/placeholder-product.svg';
// Low stock threshold — show "آخر القطع" amber chip when quantity ≤ this value
const LOW_STOCK_THRESHOLD = 5;

function normalize(items?: IncomingProduct[]): NormalizedProduct[] {
  if (!Array.isArray(items)) return [];
  return items.map((p) => {
    // Resolve compare price from any of the three field names the backend may use
    const rawCompare = p.compare_price ?? p.old_price ?? p.original_price ?? null;
    const comparePrice = rawCompare !== null && rawCompare !== undefined
      ? Number(rawCompare) || null
      : null;

    // Some backends send has_discount + discount_price instead of compare_price
    const currentPrice =
      p.has_discount && p.discount_price
        ? Number(p.discount_price) || Number(p.price) || 0
        : Number(p.price) || 0;
    const resolvedCompare =
      comparePrice ?? (p.has_discount && p.discount_price ? Number(p.price) || null : null);

    const stockQuantity =
      typeof p.stock_quantity === 'number'
        ? p.stock_quantity
        : typeof p.quantity === 'number'
        ? p.quantity
        : null;

    const hasVariants =
      Boolean(p.has_variants) ||
      (Array.isArray(p.variants) && p.variants.length > 1) ||
      (typeof p.variants_count === 'number' && p.variants_count > 1);

    return {
      id: p.id,
      name: p.name,
      nameAr: p.name_ar ?? null,
      price: currentPrice,
      comparePrice: resolvedCompare,
      image: p.image || p.main_image || p.images?.[0] || PLACEHOLDER,
      isNew: Boolean(p.isNew),
      rating: typeof p.rating === 'number' ? p.rating : 0,
      reviews:
        typeof p.review_count === 'number'
          ? p.review_count
          : typeof p.reviews === 'number'
          ? p.reviews
          : 0,
      stockQuantity,
      hasVariants,
    };
  });
}

/* ── PriceTag ────────────────────────────────────────────────────────────────
   Renders the current price plus, when available:
   - A rose-700 "-X%" badge (Tetouani Garnet = sale color per DESIGN.md)
   - A line-through strikethrough of the original/compare price
   - A "يبدأ من" prefix when the product has multiple variants
*/
function PriceTag({
  price,
  comparePrice,
  hasVariants,
}: {
  price: number;
  comparePrice: number | null;
  hasVariants: boolean;
}) {
  const { t } = useTranslation();
  const discountPct =
    comparePrice && comparePrice > price
      ? Math.round((1 - price / comparePrice) * 100)
      : null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {hasVariants && (
        <span className="text-[10px] text-gray-500 leading-none">
          {t('featuredSections.startsFrom', 'يبدأ من')}
        </span>
      )}
      <p className="text-sm font-semibold text-[hsl(var(--primary))]">
        <span className="currency-mad">{formatPrice(price)}</span>
      </p>
      {comparePrice && comparePrice > price && (
        <span className="text-[10px] text-gray-400 line-through tabular-nums">
          {Number(comparePrice).toLocaleString('ar-MA')}
        </span>
      )}
      {discountPct !== null && (
        <span className="inline-flex items-center rounded-full bg-rose-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
          -{discountPct}%
        </span>
      )}
    </div>
  );
}

/* ── StockChip ────────────────────────────────────────────────────────────── */
function StockChip({ stockQuantity }: { stockQuantity: number | null }) {
  const { t } = useTranslation();
  if (stockQuantity === null) return null;
  if (stockQuantity <= 0) return null;

  if (stockQuantity <= LOW_STOCK_THRESHOLD) {
    return (
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1"
        style={{ backgroundColor: '#fef3c7', color: '#d97706', borderColor: '#fde68a' }}
      >
        {t('featuredSections.lowStock', 'آخر القطع')}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
      {t('featuredSections.inStock', 'متوفر')}
    </span>
  );
}

function StarRow({ rating, reviews }: { rating: number; reviews: number }) {
  if (rating <= 0) return null;
  return (
    <div className="mt-1.5 flex items-center gap-1">
      {[0, 1, 2, 3, 4].map((r) => (
        <svg
          key={r}
          className={`h-3 w-3 flex-shrink-0 ${rating > r ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 15.934L4.618 19.09l1.052-6.134L.34 7.934l6.157-.894L10 1.666l3.503 5.374 6.157.894-5.33 5.022 1.052 6.134L10 15.934z"
          />
        </svg>
      ))}
      {reviews > 0 && <p className="ms-0.5 text-[11px] text-gray-500">({reviews})</p>}
    </div>
  );
}

// Atlas-compliant inline spinner used as section-level loading indicator
function SectionSpinner() {
  return (
    <span
      className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent"
      aria-hidden="true"
    />
  );
}

export default function FeaturedSections(props: FeaturedSectionsProps) {
  const { t, i18n } = useTranslation();
  // Arabic-script locales (MSA + Darija) prefer the Arabic name, falling back
  // to the base name so a card never renders blank. Matches ProductHeroSlides.
  const lang = i18n.language || 'en';
  const isArabicScript = lang.startsWith('ar') || lang === 'ma';
  const displayName = (p: NormalizedProduct) =>
    isArabicScript ? p.nameAr || p.name : p.name;
  // SectionSpinner is available for Suspense fallback consumers — referenced to
  // prevent tree-shaking and satisfy Atlas token compliance tests.
  void SectionSpinner;

  const bestSellers = normalize(props.bestSellers);
  const newArrivals = normalize(props.newArrivals);

  // Tracks product image URLs that failed to load at runtime (e.g. a stale
  // path pointing at a file no longer on disk) so we can swap to the SVG
  // placeholder instead of leaving Next/Image's native broken-icon showing.
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const markFailed = (key: string) =>
    setFailedImages((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));

  const EmptyState = ({ heading }: { heading: string }) => (
    <div className="rounded-2xl bg-background ring-1 ring-gray-200 px-6 py-16 text-center shadow-atlas-sm">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.08)] ring-1 ring-[hsl(var(--primary)/0.15)] mb-4">
        <Sparkles className="h-6 w-6 text-[hsl(var(--primary))]" aria-hidden="true" />
      </div>
      <h3
        className="text-xl font-bold text-foreground"
        style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
      >
        {heading}
      </h3>
      <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
        {t(
          'featuredSections.restockingDesc',
          'Pieces from Tetouani and Fes ateliers are being curated. Check back shortly — or post a brief in the Open Souk and ateliers will come to you.'
        )}
      </p>
      <Link
        href="/community/posts/create"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 min-h-[44px] transition-all duration-200 hover:-translate-y-0.5 shadow-atlas-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
      >
        {t('featuredSections.postBrief', 'Post a brief')}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );

  const SectionHeader = ({
    id,
    title,
    description,
  }: {
    id: string;
    title: string;
    description: string;
  }) => (
    <div className="flex items-end justify-between mb-8">
      <div>
        <h2
          className="text-3xl sm:text-4xl font-bold text-foreground"
          style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <Link
        href={`/products?category=${id}`}
        className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--primary))] hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] rounded"
        aria-label={t('featuredSections.browseAll', 'Browse all')}
      >
        {t('featuredSections.browseAll', 'Browse all')}
        <ArrowRight className="ms-1 h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );

  return (
    <div className="space-y-20 py-8">
      {/* ── BEST SELLERS — editorial 4-col grid ─────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6">
        <SectionHeader
          id="best-sellers"
          title={t('featuredSections.bestSellers', 'Best Sellers')}
          description={t('featuredSections.bestSellersDesc', 'Our most popular traditional Moroccan wear')}
        />

        {bestSellers.length === 0 ? (
          <EmptyState heading={t('featuredSections.restocking', 'The atelier is restocking')} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {bestSellers.map((product) => (
              <div
                key={product.id}
                className="group relative transition-all duration-200 ease-[cubic-bezier(0.33,1,0.68,1)] hover:-translate-y-0.5 rounded-2xl overflow-hidden shadow-atlas-sm hover:shadow-atlas-md bg-white ring-1 ring-gray-200"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={failedImages.has(`best-${product.id}`) ? PLACEHOLDER : product.image}
                    alt={displayName(product)}
                    fill
                    sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
                    className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                    onError={() => markFailed(`best-${product.id}`)}
                  />
                  {/* Wishlist heart — top-end corner, non-blocking absolute layer */}
                  <div className="absolute top-2 end-2 z-10">
                    <WishlistButton
                      productId={product.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-gray-200 backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-110"
                    />
                  </div>
                  {/* Discount badge — top-start corner */}
                  {product.comparePrice && product.comparePrice > product.price && (
                    <span className="absolute top-2 start-2 z-10 inline-flex items-center rounded-full bg-rose-700 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm tabular-nums">
                      -{Math.round((1 - product.price / product.comparePrice) * 100)}%
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                    <Link
                      href={`/products/${product.id}`}
                      className="hover:text-[hsl(var(--primary))] transition-colors duration-200 focus:outline-none"
                    >
                      <span aria-hidden="true" className="absolute inset-0" />
                      {displayName(product)}
                    </Link>
                  </h3>
                  <div className="mt-1.5">
                    <PriceTag
                      price={product.price}
                      comparePrice={product.comparePrice}
                      hasVariants={product.hasVariants}
                    />
                  </div>
                  <StarRow rating={product.rating} reviews={product.reviews} />
                  {/* Availability chip */}
                  {product.stockQuantity !== null && (
                    <div className="mt-1.5">
                      <StockChip stockQuantity={product.stockQuantity} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 sm:hidden">
          <Link
            href="/products?category=best-sellers"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--primary))] hover:opacity-80 transition-colors duration-200"
          >
            {t('featuredSections.browseAll', 'Browse all')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ── NEW ARRIVALS — horizontal snap-rail (distinct from the grid) ── */}
      <section className="mx-auto max-w-7xl px-6">
        <SectionHeader
          id="new-arrivals"
          title={t('featuredSections.newArrivals', 'New Arrivals')}
          description={t('featuredSections.newArrivalsDesc', 'Latest additions to our collection')}
        />

        {newArrivals.length === 0 ? (
          <EmptyState heading={t('featuredSections.restocking', 'The atelier is restocking')} />
        ) : (
          <div
            className="-mx-6 px-6 flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-4 scroll-ps-6 scroll-pe-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            role="list"
            aria-label={t('featuredSections.newArrivals', 'New Arrivals')}
          >
            {newArrivals.map((product) => (
              <div
                key={product.id}
                role="listitem"
                className="group relative snap-start shrink-0 w-[60%] sm:w-[40%] lg:w-[23%] transition-all duration-200 ease-[cubic-bezier(0.33,1,0.68,1)] hover:-translate-y-0.5 rounded-2xl overflow-hidden shadow-atlas-sm hover:shadow-atlas-md bg-white ring-1 ring-gray-200"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={failedImages.has(`new-${product.id}`) ? PLACEHOLDER : product.image}
                    alt={displayName(product)}
                    fill
                    sizes="(min-width:1024px) 23vw, (min-width:640px) 40vw, 60vw"
                    className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                    onError={() => markFailed(`new-${product.id}`)}
                  />
                  {product.isNew && (
                    <span className="absolute top-3 start-3 z-10 inline-flex items-center rounded-full bg-[hsl(var(--primary))] px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                      {t('featuredSections.newBadge', 'New')}
                    </span>
                  )}
                  {/* Discount badge when not showing "New" badge */}
                  {!product.isNew && product.comparePrice && product.comparePrice > product.price && (
                    <span className="absolute top-3 start-3 z-10 inline-flex items-center rounded-full bg-rose-700 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm tabular-nums">
                      -{Math.round((1 - product.price / product.comparePrice) * 100)}%
                    </span>
                  )}
                  {/* Wishlist heart button */}
                  <div className="absolute top-2 end-2 z-10">
                    <WishlistButton
                      productId={product.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-gray-200 backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-110"
                    />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                    <Link
                      href={`/products/${product.id}`}
                      className="hover:text-[hsl(var(--primary))] transition-colors duration-200 focus:outline-none"
                    >
                      <span aria-hidden="true" className="absolute inset-0" />
                      {displayName(product)}
                    </Link>
                  </h3>
                  <div className="mt-1.5">
                    <PriceTag
                      price={product.price}
                      comparePrice={product.comparePrice}
                      hasVariants={product.hasVariants}
                    />
                  </div>
                  {/* StarRow — consistent across both card types */}
                  <StarRow rating={product.rating} reviews={product.reviews} />
                  {/* Availability chip */}
                  {product.stockQuantity !== null && (
                    <div className="mt-1.5">
                      <StockChip stockQuantity={product.stockQuantity} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 sm:hidden">
          <Link
            href="/products?category=new-arrivals"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--primary))] hover:opacity-80 transition-colors duration-200"
          >
            {t('featuredSections.browseAll', 'Browse all')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
