'use client';

import React, { useState, memo, Suspense, lazy } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@/utils/formatters';
import { getImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '@/utils/imageUtils';
import { useDirection } from '@/hooks/useDirection';
import { useCart } from '@/contexts/CartContext';
import toast from '@/utils/toast';
import {
  ShoppingCart,
  Zap,
  ImageIcon,
  Heart,
  Check,
  Maximize2,
  XCircle,
  Truck,
} from 'lucide-react';
import OfferCountdownChip from './OfferCountdownChip';
import SellerStrip from './SellerStrip';

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
  const { addToCart } = useCart();

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
    ends_at,
  } = product;

  const displayName = isRTL ? name_ar || name : name;
  const displayCategory = isRTL ? category_ar || category : category;
  const displayPrice = has_discount && discount_price ? discount_price : price;
  const hasDiscount = has_discount && discount_price;
  const discountPercentage =
    hasDiscount && typeof price === 'number' && typeof discount_price === 'number'
      ? Math.round((1 - discount_price / price) * 100)
      : 0;

  const getStockStatusText = () => {
    // "Out of Stock" if 0 or less, "In Stock" otherwise
    return stock_quantity <= 0 ? t('stock.out_of_stock') : t('stock.in_stock_simple');
  };

  // Use getImageUrl from imageUtils to handle image paths
  // Determine the image source with proper fallbacks
  // Seed/demo products can carry dead external image URLs — fall back to the
  // branded placeholder instead of the browser's broken-image glyph.
  const [imgFailed, setImgFailed] = useState(false);
  const imageSrc = getImageUrl(main_image || (product as any).image_url || (images && images.length > 0 ? images[0] : null), DEFAULT_PLACEHOLDER_IMAGE);
  const altText = (product.name && product.name.trim() !== '') ? product.name : 'Product image'; // Ensure non-empty alt text
  
  // Handle add to cart with animation
  // When no custom onAddToCart prop is provided, use the REAL CartContext.addToCart —
  // a fake setTimeout was silently no-oping for guests (no API call was fired).
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (stock_quantity <= 0) return;

    setIsAddingToCart(true);

    // If there's a custom handler, use it (parent manages the cart call)
    if (onAddToCart) {
      onAddToCart(product as Product);
      setTimeout(() => setIsAddingToCart(false), 1000);
    } else {
      // Default path: call the real CartContext.addToCart so the item reaches
      // the backend cart (including guest carts keyed by X-Guest-Token).
      try {
        await addToCart(product as Product);
        // Brief success state before resetting
        setTimeout(() => setIsAddingToCart(false), 800);
      } catch {
        setIsAddingToCart(false);
        toast.error(t('cart.error_adding', 'Failed to add to cart'), {
          position: isRTL ? 'bottom-left' : 'bottom-right',
          duration: 2000,
        });
      }
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
      {/* ── Product Image ─────────────────────────────────────────────── */}
      <Link href={`/products/${id}`} className="block" tabIndex={0} aria-label={displayName}>
        <div className="relative w-full aspect-[4/5] overflow-hidden rounded-t-2xl">

          {/* Express badge — top-start, indigo-700 */}
          {showExpressDelivery && (
            <div className="absolute top-2.5 start-2.5 z-10 pointer-events-none">
              <span className="inline-flex items-center gap-1 bg-indigo-700 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide shadow-sm">
                <Zap className="h-2.5 w-2.5" aria-hidden="true" />
                {t('product.express')}
              </span>
            </div>
          )}

          {/* Discount badge — top-end, rose-700 (Tetouani Garnet, sale-only) */}
          {hasDiscount && (
            <div className="absolute top-2.5 end-2.5 z-10 pointer-events-none">
              <span className="inline-flex bg-rose-700 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm tabular-nums">
                -{discountPercentage}%
              </span>
            </div>
          )}

          {/* Offer countdown chip — bottom-start, amber (render-gated on ends_at) */}
          {/* NOTE: Renders only when backend exposes ends_at on product responses. */}
          <div className="absolute bottom-2.5 start-2.5 z-10 pointer-events-none">
            <OfferCountdownChip endsAt={ends_at} />
          </div>

          {/* Image area */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100">
            {imgFailed || imageSrc === '/placeholder-product.svg' ? (
              <div className="flex flex-col items-center justify-center w-full h-full gap-2">
                <div className="image-placeholder">
                  <ImageIcon className="h-10 w-10 text-gray-400" aria-hidden="true" />
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {t('product.no_image', 'بلا تصويرة')}
                </span>
              </div>
            ) : (
              <>
                <Image
                  src={imageSrc}
                  alt={altText}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 will-change-transform"
                  priority={priority}
                  onError={() => setImgFailed(true)}
                />
                {/* Subtle gradient scrim — darkens only bottom so badges stay legible */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" aria-hidden="true" />
              </>
            )}
          </div>

          {/* Out-of-stock frosted overlay over image */}
          {stock_quantity <= 0 && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-end pointer-events-none" aria-hidden="true">
              <div className="w-full px-3 pb-2.5">
                <span className="badge-stock badge-stock-out w-fit">
                  <XCircle className="h-3 w-3" aria-hidden="true" />
                  {getStockStatusText()}
                </span>
              </div>
            </div>
          )}

          {/* Quick-action buttons — slide in from end edge on hover */}
          <div
            className="absolute top-10 end-2.5 z-20 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 rtl:-translate-x-2 rtl:group-hover:translate-x-0"
            aria-hidden="true"
          >
            <button
              onClick={handleWishlistToggle}
              className={`btn-action ${isWishlisted ? 'btn-action-active' : 'btn-action-default'}`}
              aria-pressed={isWishlisted}
              aria-label={isWishlisted ? t('wishlist.remove') : t('wishlist.add')}
              tabIndex={isHovering ? 0 : -1}
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} aria-hidden="true" />
            </button>
            <button
              onClick={handleQuickView}
              className="btn-action btn-action-default"
              aria-label={t('product.quickView')}
              tabIndex={isHovering ? 0 : -1}
            >
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </Link>

      {/* ── Product Details ───────────────────────────────────────────── */}
      <div className="p-3.5 flex flex-col gap-2">

        {/* Category chip + Rating — same row */}
        <div className="flex items-center justify-between gap-2">
          {displayCategory && (
            <span className="text-[10px] font-semibold text-indigo-700 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full truncate max-w-[7rem] shrink-0">
              {displayCategory}
            </span>
          )}
          {rating > 0 && (
            <div className="badge-rating ms-auto shrink-0">
              <span className="text-amber-600 text-[10px] font-bold leading-none">{rating.toFixed(1)}</span>
              <span className="text-amber-500 text-[10px] ms-0.5" aria-hidden="true">★</span>
              {reviews_count > 0 && (
                <span className="ms-1 text-[10px] text-amber-400/80 tabular-nums">({reviews_count})</span>
              )}
            </div>
          )}
        </div>

        {/* Product Name */}
        <Link href={`/products/${id}`} tabIndex={-1} aria-hidden="true">
          <h3 className="product-name">
            {displayName}
          </h3>
        </Link>

        {/* Seller identity strip — shown when product has store metadata */}
        <SellerStrip
          store_name={product.store_name}
          store_slug={product.store_slug}
          store_rating={product.store_rating}
          store_is_verified={product.store_is_verified}
        />

        {/* Free-shipping badge — shown when price exceeds 500 MAD */}
        {parseFloat(String(displayPrice)) > 500 && (
          <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 w-fit">
            <Truck className="h-2.5 w-2.5" aria-hidden="true" />
            {t('product.free_shipping', 'شحن مجاني')}
          </div>
        )}

        {/* Price + Add-to-cart */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-0.5">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-sm font-extrabold text-indigo-700 currency-mad tabular-nums leading-none">
              {formatPrice(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="price-original text-[10px] tabular-nums">{formatPrice(price)}</span>
            )}
          </div>

          {/* Add to Cart — amber CTA, amber-950 text for WCAG AA contrast */}
          {stock_quantity > 0 ? (
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className={`relative shrink-0 p-2.5 rounded-xl bg-amber-500 text-amber-950 hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 active:scale-95 hover:scale-105 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md flex items-center justify-center min-w-[44px] min-h-[44px] ${isAddingToCart ? 'opacity-80 cursor-wait' : ''}`}
              aria-label={t('product.addToCart')}
            >
              {/* Success ripple slides up */}
              <span
                className={`absolute inset-0 flex items-center justify-center bg-indigo-700 transition-transform duration-500 ease-out ${isAddingToCart ? 'translate-y-0' : 'translate-y-full'}`}
                aria-hidden="true"
              >
                <Check className="h-4 w-4 text-white" />
              </span>
              <ShoppingCart
                className={`h-4 w-4 transition-all duration-300 ${isAddingToCart ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}
                aria-hidden="true"
              />
            </button>
          ) : (
            /* Out-of-stock inline text (image overlay already signals this) */
            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded-full shrink-0">
              {t('catalog.product.out_of_stock', 'نفد')}
            </span>
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
