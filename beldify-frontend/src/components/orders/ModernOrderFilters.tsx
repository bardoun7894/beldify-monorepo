'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  CogIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  FunnelIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import {
  ClockIcon as ClockSolid,
  CogIcon as CogSolid,
  TruckIcon as TruckSolid,
  CheckCircleIcon as CheckSolid,
  XCircleIcon as XSolid,
  SparklesIcon as SparklesSolid
} from '@heroicons/react/24/solid';

interface FilterOption {
  key: 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  label: string;
  count: number;
  icon: React.ElementType;
  activeIcon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverBg: string;
  activeBg: string;
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
  isRTL = false
}: ModernOrderFiltersProps) {
  const filterOptions: FilterOption[] = [
    {
      key: 'all',
      label: filterLabel('all'),
      count: statusCounts.all || 0,
      icon: SparklesIcon,
      activeIcon: SparklesSolid,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      hoverBg: 'hover:bg-purple-50',
      activeBg: 'bg-gradient-to-r from-purple-500 to-indigo-500'
    },
    {
      key: 'pending',
      label: filterLabel('pending'),
      count: statusCounts.pending || 0,
      icon: ClockIcon,
      activeIcon: ClockSolid,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      hoverBg: 'hover:bg-amber-50',
      activeBg: 'bg-gradient-to-r from-amber-500 to-orange-500'
    },
    {
      key: 'processing',
      label: filterLabel('processing'),
      count: statusCounts.processing || 0,
      icon: CogIcon,
      activeIcon: CogSolid,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverBg: 'hover:bg-blue-50',
      activeBg: 'bg-gradient-to-r from-blue-500 to-cyan-500'
    },
    {
      key: 'shipped',
      label: filterLabel('shipped'),
      count: statusCounts.shipped || 0,
      icon: TruckIcon,
      activeIcon: TruckSolid,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      hoverBg: 'hover:bg-indigo-50',
      activeBg: 'bg-gradient-to-r from-indigo-500 to-purple-500'
    },
    {
      key: 'delivered',
      label: filterLabel('delivered'),
      count: statusCounts.delivered || 0,
      icon: CheckCircleIcon,
      activeIcon: CheckSolid,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      hoverBg: 'hover:bg-emerald-50',
      activeBg: 'bg-gradient-to-r from-emerald-500 to-green-500'
    },
    {
      key: 'cancelled',
      label: filterLabel('cancelled'),
      count: statusCounts.cancelled || 0,
      icon: XCircleIcon,
      activeIcon: XSolid,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      hoverBg: 'hover:bg-gray-50',
      activeBg: 'bg-gradient-to-r from-gray-500 to-slate-500'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Modern Filter Pills - Desktop */}
      <div className="hidden lg:flex items-center gap-2 flex-wrap">
        {filterOptions.map((option, index) => {
          const isActive = statusFilter === option.key;
          const Icon = isActive ? option.activeIcon : option.icon;
          
          return (
            <motion.button
              key={option.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStatusFilter(option.key)}
              className={`
                relative group flex items-center gap-2 px-4 py-2.5 rounded-full
                transition-all duration-300 ease-out transform
                ${isActive 
                  ? `${option.activeBg} text-white shadow-lg scale-105` 
                  : `bg-white border ${option.borderColor} ${option.hoverBg} hover:shadow-md`
                }
              `}
            >
              {/* Animated Background Glow */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-white opacity-20"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0, 0.2],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              
              {/* Icon with animation */}
              <motion.div
                animate={isActive ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : option.color}`} />
              </motion.div>
              
              {/* Label */}
              <span className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-700'}`}>
                {option.label}
              </span>
              
              {/* Count Badge */}
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-bold
                ${isActive 
                  ? 'bg-white/20 text-white' 
                  : `${option.bgColor} ${option.color}`
                }
              `}>
                {option.count}
              </span>
              
              {/* Hover Effect Dot */}
              {!isActive && (
                <motion.div
                  className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${option.bgColor} opacity-0 group-hover:opacity-100`}
                  animate={{
                    scale: [0, 1.5, 1],
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Modern Grid Cards - Tablet */}
      <div className="hidden sm:grid lg:hidden grid-cols-3 gap-3">
        {filterOptions.map((option, index) => {
          const isActive = statusFilter === option.key;
          const Icon = isActive ? option.activeIcon : option.icon;
          
          return (
            <motion.button
              key={option.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStatusFilter(option.key)}
              className={`
                relative overflow-hidden p-4 rounded-2xl
                transition-all duration-300 transform
                ${isActive 
                  ? `${option.activeBg} text-white shadow-xl` 
                  : `bg-white border-2 ${option.borderColor} hover:shadow-lg`
                }
              `}
            >
              {/* Animated Pattern Background */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                  animate={{
                    x: [0, 10, 0],
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              )}
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-6 h-6 ${isActive ? 'text-white' : option.color}`} />
                  <span className={`text-2xl font-bold ${isActive ? 'text-white' : 'text-gray-900'}`}>
                    {option.count}
                  </span>
                </div>
                <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-600'}`}>
                  {option.label}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Mobile Horizontal Scroll */}
      <div className="sm:hidden overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max px-4">
          {filterOptions.map((option, index) => {
            const isActive = statusFilter === option.key;
            const Icon = isActive ? option.activeIcon : option.icon;
            
            return (
              <motion.button
                key={option.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStatusFilter(option.key)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap
                  transition-all duration-300
                  ${isActive 
                    ? `${option.activeBg} text-white shadow-lg` 
                    : `bg-white border ${option.borderColor} ${option.hoverBg}`
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : option.color}`} />
                <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>
                  {option.label}
                </span>
                <span className={`
                  px-1.5 py-0.5 rounded text-xs font-bold
                  ${isActive ? 'bg-white/20 text-white' : `${option.bgColor} ${option.color}`}
                `}>
                  {option.count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Filter Summary Bar */}
      {statusFilter !== 'all' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100"
        >
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-indigo-600" />
            <span className="text-sm text-gray-700">
              Filtering by: <span className="font-semibold">{filterLabel(statusFilter)}</span>
            </span>
          </div>
          <button
            onClick={() => setStatusFilter('all')}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Clear filter
          </button>
        </motion.div>
      )}
    </div>
  );
}