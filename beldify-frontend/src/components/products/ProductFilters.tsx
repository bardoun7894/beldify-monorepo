'use client';

import { useTranslation } from 'react-i18next';
import { Switch } from '@headlessui/react';
import {
  MinusIcon,
  PlusIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface ProductFiltersProps {
  filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    colors: string[];
    sizes: string[];
    fabrics: string[];
    customizable?: boolean;
    inStock?: boolean;
  };
  onChange: (filters: ProductFiltersProps['filters']) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

interface FilterBadge {
  id: string;
  label: string;
  type: string;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 last:border-none">
      <button
        className="flex w-full items-center justify-between py-4 text-sm font-semibold text-gray-700 hover:text-indigo-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        {isOpen ? (
          <MinusIcon className="h-5 w-5 text-gray-400" />
        ) : (
          <PlusIcon className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="pb-4">{children}</div>}
    </div>
  );
}

const availableColors = [
  { id: '#000000', en: 'Black', ar: 'أسود', textColor: 'black' },
  { id: '#FFFFFF', en: 'White', ar: 'أبيض', textColor: 'black' },
  { id: '#FF0000', en: 'Red', ar: 'أحمر', textColor: 'Red' },
  { id: '#0000FF', en: 'Blue', ar: 'أزرق', textColor: 'Blue' },
  { id: '#00FF00', en: 'Green', ar: 'أخضر', textColor: 'black' },
  { id: '#FFFF00', en: 'Yellow', ar: 'أصفر', textColor: 'Yellow' },
];

const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const availableFabrics = ['Brocade', 'Silk', 'Wool', 'Linen', 'Polyester'];

