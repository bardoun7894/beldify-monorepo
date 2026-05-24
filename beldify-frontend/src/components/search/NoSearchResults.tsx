'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { 
  MagnifyingGlassIcon, 
  LightBulbIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';

interface NoSearchResultsProps {
  query?: string;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  'djellaba',
  'caftan',
  'babouches',
  'handmade',
  'traditional',
  'leather',
];

export default function NoSearchResults({ 
  query, 
  suggestions = DEFAULT_SUGGESTIONS 
}: NoSearchResultsProps) {
  const { t } = useTranslation();

  return (
    <div className="text-center py-12 px-4">
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <MagnifyingGlassIcon className="h-10 w-10 text-indigo-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {t('search.no_results_title')}
      </h3>
      
      {query && (
        <p className="text-gray-500 mb-6">
          {t('search.no_results_for', { query })}
        </p>
      )}

      <div className="max-w-md mx-auto">
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 mb-6">
          <div className="flex items-start gap-3">
            <LightBulbIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <h4 className="font-medium text-amber-900 mb-1">
                {t('search.try_these_tips')}
              </h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>{t('search.tip_1')}</li>
                <li>{t('search.tip_2')}</li>
                <li>{t('search.tip_3')}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-left">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            {t('search.popular_searches')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <Link
                key={suggestion}
                href={`/products?q=${encodeURIComponent(suggestion)}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                {suggestion}
                <ArrowRightIcon className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {t('search.browse_all_products')}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
