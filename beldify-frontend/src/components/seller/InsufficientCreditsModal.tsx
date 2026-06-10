'use client';

/**
 * InsufficientCreditsModal
 *
 * Shown when any AI tool returns HTTP 402 (insufficient_credits).
 * Props are intentionally loose — cost / balance / feature are all optional
 * so callers can show the modal even with partial context.
 *
 * Another packet (AI tools) imports from this exact path:
 *   @/components/seller/InsufficientCreditsModal
 * The named export `InsufficientCreditsModal` is the stable public API.
 * The default export is provided as a convenience for lazy loading.
 *
 * Props:
 *   open      — controls visibility
 *   onClose   — called when user dismisses
 *   cost      — credits required for the action (optional)
 *   balance   — current credit balance (optional)
 *   feature   — feature key e.g. "listing_writer" (optional; used for label)
 */
import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Sparkles, X, ArrowRight } from 'lucide-react';

export interface InsufficientCreditsModalProps {
  open: boolean;
  onClose: () => void;
  cost?: number;
  balance?: number;
  feature?: string;
}

/** Map feature keys to human-readable labels (i18n key + English fallback). */
const FEATURE_LABELS: Record<string, string> = {
  listing_writer: 'Listing Writer',
  store_creator: 'Store Creator',
  translate_listing: 'Listing Translator',
  marketing_copy: 'Marketing Copy',
};

export function InsufficientCreditsModal({
  open,
  onClose,
  cost,
  balance,
  feature,
}: InsufficientCreditsModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  const featureLabel =
    feature && FEATURE_LABELS[feature]
      ? t(`credits.features.${feature}`, FEATURE_LABELS[feature])
      : feature ?? null;

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="insufficient-credits-title"
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-md mx-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
        {/* Header band */}
        <div className="bg-indigo-700 px-6 py-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-950" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-300 font-medium mb-0.5">
              {t('credits.modal.eyebrow', 'AI Credits')}
            </p>
            <h2
              id="insufficient-credits-title"
              className="text-lg font-bold text-white leading-snug"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('credits.modal.title', 'Not enough credits')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('credits.modal.close', 'Close modal')}
            className="text-indigo-300 hover:text-white transition-colors mt-0.5"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Feature label */}
          {featureLabel && (
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{featureLabel}</span>{' '}
              {t('credits.modal.requires_credits', 'requires credits you currently do not have.')}
            </p>
          )}
          {!featureLabel && (
            <p className="text-sm text-gray-600">
              {t(
                'credits.modal.generic_body',
                'You do not have enough credits to use this AI feature.'
              )}
            </p>
          )}

          {/* Cost / balance grid */}
          {(cost !== undefined || balance !== undefined) && (
            <div className="grid grid-cols-2 gap-3">
              {cost !== undefined && (
                <div className="bg-rose-50 ring-1 ring-rose-200 rounded-2xl px-4 py-3 text-center">
                  <p className="text-xs text-rose-500 uppercase tracking-wide font-medium mb-0.5">
                    {t('credits.modal.cost_label', 'Required')}
                  </p>
                  <p className="text-2xl font-bold text-rose-700">{cost}</p>
                  <p className="text-xs text-rose-400 mt-0.5">
                    {t('credits.modal.credits_unit', 'credits')}
                  </p>
                </div>
              )}
              {balance !== undefined && (
                <div className="bg-gray-50 ring-1 ring-gray-200 rounded-2xl px-4 py-3 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">
                    {t('credits.modal.balance_label', 'Your balance')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{balance}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t('credits.modal.credits_unit', 'credits')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <Link
            href="/seller/credits"
            className="flex items-center justify-center gap-2 w-full bg-indigo-700 hover:bg-indigo-800 text-white rounded-2xl px-5 py-3 text-sm font-semibold transition-colors"
            onClick={onClose}
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            {t('credits.modal.cta', 'Top up credits')}
            <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
          </Link>

          {/* Secondary dismiss */}
          <button
            type="button"
            onClick={onClose}
            aria-label={t('credits.modal.later', 'Maybe later')}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            {t('credits.modal.later', 'Maybe later')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InsufficientCreditsModal;
