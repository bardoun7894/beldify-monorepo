'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Search,
  X,
  SlidersHorizontal,
  Calendar,
  Tag
} from 'lucide-react';

interface ModernSearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: any) => void;
  placeholder?: string;
  isRTL?: boolean;
  t?: any;
}

export default function ModernSearchBar({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  placeholder,
  isRTL = false,
}: ModernSearchBarProps) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const resolvedPlaceholder = placeholder ?? t('orders.search.placeholder', 'Search orders...');

  // Quick filters — these wire into setStatusFilter / setQuery so they're not dead
  const statusQuickFilters = [
    {
      label: t('orders.filter.pending', 'Pending'),
      icon: Calendar,
      action: () => setStatusFilter('pending'),
    },
    {
      label: t('orders.filter.shipped', 'Shipped'),
      icon: Tag,
      action: () => setStatusFilter('shipped'),
    },
    {
      label: t('orders.filter.delivered', 'Delivered'),
      icon: Tag,
      action: () => setStatusFilter('delivered'),
    },
  ];

  return (
    <div className="space-y-3">
      {/* Main search bar */}
      <motion.div
        className={`relative ${isFocused ? 'z-20' : 'z-10'}`}
        animate={shouldReduceMotion ? { scale: 1 } : isFocused ? { scale: 1.005 } : { scale: 1 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.15, ease: [0.33, 1, 0.68, 1] }}
      >
        <div className={`
          relative flex items-center gap-2 p-1
          bg-white rounded-2xl ring-2 transition-all duration-200
          ${isFocused
            ? 'ring-indigo-700/30 shadow-atlas-sm'
            : 'ring-amber-200 hover:ring-amber-300'
          }
        `}>
          {/* Search icon */}
          <div className="ps-3">
            <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-indigo-700' : 'text-gray-400'}`} strokeWidth={1.5} />
          </div>

          {/* Search input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={resolvedPlaceholder}
            className="flex-1 px-2 py-3 text-sm outline-none bg-transparent placeholder-gray-400"
            dir={isRTL ? 'rtl' : 'ltr'}
            aria-label={resolvedPlaceholder}
          />

          {/* Clear button */}
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setQuery('')}
                className="p-2 hover:bg-amber-50 rounded-xl transition-colors focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
                aria-label={t('orders.search.clear', 'Clear search')}
              >
                <X className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="w-px h-8 bg-amber-100" />

          {/* Advanced filter toggle — status selection is owned by the pills below */}
          <motion.button
            whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`
              flex items-center gap-2 px-4 py-2 me-1 rounded-2xl
              transition-all duration-200 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none
              ${showAdvanced
                ? 'bg-indigo-700 text-white shadow-atlas-sm'
                : 'bg-amber-50 text-gray-700 hover:bg-amber-100 ring-1 ring-amber-200'
              }
            `}
            aria-label={t('orders.search.filters', 'Filters')}
            aria-expanded={showAdvanced}
          >
            <SlidersHorizontal className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-sm font-medium hidden sm:inline">
              {t('orders.search.filters', 'Filters')}
            </span>
          </motion.button>
        </div>

        {/* Search suggestions dropdown */}
        <AnimatePresence>
          {isFocused && !query && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: [0.33, 1, 0.68, 1] }}
              className="absolute top-full start-0 end-0 mt-2 bg-white rounded-2xl shadow-atlas-lg ring-1 ring-amber-100 p-3 z-50"
              role="listbox"
              aria-label={t('orders.search.popular_searches', 'Popular searches')}
            >
              <p className="text-xs text-gray-400 mb-2 px-2 uppercase tracking-wider">
                {t('orders.search.quick_filter_label', 'Quick filters')}
              </p>
              <div className="space-y-0.5">
                {statusQuickFilters.map((f) => (
                  <button
                    key={f.label}
                    onMouseDown={(e) => {
                      // prevent onBlur from closing before click fires
                      e.preventDefault();
                      f.action();
                    }}
                    className="w-full text-start px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors"
                    role="option"
                    aria-selected={false}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Advanced quick filters panel */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 p-4 bg-amber-50 rounded-2xl ring-1 ring-amber-200">
              <span className="text-sm text-gray-600 font-medium me-2">
                {t('orders.search.quick_filters_label', 'Quick filters:')}
              </span>
              {statusQuickFilters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <motion.button
                    key={filter.label}
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    onClick={filter.action}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl ring-1 ring-amber-200 hover:ring-indigo-300 hover:bg-indigo-50 transition-all duration-200 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
                  >
                    <Icon className="w-3.5 h-3.5 text-indigo-700" strokeWidth={1.5} />
                    {filter.label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filters tags */}
      {(query || statusFilter !== 'all') && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-xs text-gray-400">
            {t('orders.search.active_filters', 'Active filters:')}
          </span>

          {query && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
            >
              <span>{t('orders.search.filter_tag_search', 'Search')}: &ldquo;{query}&rdquo;</span>
              <button
                onClick={() => setQuery('')}
                className="hover:text-indigo-900 focus:outline-none"
                aria-label={t('orders.search.clear', 'Clear search')}
              >
                <X className="w-3 h-3" strokeWidth={2} />
              </button>
            </motion.div>
          )}

          {statusFilter !== 'all' && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"
            >
              <span>{t('orders.search.filter_tag_status', 'Status')}: {t(`orders.filter.${statusFilter}`, { defaultValue: statusFilter })}</span>
              <button
                onClick={() => setStatusFilter('all')}
                className="hover:text-amber-900 focus:outline-none"
                aria-label={t('orders.search.clear_filter', 'Clear filter')}
              >
                <X className="w-3 h-3" strokeWidth={2} />
              </button>
            </motion.div>
          )}

          <button
            onClick={() => {
              setQuery('');
              setStatusFilter('all');
            }}
            className="text-xs text-indigo-700 hover:text-indigo-800 font-medium ms-2 focus:underline"
          >
            {t('orders.search.clear_all', 'Clear all')}
          </button>
        </motion.div>
      )}
    </div>
  );
}
