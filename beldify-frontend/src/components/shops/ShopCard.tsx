'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import type { Shop } from '@/lib/types/shop';
import { S3_CONFIG } from '@/config/constants';
import { useDirection } from '@/hooks/useDirection';
import { ImageIcon, MapPin, Star, ShoppingBag, BadgeCheck } from 'lucide-react';
import api from '@/lib/api';
import logger from '@/utils/consoleLogger';

interface ShopCardProps {
  shop: Shop;
}

export default function ShopCard({ shop }: ShopCardProps) {
  const { t } = useTranslation();
  const { isRTL } = useDirection();

  // Format slug for URL - replace spaces with dashes and make lowercase
  const formatSlugForUrl = (text: string) => {
    return text.replace(/\s+/g, '-').toLowerCase();
  };

  const shopUrlSlug = shop.slug ? formatSlugForUrl(shop.slug) : 
    (shop.name ? formatSlugForUrl(shop.name) : shop.id);

  const displayName = isRTL
    ? shop.profile?.store_name_ar || shop.profile?.store_name || shop.name || shop.name_ar
    : shop.profile?.store_name || shop.name;

  const displayType = isRTL
    ? shop.store_type?.name_ar || shop.store_type?.name
    : shop.store_type?.name;

  const displayDescription = isRTL
    ? shop.profile?.description_ar || shop.profile?.description || shop.description_ar || shop.description
    : shop.profile?.description || shop.description;

  const getImageUrl = (imagePath: string | null) => {
    logger.log('Image path:', imagePath);
    if (!imagePath) return '/images/placeholder.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    return `${S3_CONFIG.BASE_URL}/${imagePath}`;
  };

  const logoUrl = shop.profile?.store_logo || shop.logo;

  return (
    <div className="group relative bg-white rounded-2xl ring-1 ring-gray-200 hover:shadow-md transition-all duration-300 w-full overflow-hidden hover:-translate-y-0.5">
      {/* Status Badge */}
      {(shop.status === "suspended" || shop.status === 'suspended' || shop.status?.toString() === 'suspended') && (
        <div className="absolute top-2 start-2 bg-rose-50 text-rose-700 ring-1 ring-rose-200 text-xs font-medium px-2.5 py-1 rounded-full z-20 shadow-sm">
          {t('shop.suspended')}
        </div>
      )}

      {/* Shop Image Container */}
      <Link href={`/shops/${shopUrlSlug}`} className="block">
        <div className="relative w-full pt-[100%] bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Featured Badge */}
          {shop.profile?.is_featured && (
            <div className="absolute top-3 start-3 z-10">
              <div className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 shadow-sm ring-1 ring-amber-200">
                <Star className="h-3 w-3 text-amber-600" aria-hidden="true" />
                {t('shop.featured')}
              </div>
            </div>
          )}

          {/* Verified Badge — Atlas §6.7 */}
          {shop.profile?.is_verified && (
            <div className="absolute top-3 end-3 z-10">
              <div className="bg-amber-400 text-gray-900 px-2.5 py-1 rounded-full text-[10px] font-semibold shadow-sm flex items-center gap-1">
                <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                {t('shop.verified')}
              </div>
            </div>
          )}

          {/* Image */}
          <div className="absolute inset-0">
            <div className="relative w-full h-full">
              {!logoUrl ? (
                <div className="flex items-center justify-center w-full h-full bg-amber-50">
                  <div className="text-center">
                    <ImageIcon className="h-16 w-16 mx-auto text-amber-300" aria-hidden="true" />
                    <span className="text-sm text-gray-500 mt-2 block">{t('shop.no_image')}</span>
                    <span className="text-xs text-gray-400 block">{displayName}</span>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={getImageUrl(logoUrl)}
                    alt={displayName || t('shop.shop_image')}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                    priority={false}
                    onError={(e) => {
                      logger.log('Image failed to load:', logoUrl);
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/placeholder.jpg';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Shop Details */}
      <div className="p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-3">
        {/* Type & Rating */}
        <div className="flex items-center justify-between gap-2">
          {displayType && (
            <span className="text-xs font-medium text-amber-700 bg-amber-50 ring-1 ring-amber-200 px-2 py-1 rounded-full shadow-sm truncate">
              {displayType}
            </span>
          )}
          {((shop.profile?.rating && shop.profile.rating > 0) || (shop.rating && shop.rating > 0)) && (
            <div className="flex items-center shrink-0 bg-amber-100 px-2 py-1 rounded-full shadow-sm">
              <span className="text-amber-700 text-xs sm:text-sm font-semibold">
                {(shop.profile?.rating || shop.rating || 0).toFixed(1)} ★
              </span>
              {((shop.profile?.total_reviews && shop.profile.total_reviews > 0) ||
                (shop.total_reviews && shop.total_reviews > 0) ||
                (shop.reviews_count && shop.reviews_count > 0)) && (
                <span className="ms-1 text-xs text-amber-900 hidden sm:inline">
                  ({shop.profile?.total_reviews || shop.total_reviews || shop.reviews_count || 0})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Shop Name */}
        <Link href={`/shops/${shopUrlSlug}`}>
          <h3
            className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 hover:text-indigo-700 transition-colors duration-200 leading-tight"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {displayName}
          </h3>
        </Link>

        {/* Description */}
        {displayDescription && (
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">{displayDescription}</p>
        )}

        {/* Location & Products Count */}
        <div className="flex flex-col gap-1.5 sm:gap-2 pt-1">
          {(shop.profile?.address || shop.profile?.store_locations?.[0]?.address || shop.location) && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 shrink-0" aria-hidden="true" />
              <span className="line-clamp-1 font-medium">
                {shop.profile?.address ||
                 (shop.profile?.store_locations && shop.profile.store_locations.length > 0 ?
                  `${shop.profile.store_locations[0].address}, ${shop.profile.store_locations[0].city}` : '') ||
                 shop.location}
              </span>
            </div>
          )}
          {/* Fix 6: hide count entirely when products_count is null/undefined;
              only render when a real number (including 0) is present */}
          {shop.products_count != null && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
              <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 shrink-0" aria-hidden="true" />
              <span className="font-medium">{t('shops.products_count', { count: shop.products_count })}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
