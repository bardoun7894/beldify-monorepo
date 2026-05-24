'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  ChevronDownIcon,
  ArrowsUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FireIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface ProductSortProps {
  value: string;
  onChange: (value: string) => void;
}

const sortOptions = [
  {
    value: 'newest',
    label: 'sort.newest',
    icon: SparklesIcon,
  },
  {
    value: 'price-low-high',
    label: 'sort.price_low_high',
    icon: ArrowDownIcon,
  },
  {
    value: 'price-high-low',
    label: 'sort.price_high_low',
    icon: ArrowUpIcon,
  },
  {
    value: 'popular',
    label: 'sort.popular',
    icon: FireIcon,
  },
];

export default function ProductSort({ value, onChange }: ProductSortProps) {
  const { t } = useTranslation();
  const selectedOption = sortOptions.find((option) => option.value === value) || sortOptions[0];
  const Icon = selectedOption.icon;

  const SortMenu = ({ className = '' }) => (
    <Menu as="div" className={`relative inline-block text-left ${className}`}>
      <Menu.Button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
        <Icon className="h-5 w-5 text-gray-500" />
        <span>{t(selectedOption.label)}</span>
        <ChevronDownIcon className="h-5 w-5 text-gray-500" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {sortOptions.map((option) => {
              const OptionIcon = option.icon;
              return (
                <Menu.Item key={option.value}>
                  {({ active }) => (
                    <button
                      onClick={() => onChange(option.value)}
                      className={`
                        ${active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'}
                        ${value === option.value ? 'bg-indigo-50 text-indigo-600' : ''}
                        group flex w-full items-center px-4 py-2 text-sm
                      `}
                    >
                      <OptionIcon
                        className={`
                          mr-3 h-5 w-5
                          ${value === option.value ? 'text-indigo-600' : 'text-gray-400'}
                          ${active ? 'text-gray-500' : ''}
                        `}
                      />
                      {t(option.label)}
                    </button>
                  )}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700 hidden md:inline">{t('sort.title')}</span>
      <SortMenu className="md:w-48" />
    </div>
  );
}
