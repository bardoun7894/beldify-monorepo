'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FeaturedProduct } from '@/services/megaOfferService';
import { intlLocale } from '@/i18n/config';

interface MegaOfferProductCardProps {
  product: FeaturedProduct;
  locale: string;
}

/**
 * Compact product card for mega-offer collection pages.
 * Mirrors the card used inside the home MegaOffers section so the
 * /mega-offers routes feel continuous with the home teaser.
 */
export default function MegaOfferProductCard({ product, locale }: MegaOfferProductCardProps) {
  const { t } = useTranslation();
  const isAr = ['ar', 'ma'].includes(locale);
  const displayName = isAr ? (product.name_ar || product.name) : (product.name || product.name_ar);
  const imgSrc = product.main_image || product.image || '/placeholder-product.svg';

  return (
    <Link href={`/products/${product.slug}?locale=${locale}`} className="group/product block">
      <div className="bg-white rounded-2xl overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.33,1,0.68,1)] hover:-translate-y-0.5 shadow-atlas-sm hover:shadow-atlas-md ring-1 ring-gray-200">
        <div className="relative h-36 md:h-44 overflow-hidden bg-gray-50">
          <Image
            src={imgSrc}
            alt={displayName}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover/product:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-product.svg';
            }}
          />
          <div className="absolute top-2 start-2 flex flex-col gap-1">
            {product.has_discount && product.discount_percentage != null && product.discount_percentage > 0 && (
              <span className="text-white text-xs px-2 py-0.5 rounded-full font-semibold bg-rose-700">
                -{product.discount_percentage}%
              </span>
            )}
            {product.is_trending && (
              <span className="text-indigo-950 text-xs px-2 py-0.5 rounded-full font-semibold bg-[hsl(var(--secondary))]">
                {t('megaOffers.hot', 'HOT')}
              </span>
            )}
          </div>
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-gray-900 text-sm mb-1.5 line-clamp-2 leading-tight">
            {displayName}
          </h3>

          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-[hsl(var(--primary))] text-sm">
              {Number(product.price).toLocaleString(intlLocale(locale))} {isAr ? 'درهم' : 'MAD'}
            </span>
            {product.has_discount && product.original_price && product.original_price !== product.price && (
              <span className="text-xs text-gray-500 line-through">
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
