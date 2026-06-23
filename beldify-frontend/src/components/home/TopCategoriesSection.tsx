'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchCategories } from '@/lib/api';
import SubcategoriesGrid from '@/components/home/SubcategoriesGrid';
import { Category } from '@/types/category';
import logger from '@/utils/consoleLogger';

type AnyCategory = Category & { sub_categories?: AnyCategory[] };

const TopCategoriesSection: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const data = await fetchCategories();
        setCategories(data);
        
        // Extract all subcategories from main categories
        const allSubcategories = (data as AnyCategory[]).flatMap((category: AnyCategory) =>
          category.sub_categories || []
        );

        // Get unique subcategories (in case there are duplicates)
        const uniqueSubcategories = allSubcategories.filter((subcat: AnyCategory, index: number, self: AnyCategory[]) =>
          index === self.findIndex((s: AnyCategory) => s.id === subcat.id)
        );
        
        // Get top subcategories (limit to 16 for better UI)
        setSubcategories(uniqueSubcategories.slice(0, 16));
      } catch (error) {
        logger.error('Failed to load categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="h-20 w-20 rounded-full bg-gray-200"></div>
                        <div className="h-3 bg-gray-200 rounded w-16 mt-2"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <SubcategoriesGrid 
            subcategories={subcategories}
            title={t('home.topCategories')}
            showMoreLink="/categories"
            colorsScheme="amber"
          />
        )}
      </div>
    </section>
  );
};

export default TopCategoriesSection;
