
'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productService } from '@/services/api';
import CategoryHeader from './CategoryHeader';
import ProductGrid from '@/components/products/ProductGrid';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import logger from '@/utils/consoleLogger';
interface CategoryContentProps {
  slug: string;
}

interface Category {
  id: number;
  name: string;
  category_name_en: string;
  category_name_ar: string;
  description?: string;
  image: string;
  itemCount: number;
  store_id: number;
}

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

interface CategoryResponse {
  success: boolean;
  category: Category;
  subCategories: any[];
  message?: string;
  products: Product[];
}

export default function CategoryContent({ slug }: CategoryContentProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [categoryData, setCategoryData] = useState<CategoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await productService.getProducts({ category: slug });
        if (response.data.success) {
          setCategoryData(response.data);
        } else {
          setError(t('errors.failedToLoadCategory', 'Failed to load category'));
        }
      } catch (err) {
        setError(t('errors.failedToLoadCategory', 'Failed to load category'));
        logger.error('Error fetching category:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCategoryData();
    }
  }, [slug]);

  const handleSort = (value: string) => {
    setSortBy(value);
    // TODO: Implement sorting logic
  };

  const handleFilter = () => {
    setShowFilters(!showFilters);
    // TODO: Implement filter logic
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!categoryData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={t('errors.categoryNotFound')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category Header */}
      <div className="sticky top-0 z-10">
        <CategoryHeader
          title={categoryData.category.category_name_en}
          itemCount={categoryData.category.itemCount}
          onSort={handleSort}
          onFilter={handleFilter}
        />
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters - Only shown on desktop */}
          <div className="hidden lg:block w-64 space-y-6">
            {/* Price Range */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3">{t('category.price_range')}</h3>
              {/* Add price range slider here */}
            </div>

            {/* Brand Filter */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3">{t('category.brands')}</h3>
              {/* Add brand checkboxes here */}
            </div>

            {/* Rating Filter */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3">{t('category.rating')}</h3>
              {/* Add rating filter here */}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            <ProductGrid products={categoryData.products} />
          </div>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">{t('category.filters')}</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="sr-only">{t('common.close')}</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {/* Mobile filter options */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
