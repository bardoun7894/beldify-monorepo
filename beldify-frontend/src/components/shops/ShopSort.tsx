'use client';

import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline';

export type SortOption = 'latest' | 'name_asc' | 'name_desc' | 'products_count';

interface ShopSortProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export default function ShopSort({ value, onChange }: ShopSortProps) {
  const { t } = useTranslation();

  const sortOptions = [
    { value: 'latest', label: t('shops.filters.sort.options.latest') },
    { value: 'name_asc', label: t('shops.filters.sort.options.name_asc') },
    { value: 'name_desc', label: t('shops.filters.sort.options.name_desc') },
    { value: 'products_count', label: t('shops.filters.sort.options.products') },
  ];

  return (
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-full bg-indigo-700 shadow-atlas-sm">
        <ArrowsUpDownIcon className="h-3.5 w-3.5 text-white" />
      </div>

      {/* Atlas-token styled select — indigo trigger, amber-500 checked accent */}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className="w-[180px] min-h-[44px] rounded-2xl border-indigo-200 hover:border-indigo-700 focus:ring-2 focus:ring-indigo-700/40 bg-white hover:bg-indigo-50 transition-all duration-200 shadow-atlas-sm"
        >
          <SelectValue placeholder={t('shops.filters.sort.label')} />
        </SelectTrigger>

        <SelectContent
          className="border-indigo-200 bg-white shadow-atlas-md rounded-2xl overflow-hidden"
        >
          {sortOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="rounded-xl hover:bg-indigo-50 focus:bg-indigo-100 focus:text-indigo-900 data-[state=checked]:bg-amber-50 data-[state=checked]:text-indigo-800 data-[state=checked]:font-semibold"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
