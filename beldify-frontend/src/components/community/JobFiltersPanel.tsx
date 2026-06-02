'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, SlidersHorizontal } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { JobFilters } from '@/types/community';

interface JobFiltersPanelProps {
  /** Current filter values */
  filters: JobFilters;
  /** Callback fired when user applies/changes any filter */
  onFiltersChange: (filters: JobFilters) => void;
  /** Mobile drawer open state */
  isOpen?: boolean;
  /** Close the mobile drawer */
  onClose?: () => void;
  /** Show as mobile drawer vs desktop sidebar */
  mobile?: boolean;
}

const CATEGORIES = [
  { value: '', labelKey: 'community.all_categories', labelFallback: 'All Categories' },
  { value: 'clothing', labelKey: 'community.category.clothing', labelFallback: 'Clothing' },
  { value: 'accessories', labelKey: 'community.category.accessories', labelFallback: 'Accessories' },
  { value: 'footwear', labelKey: 'community.category.footwear', labelFallback: 'Footwear' },
  { value: 'traditional', labelKey: 'community.category.traditional', labelFallback: 'Traditional' },
  { value: 'other', labelKey: 'community.category.other', labelFallback: 'Other' },
];

const STATUSES = [
  { value: '', labelKey: 'community.all_statuses', labelFallback: 'All Statuses' },
  { value: 'open', labelKey: 'community.status.open', labelFallback: 'Open' },
  { value: 'in_progress', labelKey: 'community.status.in_progress', labelFallback: 'In Progress' },
  { value: 'completed', labelKey: 'community.status.completed', labelFallback: 'Completed' },
];

const CRAFT_SKILLS = [
  'Caftan tetouani',
  'Djellaba',
  'Takchita',
  'Embroidery',
  'Zellige',
  'Leather',
  'Babouches',
  'Tarz-tetouani',
  'Crochet',
  'Weaving',
];

function FilterContent({
  filters,
  onFiltersChange,
  onClose,
}: {
  filters: JobFilters;
  onFiltersChange: (f: JobFilters) => void;
  onClose?: () => void;
}) {
  const { t } = useTranslation();

  // Local draft — only committed on "Apply"
  const [draft, setDraft] = useState<JobFilters>(filters);

  // Sync draft when parent filters change (e.g. reset from outside)
  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const toggleSkill = (skill: string) => {
    const current = draft.skills ?? [];
    const next = current.includes(skill)
      ? current.filter(s => s !== skill)
      : [...current, skill];
    setDraft(prev => ({ ...prev, skills: next }));
  };

  const handleApply = () => {
    onFiltersChange(draft);
    onClose?.();
  };

  const handleReset = () => {
    const empty: JobFilters = {};
    setDraft(empty);
    onFiltersChange(empty);
    onClose?.();
  };

  const hasActiveDraft =
    !!draft.category_id ||
    !!draft.budget_min ||
    !!draft.budget_max ||
    !!draft.status ||
    (draft.skills && draft.skills.length > 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-indigo-700" />
          <h2
            className="text-sm font-semibold text-gray-900"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('openSouk.filters', 'Filters')}
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label={t('common.close', 'Close')}
            className="p-1.5 rounded-full hover:bg-amber-50 text-gray-500 hover:text-gray-900 transition-colors duration-200"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          {t('community.filter_by_category', 'Category')}
        </label>
        <select
          value={draft.category_id ?? ''}
          onChange={e => setDraft(prev => ({ ...prev, category_id: e.target.value || undefined }))}
          className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-2xl focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 bg-white"
        >
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>
              {t(cat.labelKey, cat.labelFallback)}
            </option>
          ))}
        </select>
      </div>

      {/* Budget range */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          {t('openSouk.budgetRange', 'Budget (MAD)')}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder={t('openSouk.budgetMin', 'Min')}
            value={draft.budget_min ?? ''}
            onChange={e =>
              setDraft(prev => ({
                ...prev,
                budget_min: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-2xl focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 bg-white"
          />
          <span className="text-gray-400 text-xs shrink-0">–</span>
          <input
            type="number"
            min={0}
            placeholder={t('openSouk.budgetMax', 'Max')}
            value={draft.budget_max ?? ''}
            onChange={e =>
              setDraft(prev => ({
                ...prev,
                budget_max: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-2xl focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 bg-white"
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          {t('community.filter_by_status', 'Status')}
        </label>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => {
            const active = (draft.status ?? '') === s.value;
            return (
              <button
                key={s.value}
                onClick={() =>
                  setDraft(prev => ({
                    ...prev,
                    status: s.value as JobFilters['status'] | undefined,
                  }))
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 min-h-[36px] ${
                  active
                    ? 'bg-indigo-700 text-white'
                    : 'ring-1 ring-amber-200 text-gray-600 hover:ring-amber-300 hover:text-gray-900 bg-white'
                }`}
              >
                {t(s.labelKey, s.labelFallback)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          {t('openSouk.skills', 'Craft Skills')}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CRAFT_SKILLS.map(skill => {
            const active = (draft.skills ?? []).includes(skill);
            return (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 min-h-[32px] ${
                  active
                    ? 'bg-amber-500 text-amber-950'
                    : 'ring-1 ring-amber-200 text-gray-600 hover:ring-amber-300 bg-white'
                }`}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 pt-2 border-t border-amber-100">
        <button
          onClick={handleReset}
          className="flex-1 px-3 py-2.5 rounded-full ring-1 ring-amber-200 text-xs font-medium text-gray-700 hover:ring-amber-300 transition-all duration-200 min-h-[44px]"
        >
          {t('common.reset', 'Reset')}
        </button>
        <button
          onClick={handleApply}
          disabled={!hasActiveDraft}
          className="flex-[2] px-4 py-2.5 bg-indigo-700 text-white rounded-full text-xs font-semibold hover:bg-indigo-800 transition-colors duration-200 disabled:opacity-50 min-h-[44px]"
        >
          {t('common.apply', 'Apply')}
        </button>
      </div>
    </div>
  );
}

/**
 * JobFiltersPanel
 *
 * Renders as:
 *   - Desktop: plain content block (no frame — parent wraps in amber-50 card)
 *   - Mobile: full-screen bottom drawer controlled by `isOpen`
 */
export default function JobFiltersPanel({
  filters,
  onFiltersChange,
  isOpen = false,
  onClose,
  mobile = false,
}: JobFiltersPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!mobile) {
    // Desktop sidebar — inline, no drawer chrome
    return (
      <div className="bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 p-5">
        <FilterContent
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      </div>
    );
  }

  // Mobile drawer
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-40 bg-black/30"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer"
            initial={prefersReducedMotion ? false : { y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.28,
              ease: [0.33, 1, 0.68, 1],
            }}
            className="fixed bottom-0 start-0 end-0 z-50 bg-white rounded-t-3xl shadow-atlas-md max-h-[85vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-amber-200 rounded-full" />
            </div>

            <div className="p-5">
              <FilterContent
                filters={filters}
                onFiltersChange={onFiltersChange}
                onClose={onClose}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
