'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Category } from '@/types/category';

interface SubcategoriesGridProps {
  subcategories: Category[];
  title?: string;
  showMoreLink?: string;
  colorsScheme?: 'amber' | 'indigo' | 'default';
}

export default function SubcategoriesGrid({
  subcategories,
  title,
  showMoreLink,
  colorsScheme = 'default',
}: SubcategoriesGridProps) {
  const { t } = useTranslation();
  if (!subcategories || subcategories.length === 0) return null;

  const accentClass =
    colorsScheme === 'amber'
      ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
      : colorsScheme === 'indigo'
      ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
      : 'text-gray-700 bg-gray-50 hover:bg-gray-100';

  return (
    <div>
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {showMoreLink && (
            <Link
              href={showMoreLink}
              className={`inline-flex items-center gap-1 text-sm font-medium rounded-full px-3 py-1 transition-colors duration-200 ${accentClass}`}
            >
              {t('common.viewAll', 'View all')} <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {subcategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug || cat.id}`}
            className="group flex flex-col items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40 rounded-xl p-2"
          >
            <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-50 ring-1 ring-gray-200 transition-all duration-200 group-hover:ring-2 group-hover:ring-indigo-700">
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <span className="text-xl" aria-hidden="true">🏷</span>
              )}
            </span>
            <span className="text-[11px] font-medium text-gray-700 text-center leading-tight whitespace-nowrap max-w-[64px] truncate">
              {cat.name_en || cat.name_ar || ''}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
