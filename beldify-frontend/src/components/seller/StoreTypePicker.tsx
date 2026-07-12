'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useStoreTypes } from '@/hooks/useStoreTypes';

interface StoreTypePickerProps {
  value: number | null;
  onChange: (storeTypeId: number) => void;
}

/**
 * "What do you sell?" — supplies `store_type_id` (the store's VERTICAL).
 *
 * Deliberately separate from the `business_type` question (legal structure:
 * individual/company/cooperative). Options come from GET /api/store-types —
 * never hardcoded, so a wrong-but-silent default can never be sent.
 */
export default function StoreTypePicker({ value, onChange }: StoreTypePickerProps) {
  const { t } = useTranslation();
  const { storeTypes, isLoading, error, refetch } = useStoreTypes();

  if (isLoading) {
    return (
      <div
        data-testid="store-type-loading"
        className="flex items-center gap-2 p-4 rounded-2xl bg-amber-50 ring-1 ring-amber-200 text-sm text-gray-500"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-4 h-4 animate-spin text-indigo-700" aria-hidden="true" />
        {t('seller.register.store_type_loading', 'Loading store categories...')}
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-testid="store-type-error"
        className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 ring-1 ring-rose-200 text-sm text-rose-700"
        role="alert"
      >
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <p>
            {t(
              'seller.register.store_type_load_error',
              'We could not load store categories. Please try again.'
            )}
          </p>
          <button
            type="button"
            onClick={refetch}
            className="mt-2 text-sm font-semibold text-rose-700 underline hover:text-rose-900"
          >
            {t('common.retry', 'Try again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
      role="group"
      aria-label={t('seller.register.store_type_label', 'What do you sell?')}
    >
      {storeTypes.map((storeType) => {
        const isSelected = value === storeType.id;
        return (
          <button
            key={storeType.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(storeType.id)}
            className={`min-h-[44px] px-3 py-2.5 rounded-2xl text-sm font-medium text-center transition-all duration-150 ring-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700/50 ${
              isSelected
                ? 'bg-indigo-700 text-white ring-indigo-700 shadow-atlas-sm'
                : 'bg-amber-50 text-gray-700 ring-amber-200 hover:bg-amber-100'
            }`}
          >
            {storeType.name}
          </button>
        );
      })}
    </div>
  );
}
