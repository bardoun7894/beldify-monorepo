'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@/utils/formatters';
import { getImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '@/utils/imageUtils';
import { useDirection } from '@/hooks/useDirection';
import { useWishlist } from '@/contexts/WishlistContext';
import toast from '@/utils/toast';
import {
  ShoppingCart,
  Zap,
  ImageIcon,
  Heart,
  Check,
  Maximize2,
  XCircle,
} from 'lucide-react';
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
  const { isInWishlist: isInWishlistFn, addToWishlist, removeFromWishlist } = useWishlist();
  const router = useRouter();

  const [isHovering, setIsHovering] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const cartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (cartTimerRef.current) clearTimeout(cartTimerRef.current); }, []);

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
    stock: stockRaw,
  } = product;

  const stock = stockRaw ?? 0;

  const isWishlisted = isInWishlistFn(id);
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
      cartTimerRef.current = setTimeout(() => setIsAddingToCart(false), 1000);
    } else {
      cartTimerRef.current = setTimeout(() => {
        setIsAddingToCart(false);
        toast.success(t('product.addedToCart'), {
          position: isRTL ? 'bottom-left' : 'bottom-right',
          duration: 2000
        });
      }, 600);
    }
  };
  
  // Handle wishlist toggle — calls real WishlistContext; context handles toasts
  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isToggling) return;
    if (onAddToWishlist) {
      onAddToWishlist(product as Product);
      return;
    }
    setIsToggling(true);
    try {
      if (isWishlisted) {
        await removeFromWishlist(id);
      } else {
        await addToWishlist(id);
      }
    } catch {
      // Context handles error toasts
    } finally {
      setIsToggling(false);
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
      className={`group relative bg-white rounded-2xl shadow-atlas-sm hover:shadow-atlas-md transition-all duration-200 overflow-hidden hover:-translate-y-0.5 w-full ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Product Image Container */}
      <Link href={`/products/${id}`} className="block">
        <div className="relative w-full pt-[100%]">
          {/* Express Delivery Badge — Atlas: indigo-700 */}
          {showExpressDelivery && (
            <div className="absolute top-3 start-3 z-10">
              <div className="badge-express flex items-center gap-1">
                <Zap className="h-2.5 w-2.5" aria-hidden="true" />
                {t('product.express')}
              </div>
            </div>
          )}

          {/* Discount Badge — Atlas: rose-700 (Tetouani Garnet) */}
          {hasDiscount && (
            <div className="absolute top-3 end-3 z-10">
              <div className="badge-discount">
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
                      <div className="image-placeholder">
                        <ImageIcon className="h-8 w-8 text-amber-400" aria-hidden="true" />
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

          {/* Quick Action Buttons — float from end edge */}
          <div className="absolute top-3 end-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
            <button
              onClick={handleWishlistToggle}
              disabled={isToggling}
              className={`btn-action ${isWishlisted ? 'btn-action-active' : 'btn-action-default'} disabled:opacity-50`}
              aria-pressed={isWishlisted}
              aria-label={isWishlisted ? t('wishlist.remove') : t('wishlist.add')}
            >
              <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-current' : ''}`} aria-hidden="true" />
            </button>
            <button
              onClick={handleQuickView}
              className="btn-action btn-action-default"
              aria-label={t('product.quickView')}
            >
              <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Stock Status Indicator - Only show for out of stock */}
          {stock <= 0 && (
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
      <div className="p-2.5">
        {/* Category & Rating */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-indigo-700 truncate max-w-[80px] uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full">
            {displayCategory}
          </span>
          {rating > 0 && (
            <div className="badge-rating">
              <span className="text-amber-700 text-[10px] font-semibold">{rating.toFixed(1)} ★</span>
              {reviews_count > 0 && (
                <span className="ms-1 text-[9px] text-amber-600/70">({reviews_count})</span>
              )}
            </div>
          )}
        </div>

        {/* Product Name */}
        <Link href={`/products/${id}`}>
          <h3 className="product-name text-xs min-h-[2rem]">
            {displayName}
          </h3>
        </Link>

        {/* Price Section */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-1.5">
              <span className="price-current text-sm currency-mad">{formatPrice(displayPrice)}</span>
              {hasDiscount && (
                <span className="price-original text-[10px] currency-mad">{formatPrice(price)}</span>
              )}
            </div>
            {stock <= 0 && (
              <span className="text-[10px] text-rose-700 font-semibold mt-0.5">{t('stock.out_of_stock')}</span>
            )}
          </div>

          {/* Add to Cart Quick Button — Atlas amber accent for add-to-cart */}
          {stock > 0 && (
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="p-2 rounded-2xl bg-amber-500 text-amber-950 hover:bg-amber-400 transition-all duration-200 active:scale-95 relative overflow-hidden shadow-sm hover:shadow-md"
              aria-label={t('product.addToCart')}
            >
              <div className={`absolute inset-0 flex items-center justify-center bg-indigo-700 transition-transform duration-500 ${isAddingToCart ? 'translate-y-0' : 'translate-y-full'}`}>
                <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
              </div>
              <ShoppingCart className={`h-3.5 w-3.5 transition-all duration-300 ${isAddingToCart ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
