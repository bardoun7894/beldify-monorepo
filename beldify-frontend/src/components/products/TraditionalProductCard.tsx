'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@/utils/formatters';
import { getImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '@/utils/imageUtils';
import { useDirection } from '@/hooks/useDirection';
import toast from '@/utils/toast';
import {
  ShoppingCartIcon,
  BoltIcon,
  PhotoIcon,
  EyeIcon,
  HeartIcon,
  HeartIcon as HeartSolidIcon,
  CheckIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartFilledIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

interface TraditionalProductCardProps {
  readonly product: Readonly<Product>;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  isInWishlist?: boolean;
  showExpressDelivery?: boolean;
  showShopInfo?: boolean;
  priority?: boolean;
  className?: string;
}

export default function TraditionalProductCard({
  product,
  onAddToCart,
  onAddToWishlist,
  onQuickView,
  isInWishlist = false,
  showExpressDelivery = true,
  showShopInfo = false,
  priority = false,
  className = ''
}: TraditionalProductCardProps) {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const router = useRouter();
  
  const [isHovering, setIsHovering] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(isInWishlist);

  const {
    id,
    name,
    name_ar,
    price,
    main_image,
    images,
    has_discount,
    discount_price,
    rating,
    reviews_count,
    category,
    category_ar,
    stock_status,
    stock,
  } = product;

  const displayName = isRTL ? name_ar || name : name;
  const displayCategory = isRTL ? category_ar || category : category;
  const displayPrice = has_discount && discount_price ? discount_price : price;
  const hasDiscount = has_discount && discount_price;
  const discountPercentage =
    hasDiscount && typeof price === 'number' && typeof discount_price === 'number'
      ? Math.round((1 - discount_price / price) * 100)
      : 0;

  // Stock status indicator based on quantity
  const getStockStatusColor = () => {
    return stock <= 0 ? 'bg-red-500' : 'bg-green-500';
  };

  const getStockStatusText = () => {
    return stock <= 0 ? t('stock.out_of_stock') : t('stock.in_stock_simple');
  };

  // Use getImageUrl from imageUtils to handle image paths
  const imageSrc = getImageUrl(main_image || (product as any).image_url || (images && images.length > 0 ? images[0] : null), DEFAULT_PLACEHOLDER_IMAGE);
  const altText = (product.name && product.name.trim() !== '') ? product.name : 'Product image';
  
  // Handle add to cart with animation
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (stock <= 0) return;
    
    setIsAddingToCart(true);
    
    if (onAddToCart) {
      onAddToCart(product as Product);
      setTimeout(() => setIsAddingToCart(false), 1000);
    } else {
      setTimeout(() => {
        setIsAddingToCart(false);
        toast.success(t('product.addedToCart'), {
          position: isRTL ? 'bottom-left' : 'bottom-right',
          duration: 2000
        });
      }, 600);
    }
  };
  
  // Handle wishlist toggle
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsWishlisted(!isWishlisted);
    
    if (onAddToWishlist) {
      onAddToWishlist(product as Product);
    } else {
      toast.success(
        isWishlisted 
          ? t('wishlist.removed') 
          : t('wishlist.added'), 
        {
          position: isRTL ? 'bottom-left' : 'bottom-right',
          duration: 2000,
          icon: isWishlisted ? '💔' : '❤️'
        }
      );
    }
  };
  
  // Handle quick view
  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onQuickView) {
      onQuickView(product as Product);
    } else {
      router.push(`/products/${id}`);
    }
  };

  return (
    <div 
      className={`group relative bg-white border-0 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden backdrop-blur-sm bg-gradient-to-br from-white to-gray-50/50 hover:from-white hover:to-indigo-50/30 w-full ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Product Image Container */}
      <Link href={`/products/${id}`} className="block">
        <div className="relative w-full pt-[100%]">
          {/* Express Delivery Badge - Only show if enabled */}
          {showExpressDelivery && (
            <div className="absolute top-3 left-3 z-10">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-2 py-1 rounded-full text-[9px] font-bold shadow-lg backdrop-blur-sm border border-emerald-400/20 flex items-center gap-1">
                <BoltIcon className="h-2.5 w-2.5" />
                {t('product.express')}
              </div>
            </div>
          )}

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-3 right-3 z-10">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-[9px] font-bold shadow-lg backdrop-blur-sm border border-red-400/20 animate-pulse">
                -{discountPercentage}%
              </div>
            </div>
          )}

          {/* Image */}
          <div className="absolute inset-0">
            <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden rounded-t-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent">
                {imageSrc === '/placeholder-product.svg' ? (
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-2 bg-white/80 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm">
                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <span className="text-sm text-gray-500 mt-2 block font-medium">
                        {t('product.no_image')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <Image
                      src={imageSrc || '/placeholder-product.svg'}
                      alt={altText}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-105 will-change-transform"
                      priority={priority}
                    />

                    {/* Image Overlay on Hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 pointer-events-none"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
            <button 
              onClick={handleWishlistToggle}
              className={`p-2 ${isWishlisted ? 'bg-red-500/90 text-white' : 'bg-white/80 text-gray-700'} backdrop-blur-md shadow-lg hover:shadow-xl rounded-xl active:scale-95 hover:scale-110 transition-all duration-300 border border-white/20`}
              aria-label={isWishlisted ? t('wishlist.remove') : t('wishlist.add')}
            >
              {isWishlisted ? (
                <HeartFilledIcon className="h-3.5 w-3.5" />
              ) : (
                <HeartIcon className="h-3.5 w-3.5" />
              )}
            </button>
            <button 
              onClick={handleQuickView}
              className="p-2 bg-white/80 backdrop-blur-md shadow-lg hover:shadow-xl rounded-xl active:scale-95 hover:scale-110 transition-all duration-300 border border-white/20"
              aria-label={t('product.quickView')}
            >
              <ArrowsPointingOutIcon className="h-3.5 w-3.5 text-gray-700 hover:text-indigo-600 transition-colors duration-300" />
            </button>
          </div>

          {/* Stock Status Indicator - Only show for out of stock */}
          {stock <= 0 && (
            <div className="absolute bottom-3 left-3 z-10">
              <div className={`px-2.5 py-1 rounded-full text-[10px] font-medium text-white flex items-center gap-1 ${getStockStatusColor()}`}>
                {getStockStatusText()}
              </div>
            </div>
          )}


        </div>
      </Link>

      {/* Product Details */}
      <div className="p-2.5">
        {/* Brand & Rating */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-indigo-600 truncate max-w-[80px] uppercase tracking-wider bg-indigo-50/50 px-2 py-0.5 rounded-full">
            {displayCategory}
          </span>
          {rating > 0 && (
            <div className="flex items-center shrink-0 bg-gradient-to-r from-amber-50 to-yellow-50 px-2 py-0.5 rounded-full border border-amber-200/30">
              <span className="text-amber-600 text-[10px] font-bold">{rating.toFixed(1)} ★</span>
              {reviews_count > 0 && (
                <span className="ml-1 text-[9px] text-amber-500/70">({reviews_count})</span>
              )}
            </div>
          )}
        </div>

        {/* Product Name */}
        <Link href={`/products/${id}`}>
          <h3 className="text-xs font-bold text-gray-900 line-clamp-2 min-h-[2rem] mb-2 hover:text-indigo-600 transition-all duration-300 group-hover:text-indigo-600 leading-tight hover:scale-[1.02] transform">
            {displayName}
          </h3>
        </Link>



        {/* Price Section */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{formatPrice(displayPrice)}</span>
              {hasDiscount && (
                <span className="text-[10px] text-gray-400 line-through bg-gray-100/50 px-1 py-0.5 rounded">{formatPrice(price)}</span>
              )}
            </div>
             {/* Stock Text - Only show "Out of Stock" when quantity is 0 or less */}
             {stock <= 0 && (
               <span className="text-[10px] text-red-500 font-bold mt-0.5 bg-red-50/50 px-1 py-0.5 rounded">{t('stock.out_of_stock')}</span>
             )}
          </div>

          {/* Add to Cart Quick Button - Only show if in stock */}
          {stock > 0 && (
            <button 
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className={`p-2 rounded-xl ${isAddingToCart ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'} transition-all duration-300 active:scale-95 hover:scale-105 relative overflow-hidden shadow-lg hover:shadow-xl backdrop-blur-sm`}
              aria-label={t('product.addToCart')}
            >
              <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500 transition-transform duration-500 ${isAddingToCart ? 'translate-y-0' : 'translate-y-full'}`}>
                <CheckIcon className="h-3.5 w-3.5 text-white" />
              </div>
              <ShoppingCartIcon className={`h-3.5 w-3.5 transition-all duration-300 ${isAddingToCart ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
