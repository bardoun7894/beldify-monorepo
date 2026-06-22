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
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({ 
  productId, 
  isCartPage = false, 
  title, 
  limit = 4,
  className 
}) => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let ignore = false;
    const fetchRelatedProducts = async () => {
      setLoading(true);
      try {
        let data;
        if (isCartPage) {
          // Use cart related products endpoint
          data = await cartService.getCartRelatedProducts(productId, limit);
        } else if (productId) {
          // Use product related products endpoint
          data = await productService.getRelatedProducts(productId, limit);
        } else {
          // No product ID and not cart page
          if (!ignore) {
            setProducts([]);
            setLoading(false);
          }
          return;
        }

        if (!ignore) setProducts(data?.products || []);
      } catch (error) {
        logger.error('Error fetching related products:', error);
        if (!ignore) setProducts([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchRelatedProducts();
    return () => {
      ignore = true;
    };
  }, [productId, isCartPage, limit]);

  if (loading) {
    return (
      <div className={cn("mt-8 px-4", className)}>
        <div className="flex items-center space-x-2 mb-6">
          <div className="h-6 w-40 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
              <div className="h-40 bg-gray-200 rounded-md mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className={cn("mt-8 px-4", className)}>
      <div className="relative mb-6">
        <h2 className="text-xl font-medium inline-block">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-amber-500">
            {title || t('product.related_products')}
          </span>
        </h2>
        <div className="absolute -bottom-2 left-0 h-1 w-20 bg-gradient-to-r from-indigo-600 to-amber-500 rounded-full"></div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
