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
                    {/* Header with premium styling */}
                    <div className="relative overflow-hidden">
                      {/* Premium gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-800 opacity-90">
                        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]"></div>
                        {/* Amber pattern overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-transparent"></div>
                      </div>
                      {/* Amber accent */}
                      <div className="absolute bottom-0 h-1 w-full bg-gradient-to-r from-amber-400 to-amber-500"></div>
                      
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
                        <span className="inline-block w-8 h-0.5 bg-gradient-to-r from-indigo-600 to-indigo-800 mr-2"></span>
                        <span className="text-amber-600 font-semibold">{t('shops.typeFilter')}</span>
                      </h3>
                      <div className="space-y-2 mt-4">
                        {shopTypes.map((type) => (
                          <Button
                            key={type.value}
                            variant={selectedType === type.value ? 'default' : 'outline'}
                            className={`w-full justify-start transition-all duration-200 ${
                              selectedType === type.value 
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-800 text-white hover:from-indigo-700 hover:to-indigo-900 shadow-md border-l-4 border-amber-400' 
                                : 'border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 hover:text-amber-700'
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