export default function ProductFilters({
  filters,
  onChange,
  isMobileOpen,
  onMobileClose,
}: ProductFiltersProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleFilter = (type: keyof typeof filters, value: any) => {
    if (Array.isArray(filters[type])) {
      onChange({
        ...filters,
        [type]: filters[type].includes(value)
          ? (filters[type] as string[]).filter((item) => item !== value)
          : [...(filters[type] as string[]), value],
      });
    } else {
      onChange({
        ...filters,
        [type]: value,
      });
    }
  };

  const getActiveBadges = (): FilterBadge[] => {
    const badges: FilterBadge[] = [];

    if (filters.colors?.length) {
      filters.colors.forEach((color) => {
        badges.push({
          id: `color-${color}`,
          label: t(`filters.colors.${color}`),
          type: 'color',
        });
      });
    }

    if (filters.sizes?.length) {
      filters.sizes.forEach((size) => {
        badges.push({
          id: `size-${size}`,
          label: size.toUpperCase(),
          type: 'size',
        });
      });
    }

    if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
      badges.push({
        id: 'price-range',
        label: `$${filters.minPrice} - $${filters.maxPrice}`,
        type: 'price',
      });
    }

    return badges;
  };

  const removeBadge = (badge: FilterBadge) => {
    const newFilters = { ...filters };
    switch (badge.type) {
      case 'color':
        newFilters.colors = filters.colors?.filter((c) => `color-${c}` !== badge.id);
        break;
      case 'size':
        newFilters.sizes = filters.sizes?.filter((s) => `size-${s}` !== badge.id);
        break;
      case 'price':
        delete newFilters.minPrice;
        delete newFilters.maxPrice;
        break;
    }
    onChange(newFilters);
  };

  const activeBadges = getActiveBadges();

  const FiltersContent = () => (
    <div className="space-y-4">
      <FilterSection title={t('filters.price_range')}>
        <div className="flex flex-col space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">
              {t('filters.min')}
            </label>
            <input
              type="number"
              id="minPrice"
              value={filters.minPrice || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  minPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-lg"
              placeholder="0"
              style={{ direction: 'ltr' }} // Force left-to-right for numbers even in RTL layout
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">
              {t('filters.max')}
            </label>
            <input
              type="number"
              id="maxPrice"
              value={filters.maxPrice || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  maxPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-lg"
              placeholder="1000"
              style={{ direction: 'ltr' }} // Force left-to-right for numbers even in RTL layout
            />
          </div>
        </div>
      </FilterSection>

      <FilterSection title={t('filters.colors')}>
        <div className="grid grid-cols-6 gap-3">
          {availableColors.map((color) => (
            <div key={color.id} className="relative group">
              <button
                onClick={() => toggleFilter('colors', color.id)}
                className={`w-full aspect-square rounded-full border-2 transition-all duration-300
                  ${
                    filters.colors.includes(color.id)
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 scale-110'
                      : 'border-gray-200 hover:border-indigo-400 hover:scale-105'
                  }`}
                style={{
                  backgroundColor: color.id,
                  boxShadow: color.id === '#FFFFFF' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined,
                }}
              >
                {filters.colors.includes(color.id) && (
                  <span className="text-white drop-shadow-md">✓</span>
                )}
              </button>
              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded pointer-events-none">
                {isRTL ? color.ar : color.en}
              </div>
            </div>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={t('filters.sizes')}>
        <div className="grid grid-cols-3 gap-2">
          {availableSizes.map((size) => (
            <button
              key={size}
              onClick={() => toggleFilter('sizes', size)}
              className={`px-4 py-3 min-h-[44px] text-sm font-medium rounded-lg transition-all duration-200 touch-manipulation ${
                filters.sizes.includes(size)
                  ? 'bg-indigo-500 text-white shadow-sm hover:bg-indigo-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={t('filters.fabrics')}>
        <div className="space-y-3">
          {availableFabrics.map((fabric) => (
            <label key={fabric} className="flex items-center group cursor-pointer">
              <input
                type="checkbox"
                checked={filters.fabrics?.includes(fabric) || false}
                onChange={() => toggleFilter('fabrics', fabric)}
                className="w-5 h-5 rounded text-indigo-500 border-gray-300 focus:ring-indigo-500/20"
              />
              <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-900">{fabric}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={t('filters.additional')} defaultOpen={false}>
        <div className="space-y-4">
          <Switch.Group as="div" className="flex items-center justify-between">
            <Switch.Label className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
              {t('filters.in_stock')}
            </Switch.Label>
            <Switch
              checked={filters.inStock || false}
              onChange={(value) => onChange({ ...filters, inStock: value })}
              className={`${
                filters.inStock ? 'bg-indigo-500' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
            >
              <span
                className={`${
                  filters.inStock ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </Switch.Group>

          <Switch.Group as="div" className="flex items-center justify-between">
            <Switch.Label className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
              {t('filters.customizable')}
            </Switch.Label>
            <Switch
              checked={filters.customizable || false}
              onChange={(value) => onChange({ ...filters, customizable: value })}
              className={`${
                filters.customizable ? 'bg-indigo-500' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
            >
              <span
                className={`${
                  filters.customizable ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </Switch.Group>
        </div>
      </FilterSection>
    </div>
  );

  // Desktop view
  const DesktopFilters = () => (
    <div className="hidden md:block bg-white rounded-2xl shadow-lg divide-y divide-gray-100">
      <div className="p-4 bg-gray-50 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FunnelIcon className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-semibold text-gray-800">{t('filters.title')}</h3>
          </div>
          <button
            onClick={() =>
              onChange({
                colors: [],
                sizes: [],
                fabrics: [],
                inStock: false,
                customizable: false,
                minPrice: undefined,
                maxPrice: undefined,
              })
            }
            className="text-sm font-medium text-indigo-500 hover:text-indigo-600 hover:underline"
          >
            {t('filters.clear_all')}
          </button>
        </div>
      </div>
      <div className="p-4">
        <FiltersContent />
      </div>
    </div>
  );

  // Mobile view
  const MobileFilters = () => (
    <Transition show={isMobileOpen || false} as={Fragment}>
      <Dialog as="div" className="relative z-50 md:hidden" onClose={onMobileClose || (() => {})}>
        <Transition
          show={isMobileOpen || false}
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition>

        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition
                show={isMobileOpen || false}
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white border-b">
                      <Dialog.Title className="text-base font-semibold text-gray-900">
                        {t('filters.title')}
                      </Dialog.Title>
                      <button
                        type="button"
                        className="rounded-md text-gray-400 hover:text-gray-500"
                        onClick={onMobileClose}
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="p-4">
                      {activeBadges.length > 0 && (
                        <div className="px-4 py-2 border-b">
                          <div className="flex flex-wrap gap-2">
                            {activeBadges.map((badge) => (
                              <span
                                key={badge.id}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                              >
                                {badge.label}
                                <button
                                  type="button"
                                  onClick={() => removeBadge(badge)}
                                  className="ml-1 p-1 min-w-[32px] min-h-[32px] flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full touch-manipulation"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <FiltersContent />
                    </div>
                    <div className="sticky bottom-0 border-t bg-white p-4">
                      <button
                        onClick={onMobileClose}
                        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700"
                      >
                        {t('filters.apply')}
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

  return (
    <>
      <DesktopFilters />
      <MobileFilters />
      {/* Mobile filter button */}
      {/* <button
        type="button"
        className="md:hidden inline-flex items-center gap-2 px-4 py-2 text-sm font-medium 
          bg-white text-gray-700 border border-gray-300 rounded-lg 
          hover:bg-gray-50 shadow-sm"
        onClick={() => onMobileClose?.()}
      >
        <FunnelIcon className="h-5 w-5" />
        {t('filters.apply')}
      </button> */}

      {/* Active filter badges - Mobile */}
      {activeBadges.length > 0 && (
        <div className="md:hidden mt-4">
          <div className="flex flex-wrap gap-2">
            {activeBadges.map((badge) => (
              <span
                key={badge.id}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm 
                  bg-gray-100 text-gray-700 border border-gray-200"
              >
                {badge.label}
                <button
                  type="button"
                  onClick={() => removeBadge(badge)}
                  className="ml-1 p-1 min-w-[32px] min-h-[32px] flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full touch-manipulation"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
            <button
              onClick={() =>
                onChange({
                  colors: [],
                  sizes: [],
                  minPrice: undefined,
                  maxPrice: undefined,
                  fabrics: [],
                  inStock: false,
                  customizable: false,
                })
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm 
                text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200"
            >
              {t('products.filters.clear_all')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
