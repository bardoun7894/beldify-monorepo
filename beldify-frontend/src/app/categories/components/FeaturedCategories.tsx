'use client';

import React from 'react';
import type { Category } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRightIcon, TagIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import '@/i18n/config';

interface FeaturedCategoriesProps {
  categories: Category[];
}

export default function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('categories.featured.title')}</h2>
        <p className="text-gray-600">{t('categories.featured.description')}</p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category: Category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="group relative h-80 overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 hover:border-indigo-200"
          > 
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src={category.image ?? '/placeholder.png'}
                alt={category.name ?? category.name_en ?? 'Category Image'}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            </div>

            {/* Featured Badge */}
            <div className="absolute top-4 left-4 bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-md">
              <TagIcon className="h-3 w-3 text-white" />
              {t('category.featured')}
            </div>

            {/* Action Button */}
            <div className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 shadow-lg">
              <ChevronRightIcon className="h-5 w-5 text-indigo-600" />
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-indigo-200 transition-colors duration-300">
                <span className="border-b border-amber-400/50 pb-1">{category.name ?? category.name_en}</span>
              </h3>
              
              {/* Subcategories */}
              <div className="flex flex-wrap gap-2 mb-4">
                {category.sub_categories?.slice(0, 3).map((sub: Category) => (
                  <span
                    key={sub.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium"
                  >
                    {sub.name ?? sub.name_en}
                  </span>
                ))}
                {category.sub_categories && category.sub_categories.length > 3 && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium border border-white/30">
                    +{category.sub_categories.length - 3} {t('categories.more')}
                  </span>
                )}
              </div>
              
              {/* CTA */}
              <div className="flex items-center justify-between">
                <div className="flex items-center text-white text-sm font-medium">
                  <span className="group-hover:text-indigo-200 transition-colors duration-300">
                    {t('categories.explore')}
                  </span>
                </div>
                <div className="flex items-center text-indigo-200 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <span>{t('categories.shopNow')}</span>
                  <ChevronRightIcon className="ml-1 w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
