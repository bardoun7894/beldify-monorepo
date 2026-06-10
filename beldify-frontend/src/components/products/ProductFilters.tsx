'use client';

import { useTranslation } from 'react-i18next';
import {
  Minus,
  Plus,
  Filter,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Switch } from '@headlessui/react';

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
    <div className="border-b border-gray-100 last:border-none">
      <button
        type="button"
        className="flex w-full items-center justify-between py-3 text-xs font-semibold text-gray-500 uppercase tracking-[0.12em] hover:text-indigo-700 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 focus-visible:rounded"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        {isOpen ? (
          <Minus className="h-3.5 w-3.5 text-gray-300 shrink-0" aria-hidden="true" />
        ) : (
          <Plus className="h-3.5 w-3.5 text-gray-300 shrink-0" aria-hidden="true" />
        )}
      </button>
      {isOpen && (
        <div className="pb-3.5">
          {children}
        </div>
      )}
    </div>
  );
}

const availableColors = [
  { id: '#000000', en: 'Black', ar: 'أسود' },
  { id: '#FFFFFF', en: 'White', ar: 'أبيض' },
  { id: '#FF0000', en: 'Red', ar: 'أحمر' },
  { id: '#0000FF', en: 'Blue', ar: 'أزرق' },
  { id: '#00FF00', en: 'Green', ar: 'أخضر' },
  { id: '#FFFF00', en: 'Yellow', ar: 'أصفر' },
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

  const toggleFilter = (type: keyof typeof filters, value: any) => {
    if (Array.isArray(filters[type])) {
      onChange({
        ...filters,
        [type]: (filters[type] as string[]).includes(value)
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
          label: t(`filters.colors.${color}`, color),
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

    // MAD currency for price range badge
    if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
      badges.push({
        id: 'price-range',
        label: `${filters.minPrice.toLocaleString()} – ${filters.maxPrice.toLocaleString()} ${t('product.currency', 'MAD')}`,
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

  const clearAll = () =>
    onChange({
      colors: [],
      sizes: [],
      fabrics: [],
      inStock: false,
      customizable: false,
      minPrice: undefined,
      maxPrice: undefined,
    });

  const FiltersContent = () => (
    <div>
      {/* Price range — MAD localized placeholder */}
      <FilterSection title={t('filters.price_range', 'Price range')}>
        <div className="flex flex-col gap-2.5">
          <div>
            <label htmlFor="minPrice" className="text-xs font-medium text-gray-500 mb-1.5 block">
              {t('filters.min', 'Minimum')}
            </label>
            {/* dir="ltr" on wrapper: both pe-14 (padding-inline-end) and right-3
                resolve to the physical right edge, so the MAD suffix never
                collides with the left-aligned numeral in RTL page context. */}
            <div className="relative" dir="ltr">
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
                className="w-full pl-3 pr-14 py-2.5 rounded-2xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 transition-colors"
                placeholder="0"
                aria-label={t('filters.min_price_aria', 'Minimum price in MAD')}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none select-none">
                {t('product.currency', 'MAD')}
              </span>
            </div>
          </div>
          <div>
            <label htmlFor="maxPrice" className="text-xs font-medium text-gray-500 mb-1.5 block">
              {t('filters.max', 'Maximum')}
            </label>
            {/* dir="ltr" on wrapper: both pr-14 and right-3 stay on physical right. */}
            <div className="relative" dir="ltr">
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
                className="w-full pl-3 pr-14 py-2.5 rounded-2xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 transition-colors"
                placeholder="5,000"
                aria-label={t('filters.max_price_aria', 'Maximum price in MAD')}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none select-none">
                {t('product.currency', 'MAD')}
              </span>
            </div>
          </div>
        </div>
      </FilterSection>

      {/* Colors */}
      <FilterSection title={t('filters.colors', 'Colors')}>
        <div className="flex flex-wrap gap-2">
          {availableColors.map((color) => {
            const isSelected = filters.colors.includes(color.id);
            const label = isRTL ? color.ar : color.en;
            return (
              <div key={color.id} className="relative group/swatch">
                <button
                  type="button"
                  onClick={() => toggleFilter('colors', color.id)}
                  aria-label={label}
                  aria-pressed={isSelected}
                  className={`w-7 h-7 rounded-full border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40 focus-visible:ring-offset-2 touch-manipulation ${
                    isSelected
                      ? 'border-indigo-700 scale-110 shadow-md'
                      : 'border-transparent hover:border-indigo-300 hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: color.id,
                    boxShadow: isSelected
                      ? undefined
                      : color.id === '#FFFFFF'
                      ? 'inset 0 0 0 1px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.08)'
                      : '0 0 0 1px rgba(0,0,0,0.08)',
                  }}
                >
                  {isSelected && (
                    <span
                      className="flex h-full w-full items-center justify-center drop-shadow text-[10px] font-bold"
                      style={{ color: color.id === '#FFFFFF' || color.id === '#FFFF00' ? '#4338ca' : '#fff' }}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  )}
                </button>
                {/* Tooltip — physical centering avoids RTL -translate-x-1/2 quirk */}
                <div
                  role="tooltip"
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-[10px] text-white opacity-0 group-hover/swatch:opacity-100 transition-opacity duration-150 z-30"
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </FilterSection>

      {/* Sizes */}
      <FilterSection title={t('filters.sizes', 'Sizes')}>
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((size) => {
            const isSelected = filters.sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleFilter('sizes', size)}
                aria-pressed={isSelected}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 touch-manipulation min-h-[36px] min-w-[40px] ${
                  isSelected
                    ? 'bg-indigo-700 text-white shadow-sm hover:bg-indigo-800'
                    : 'bg-amber-50 text-gray-600 border border-amber-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Fabrics */}
      <FilterSection title={t('filters.fabrics', 'Fabric')}>
        <div className="space-y-2">
          {availableFabrics.map((fabric) => {
            const isSelected = filters.fabrics?.includes(fabric);
            const fabricLabel = t(`filters.fabric.${fabric.toLowerCase()}`, fabric);
            return (
              <label
                key={fabric}
                className="flex items-center gap-2.5 cursor-pointer group/fab py-0.5 touch-manipulation"
              >
                <span
                  className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-150 ${
                    isSelected
                      ? 'bg-indigo-700 border-indigo-700'
                      : 'border-gray-300 bg-white group-hover/fab:border-indigo-400'
                  }`}
                  aria-hidden="true"
                >
                  {isSelected && (
                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={isSelected || false}
                  onChange={() => toggleFilter('fabrics', fabric)}
                  aria-label={fabricLabel}
                  className="sr-only"
                />
                <span className={`text-sm leading-none transition-colors duration-150 ${isSelected ? 'text-indigo-700 font-medium' : 'text-gray-600 group-hover/fab:text-gray-900'}`}>
                  {fabricLabel}
                </span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Additional toggles */}
      <FilterSection title={t('filters.additional', 'Options')} defaultOpen={false}>
        <div className="space-y-4">
          <Switch.Group as="div" className="flex items-center justify-between">
            <Switch.Label className="text-sm text-gray-700 cursor-pointer select-none">
              {t('filters.in_stock', 'In stock')}
            </Switch.Label>
            <Switch
              checked={filters.inStock || false}
              onChange={(value) => onChange({ ...filters, inStock: value })}
              className={`${
                filters.inStock ? 'bg-indigo-700' : 'bg-gray-200'
              } relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30`}
            >
              <span
                className={`${
                  filters.inStock ? 'translate-x-4' : 'translate-x-1'
                } inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200`}
              />
            </Switch>
          </Switch.Group>

          <Switch.Group as="div" className="flex items-center justify-between">
            <Switch.Label className="text-sm text-gray-700 cursor-pointer select-none">
              {t('filters.customizable', 'Customizable')}
            </Switch.Label>
            <Switch
              checked={filters.customizable || false}
              onChange={(value) => onChange({ ...filters, customizable: value })}
              className={`${
                filters.customizable ? 'bg-indigo-700' : 'bg-gray-200'
              } relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30`}
            >
              <span
                className={`${
                  filters.customizable ? 'translate-x-4' : 'translate-x-1'
                } inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200`}
              />
            </Switch>
          </Switch.Group>
        </div>
      </FilterSection>
    </div>
  );

  // Desktop sidebar
  const DesktopFilters = () => (
    <div className="hidden md:block bg-white rounded-2xl ring-1 ring-gray-200 shadow-atlas-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-indigo-50 rounded-lg shrink-0">
            <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-700" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-bold text-gray-900 truncate">{t('filters.title', 'الفلاتر')}</h2>
        </div>
        {activeBadges.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 text-[10px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600/30 transition-colors"
          >
            {t('filters.clear_all', 'مسح الكل')}
          </button>
        )}
      </div>

      {/* Active badges strip */}
      {activeBadges.length > 0 && (
        <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-wrap gap-1.5">
            {activeBadges.map((badge) => (
              <span
                key={badge.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-white text-indigo-700 border border-indigo-200 font-semibold shadow-sm"
              >
                {badge.type === 'price' ? (
                  <span className="currency-mad">{badge.label}</span>
                ) : (
                  badge.label
                )}
                <button
                  type="button"
                  onClick={() => removeBadge(badge)}
                  aria-label={t('filters.remove_filter', `Remove ${badge.label}`)}
                  className="ms-0.5 rounded-full hover:bg-indigo-100 p-0.5 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-700/30"
                >
                  <X className="h-2.5 w-2.5" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pt-1 pb-3">
        <FiltersContent />
      </div>
    </div>
  );

  // Mobile drawer
  const MobileFilters = () => (
    <Transition show={isMobileOpen || false} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50 md:hidden"
        onClose={onMobileClose || (() => {})}
      >
        {/* Backdrop */}
        <Transition
          show={isMobileOpen || false}
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm" aria-hidden="true" />
        </Transition>

        {/* Drawer panel — docks on the end edge. `justify-end` is already
            direction-aware (resolves to physical left under dir=rtl, which the
            <html> element sets and the Dialog portal inherits), so we keep it.
            Only the CSS transform is physical, so flip it: slide in from the
            right in LTR, from the left in RTL. */}
        <div className="fixed inset-0 z-50 flex justify-end">
          <Transition
            show={isMobileOpen || false}
            as={Fragment}
            enter="transform transition ease-[cubic-bezier(0.33,1,0.68,1)] duration-300"
            enterFrom={isRTL ? '-translate-x-full' : 'translate-x-full'}
            enterTo="translate-x-0"
            leave="transform transition ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo={isRTL ? '-translate-x-full' : 'translate-x-full'}
          >
            <Dialog.Panel className="w-screen max-w-sm flex flex-col bg-white shadow-atlas-xl overflow-y-auto">
              {/* Drawer header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-indigo-700" aria-hidden="true" />
                  <Dialog.Title className="text-base font-semibold text-gray-900">
                    {t('filters.title', 'Filters')}
                  </Dialog.Title>
                </div>
                <button
                  type="button"
                  aria-label={t('common.close', 'Close')}
                  className="rounded-full p-2 text-gray-500 hover:bg-amber-50 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 transition-colors"
                  onClick={onMobileClose}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* Active badges in drawer */}
              {activeBadges.length > 0 && (
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex flex-wrap gap-1.5">
                    {activeBadges.map((badge) => (
                      <span
                        key={badge.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-white text-amber-700 border border-gray-200 font-medium"
                      >
                        {badge.type === 'price' ? (
                          <span className="currency-mad">{badge.label}</span>
                        ) : (
                          badge.label
                        )}
                        <button
                          type="button"
                          onClick={() => removeBadge(badge)}
                          aria-label={t('filters.remove_filter', `Remove ${badge.label}`)}
                          className="ms-0.5 rounded-full hover:bg-amber-100 p-0.5 transition-colors focus:outline-none"
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter content */}
              <div className="flex-1 px-5 py-2">
                <FiltersContent />
              </div>

              {/* Sticky drawer footer */}
              <div className="sticky bottom-0 border-t border-gray-100 bg-white px-5 py-4 flex gap-3">
                <button
                  type="button"
                  onClick={clearAll}
                  className="flex-1 py-3 px-4 rounded-2xl border border-amber-200 text-sm font-medium text-gray-700 hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 transition-colors"
                >
                  {t('filters.clear_all', 'Clear all')}
                </button>
                <button
                  type="button"
                  onClick={onMobileClose}
                  className="flex-1 py-3 px-4 rounded-2xl bg-indigo-700 text-white text-sm font-semibold hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 focus-visible:ring-offset-2 transition-colors"
                >
                  {t('filters.apply', 'Show results')}
                </button>
              </div>
            </Dialog.Panel>
          </Transition>
        </div>
      </Dialog>
    </Transition>
  );

  return (
    <>
      <DesktopFilters />
      <MobileFilters />
    </>
  );
}
