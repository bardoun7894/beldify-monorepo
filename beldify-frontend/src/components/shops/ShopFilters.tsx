'use client';

import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface ShopFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
}

export default function ShopFilters({
  isOpen,
  onClose,
  selectedType,
  onTypeChange,
}: ShopFiltersProps) {
  const { t } = useTranslation();

  // These should match the store_type slugs in your database
  const shopTypes = [
    { value: '', label: t('shops.types.all', 'All sellers') },
    { value: 'individual', label: t('shops.types.individual', 'Individual artisan') },
    { value: 'company', label: t('shops.types.company', 'Company') },
    { value: 'manufacturer', label: t('shops.types.manufacturer', 'Manufacturer') },
    { value: 'distributor', label: t('shops.types.distributor', 'Distributor') },
  ];

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            {/* Drawer anchored to inline-end (RTL-safe: end = right in LTR, left in RTL) */}
            <div className="pointer-events-none fixed inset-y-0 end-0 flex max-w-full ps-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-sm">
                  <div className="flex h-full flex-col overflow-y-auto bg-white shadow-atlas-xl">
                    {/* Header — Atlas indigo-950 surface */}
                    <div className="relative overflow-hidden bg-indigo-950 shrink-0">
                      <div
                        aria-hidden
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            'radial-gradient(ellipse 80% 60% at 10% 80%, hsl(38 92% 50% / 0.18) 0%, transparent 60%)',
                        }}
                      />
                      <div className="relative flex items-center justify-between px-6 py-5">
                        <Dialog.Title className="flex items-center gap-2.5 text-base font-semibold text-white">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-gray-300">
                            <FunnelIcon className="h-4 w-4 text-amber-300" aria-hidden="true" />
                          </span>
                          {t('shops.filters', 'Filters')}
                        </Dialog.Title>
                        <button
                          type="button"
                          onClick={onClose}
                          aria-label={t('actions.close', 'Close')}
                          className="rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 transition focus-visible:ring-2 focus-visible:ring-white/40"
                        >
                          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 px-6 py-7">
                      <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-5">
                        {t('shops.typeFilter', 'Seller type')}
                      </p>
                      <div className="space-y-2.5">
                        {shopTypes.map((type) => {
                          const isActive = selectedType === type.value;
                          return (
                            <Button
                              key={type.value}
                              variant={isActive ? 'default' : 'outline'}
                              className={`w-full justify-start rounded-full transition-all duration-150 ${
                                isActive
                                  ? 'bg-indigo-700 text-white hover:bg-indigo-800 shadow-atlas-sm'
                                  : 'ring-1 ring-amber-200 hover:ring-amber-300 hover:bg-amber-50 text-gray-700'
                              }`}
                              onClick={() => {
                                onTypeChange(type.value);
                                onClose();
                              }}
                            >
                              {type.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="shrink-0 px-6 py-4 border-t border-gray-200">
                      <Button
                        variant="ghost"
                        className="w-full rounded-full text-indigo-700 hover:bg-indigo-50"
                        onClick={() => {
                          onTypeChange('');
                          onClose();
                        }}
                      >
                        {t('common.actions.clearFilters', 'Clear all filters')}
                      </Button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
