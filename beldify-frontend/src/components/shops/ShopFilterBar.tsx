'use client';

import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Store,
  Flame,
  Star,
  MapPin,
} from 'lucide-react';

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
    { id: '', label: t('shops.all', 'All'), icon: Store },
    { id: 'featured', label: t('shops.featured', 'Featured'), icon: Flame },
    { id: 'verified', label: t('shops.verified', 'Verified'), icon: Star },
    { id: 'nearby', label: t('shops.nearby', 'Nearby'), icon: MapPin },
  ];

  const scroll = (direction: 'start' | 'end') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 200;
      // RTL-aware: "end" scrolls positively in LTR, negatively in RTL
      const isRtl = document.documentElement.dir === 'rtl';
      const delta =
        direction === 'end'
          ? isRtl ? -scrollAmount : scrollAmount
          : isRtl ? scrollAmount : -scrollAmount;
      container.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex items-center bg-white border-b border-gray-200 py-2 sm:py-3">
      {/* Inline-start fade + scroll button */}
      <div className="absolute start-0 z-10 h-full flex items-center">
        <div
          aria-hidden
          className="absolute inset-y-0 start-0 w-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, white 40%, transparent)' }}
        />
        <button
          onClick={() => scroll('start')}
          aria-label={t('common.scroll_start', 'Scroll start')}
          className="relative z-10 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white ring-1 ring-amber-200 hover:bg-amber-50 transition ms-1 focus-visible:ring-2 focus-visible:ring-indigo-700/30"
        >
          <ChevronLeft className="w-4 h-4 text-indigo-700" aria-hidden="true" />
        </button>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto scrollbar-hide ps-12 pe-12 flex items-center gap-1.5 sm:gap-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Filters trigger button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenFilters}
          aria-label={t('common.actions.filters', 'Open filters')}
          className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 shadow-atlas-sm text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-full min-h-[44px]"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-700 shrink-0">
            <SlidersHorizontal className="w-2.5 h-2.5 text-white" aria-hidden="true" />
          </span>
          <span className="text-gray-800 hidden sm:inline">{t('common.actions.filters', 'Filters')}</span>
        </Button>

        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = selectedType === filter.id;
          return (
            <Button
              key={filter.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTypeChange(filter.id)}
              aria-pressed={isActive}
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 whitespace-nowrap transition-all duration-150 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-full min-h-[44px]',
                isActive
                  ? 'bg-indigo-700 text-white hover:bg-indigo-800 border-indigo-700 shadow-atlas-sm'
                  : 'border-amber-200 hover:border-gray-300 hover:bg-amber-50'
              )}
            >
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{filter.label}</span>
              <span className="sm:hidden sr-only">{filter.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Inline-end fade + scroll button */}
      <div className="absolute end-0 z-10 h-full flex items-center">
        <div
          aria-hidden
          className="absolute inset-y-0 end-0 w-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, white 40%, transparent)' }}
        />
        <button
          onClick={() => scroll('end')}
          aria-label={t('common.scroll_end', 'Scroll end')}
          className="relative z-10 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white ring-1 ring-amber-200 hover:bg-amber-50 transition me-1 focus-visible:ring-2 focus-visible:ring-indigo-700/30"
        >
          <ChevronRight className="w-4 h-4 text-indigo-700" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
