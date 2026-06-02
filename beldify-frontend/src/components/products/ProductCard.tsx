'use client';

import React, { useState, memo, Suspense, lazy } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@/utils/formatters';
import { getImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '@/utils/imageUtils';
import { useDirection } from '@/hooks/useDirection';
import toast from '@/utils/toast';
import {
  ShoppingCart,
  Zap,
  ImageIcon,
  Eye,
  Heart,
  Check,
  Maximize2,
  XCircle,
  CheckCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Dynamic import for ProductQuickView to reduce initial bundle size
const ProductQuickView = lazy(() => import('./ProductQuickView'));

interface ProductCardProps {
  readonly product: Readonly<Product>;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  isInWishlist?: boolean;
  showExpressDelivery?: boolean;
  priority?: boolean;
  className?: string;
}

// Wrap with React.memo to prevent unnecessary re-renders when props haven't changed
const ProductCard = memo(function ProductCard({ 
  product, 
  onAddToCart, 
  onAddToWishlist, 
  onQuickView,
  isInWishlist = false,
  showExpressDelivery = true,
  priority = false,
  className = ''
}: ProductCardProps) {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const router = useRouter();
  
  const [isHovering, setIsHovering] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(isInWishlist);
  const [showQuickView, setShowQuickView] = useState(false);

  const {
    id,
    name,
    name_ar,
    price,
    main_image,
    images, // Added images to destructuring
    has_discount,
    discount_price,
    rating,
    reviews_count,
    category,
    category_ar,
    stock_status,
    stock_quantity,
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
    // Red if 0 or less, green otherwise
    return stock_quantity <= 0 ? 'bg-rose-700' : 'bg-green-600';
  };

  const getStockStatusText = () => {
    // "Out of Stock" if 0 or less, "In Stock" otherwise
    return stock_quantity <= 0 ? t('stock.out_of_stock') : t('stock.in_stock_simple');
  };

  // Use getImageUrl from imageUtils to handle image paths
  // Determine the image source with proper fallbacks
  const imageSrc = getImageUrl(main_image || (product as any).image_url || (images && images.length > 0 ? images[0] : null), DEFAULT_PLACEHOLDER_IMAGE);
  const altText = (product.name && product.name.trim() !== '') ? product.name : 'Product image'; // Ensure non-empty alt text
  
  // Handle add to cart with animation
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (stock_quantity <= 0) return;
    
    setIsAddingToCart(true);
    
    // If there's a custom handler, use it
    if (onAddToCart) {
      onAddToCart(product as Product);
      setTimeout(() => setIsAddingToCart(false), 1000);
    } else {
      // Default behavior
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
      // Default behavior
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
      // Show quick view modal
      setShowQuickView(true);
    }
  };

  return (
    <article 
      className={`group product-card hover-lift ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Product Image Container */}
      <Link href={`/products/${id}`} className="block">
        <div className="relative w-full pt-[100%]">
          {/* Express Delivery Badge — Atlas: indigo-700 bg */}
          {showExpressDelivery && (
            <div className="absolute top-3 start-3 z-10">
              <div className="flex items-center gap-1 bg-indigo-700 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm">
                <Zap className="h-3 w-3" aria-hidden="true" />
                {t('product.express')}
              </div>
            </div>
          )}

          {/* Discount Badge — Atlas: rose-700 (Tetouani Garnet, sale-only) */}
          {hasDiscount && (
            <div className="absolute top-3 end-3 z-10">
              <div className="bg-rose-700 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm">
                -{discountPercentage}%
              </div>
            </div>
          )}

          {/* Image */}
          <div className="absolute inset-0">
            <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden rounded-t-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent">
                {imageSrc === '/placeholder-product.svg' ? ( // Check if final source is placeholder
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="text-center">
                      <div className="image-placeholder">
                        <ImageIcon className="h-10 w-10 text-gray-400" />
                      </div>
                      <span className="text-sm text-gray-500 mt-3 block font-medium">
                        {t('product.no_image')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <Image
                      src={imageSrc || '/placeholder-product.svg'} // Use the calculated imageSrc with fallback
                      alt={altText} // Use the calculated altText
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-105 will-change-transform"
                      priority={priority}
                      
                    />

                    {/* Image Overlay on Hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 pointer-events-none"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons — float from end edge */}
          <div className="absolute top-3 end-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
            <button
              onClick={handleWishlistToggle}
              className={`btn-action ${isWishlisted ? 'btn-action-active' : 'btn-action-default'}`}
              aria-pressed={isWishlisted}
              aria-label={isWishlisted ? t('wishlist.remove') : t('wishlist.add')}
            >
              {isWishlisted ? (
                <Heart className="h-4 w-4 fill-current" aria-hidden="true" />
              ) : (
                <Heart className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <button
              onClick={handleQuickView}
              className="btn-action btn-action-default"
              aria-label={t('product.quickView')}
            >
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Stock Status Indicator - Only show for out of stock */}
          {stock_quantity <= 0 && (
            <div className="absolute bottom-3 start-3 z-10">
              <div className="badge-stock badge-stock-out flex items-center gap-1">
                <XCircle className="h-3 w-3" aria-hidden="true" />
                {getStockStatusText()}
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Product Details */}
      <div className="p-4">
        {/* Brand & Rating */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-indigo-700 truncate max-w-[100px] uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full">
            {displayCategory}
          </span>
          {rating > 0 && (
            <div className="badge-rating">
              <span className="text-amber-600 text-xs font-bold">{rating.toFixed(1)} ★</span>
              {reviews_count > 0 && (
                <span className="ms-1 text-xs text-amber-500/70">({reviews_count})</span>
              )}
            </div>
          )}
        </div>

        {/* Product Name */}
        <Link href={`/products/${id}`}>
          <h3 className="product-name">
            {displayName}
          </h3>
        </Link>

        {/* Price Section */}
        <div className="flex items-center justify-between gap-3 mt-3">
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              {/* Atlas price-display: indigo-700 per design spec (overrides .price-current gray gradient) */}
              <span className="text-base font-extrabold text-indigo-700 currency-mad">{formatPrice(displayPrice)}</span>
              {hasDiscount && (
                <span className="price-original">{formatPrice(price)}</span>
              )}
            </div>
             {/* Stock Text - Only show "Out of Stock" when quantity is 0 or less */}
             {stock_quantity <= 0 && (
               <span className="text-xs text-rose-700 font-bold mt-1 bg-rose-50/50 px-2 py-0.5 rounded inline-block w-fit flex items-center gap-1">
                 <XCircle className="h-3 w-3" aria-hidden="true" />
                 {t('catalog.product.out_of_stock', 'Out of stock')}
               </span>
             )}
          </div>

          {/* Add to Cart Quick Button - Only show if in stock.
              Atlas: amber CTAs use text-amber-950 (dark) for WCAG AA contrast on amber-500 background. */}
          {stock_quantity > 0 && (
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className={`p-2.5 rounded-xl bg-amber-500 text-amber-950 hover:bg-amber-400 transition-all duration-300 active:scale-95 hover:scale-105 relative overflow-hidden shadow-md hover:shadow-lg flex items-center justify-center ${isAddingToCart ? 'opacity-80' : ''}`}
              aria-label={t('product.addToCart')}
            >
              <div className={`absolute inset-0 flex items-center justify-center bg-indigo-950 transition-transform duration-500 ${isAddingToCart ? 'translate-y-0' : 'translate-y-full'}`}>
                <Check className="h-4 w-4 text-white" />
              </div>
              <ShoppingCart className={`h-4 w-4 transition-all duration-300 ${isAddingToCart ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`} />
            </button>
          )}
        </div>
      </div>
      
      {/* Product Quick View Modal - Lazy loaded with Suspense */}
      <Suspense fallback={null}>
        <ProductQuickView
          product={showQuickView ? product : null}
          isOpen={showQuickView}
          onClose={() => setShowQuickView(false)}
          onAddToCart={onAddToCart}
          onAddToWishlist={onAddToWishlist}
          isInWishlist={isWishlisted}
        />
      </Suspense>
    </article>
  );
});

export default ProductCard;
