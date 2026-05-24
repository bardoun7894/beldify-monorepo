'use client';

import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';

interface SubCategory {
  id: number;
  name: string;
  category_name_en: string;
  category_name_ar: string;
  slug: string;
  image?: string;
  itemCount: number;
}

interface CategoryHeaderProps {
  title: string;
  itemCount: number;
  subCategories: SubCategory[];
  onSort?: (value: string) => void;
}

export default function CategoryHeader({
  title,
  itemCount,
  subCategories,
  onSort,
}: CategoryHeaderProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [showAllSubcategories, setShowAllSubcategories] = useState(false);

  // Show only 6 subcategories initially, show all when "View More" is clicked
  const visibleSubcategories = showAllSubcategories ? (subCategories || []) : (subCategories || []).slice(0, 6);
  const hasMoreSubcategories = (subCategories || []).length > 6;

  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4 py-4">
        {/* Category Title and Count */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {itemCount} {t('category.items')}
            </p>
          </div>
        </div>

        {/* Subcategories Circles */}
        {(subCategories || []).length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-medium text-gray-900">{t('category.subcategories')}</h2>
              {hasMoreSubcategories && (
                <button
                  onClick={() => setShowAllSubcategories(!showAllSubcategories)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                  {showAllSubcategories ? t('category.show_less') : t('category.view_more')}
                  <ChevronRightIcon className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {visibleSubcategories.map((subcat) => (
                <Link
                  key={subcat.id}
                  href={`/category/${subcat.slug}`}
                  className="group flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 mb-2 border border-gray-200 group-hover:border-blue-500 transition-colors duration-200">
                    {subcat.image ? (
                      <img
                        src={subcat.image}
                        alt={isRTL ? subcat.category_name_ar : subcat.category_name_en}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <span className="text-gray-400 text-2xl">📁</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 text-center group-hover:text-blue-600 line-clamp-2">
                    {isRTL ? subcat.category_name_ar : subcat.category_name_en}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sort Options */}
        <div className="flex items-center justify-end border-t pt-4">
          <div className="flex items-center">
            <span className="text-sm text-gray-700 mr-2">{t('category.sort_by')}:</span>
            <select
              onChange={(e) => onSort?.(e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="featured">{t('category.featured')}</option>
              <option value="newest">{t('category.newest')}</option>
              <option value="price_low">{t('category.price_low_high')}</option>
              <option value="price_high">{t('category.price_high_low')}</option>
              <option value="rating">{t('category.top_rated')}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
