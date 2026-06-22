'use client';

import { useTranslation } from 'react-i18next';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
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
      toast.error(t('errors.something_went_wrong', 'Something went wrong'));
    }
  };

  const handleRemoveFromWishlist = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    await removeFromWishlist(productId);
    toast.success(t('wishlist.removed_success', 'Item removed from wishlist'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50 py-16 sm:py-20 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="animate-pulse space-y-8">
            <div className="h-10 w-64 bg-amber-100 rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden ring-1 ring-amber-200">
                  <div className="aspect-square bg-amber-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-amber-100 rounded-full w-3/4" />
                    <div className="h-4 bg-amber-100 rounded-full w-1/2" />
                    <div className="h-4 bg-amber-100 rounded-full w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-amber-50 py-16 sm:py-20" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-sm p-10 ring-1 ring-amber-200">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-2 ring-amber-200">
                <Heart className="h-9 w-9 text-amber-400" strokeWidth={1.5} />
              </div>
              <h2
                className="text-2xl font-bold text-gray-900 mb-2"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('wishlist.empty_title', 'Your wishlist is empty')}
              </h2>
              <p className="text-sm text-gray-500 mb-8">
                {t('wishlist.empty_description', 'Save items you love to buy them later')}
              </p>
              <Link
                href={`/products?locale=${locale}`}
                className="inline-flex items-center px-6 py-3 rounded-full text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 transition-colors duration-200"
              >
                {t('wishlist.start_shopping', 'Start Shopping')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 py-16 sm:py-20" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-2">
              {t('navigation.account', 'My Account')}
            </p>
            <h1
              className="text-3xl sm:text-4xl font-bold text-gray-900"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('wishlist.title', 'My Wishlist')}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {wishlistItems.length === 1
                ? t('wishlist.items_count_one', '{{count}} item', { count: wishlistItems.length })
                : t('wishlist.items_count_other', '{{count}} items', { count: wishlistItems.length })}
            </p>
          </div>
          <Link
            href={`/products?locale=${locale}`}
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-full text-sm font-medium text-indigo-700 bg-white ring-1 ring-indigo-200 hover:bg-indigo-50 transition-colors duration-200"
          >
            {t('account.wishlist.continue_shopping', 'Continue Shopping')}
          </Link>
        </div>

        {/* Wishlist Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl shadow-sm ring-1 ring-amber-200 overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md duration-200"
            >
              <Link href={`/products/${item.product.id}?locale=${locale}`}>
                <div className="aspect-square relative bg-amber-50 overflow-hidden">
                  {/* Filled amber heart — top right */}
                  <div className="absolute top-3 end-3 z-10">
                    <Heart
                      className="h-5 w-5 text-amber-500 fill-amber-500"
                      aria-hidden="true"
                    />
                  </div>

                  {imageError[item.product.id] ? (
                    <div className="w-full h-full flex items-center justify-center">
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

              <div className="p-4">
                <Link href={`/products/${item.product.id}?locale=${locale}`}>
                  <h3 className="text-sm font-medium text-gray-900 hover:text-indigo-700 transition-colors mb-1 line-clamp-2">
                    {item.product.name}
                  </h3>
                </Link>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-semibold text-indigo-700">
                      {Number(item.product.price).toFixed(2)} {t('common.currency', 'MAD')}
                    </span>
                    {item.product.sale_price && item.product.is_on_sale && (
                      <span className="text-xs text-gray-400 line-through">
                        {Number(item.product.sale_price).toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleAddToCart(e, item.product_id)}
                      className="p-2 text-gray-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors duration-200"
                      title={t('account.wishlist.add_to_cart', 'Add to Cart')}
                      aria-label={t('account.wishlist.add_to_cart', 'Add to Cart')}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleRemoveFromWishlist(e, item.product_id)}
                      className="p-2 text-gray-400 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors duration-200"
                      title={t('account.wishlist.remove', 'Remove from Wishlist')}
                      aria-label={t('account.wishlist.remove', 'Remove from Wishlist')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile continue shopping */}
        <div className="mt-10 text-center sm:hidden">
          <Link
            href={`/products?locale=${locale}`}
            className="inline-flex items-center px-6 py-3 rounded-full text-sm font-semibold text-indigo-700 bg-white ring-1 ring-indigo-200 hover:bg-indigo-50 transition-colors duration-200"
          >
            {t('account.wishlist.continue_shopping', 'Continue Shopping')}
          </Link>
        </div>
      </div>
    </div>
  );
}
