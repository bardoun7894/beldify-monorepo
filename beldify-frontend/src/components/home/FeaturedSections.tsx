'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface IncomingProduct {
  id: number;
  name: string;
  price: number;
  image?: string;
  main_image?: string;
  images?: string[];
  isNew?: boolean;
  rating?: number;
  reviews?: number;
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
  price: number;
  image: string;
  isNew: boolean;
  rating: number;
  reviews: number;
}

const PLACEHOLDER = '/placeholder-product.jpg';

function normalize(items?: IncomingProduct[]): NormalizedProduct[] {
  if (!Array.isArray(items)) return [];
  return items.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price) || 0,
    image: p.image || p.main_image || p.images?.[0] || PLACEHOLDER,
    isNew: Boolean(p.isNew),
    rating: typeof p.rating === 'number' ? p.rating : 0,
    reviews: typeof p.reviews === 'number' ? p.reviews : 0,
  }));
}

/* Shared price + rating lockup so both layouts read identically at the card
   level — only the *arrangement* of cards differs between the two sections. */
function PriceTag({ price }: { price: number }) {
  return (
    <p className="text-sm font-semibold text-indigo-700">
      {/* MAD lockup isolated so the numeral + درهم don't reorder under bidi */}
      <span className="currency-mad">{Number(price).toLocaleString('ar-MA')} درهم</span>
    </p>
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

export default function FeaturedSections(props: FeaturedSectionsProps) {
  const { t } = useTranslation();

  const bestSellers = normalize(props.bestSellers);
  const newArrivals = normalize(props.newArrivals);

  const EmptyState = ({ heading }: { heading: string }) => (
    <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-200 px-6 py-16 text-center shadow-atlas-sm">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 ring-1 ring-amber-200 mb-4">
        <Sparkles className="h-6 w-6 text-indigo-700" aria-hidden="true" />
      </div>
      <h3
        className="text-xl font-bold text-gray-900"
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
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 min-h-[44px] transition-all duration-200 hover:-translate-y-0.5 shadow-atlas-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
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
          className="text-3xl sm:text-4xl font-bold text-gray-900"
          style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <Link
        href={`/products?category=${id}`}
        className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 rounded"
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
                className="group relative transition-all duration-200 ease-[cubic-bezier(0.33,1,0.68,1)] hover:-translate-y-0.5 rounded-2xl overflow-hidden shadow-atlas-sm hover:shadow-atlas-md bg-white ring-1 ring-amber-200/50"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
                    className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                    <Link
                      href={`/products/${product.id}`}
                      className="hover:text-indigo-700 transition-colors duration-200 focus:outline-none"
                    >
                      <span aria-hidden="true" className="absolute inset-0" />
                      {product.name}
                    </Link>
                  </h3>
                  <div className="mt-1.5 flex items-center justify-between">
                    <PriceTag price={product.price} />
                  </div>
                  <StarRow rating={product.rating} reviews={product.reviews} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 sm:hidden">
          <Link
            href="/products?category=best-sellers"
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors duration-200"
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
                className="group relative snap-start shrink-0 w-[60%] sm:w-[40%] lg:w-[23%] transition-all duration-200 ease-[cubic-bezier(0.33,1,0.68,1)] hover:-translate-y-0.5 rounded-2xl overflow-hidden shadow-atlas-sm hover:shadow-atlas-md bg-white ring-1 ring-amber-200/50"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(min-width:1024px) 23vw, (min-width:640px) 40vw, 60vw"
                    className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  {product.isNew && (
                    <span className="absolute top-3 start-3 inline-flex items-center rounded-full bg-indigo-700 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                      {t('featuredSections.newBadge', 'New')}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                    <Link
                      href={`/products/${product.id}`}
                      className="hover:text-indigo-700 transition-colors duration-200 focus:outline-none"
                    >
                      <span aria-hidden="true" className="absolute inset-0" />
                      {product.name}
                    </Link>
                  </h3>
                  <div className="mt-1.5 flex items-center justify-between">
                    <PriceTag price={product.price} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 sm:hidden">
          <Link
            href="/products?category=new-arrivals"
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors duration-200"
          >
            {t('featuredSections.browseAll', 'Browse all')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
