'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Flame,
  Sparkles,
  Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProductSortProps {
  value: string;
  onChange: (value: string) => void;
}

const sortOptions = [
  {
    value: 'newest',
    label: 'sort.newest',
    fallback: 'Newest',
    icon: Sparkles,
  },
  {
    value: 'price-low-high',
    label: 'sort.price_low_high',
    fallback: 'Price: low to high',
    icon: ArrowDown,
  },
  {
    value: 'price-high-low',
    label: 'sort.price_high_low',
    fallback: 'Price: high to low',
    icon: ArrowUp,
  },
  {
    value: 'popular',
    label: 'sort.popular',
    fallback: 'Most popular',
    icon: Flame,
  },
];

export default function ProductSort({ value, onChange }: ProductSortProps) {
  const { t } = useTranslation();
  const selectedOption = sortOptions.find((opt) => opt.value === value) || sortOptions[0];
  const Icon = selectedOption.icon;

  return (
    <div className="flex items-center gap-2">
      <span className="hidden md:inline text-xs font-medium text-gray-500 uppercase tracking-wide">
        {t('sort.title', 'Sort')}
      </span>

      <Menu as="div" className="relative">
        <Menu.Button
          className="inline-flex items-center gap-1.5 ps-3 pe-3 py-2 text-sm font-medium text-gray-700 bg-white border border-amber-200 rounded-full hover:border-gray-300 hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 transition-colors"
          aria-label={t('sort.aria_label', 'Sort products')}
        >
          <Icon className="h-4 w-4 text-indigo-700 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">{t(selectedOption.label, selectedOption.fallback)}</span>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" aria-hidden="true" />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-[cubic-bezier(0.33,1,0.68,1)] duration-150"
          enterFrom="transform opacity-0 scale-95 translate-y-1"
          enterTo="transform opacity-100 scale-100 translate-y-0"
          leave="transition ease-in duration-100"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute end-0 z-50 mt-2 w-52 origin-top-right rounded-2xl bg-white shadow-atlas-lg ring-1 ring-gray-200 focus:outline-none">
            <div className="py-1.5">
              {sortOptions.map((option) => {
                const OptionIcon = option.icon;
                const isActive = value === option.value;
                return (
                  <Menu.Item key={option.value}>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`
                          group flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors
                          ${active ? 'bg-amber-50 text-gray-900' : 'text-gray-700'}
                          ${isActive ? 'font-semibold text-indigo-700' : ''}
                        `}
                      >
                        <OptionIcon
                          className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-700' : 'text-gray-400 group-hover:text-gray-600'}`}
                          aria-hidden="true"
                        />
                        <span className="flex-1 text-start">{t(option.label, option.fallback)}</span>
                        {isActive && (
                          <Check className="h-3.5 w-3.5 text-indigo-700 shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    )}
                  </Menu.Item>
                );
              })}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
