'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, HeartIcon, ShoppingCartIcon, StarIcon, CheckIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartFilledIcon, StarIcon as StarFilledIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@/utils/formatters';
import { getImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '@/utils/imageUtils';
import { useDirection } from '@/hooks/useDirection';
import toast from '@/utils/toast';

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
  isInWishlist?: boolean;
}

export default function ProductQuickView({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onAddToWishlist,
  isInWishlist = false
}: ProductQuickViewProps) {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(isInWishlist);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

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
    stock_quantity,
    description,
    description_ar
  } = product;

  const displayName = isRTL ? name_ar || name : name;
  const displayCategory = isRTL ? category_ar || category : category;
  const displayPrice = has_discount && discount_price ? discount_price : price;
  const displayDescription = isRTL ? description_ar || description : description;
  const hasDiscount = has_discount && discount_price;
  const discountPercentage =
    hasDiscount && typeof price === 'number' && typeof discount_price === 'number'
      ? Math.round((1 - discount_price / price) * 100)
      : 0;

  // Prepare images array
  const productImages = [];
  if (main_image) productImages.push(main_image);
  if (images && Array.isArray(images)) {
    images.forEach(img => {
      if (img !== main_image) productImages.push(img);
    });
  }

  const currentImageSrc = productImages.length > 0 
    ? getImageUrl(productImages[selectedImageIndex], DEFAULT_PLACEHOLDER_IMAGE)
    : DEFAULT_PLACEHOLDER_IMAGE;

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    
    try {
      if (onAddToCart) {
        await onAddToCart(product);
      }
      
      toast.success(t('product.addedToCart'), {
        position: isRTL ? 'bottom-left' : 'bottom-right',
        duration: 2000
      });
    } catch (error) {
      toast.error(t('error.general'));
    } finally {
      setTimeout(() => setIsAddingToCart(false), 1000);
    }
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
    
    if (onAddToWishlist) {
      onAddToWishlist(product);
    }
    
    toast.success(
      isWishlisted ? t('wishlist.removed') : t('wishlist.added'),
      {
        position: isRTL ? 'bottom-left' : 'bottom-right',
        duration: 2000,
        icon: isWishlisted ? '💔' : '❤️'
      }
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} aria-modal="true" role="dialog" aria-labelledby="quick-view-title">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <div className="relative">
                  {/* Close Button */}
                  <button
                    type="button"
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-200"
                    onClick={onClose}
                    aria-label={t('common.close') || 'Close'}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    {/* Images Section */}
                    <div className="relative bg-gray-50">
                      <div className="aspect-square relative">
                        <Image
                          src={currentImageSrc}
                          alt={displayName}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover will-change-transform"
                        />
                        
                        {/* Discount Badge */}
                        {hasDiscount && (
                          <div className="absolute top-4 left-4 z-10">
                            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                              -{discountPercentage}%
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Image Thumbnails */}
                      {productImages.length > 1 && (
                        <div className="flex gap-2 p-4 overflow-x-auto">
                          {productImages.map((img, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedImageIndex(index)}
                              className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                                selectedImageIndex === index
                                  ? 'border-indigo-500'
                                  : 'border-gray-200'
                              }`}
                            >
                              <Image
                                src={getImageUrl(img, DEFAULT_PLACEHOLDER_IMAGE)}
                                alt={`${displayName} ${index + 1}`}
                                fill
                                sizes="64px"
                                className="object-cover will-change-transform"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Product Details Section */}
                    <div className="p-6 lg:p-8">
                      {/* Category & Rating */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                          {displayCategory}
                        </span>
                        {rating > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="flex">
                              {renderStars(rating)}
                            </div>
                            <span className="text-sm text-gray-600 ml-1">
                              ({reviews_count || 0})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Name */}
                      <h2 id="quick-view-title" className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                        {displayName}
                      </h2>

                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-bold text-gray-900">
                            {formatPrice(displayPrice)}
                          </span>
                          {hasDiscount && (
                            <span className="text-lg text-gray-500 line-through">
                              {formatPrice(price)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {displayDescription && (
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-gray-900 mb-2">
                            {t('product.description')}
                          </h3>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {displayDescription}
                          </p>
                        </div>
                      )}

                      {/* Stock Status */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2">
                          {stock_quantity > 0 ? (
                            <>
                              <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                              <span className="text-sm font-medium text-green-600">
                                {t('stock.in_stock')}
                              </span>
                              <span className="text-sm text-gray-500" aria-label={`${stock_quantity} items available`}>
                                ({stock_quantity} {t('stock.available') || 'available'})
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                              <span className="text-sm font-medium text-red-600">
                                {t('stock.out_of_stock')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Quantity Selector */}
                      {stock_quantity > 0 && (
                        <div className="mb-6">
                          <label id="quantity-label" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('product.quantity')}
                          </label>
                          <div className="flex items-center" role="group" aria-labelledby="quantity-label">
                            <button
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              className="p-2 border border-gray-300 rounded-l-lg hover:bg-gray-50"
                              aria-label={t('cart.quantity.decrease') || 'Decrease quantity'}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={stock_quantity}
                              value={quantity}
                              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 p-2 border-t border-b border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              aria-label={t('product.quantity') || 'Quantity'}
                            />
                            <button
                              onClick={() => setQuantity(Math.min(stock_quantity, quantity + 1))}
                              className="p-2 border border-gray-300 rounded-r-lg hover:bg-gray-50"
                              aria-label={t('cart.quantity.increase') || 'Increase quantity'}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 mb-4">
                        {stock_quantity > 0 && (
                          <button
                            onClick={handleAddToCart}
                            disabled={isAddingToCart}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-semibold transition ${
                              isAddingToCart
                                ? 'bg-emerald-600 text-white'
                                : 'bg-indigo-700 hover:bg-indigo-800 text-white'
                            }`}
                          >
                            {isAddingToCart ? (
                              <CheckIcon className="h-5 w-5" />
                            ) : (
                              <ShoppingCartIcon className="h-5 w-5" />
                            )}
                            {isAddingToCart ? t('product.added') : t('product.addToCart')}
                          </button>
                        )}

                        <button
                          onClick={handleWishlistToggle}
                          className={`p-3 rounded-xl border transition-all duration-300 ${
                            isWishlisted
                              ? 'bg-red-50 border-red-200 text-red-600'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                          }`}
                          aria-pressed={isWishlisted}
                          aria-label={isWishlisted ? t('wishlist.remove') : t('wishlist.add')}
                        >
                          {isWishlisted ? (
                            <HeartFilledIcon className="h-5 w-5" aria-hidden="true" />
                          ) : (
                            <HeartIcon className="h-5 w-5" aria-hidden="true" />
                          )}
                        </button>
                      </div>

                      {/* View Full Product Button */}
                      <button
                        onClick={() => {
                          window.open(`/products/${id}`, '_blank');
                        }}
                        className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm"
                      >
                        {t('product.viewFullDetails')}
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}