'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckoutProgressBarProps {
  /** 1 = السلة, 2 = المعلومات, 3 = التأكيد */
  currentStep: 1 | 2 | 3;
}

/**
 * CheckoutProgressBar — thin 3-step indicator (السلة ← المعلومات ← التأكيد).
 *
 * Design:
 * - 3 bubbles connected by lines
 * - Active step: indigo-700 filled ring
 * - Completed step: indigo-700 filled with checkmark
 * - Future step: gray-200
 * - Darija labels below each bubble
 * - RTL-safe (logical properties)
 */
export function CheckoutProgressBar({ currentStep }: CheckoutProgressBarProps) {
  const { t } = useTranslation();

  const steps = [
    { id: 1, label: t('checkout.progress.bag', 'السلة') },
    { id: 2, label: t('checkout.progress.info', 'المعلومات') },
    { id: 3, label: t('checkout.progress.confirm', 'التأكيد') },
  ];

  return (
    <nav
      aria-label={t('checkout.stepper.aria_label', 'خطوات الطلب')}
      className="w-full py-4 px-4"
    >
      <ol className="flex items-center justify-center" role="list">
        {steps.map((step, idx) => {
          const completed = step.id < currentStep;
          const active = step.id === currentStep;

          return (
            <li key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                {/* Bubble */}
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200',
                    completed
                      ? 'bg-indigo-700 text-white shadow-sm'
                      : active
                      ? 'bg-indigo-700 text-white ring-2 ring-offset-2 ring-indigo-700/40'
                      : 'bg-gray-200 text-gray-500'
                  )}
                  aria-current={active ? 'step' : undefined}
                >
                  {completed ? (
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : active ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden="true" />
                  ) : (
                    <span aria-hidden="true">{step.id}</span>
                  )}
                </span>
                {/* Label */}
                <span
                  className={cn(
                    'mt-1.5 text-xs font-medium whitespace-nowrap',
                    active
                      ? 'text-indigo-700'
                      : completed
                      ? 'text-gray-700'
                      : 'text-gray-400'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (not after last) */}
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'w-14 sm:w-24 h-px mx-2 mb-5 transition-colors duration-300',
                    completed ? 'bg-indigo-300' : 'bg-gray-200'
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default CheckoutProgressBar;
