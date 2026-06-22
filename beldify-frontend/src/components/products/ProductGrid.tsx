'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Product {
  id: number;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  image: string;
  price: number | null;
  rating: number;
  reviews: number;
  discount_price: number | null;
  discount_start_date: string | null;
  discount_end_date: string | null;
}

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const formatPrice = (price: number | null) => {
    if (price === null) return t('product.price_unavailable');
    return `${price} ${t('product.currency')}`;
  };

  const calculateDiscount = (original: number, discounted: number) => {
    return Math.round(((original - discounted) / original) * 100);
  };

  const isDiscountValid = (product: Product) => {
    if (!product.discount_price || !product.discount_start_date || !product.discount_end_date) {
      return false;
    }

    const now = new Date();
    const startDate = new Date(product.discount_start_date);
    const endDate = new Date(product.discount_end_date);

    return now >= startDate && now <= endDate;
  };

  if (!products?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{t('product.no_products')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="group bg-white rounded-2xl ring-1 ring-amber-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
        >
          <Link href={`/products/${product.id}`}>
            <div className="relative aspect-square">
              <Image
                src={product.image}
                alt={isRTL ? product.name_ar || product.name : product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
              {isDiscountValid(product) && product.price && product.discount_price && (
                <div className="absolute top-2 left-2 bg-rose-700 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {calculateDiscount(product.price, product.discount_price)}% {t('product.off')}
                </div>
              )}
              <div className="absolute top-2 right-2 flex space-x-2">
                <button
                  className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
                  aria-label={t('product.add_to_wishlist')}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </Link>

          <div className="p-4 space-y-3">
            <div className="min-h-[2.5rem]">
              <Link href={`/product/${product.id}`}>
                <h3 className="font-medium text-sm text-gray-800 group-hover:text-amber-600 transition-colors line-clamp-2">
                  {isRTL ? product.name_ar || product.name : product.name}
                </h3>
              </Link>
            </div>

            {typeof product.rating === 'number' && (
              <div className="flex items-center space-x-1.5">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(product.rating) ? 'text-amber-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  ({t('product.reviews_count', { count: product.reviews })})
                </span>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-baseline space-x-2">
                <span className="text-lg font-bold text-amber-600">
                  {formatPrice(isDiscountValid(product) ? product.discount_price : product.price)}
                </span>
                {isDiscountValid(product) && product.price && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>

              {product.description && (
                <p className="text-xs text-gray-500 line-clamp-2">
                  {isRTL ? product.description_ar || product.description : product.description}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100">
              <button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                onClick={(e) => {
                  e.preventDefault();
                  // Add to cart logic here
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>{t('product.add_to_cart')}</span>
              </button>
            </div>

            {/* Express Delivery Badge */}
            <div className="flex items-center space-x-2 text-xs text-green-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>{t('product.express_delivery')}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
