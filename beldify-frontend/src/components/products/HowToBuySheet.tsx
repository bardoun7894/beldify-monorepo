'use client';

import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Phone, ShoppingBag, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HowToBuySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: ShoppingBag,
    label: 'اختار القياس و اللون',
    desc: 'اختار المقاس ديالك و اللون اللي كيعجبك من الخيارات',
  },
  {
    icon: Phone,
    label: 'دخّل سميتك، التيليفون و العنوان',
    desc: 'خاصنا غير الاسم، الرقم، و العنوان ديالك باش نوصلو ليك',
  },
  {
    icon: Package,
    label: 'خلّص ملي توصلك السلعة — الدفع عند الاستلام',
    desc: 'ما خاصكش تدفع دابا. خلّص ملي توصلك السلعة فدارك',
  },
] as const;

export function HowToBuySheet({ isOpen, onClose }: HowToBuySheetProps) {
  const { t } = useTranslation();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    // Focus the close button when opened
    closeRef.current?.focus();
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-gray-950/60"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Sheet — slides up from bottom */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('pdp.howToBuy.title', 'كيفاش نشري؟')}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50',
          'bg-white rounded-t-3xl shadow-2xl',
          'px-5 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]',
          'max-h-[85vh] overflow-y-auto',
          'animate-in slide-in-from-bottom duration-300'
        )}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {t('pdp.howToBuy.title', 'كيفاش نشري؟')}
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label={t('common.close', 'اغلق')}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
          >
            <X className="w-4 h-4 text-gray-600" aria-hidden="true" />
          </button>
        </div>

        {/* Steps */}
        <ol className="space-y-5" dir="rtl">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <li key={idx} className="flex items-start gap-4">
                {/* Step circle */}
                <div className="flex flex-col items-center shrink-0">
                  <span className="flex items-center justify-center w-11 h-11 rounded-full bg-indigo-700 text-white font-bold text-sm shadow-sm">
                    {idx + 1}
                  </span>
                  {idx < STEPS.length - 1 && (
                    <div className="w-px flex-1 bg-indigo-200 mt-2 min-h-[1.5rem]" aria-hidden="true" />
                  )}
                </div>

                {/* Icon + text */}
                <div className="flex-1 pt-1 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden="true" />
                    <p className="text-sm font-semibold text-gray-900">{step.label}</p>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* COD reassurance pill */}
        <div className="mt-6 bg-indigo-50 ring-1 ring-indigo-200 rounded-2xl px-4 py-3 text-center">
          <p className="text-sm font-medium text-indigo-700">
            {t('pdp.howToBuy.cod_note', 'الدفع عند الاستلام — ما محتاجش بطاقة بنكية')}
          </p>
        </div>
      </div>
    </>
  );
}

export default HowToBuySheet;
