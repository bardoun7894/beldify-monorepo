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
  className = '' 
}: FilterChipsProps) {
  const { t } = useTranslation();

  if (chips.length === 0) return null;

  const getChipColor = (_type: FilterChip['type']) => {
    // Atlas §8: single-palette chips — amber for active filters
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {chips.map((chip) => (
        <span
          key={chip.id}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border ${getChipColor(chip.type)}`}
        >
          <span className="font-medium">{chip.label}</span>
          <button
            onClick={() => onRemove(chip)}
            className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}
      
      {chips.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-indigo-700 hover:text-indigo-800 underline transition-colors ml-2"
        >
          {t('filters.clear_all')}
        </button>
      )}
    </div>
  );
}
