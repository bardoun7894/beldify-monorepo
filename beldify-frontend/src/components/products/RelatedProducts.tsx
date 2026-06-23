'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '@/lib/types';
import ProductCard from '@/components/products/ProductCard';
import { productService, cartService } from '@/services/api';
import { cn } from '@/utils/classNames';
import logger from '@/utils/consoleLogger';

interface RelatedProductsProps {
  productId?: string;
  isCartPage?: boolean;
  title?: string;
  limit?: number;
  className?: string;
  /** Pass pre-fetched products to skip the internal fetch (PDP render-only mode).
   *  When provided, the component renders a mobile snap-scroll carousel and
   *  Atlas-styled skeletons. Cart consumers do NOT pass this prop and use the
   *  original grid + fetch path — preserving the cart layout exactly. */
  products?: Product[];
  /** Show the component's own <h2> heading. Defaults to true so the cart page
   *  is unaffected. Pass false on the PDP which supplies its own section header. */
  showHeading?: boolean;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({
  productId,
  isCartPage = false,
  title,
  limit = 4,
  className,
  products: prefetchedProducts,
  showHeading = true,
}) => {
  const { t } = useTranslation();
  const [fetchedProducts, setFetchedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(prefetchedProducts === undefined);

  // PDP passes pre-fetched products → PDP mode; cart does not → fetch mode.
  const isPdpMode = prefetchedProducts !== undefined;

  useEffect(() => {
    // PDP mode: skip the internal fetch entirely — products are pre-partitioned.
    if (isPdpMode) {
      setLoading(false);
      return;
    }

    const fetchRelatedProducts = async () => {
      setLoading(true);
      try {
        let data;
        if (isCartPage) {
          data = await cartService.getCartRelatedProducts(productId, limit);
        } else if (productId) {
          data = await productService.getRelatedProducts(productId, limit);
        } else {
          setFetchedProducts([]);
          setLoading(false);
          return;
        }

        setFetchedProducts(data.products || []);
      } catch (error) {
        logger.error('Error fetching related products:', error);
        setFetchedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [productId, isCartPage, limit, isPdpMode]);

  // Resolve which product list to render.
  const products = isPdpMode ? prefetchedProducts! : fetchedProducts;

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    if (isPdpMode) {
      // Atlas-styled skeleton with mobile snap-scroll for PDP mode
      return (
        <div className={cn('mt-8', className)}>
          {showHeading && (
            <div className="flex items-center gap-2 mb-6">
              <div className="h-6 w-40 bg-gray-100 animate-pulse rounded-full" />
            </div>
          )}
          {/* Mobile: horizontal snap-scroll skeleton */}
          <div className="flex overflow-x-auto snap-x gap-4 pb-2 md:hidden">
            {Array(4).fill(0).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-44 snap-start bg-amber-50 rounded-2xl p-3 animate-pulse"
              >
                <div className="h-40 bg-amber-100 rounded-xl mb-3" />
                <div className="h-4 bg-amber-100 rounded-full w-3/4 mb-2" />
                <div className="h-4 bg-amber-100 rounded-full w-1/2" />
              </div>
            ))}
          </div>
          {/* Desktop: grid skeleton */}
          <div className="hidden md:grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-amber-50 rounded-2xl p-4 animate-pulse">
                <div className="h-40 bg-amber-100 rounded-xl mb-3" />
                <div className="h-4 bg-amber-100 rounded-full w-3/4 mb-2" />
                <div className="h-4 bg-amber-100 rounded-full w-1/2" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Original skeleton preserved for cart and other fetch-mode consumers
    return (
      <div className={cn('mt-8 px-4', className)}>
        <div className="flex items-center gap-2 mb-6">
          <div className="h-6 w-40 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
              <div className="h-40 bg-gray-200 rounded-md mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  // ── PDP render-only mode: Atlas styles + mobile snap-scroll carousel ───────

  if (isPdpMode) {
    return (
      <div className={cn('mt-8', className)}>
        {showHeading && (
          <div className="relative mb-6">
            <h2 className="text-xl font-medium inline-block">
              <span className="text-indigo-700">
                {title || t('product.related_products')}
              </span>
            </h2>
            <div className="absolute -bottom-2 start-0 h-1 w-20 bg-gradient-to-r from-indigo-600 to-amber-500 rounded-full" />
          </div>
        )}

        {/* Mobile: horizontal snap-scroll carousel */}
        <div className="flex overflow-x-auto snap-x gap-4 pb-2 md:hidden mt-2">
          {products.map((product) => (
            <div key={product.id} className="shrink-0 w-48 snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Desktop: responsive grid */}
        <div className="hidden md:grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    );
  }

  // ── Original layout for cart and other fetch-mode consumers ─────────────────
  // This path is byte-identical to the original component for cart consumers.

  return (
    <div className={cn('mt-8 px-4', className)}>
      {showHeading && (
        <div className="relative mb-6">
          <h2 className="text-xl font-medium inline-block">
            <span className="text-indigo-700">
              {title || t('product.related_products')}
            </span>
          </h2>
          <div className="absolute -bottom-2 left-0 h-1 w-20 bg-gradient-to-r from-indigo-600 to-amber-500 rounded-full" />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
