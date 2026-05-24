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
    { value: '', label: t('shops.types.all') },
    { value: 'individual', label: t('shops.types.individual') },
    { value: 'company', label: t('shops.types.company') },
    { value: 'manufacturer', label: t('shops.types.manufacturer') },
    { value: 'distributor', label: t('shops.types.distributor') },
  ];

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
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
                    {/* Header with Atlas styling */}
                    <div className="relative overflow-hidden">
                      <div className="absolute inset-0 bg-indigo-900">
                        <div
                          aria-hidden
                          className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_15%_15%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_85%_60%,_#6366f1_0,_transparent_50%)]"
                        />
                      </div>

                      <div className="relative flex items-center justify-between px-4 py-6 sm:px-6">
                        <Dialog.Title className="flex items-center text-base font-semibold leading-6 text-white">
                          <div className="rounded-full bg-white/10 p-1 ring-2 ring-amber-300 ring-opacity-70">
                            <FunnelIcon className="h-4 w-4 text-white" aria-hidden="true" />
                          </div>
                          {t('shops.filters')}
                        </Dialog.Title>
                        <div className="flex h-7 items-center">
                          <button
                            type="button"
                            className="relative rounded-full p-1.5 bg-white/20 text-white hover:bg-white/30 transition-all duration-200 backdrop-blur-sm"
                            onClick={onClose}
                          >
                            <span className="sr-only">{t('actions.close')}</span>
                            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Content with improved styling */}
                    <div className="p-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                        <span className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">{t('shops.typeFilter')}</span>
                      </h3>
                      <div className="space-y-2 mt-4">
                        {shopTypes.map((type) => (
                          <Button
                            key={type.value}
                            variant={selectedType === type.value ? 'default' : 'outline'}
                            className={`w-full justify-start rounded-full transition-all duration-200 ${
                              selectedType === type.value
                                ? 'bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm'
                                : 'ring-1 ring-amber-200 hover:ring-amber-300 hover:bg-amber-50 text-gray-700 hover:text-amber-700'
                            }`}
                            onClick={() => {
                              onTypeChange(type.value);
                              onClose();
                            }}
                          >
                            {type.label}
                          </Button>
                        ))}
                      </div>
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
