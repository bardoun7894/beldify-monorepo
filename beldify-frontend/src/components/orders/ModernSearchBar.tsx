'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  TagIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

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
  placeholder = "Search orders...",
  isRTL = false,
  t
}: ModernSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const quickFilters = [
    { label: 'Last 7 days', icon: CalendarIcon, action: () => console.log('Last 7 days') },
    { label: 'High value', icon: CurrencyDollarIcon, action: () => console.log('High value') },
    { label: 'With discount', icon: TagIcon, action: () => console.log('With discount') },
  ];

  return (
    <div className="space-y-3">
      {/* Main Search Bar */}
      <motion.div
        className={`relative ${isFocused ? 'z-20' : 'z-10'}`}
        animate={isFocused ? { scale: 1.02 } : { scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className={`
          relative flex items-center gap-2 p-1 
          bg-white rounded-2xl border-2 transition-all duration-300
          ${isFocused 
            ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20' 
            : 'border-gray-200 hover:border-gray-300 shadow-md'
          }
        `}>
          {/* Search Icon with Animation */}
          <motion.div
            animate={isFocused ? { rotate: 90 } : { rotate: 0 }}
            transition={{ duration: 0.3 }}
            className="pl-3"
          >
            <MagnifyingGlassIcon className={`w-5 h-5 ${isFocused ? 'text-indigo-500' : 'text-gray-400'}`} />
          </motion.div>

          {/* Search Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="flex-1 px-2 py-3 text-sm outline-none bg-transparent placeholder-gray-400"
          />

          {/* Clear Button */}
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                onClick={() => setQuery('')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-4 h-4 text-gray-500" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200" />

          {/* Status Filter Dropdown */}
          <div className="relative">
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-xl transition-colors">
              <FunnelIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 font-medium">
                {statusFilter === 'all' ? 'All Status' : statusFilter}
              </span>
              <ChevronDownIcon className="w-3 h-3 text-gray-400" />
            </button>
          </div>

          {/* Advanced Filter Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`
              flex items-center gap-2 px-4 py-2 mr-1 rounded-xl
              transition-all duration-300
              ${showAdvanced 
                ? 'bg-indigo-500 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Filters</span>
          </motion.button>
        </div>

        {/* Search Suggestions - Shows when focused */}
        <AnimatePresence>
          {isFocused && !query && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-50"
            >
              <p className="text-xs text-gray-500 mb-2 px-2">Popular searches</p>
              <div className="space-y-1">
                {['ORD-', 'Last month', 'Pending orders', 'High priority'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuery(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
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
            <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <span className="text-sm text-gray-600 font-medium mr-2">Quick filters:</span>
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
                    className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                  >
                    <Icon className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-sm text-gray-700">{filter.label}</span>
                  </motion.button>
                );
              })}
              
              {/* Date Range Picker */}
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all ml-auto">
                <CalendarIcon className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-sm text-gray-700">Custom date range</span>
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
          <span className="text-xs text-gray-500">Active filters:</span>
          
          {query && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs"
            >
              <span>Search: "{query}"</span>
              <button
                onClick={() => setQuery('')}
                className="hover:text-indigo-900"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </motion.div>
          )}
          
          {statusFilter !== 'all' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
            >
              <span>Status: {statusFilter}</span>
              <button
                onClick={() => setStatusFilter('all')}
                className="hover:text-purple-900"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </motion.div>
          )}
          
          <button
            onClick={() => {
              setQuery('');
              setStatusFilter('all');
            }}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium ml-2"
          >
            Clear all
          </button>
        </motion.div>
      )}
    </div>
  );
}