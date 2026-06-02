'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FilterChip {
  id: string;
  label: string;
  type: 'color' | 'size' | 'fabric' | 'price' | 'category' | 'customizable' | 'inStock';
}

interface FilterChipsProps {
  chips: FilterChip[];
  onRemove: (chip: FilterChip) => void;
  onClearAll: () => void;
  className?: string;
}

export default function FilterChips({
  chips,
  onRemove,
  onClearAll,
  className = '',
}: FilterChipsProps) {
  const { t } = useTranslation();

  if (chips.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} role="list" aria-label={t('filters.active_filters_label', 'Active filters')}>
      {chips.map((chip) => (
        <span
          key={chip.id}
          role="listitem"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-white text-amber-800 border border-amber-200 shadow-atlas-sm"
        >
          <span className={chip.type === 'price' ? 'currency-mad' : undefined}>{chip.label}</span>
          <button
            type="button"
            onClick={() => onRemove(chip)}
            aria-label={t('filters.remove_filter_aria', `Remove {{label}} filter`, { label: chip.label })}
            className="rounded-full hover:bg-amber-100 p-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
          >
            <X className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
          </button>
        </span>
      ))}

      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-sm font-medium text-indigo-700 hover:text-indigo-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded transition-colors ms-1"
        >
          {t('filters.clear_all', 'Clear all')}
        </button>
      )}
    </div>
  );
}
