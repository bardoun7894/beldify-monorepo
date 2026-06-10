'use client';

/**
 * AiGenerateButton
 *
 * Reusable button for AI-powered actions in seller forms.
 * Displays "✨ <label> (N credits)" with a loading spinner.
 *
 * Props:
 *   label    — Button label text
 *   cost     — Credit cost (shown in parentheses)
 *   onClick  — Click handler
 *   loading  — When true: spinner + disabled
 *   disabled — External disabled override (e.g. while form loads)
 *   className — Extra Tailwind classes
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface AiGenerateButtonProps {
  label: string;
  cost: number;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function AiGenerateButton({
  label,
  cost,
  onClick,
  loading = false,
  disabled = false,
  className,
}: AiGenerateButtonProps) {
  const { t } = useTranslation();
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      className={cn(
        'inline-flex items-center gap-1.5',
        'rounded-full px-4 py-2 text-xs font-semibold',
        'border border-amber-400 bg-amber-50 text-amber-900',
        'hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50',
        'transition-all duration-150',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        /* Spinner */
        <svg
          className="h-3.5 w-3.5 animate-spin text-amber-700"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        /* Sparkle icon — inline SVG to avoid lucide import overhead */
        <svg
          className="h-3.5 w-3.5 text-amber-600 shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-5.26L4 10l5.91-1.74L12 2z" />
        </svg>
      )}
      <span>{label}</span>
      <span className="opacity-60">
        ({cost}&nbsp;{t('ai.credits_unit', 'credits')})
      </span>
    </button>
  );
}

export default AiGenerateButton;
