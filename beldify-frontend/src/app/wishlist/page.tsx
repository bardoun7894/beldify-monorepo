'use client';

import { useTranslation } from 'react-i18next';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useWishlist } from '@/contexts/WishlistContext';
import { useSearchParams } from 'next/navigation';
import axios from '@/lib/axios';
import toast from '@/utils/toast';
import { useState } from 'react';
import { handleImageError, getImageUrl } from '@/utils/imageUtils';
import PlaceholderImage from '@/components/PlaceholderImage';
import logger from '@/utils/consoleLogger';
import { formatPrice } from '@/utils/formatters';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';

export default function WishlistPage() {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const locale = searchParams?.get('locale') || 'en';
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';
  const { wishlistItems, isLoading, removeFromWishlist } = useWishlist();
  const [imageError, setImageError] = useState<{ [key: number]: boolean }>({});

  const handleAddToCart = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      // TODO: Wishlist add-to-cart needs stock_id or variant_id from product data
      const response = await axios.post('/api/cart/items', {
        stock_id: productId, // This should be the actual stock_id, not product_id
        quantity: 1,
      });
      if (response.data.success) {
        toast.success(t('cart.added_success', 'Added to cart'));
      }
    } catch (err: any) {
      logger.error('Error adding to cart:', err);
      toast.error(err.response?.data?.message || t('errors.something_went_wrong', 'Something went wrong'));
    }
  };

  const handleRemoveFromWishlist = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    await removeFromWishlist(productId);
    toast.success(t('wishlist.removed_success', 'Item removed from wishlist'));
  };

  // ── Loading skeleton ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas py-16 sm:py-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="animate-pulse space-y-8">
            {/* Header skeleton */}
            <div className="space-y-3">
              <div className="h-3 w-24 bg-amber-100/70 rounded-full" />
              <div className="h-9 w-56 bg-amber-100/70 rounded-2xl" />
              <div className="h-3 w-20 bg-amber-100/70 rounded-full" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden ring-1 ring-amber-100 shadow-atlas-sm"
                >
                  <div className="aspect-square bg-amber-100/70 rounded-t-2xl" />
                  <div className="p-3 space-y-2.5">
                    <div className="h-3 bg-amber-100/70 rounded-full w-4/5" />
                    <div className="h-3 bg-amber-100/70 rounded-full w-1/2" />
                    <div className="h-3 bg-amber-100/70 rounded-full w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────
  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-canvas py-16 sm:py-24" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-md text-center">
            <div className="rounded-2xl border border-amber-100 bg-white p-10 shadow-atlas-md">
              {/* Icon */}
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 ring-2 ring-amber-200">
                <Heart className="h-9 w-9 text-amber-400" strokeWidth={1.5} aria-hidden="true" />
              </div>

              <h2
                className="mb-2 text-2xl font-bold text-indigo-900"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('wishlist.empty_title', 'Your wishlist is empty')}
              </h2>
              <p className="mb-8 text-sm text-indigo-700 leading-relaxed">
                {t('wishlist.empty_description', 'Save items you love to buy them later')}
              </p>

              <Link
                href={`/products?locale=${locale}`}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-atlas-sm hover:bg-indigo-800 hover:-translate-y-0.5 hover:shadow-atlas-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
              >
                {t('wishlist.start_shopping', 'Start Shopping')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main wishlist ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-canvas py-10 sm:py-16 pb-24 md:pb-10" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* ── Breadcrumbs: Home / My Account / Wishlist ── */}
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: t('navigation.account', 'My Account'), href: `/profile?locale=${locale}` },
            { label: t('wishlist.title', 'My Wishlist') },
          ]}
        />

        {/* ── Page header ── */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
              {t('navigation.account', 'My Account')}
            </p>
            <h1
              className="text-3xl font-bold text-indigo-900 sm:text-4xl text-balance"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('wishlist.title', 'My Wishlist')}
            </h1>
            <p className="mt-1 text-sm text-indigo-700">
              {wishlistItems.length === 1
                ? t('wishlist.items_count_one', '{{count}} item', { count: wishlistItems.length })
                : t('wishlist.items_count_other', '{{count}} items', { count: wishlistItems.length })}
            </p>
          </div>

          <Link
            href={`/products?locale=${locale}`}
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-atlas-sm hover:bg-indigo-50 hover:-translate-y-0.5 hover:shadow-atlas-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
          >
            {t('account.wishlist.continue_shopping', 'Continue Shopping')}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>

        {/* ── Product grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {wishlistItems.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white rounded-2xl border border-amber-100 shadow-atlas-sm overflow-hidden hover:-translate-y-0.5 hover:shadow-atlas-md transition-all duration-200"
            >
              {/* Image area */}
              <Link
                href={`/products/${item.product.id}?locale=${locale}`}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded-t-2xl"
                aria-label={item.product.name}
              >
                <div className="relative aspect-square overflow-hidden bg-amber-50">
                  {/* Filled amber heart badge — RTL-safe end-3 */}
                  <div className="absolute top-3 end-3 z-10" aria-hidden="true">
                    <Heart className="h-5 w-5 fill-amber-500 text-amber-500 drop-shadow-sm" />
                  </div>

                  {imageError[item.product.id] ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <PlaceholderImage />
                    </div>
                  ) : (
                    <Image
                      src={getImageUrl(item.product.image_url)}
                      alt={item.product.name}
                      fill
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      onError={(e) => {
                        setImageError((prev) => ({ ...prev, [item.product.id]: true }));
                        handleImageError(e);
                      }}
                    />
                  )}
                </div>
              </Link>

              {/* Card body */}
              <div className="p-3 sm:p-4">
                <Link href={`/products/${item.product.id}?locale=${locale}`}>
                  <h3 className="line-clamp-2 text-sm font-medium text-indigo-900 hover:text-indigo-700 transition-colors mb-2 leading-snug">
                    {item.product.name}
                  </h3>
                </Link>

                {(() => {
                  // On sale → sale_price is the discounted (active) amount; price is the struck
                  // original. Matches ProductCard's displayPrice convention. Off sale → just price.
                  const onSale = Boolean(item.product.is_on_sale && item.product.sale_price);
                  const activePrice = onSale ? item.product.sale_price! : item.product.price;
                  const discountPct = item.product.discount_percentage;
                  return (
                    <div className="flex items-center justify-between gap-1">
                      {/* Price — formatPrice gives locale-aware MAD; currency-mad isolates bidi */}
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <span className="text-base font-bold text-indigo-700 currency-mad">
                          {formatPrice(activePrice)}
                        </span>
                        {onSale && (
                          <>
                            <span className="text-xs text-indigo-500 line-through currency-mad">
                              {formatPrice(item.product.price)}
                            </span>
                            {discountPct > 0 && (
                              <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-xs font-semibold text-rose-700">
                                -{discountPct}%
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Actions — add-to-cart is the amber accent (Atlas reserves amber-500 for it);
                          remove stays the subtle destructive ghost */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => handleAddToCart(e, item.product_id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-amber-950 shadow-atlas-sm hover:bg-amber-400 hover:shadow-atlas-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                          aria-label={t('account.wishlist.add_to_cart', 'Add to Cart')}
                        >
                          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={(e) => handleRemoveFromWishlist(e, item.product_id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-indigo-700 hover:bg-rose-50 hover:text-rose-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                          aria-label={t('account.wishlist.remove', 'Remove from Wishlist')}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: continue shopping link */}
        <div className="mt-10 text-center sm:hidden">
          <Link
            href={`/products?locale=${locale}`}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-atlas-sm hover:bg-indigo-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
          >
            {t('account.wishlist.continue_shopping', 'Continue Shopping')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
