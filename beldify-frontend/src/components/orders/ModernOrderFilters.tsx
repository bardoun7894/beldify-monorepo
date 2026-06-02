'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Settings,
  Truck,
  CheckCircle,
  XCircle,
  Sparkles,
  Filter
} from 'lucide-react';

interface FilterOption {
  key: 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverBg: string;
  activeBg: string;
  activeText: string;
}

interface ModernOrderFiltersProps {
  statusFilter: string;
  setStatusFilter: (filter: any) => void;
  statusCounts: Record<string, number>;
  filterLabel: (key: string) => string;
  isRTL?: boolean;
}

export default function ModernOrderFilters({
  statusFilter,
  setStatusFilter,
  statusCounts,
  filterLabel,
  isRTL = false,
}: ModernOrderFiltersProps) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const filterOptions: FilterOption[] = [
    {
      key: 'all',
      label: filterLabel('all'),
      count: statusCounts.all || 0,
      icon: Sparkles,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      hoverBg: 'hover:bg-indigo-50',
      activeBg: 'bg-indigo-700',
      activeText: 'text-white',
    },
    {
      key: 'pending',
      label: filterLabel('pending'),
      count: statusCounts.pending || 0,
      icon: Clock,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      hoverBg: 'hover:bg-amber-50',
      activeBg: 'bg-indigo-700',
      activeText: 'text-white',
    },
    {
      key: 'processing',
      label: filterLabel('processing'),
      count: statusCounts.processing || 0,
      icon: Settings,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      hoverBg: 'hover:bg-indigo-50',
      activeBg: 'bg-indigo-700',
      activeText: 'text-white',
    },
    {
      key: 'shipped',
      label: filterLabel('shipped'),
      count: statusCounts.shipped || 0,
      icon: Truck,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      hoverBg: 'hover:bg-indigo-50',
      activeBg: 'bg-indigo-700',
      activeText: 'text-white',
    },
    {
      key: 'delivered',
      label: filterLabel('delivered'),
      count: statusCounts.delivered || 0,
      icon: CheckCircle,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      hoverBg: 'hover:bg-emerald-50',
      activeBg: 'bg-indigo-700',
      activeText: 'text-white',
    },
    {
      key: 'cancelled',
      label: filterLabel('cancelled'),
      count: statusCounts.cancelled || 0,
      icon: XCircle,
      color: 'text-rose-700',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      hoverBg: 'hover:bg-rose-50',
      activeBg: 'bg-indigo-700',
      activeText: 'text-white',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter pills — Desktop */}
      <div className="hidden lg:flex items-center gap-2 flex-wrap">
        {filterOptions.map((option, index) => {
          const isActive = statusFilter === option.key;
          const Icon = option.icon;

          return (
            <motion.button
              key={option.key}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shouldReduceMotion ? 0 : index * 0.04, ease: [0.33, 1, 0.68, 1] }}
              whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              onClick={() => setStatusFilter(option.key)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-full
                transition-all duration-200 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none
                ${isActive
                  ? `${option.activeBg} ${option.activeText} shadow-atlas-sm`
                  : `bg-white border ${option.borderColor} ${option.hoverBg} hover:shadow-atlas-sm`
                }
              `}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? 'text-white' : option.color}`}
                strokeWidth={1.5}
              />
              <span className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-700'}`}>
                {option.label}
              </span>
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-bold
                ${isActive
                  ? 'bg-white/20 text-white'
                  : `${option.bgColor} ${option.color}`
                }
              `}>
                {option.count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Grid cards — Tablet */}
      <div className="hidden sm:grid lg:hidden grid-cols-3 gap-3">
        {filterOptions.map((option, index) => {
          const isActive = statusFilter === option.key;
          const Icon = option.icon;

          return (
            <motion.button
              key={option.key}
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: shouldReduceMotion ? 0 : index * 0.04, ease: [0.33, 1, 0.68, 1] }}
              whileHover={shouldReduceMotion ? undefined : { y: -2 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              onClick={() => setStatusFilter(option.key)}
              className={`
                relative overflow-hidden p-4 rounded-2xl
                transition-all duration-200 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none
                ${isActive
                  ? `${option.activeBg} text-white shadow-atlas-md`
                  : `bg-white border-2 ${option.borderColor} hover:shadow-atlas-sm`
                }
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon
                  className={`w-6 h-6 ${isActive ? 'text-white' : option.color}`}
                  strokeWidth={1.5}
                />
                <span className={`text-2xl font-bold ${isActive ? 'text-white' : 'text-gray-900'}`}>
                  {option.count}
                </span>
              </div>
              <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-600'}`}>
                {option.label}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Mobile horizontal scroll */}
      <div className="sm:hidden overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max px-1">
          {filterOptions.map((option, index) => {
            const isActive = statusFilter === option.key;
            const Icon = option.icon;

            return (
              <motion.button
                key={option.key}
                initial={shouldReduceMotion ? false : { opacity: 0, x: isRTL ? 12 : -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: shouldReduceMotion ? 0 : index * 0.04, ease: [0.33, 1, 0.68, 1] }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                onClick={() => setStatusFilter(option.key)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-2xl whitespace-nowrap
                  transition-all duration-200 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none
                  ${isActive
                    ? `${option.activeBg} text-white shadow-atlas-sm`
                    : `bg-white border ${option.borderColor} ${option.hoverBg}`
                  }
                `}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-white' : option.color}`}
                  strokeWidth={1.5}
                />
                <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>
                  {option.label}
                </span>
                <span className={`
                  px-1.5 py-0.5 rounded-full text-xs font-bold
                  ${isActive ? 'bg-white/20 text-white' : `${option.bgColor} ${option.color}`}
                `}>
                  {option.count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Active filter summary */}
      {statusFilter !== 'all' && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-4 py-2.5 bg-amber-50 rounded-2xl ring-1 ring-amber-200"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-700" strokeWidth={1.5} />
            <span className="text-sm text-gray-700">
              {t('orders.filter.filtering_by', 'Filtering by')}:{' '}
              <span className="font-semibold text-indigo-700">{filterLabel(statusFilter)}</span>
            </span>
          </div>
          <button
            onClick={() => setStatusFilter('all')}
            className="text-sm text-indigo-700 hover:text-indigo-800 font-medium focus:underline"
          >
            {t('orders.filter.clear', 'Clear filter')}
          </button>
        </motion.div>
      )}
    </div>
  );
}
