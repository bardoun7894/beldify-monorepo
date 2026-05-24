'use client';

import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
  BuildingStorefrontIcon,
  FireIcon,
  StarIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

interface ShopFilterBarProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  onOpenFilters: () => void;
}

export default function ShopFilterBar({
  selectedType,
  onTypeChange,
  onOpenFilters,
}: ShopFilterBarProps) {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filters = [
    { id: '', label: t('shops.all'), icon: BuildingStorefrontIcon },
    { id: 'featured', label: t('shops.featured'), icon: FireIcon },
    { id: 'verified', label: t('shops.verified'), icon: StarIcon },
    { id: 'nearby', label: t('shops.nearby'), icon: MapPinIcon },
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative flex items-center bg-white border-b border-amber-200/60 py-2 sm:py-3">
      {/* Left scroll button with indigo and amber accents */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 z-10 h-full px-1 sm:px-2 bg-gradient-to-r from-white via-white/90 to-transparent hover:from-indigo-50 hover:via-indigo-50/90 transition-all duration-200"
      >
        <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 hover:text-amber-500 transition-colors duration-200" />
      </button>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto scrollbar-hide px-3 sm:px-4 flex items-center gap-1.5 sm:gap-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Premium styled filter button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenFilters}
          className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 shadow-sm text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
        >
          <div className="p-0.5 sm:p-1 rounded-full bg-indigo-700 flex items-center justify-center">
            <AdjustmentsHorizontalIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
          </div>
          <span className="text-gray-800 hidden sm:inline">{t('common.actions.filters')}</span>
        </Button>

        {filters.map((filter) => {
          const Icon = filter.icon;
          return (
            <Button
              key={filter.id}
              variant={selectedType === filter.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTypeChange(filter.id)}
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shadow-sm transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2',
                selectedType === filter.id
                  ? 'bg-indigo-700 text-white hover:bg-indigo-800 border-indigo-700 rounded-full'
                  : 'border-amber-200/60 hover:border-amber-300 hover:bg-amber-50 rounded-full'
              )}
            >
              <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{filter.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Right scroll button with indigo and amber accents */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 z-10 h-full px-1 sm:px-2 bg-gradient-to-l from-white via-white/90 to-transparent hover:from-indigo-50 hover:via-indigo-50/90 transition-all duration-200"
      >
        <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 hover:text-amber-500 transition-colors duration-200" />
      </button>
    </div>
  );
}
