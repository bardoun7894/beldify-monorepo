'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Search,
  X,
  SlidersHorizontal,
  Calendar,
  DollarSign,
  Tag,
  ChevronDown,
  Filter
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
  const [isFocused, setIsFocused] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const resolvedPlaceholder = placeholder ?? t('orders.search.placeholder', 'Search orders...');

  const quickFilters = [
    { label: t('orders.search.quick_filters.last_7_days', 'Last 7 days'), icon: Calendar, action: () => {} },
    { label: t('orders.search.quick_filters.high_value', 'High value'), icon: DollarSign, action: () => {} },
    { label: t('orders.search.quick_filters.with_discount', 'With discount'), icon: Tag, action: () => {} },
  ];

  const popularSearches: string[] = [
    'ORD-',
    t('orders.search.popular.last_month', 'Last month'),
    t('orders.search.popular.pending', 'Pending orders'),
    t('orders.search.popular.high_priority', 'High priority'),
  ];

  return (
    <div className="space-y-3">
      {/* Main Search Bar */}
      <motion.div
        className={`relative ${isFocused ? 'z-20' : 'z-10'}`}
        animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className={`
          relative flex items-center gap-2 p-1
          bg-white rounded-2xl ring-2 transition-all duration-300
          ${isFocused
            ? 'ring-indigo-500 shadow-lg shadow-indigo-100'
            : 'ring-amber-200 hover:ring-amber-300 shadow-sm'
          }
        `}>
          {/* Search Icon */}
          <motion.div
            animate={isFocused ? { rotate: 90 } : { rotate: 0 }}
            transition={{ duration: 0.3 }}
            className="ps-3"
          >
            <Search className={`w-5 h-5 ${isFocused ? 'text-indigo-700' : 'text-gray-400'}`} />
          </motion.div>

          {/* Search Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={resolvedPlaceholder}
            className="flex-1 px-2 py-3 text-sm outline-none bg-transparent placeholder-gray-400"
            dir={isRTL ? 'rtl' : 'ltr'}
          />

          {/* Clear Button */}
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                onClick={() => setQuery('')}
                className="p-2 hover:bg-amber-50 rounded-xl transition-colors"
                aria-label={t('orders.search.clear', 'Clear search')}
              >
                <X className="w-4 h-4 text-gray-500" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="w-px h-8 bg-amber-200" />

          {/* Status Filter Display */}
          <div className="relative">
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-amber-50 rounded-xl transition-colors">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 font-medium">
                {statusFilter === 'all'
                  ? t('orders.search.all_status', 'All Status')
                  : statusFilter}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
          </div>

          {/* Advanced Filter Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`
              flex items-center gap-2 px-4 py-2 me-1 rounded-2xl
              transition-all duration-300
              ${showAdvanced
                ? 'bg-indigo-700 text-white shadow-md'
                : 'bg-amber-50 text-gray-700 hover:bg-amber-100 ring-1 ring-amber-200'
              }
            `}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">
              {t('orders.search.filters', 'Filters')}
            </span>
          </motion.button>
        </div>

        {/* Search Suggestions */}
        <AnimatePresence>
          {isFocused && !query && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl ring-1 ring-amber-100 p-3 z-50"
            >
              <p className="text-xs text-gray-500 mb-2 px-2">
                {t('orders.search.popular_searches', 'Popular searches')}
              </p>
              <div className="space-y-1">
                {popularSearches.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuery(suggestion)}
                    className="w-full text-start px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick Filters Bar */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 p-4 bg-amber-50 rounded-2xl ring-1 ring-amber-200">
              <span className="text-sm text-gray-600 font-medium me-2">
                {t('orders.search.quick_filters_label', 'Quick filters:')}
              </span>
              {quickFilters.map((filter, index) => {
                const Icon = filter.icon;
                return (
                  <motion.button
                    key={filter.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={filter.action}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl ring-1 ring-amber-200 hover:ring-indigo-300 hover:bg-indigo-50 transition-all"
                  >
                    <Icon className="w-3.5 h-3.5 text-indigo-700" />
                    <span className="text-sm text-gray-700">{filter.label}</span>
                  </motion.button>
                );
              })}

              {/* Custom date range */}
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl ring-1 ring-amber-200 hover:ring-amber-300 transition-all ms-auto">
                <Calendar className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-sm text-gray-700">
                  {t('orders.search.custom_date_range', 'Custom date range')}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {(query || statusFilter !== 'all') && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-xs text-gray-500">
            {t('orders.search.active_filters', 'Active filters:')}
          </span>

          {query && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs"
            >
              <span>{t('orders.search.filter_tag_search', 'Search')}: &ldquo;{query}&rdquo;</span>
              <button
                onClick={() => setQuery('')}
                className="hover:text-indigo-900"
                aria-label={t('orders.search.clear', 'Clear search')}
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}

          {statusFilter !== 'all' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs"
            >
              <span>{t('orders.search.filter_tag_status', 'Status')}: {statusFilter}</span>
              <button
                onClick={() => setStatusFilter('all')}
                className="hover:text-amber-900"
                aria-label={t('orders.search.clear_filter', 'Clear filter')}
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}

          <button
            onClick={() => {
              setQuery('');
              setStatusFilter('all');
            }}
            className="text-xs text-indigo-700 hover:text-indigo-800 font-medium ms-2"
          >
            {t('orders.search.clear_all', 'Clear all')}
          </button>
        </motion.div>
      )}
    </div>
  );
}
