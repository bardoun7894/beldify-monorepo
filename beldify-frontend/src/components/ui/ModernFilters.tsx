'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface FilterOption {
  id: string;
  label: string;
  value: any;
  count?: number;
  icon?: React.ElementType;
  color?: string;
  description?: string;
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  type: 'single' | 'multiple' | 'range';
  color?: string;
}

interface ModernFiltersProps {
  filterGroups: FilterGroup[];
  activeFilters: Record<string, any>;
  onFilterChange: (groupId: string, value: any) => void;
  onClearAll: () => void;
  style?: 'pills' | 'cards' | 'minimal';
  showCounts?: boolean;
  className?: string;
}

export default function ModernFilters({
  filterGroups,
  activeFilters,
  onFilterChange,
  onClearAll,
  style = 'pills',
  showCounts = true,
  className = ''
}: ModernFiltersProps) {
  const hasActiveFilters = Object.keys(activeFilters).some(key => 
    activeFilters[key] && 
    (Array.isArray(activeFilters[key]) ? activeFilters[key].length > 0 : true)
  );

  const PillStyle = ({ group }: { group: FilterGroup }) => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        {group.label}
        {group.color && <span className={`w-2 h-2 rounded-full bg-${group.color}-500`} />}
      </h3>
      <div className="flex flex-wrap gap-2">
        {group.options.map((option, index) => {
          const isActive = group.type === 'multiple' 
            ? (activeFilters[group.id] || []).includes(option.value)
            : activeFilters[group.id] === option.value;
          
          const Icon = option.icon;
          
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (group.type === 'multiple') {
                  const current = activeFilters[group.id] || [];
                  const updated = current.includes(option.value)
                    ? current.filter((v: any) => v !== option.value)
                    : [...current, option.value];
                  onFilterChange(group.id, updated);
                } else {
                  onFilterChange(group.id, isActive ? null : option.value);
                }
              }}
              className={`
                relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                transition-all duration-300 border-2
                ${isActive
                  ? `bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent shadow-lg`
                  : `bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md`
                }
              `}
            >
              {/* Glow effect for active */}
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
                  }}
                />
              )}
              
              {Icon && <Icon className="w-4 h-4" />}
              <span>{option.label}</span>
              {showCounts && option.count !== undefined && (
                <span className={`
                  px-1.5 py-0.5 rounded-full text-xs font-bold
                  ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}
                `}>
                  {option.count}
                </span>
              )}
              
              {isActive && (
                <CheckIcon className="w-3 h-3 ml-1" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  const CardStyle = ({ group }: { group: FilterGroup }) => (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-gray-800">{group.label}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {group.options.map((option, index) => {
          const isActive = group.type === 'multiple' 
            ? (activeFilters[group.id] || []).includes(option.value)
            : activeFilters[group.id] === option.value;
          
          const Icon = option.icon;
          
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (group.type === 'multiple') {
                  const current = activeFilters[group.id] || [];
                  const updated = current.includes(option.value)
                    ? current.filter((v: any) => v !== option.value)
                    : [...current, option.value];
                  onFilterChange(group.id, updated);
                } else {
                  onFilterChange(group.id, isActive ? null : option.value);
                }
              }}
              className={`
                relative p-4 rounded-2xl border-2 transition-all duration-300
                ${isActive
                  ? `bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent shadow-xl`
                  : `bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:shadow-lg`
                }
              `}
            >
              {/* Pattern background for active cards */}
              {isActive && (
                <div 
                  className="absolute inset-0 rounded-2xl opacity-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />
              )}
              
              <div className="relative z-10 text-center">
                {Icon && (
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${isActive ? 'text-white' : 'text-indigo-500'}`} />
                )}
                <h4 className="font-semibold mb-1">{option.label}</h4>
                {option.description && (
                  <p className={`text-xs ${isActive ? 'text-indigo-100' : 'text-gray-500'}`}>
                    {option.description}
                  </p>
                )}
                {showCounts && option.count !== undefined && (
                  <div className={`
                    mt-2 px-2 py-1 rounded-full text-xs font-bold inline-block
                    ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}
                  `}>
                    {option.count} items
                  </div>
                )}
              </div>
              
              {/* Check indicator */}
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                >
                  <CheckIcon className="w-4 h-4 text-indigo-600" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  const MinimalStyle = ({ group }: { group: FilterGroup }) => (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
        {group.label}
      </h3>
      <div className="flex flex-wrap gap-1">
        {group.options.map((option) => {
          const isActive = group.type === 'multiple' 
            ? (activeFilters[group.id] || []).includes(option.value)
            : activeFilters[group.id] === option.value;
          
          return (
            <button
              key={option.id}
              onClick={() => {
                if (group.type === 'multiple') {
                  const current = activeFilters[group.id] || [];
                  const updated = current.includes(option.value)
                    ? current.filter((v: any) => v !== option.value)
                    : [...current, option.value];
                  onFilterChange(group.id, updated);
                } else {
                  onFilterChange(group.id, isActive ? null : option.value);
                }
              }}
              className={`
                px-3 py-1 text-xs font-medium rounded-md transition-all
                ${isActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {option.label}
              {showCounts && option.count !== undefined && (
                <span className="ml-1">({option.count})</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {filterGroups.map((group) => (
        <div key={group.id}>
          {style === 'pills' && <PillStyle group={group} />}
          {style === 'cards' && <CardStyle group={group} />}
          {style === 'minimal' && <MinimalStyle group={group} />}
        </div>
      ))}
      
      {/* Active Filters Summary */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>
              {Object.entries(activeFilters).map(([groupId, value]) => {
                if (!value || (Array.isArray(value) && value.length === 0)) return null;
                
                const group = filterGroups.find(g => g.id === groupId);
                if (!group) return null;
                
                if (Array.isArray(value)) {
                  return value.map(v => {
                    const option = group.options.find(o => o.value === v);
                    return option ? (
                      <span
                        key={`${groupId}-${v}`}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                      >
                        {option.label}
                        <button
                          onClick={() => {
                            const updated = value.filter((val: any) => val !== v);
                            onFilterChange(groupId, updated);
                          }}
                          className="hover:text-indigo-900"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null;
                  });
                } else {
                  const option = group.options.find(o => o.value === value);
                  return option ? (
                    <span
                      key={groupId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                    >
                      {option.label}
                      <button
                        onClick={() => onFilterChange(groupId, null)}
                        className="hover:text-purple-900"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ) : null;
                }
              })}
            </div>
            
            <button
              onClick={onClearAll}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}