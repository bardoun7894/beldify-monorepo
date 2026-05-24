'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/types/category';
import { FiChevronRight } from 'react-icons/fi';
import { getImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '@/utils/imageUtils';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <Link href={`/${category.slug}`}>
        <div className="relative h-48 rounded-t-lg overflow-hidden">
          <Image
            src={getImageUrl(category.image ?? '')}
            alt={category.name ?? 'Category Image'}
            fill
            className="object-cover"
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              // Handle image loading error
              const target = e.target as HTMLImageElement;
              target.src = DEFAULT_PLACEHOLDER_IMAGE; // Use consistent placeholder image
            }}
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name ?? category.name_en}</h3>

          {/* Subcategories Preview */}
          <div className="space-y-2">
            {category.sub_categories?.slice(0, 3).map((sub: Category) => (
              <div
                key={sub.id}
                className="flex items-center text-sm text-gray-600 hover:text-amber-600"
              >
                <FiChevronRight className="w-4 h-4 mr-1" />
                <span>{sub.name}</span>
              </div>
            ))}
            {(category.sub_categories?.length ?? 0) > 3 && (
              <div className="text-sm text-amber-600 font-medium">
                +{(category.sub_categories?.length ?? 0) - 3} more
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
