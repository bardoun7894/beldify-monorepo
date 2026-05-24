'use client';

import { useTranslation } from 'react-i18next';
import { HeartIcon, ShoppingCartIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { useWishlist } from '@/contexts/WishlistContext';
import WishlistSkeleton from '@/components/skeletons/WishlistSkeleton';
import { useSearchParams } from 'next/navigation';
import axios from '@/lib/axios';
import toast from '@/utils/toast';
import { useState } from 'react';
import { handleImageError, getImageUrl } from '@/utils/imageUtils';
import PlaceholderImage from '@/components/PlaceholderImage';
import logger from '@/utils/consoleLogger'; 
const FALLBACK_IMAGE = '/images/product-placeholder.jpg';

export default function WishlistPage() {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const locale = searchParams?.get('locale') || 'en';
  const isRTL = i18n.language === 'ar';
  const { wishlistItems, isLoading, removeFromWishlist } = useWishlist();
  const [imageError, setImageError] = useState<{ [key: number]: boolean }>({});

  const handleImageLoad = (productId: number, imageUrl: string | null) => {
    if (imageError[productId]) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <PlaceholderImage />
        </div>
      );
    }

    return (
      <Image
        src={getImageUrl(imageUrl)}
        alt={wishlistItems.find(item => item.product.id === productId)?.product.name || ''}
        fill
        className="object-cover"
        onError={(e) => {
          setImageError((prev) => ({ ...prev, [productId]: true }));
          handleImageError(e);
        }}
      />
    );
  };

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
        toast.success(t('cart.added_success'));
      }
    } catch (err: any) {
      logger.error('Error adding to cart:', err);
      toast.error(err.response?.data?.message || t('errors.something_went_wrong'));
    }
  };

  const handleRemoveFromWishlist = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    await removeFromWishlist(productId);
    toast.success(t('wishlist.removed_success'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-32 h-32 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
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
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <HeartIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t('wishlist.empty_title') || 'Your wishlist is empty'}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {t('wishlist.empty_description') || 'Save items you love to buy them later'}
              </p>
              <Link
                href={`/products?locale=${locale}`}
                className="mt-6 inline-flex items-center px-6 py-3 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                {t('wishlist.start_shopping') || 'Start Shopping'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t('wishlist.title') || 'My Wishlist'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            <Link
              href={`/products?locale=${locale}`}
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Wishlist Items - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <Link href={`/products/${item.product.id}?locale=${locale}`}>
                <div className="aspect-square relative bg-gray-100">
                  {imageError[item.product.id] ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <PlaceholderImage />
                    </div>
                  ) : (
                    <Image
                      src={getImageUrl(item.product.image_url)}
                      alt={item.product.name}
                      fill
                      className="object-cover"
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
                  <h3 className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors mb-1">
                    {item.product.name}
                  </h3>
                </Link>
                
                {item.product.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                    {item.product.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-gray-900">
                      ${Number(item.product.price).toFixed(2)}
                    </span>
                    {item.product.sale_price && item.product.is_on_sale && (
                      <span className="text-sm text-gray-500 line-through">
                        ${Number(item.product.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleAddToCart(e, item.product_id)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Add to Cart"
                    >
                      <ShoppingCartIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleRemoveFromWishlist(e, item.product_id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from Wishlist"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
