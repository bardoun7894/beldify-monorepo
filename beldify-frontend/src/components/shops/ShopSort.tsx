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
      {/* Premium styled sort icon with indigo color and amber border */}
      <div className="p-1.5 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-sm ring-2 ring-amber-300 ring-opacity-50">
        <ArrowsUpDownIcon className="h-3.5 w-3.5 text-white" />
      </div>
      
      {/* Premium styled select with indigo and amber accents */}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          className="w-[180px] border-indigo-200 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-200 focus:ring-opacity-50 bg-white hover:bg-indigo-50 transition-all duration-200 shadow-sm"
        >
          <SelectValue placeholder={t('shops.filters.sort.label')} />
        </SelectTrigger>
        
        <SelectContent 
          className="border-indigo-200 bg-white shadow-lg rounded-lg overflow-hidden border-t-amber-300"
        >
          <div className="h-0.5 w-full bg-gradient-to-r from-indigo-600 to-indigo-800 mb-1"></div>
          <div className="h-0.5 w-1/3 mx-auto bg-gradient-to-r from-amber-400 to-amber-500 mb-2 rounded-full"></div>
          {sortOptions.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="hover:bg-indigo-50 focus:bg-indigo-100 focus:text-indigo-900 data-[state=checked]:bg-indigo-100 data-[state=checked]:text-indigo-800 data-[state=checked]:font-medium data-[state=checked]:border-l-4 data-[state=checked]:border-amber-400"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
