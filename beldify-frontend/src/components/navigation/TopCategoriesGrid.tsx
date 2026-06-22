'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Category } from '@/types/category';
import { fetchCategories } from '@/lib/api';
import { ChevronRight } from 'lucide-react';
import logger from '@/utils/consoleLogger';

interface TopCategoriesGridProps {
  maxCategories?: number;
  showTitle?: boolean;
}

const TopCategoriesGrid: React.FC<TopCategoriesGridProps> = ({ 
  maxCategories = 12, 
  showTitle = true 
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    let ignore = false;
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        if (ignore) return;
        if (Array.isArray(data)) {
          setCategories(data.slice(0, maxCategories));
        }
      } catch (error) {
        if (ignore) return;
        logger.error('Failed to load categories:', error);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadCategories();
    return () => {
      ignore = true;
    };
  }, [maxCategories]);

  if (loading) {
    return (
      <div className="w-full">
        {showTitle && (
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {t('categories.topCategories')}
          </h2>
        )}
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-4">
          {Array.from({ length: maxCategories }).map((_, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-gray-200 rounded-full animate-pulse" />
              <div className="mt-2 h-4 w-12 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {showTitle && (
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {t('categories.topCategories')}
        </h2>
      )}
      
      {/* Circular Categories Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-4 justify-items-center">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug || category.id}?locale=${i18n.language}`}
            className="group flex flex-col items-center cursor-pointer"
          >
            {/* Circular Image Container */}
            <div className="relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 overflow-hidden rounded-full border-4 border-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:border-amber-300">
              {/* Background tint for enhanced visual appeal */}
              <div className="absolute inset-0 bg-amber-50 opacity-30" />
              
              <Image
                src={category.image || '/placeholder.png'}
                alt={['ar', 'ma'].includes(i18n.language) ? category.name_ar : category.name_en}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  const imgElement = e.target as HTMLImageElement;
                  imgElement.src = '/placeholder.png';
                }}
              />
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Hover icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ChevronRight className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
            </div>
            
            {/* Category Name */}
            <div className="mt-2 text-center">
              <h3 className="text-xs md:text-sm font-medium text-gray-800 group-hover:text-amber-700 transition-colors duration-300 line-clamp-2 max-w-[80px] md:max-w-[100px]">
                {['ar', 'ma'].includes(i18n.language) ? category.name_ar : category.name_en}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TopCategoriesGrid;
