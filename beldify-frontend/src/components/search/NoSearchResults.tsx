'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Search, Lightbulb, ArrowRight, Megaphone } from 'lucide-react';

interface OpenSoukMatch {
  id: number;
  title: string;
  budget_min?: number | null;
  budget_max?: number | null;
  currency?: string;
  response_count?: number;
}

interface NoSearchResultsProps {
  query?: string;
  suggestions?: string[];
  /** "Did you mean X?" — backend curated-synonym suggestion on a dead-end search. */
  didYouMean?: string | null;
  /** Matching open Open Souk requests to cross-link to (T12). */
  openSoukMatches?: OpenSoukMatch[];
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
  suggestions = DEFAULT_SUGGESTIONS,
  didYouMean = null,
  openSoukMatches = [],
}: NoSearchResultsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center py-16 px-4 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-indigo-50 ring-1 ring-indigo-100 flex items-center justify-center mb-5">
        <Search className="h-7 w-7 text-indigo-400" aria-hidden="true" />
      </div>

      {/* Headline */}
      <h3
        className="text-2xl font-semibold text-gray-900 mb-2"
        style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
      >
        {t('search.no_results_title', 'Nothing found')}
      </h3>

      {query && (
        <p className="text-gray-500 text-sm mb-3 max-w-xs">
          {t('search.no_results_for', 'No results for "{{query}}"', { query })}
        </p>
      )}

      {/* Did you mean — curated synonym correction */}
      {didYouMean && (
        <p className="text-gray-600 text-sm mb-8">
          {t('search.did_you_mean', 'Did you mean')}{' '}
          <Link
            href={`/products?q=${encodeURIComponent(didYouMean)}`}
            className="font-semibold text-indigo-700 underline underline-offset-2 hover:text-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
          >
            {didYouMean}
          </Link>
          ?
        </p>
      )}

      {/* Tips card */}
      <div className="max-w-sm w-full">
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 mb-6 text-start">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900 mb-1.5">
                {t('search.try_these_tips', 'Try these tips')}
              </h4>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                <li>{t('search.tip_1', 'Check the spelling')}</li>
                <li>{t('search.tip_2', 'Try more general terms')}</li>
                <li>{t('search.tip_3', 'Browse categories below')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Popular searches */}
        <div className="text-start">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            {t('search.popular_searches', 'Popular searches')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <Link
                key={suggestion}
                href={`/products?q=${encodeURIComponent(suggestion)}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 text-sm hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 transition-colors"
              >
                {suggestion}
                <ArrowRight className="h-3 w-3 shrink-0" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>

        {/* Browse all */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded transition-colors"
          >
            {t('search.browse_all_products', 'Browse all products')}
            <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>

        {/* T12 — matching open Open Souk requests for this dead-end search */}
        {openSoukMatches.length > 0 && (
          <div className="mt-6 text-start">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              {t('search.open_souk_matches', 'People are looking for this too')}
            </h4>
            <ul className="space-y-2">
              {openSoukMatches.map((match) => (
                <li key={match.id}>
                  <Link
                    href={`/community/posts/${match.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-indigo-300 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 transition-colors"
                  >
                    <span className="text-sm text-gray-800 line-clamp-1 text-start">{match.title}</span>
                    <span className="shrink-0 text-xs text-gray-500">
                      {t('search.open_souk_responses', '{{count}} offers', { count: match.response_count ?? 0 })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* OpenSouk — reverse-marketplace CTA (the core differentiator) */}
        <div className="mt-6 rounded-2xl bg-indigo-700 p-5 text-center text-white shadow-atlas-sm">
          <Megaphone className="h-6 w-6 mx-auto mb-2 text-amber-300" aria-hidden="true" />
          <p className="text-sm font-semibold">
            {t('openSouk.nudgeTitle', "Can't find what you're looking for?")}
          </p>
          <p className="mt-1 text-[13px] text-indigo-100 leading-snug">
            {t('openSouk.nudgeBody', '')}
          </p>
          <Link
            href="/community"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-indigo-800 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            {t('openSouk.nudgeCta', 'Browse requests & post yours')}
            <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
