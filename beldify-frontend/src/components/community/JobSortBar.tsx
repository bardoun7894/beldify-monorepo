'use client';

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import type { JobSort } from '@/types/community';

interface JobSortBarProps {
  /** Current search query */
  query?: string;
  /** Current sort value */
  sort?: JobSort;
  /** Called when user submits/changes the search query */
  onSearch: (q: string) => void;
  /** Called when sort selection changes */
  onSort: (sort: JobSort) => void;
  /** Called when the mobile filter button is tapped */
  onFilterToggle?: () => void;
  /** How many active filters are set (shows badge on filter button) */
  activeFilterCount?: number;
}

const SORT_OPTIONS: { value: JobSort; labelKey: string; labelFallback: string }[] = [
  { value: 'latest', labelKey: 'openSouk.sort.latest', labelFallback: 'Latest' },
  { value: 'oldest', labelKey: 'openSouk.sort.oldest', labelFallback: 'Oldest' },
  { value: 'budget_asc', labelKey: 'openSouk.sort.budgetAsc', labelFallback: 'Budget: Low → High' },
  { value: 'budget_desc', labelKey: 'openSouk.sort.budgetDesc', labelFallback: 'Budget: High → Low' },
];

export default function JobSortBar({
  query = '',
  sort = 'latest',
  onSearch,
  onSort,
  onFilterToggle,
  activeFilterCount = 0,
}: JobSortBarProps) {
  const { t } = useTranslation();
  const [localQuery, setLocalQuery] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localQuery.trim());
  };

  const handleClear = () => {
    setLocalQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className="sticky top-0 z-30 bg-gray-50 backdrop-blur-sm border-b border-gray-100 py-3 px-0">
      <div className="flex items-center gap-2">
        {/* Search form */}
        <form onSubmit={handleSubmit} className="flex-1 relative min-w-0">
          <Search
            size={14}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            ref={inputRef}
            type="search"
            value={localQuery}
            onChange={e => {
              setLocalQuery(e.target.value);
              // Debounce-free: trigger on every keystroke (parent debounces)
              onSearch(e.target.value);
            }}
            placeholder={t('openSouk.searchPlaceholder', 'Search jobs…')}
            className="w-full ps-9 pe-10 py-2.5 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 bg-white min-h-[44px]"
          />
          {localQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={t('common.clear', 'Clear')}
            >
              ×
            </button>
          )}
        </form>

        {/* Sort dropdown */}
        <div className="relative shrink-0">
          <select
            value={sort}
            onChange={e => onSort(e.target.value as JobSort)}
            className="appearance-none ps-3 pe-8 py-2.5 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 bg-white min-h-[44px] text-gray-700 cursor-pointer"
            aria-label={t('openSouk.sortBy', 'Sort by')}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey, opt.labelFallback)}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute end-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>

        {/* Mobile filter toggle — only shown when onFilterToggle is provided */}
        {onFilterToggle && (
          <button
            type="button"
            onClick={onFilterToggle}
            className="relative shrink-0 flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-2xl border border-gray-200 bg-white text-sm text-gray-700 hover:border-indigo-300 hover:text-indigo-700 transition-colors duration-200 lg:hidden"
            aria-label={t('common.filter', 'Filter')}
          >
            <SlidersHorizontal size={14} />
            <span className="text-xs font-medium">{t('common.filter', 'Filter')}</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -end-1.5 w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center bg-indigo-700 text-white text-[10px] font-bold rounded-full leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
