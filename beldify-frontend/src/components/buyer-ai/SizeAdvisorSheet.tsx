'use client';

/**
 * SizeAdvisorSheet
 *
 * Entry link + bottom sheet for the AI size advisor.
 * Only renders when hasSizes=true. Hides itself on 422 not_sized.
 *
 * Flow:
 *  1. "📏 لقى قياسك" link appears near the size selector
 *  2. Click → sheet opens with height/weight/fit/usual_size inputs
 *  3. Submit → calls getSizeAdvice → shows recommended_size highlighted
 *  4. "Use this size" button calls onSelectSize(recommended_size) — never auto-selects
 *  5. 422 not_sized → hidden from this point on
 *  6. 503 ai_unavailable → show "size chart / contact" fallback message
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Ruler, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSizeAdvice,
  NotSizedException,
  AiUnavailableException,
  type FitPreference,
  type SizeAdviceResult,
} from '@/services/buyerAiService';

interface SizeAdvisorSheetProps {
  productId: string;
  hasSizes: boolean;
  availableSizes: string[];
  onSelectSize: (size: string) => void;
}

type SheetState = 'idle' | 'open' | 'loading' | 'result' | 'error' | 'unavailable';

export function SizeAdvisorSheet({
  productId,
  hasSizes,
  availableSizes,
  onSelectSize,
}: SizeAdvisorSheetProps) {
  const { t } = useTranslation();

  // Hide entry point when backend confirms product has no size dimension
  const [isSized, setIsSized] = useState(true);
  const [sheetState, setSheetState] = useState<SheetState>('idle');
  const [result, setResult] = useState<SizeAdviceResult | null>(null);

  // Form state
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [fitPreference, setFitPreference] = useState<FitPreference | ''>('');
  const [usualSize, setUsualSize] = useState('');

  if (!hasSizes || !isSized) return null;

  const handleOpen = () => setSheetState('open');
  const handleClose = () => {
    setSheetState('idle');
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sheetState === 'loading') return;
    setSheetState('loading');

    try {
      const data = await getSizeAdvice(productId, {
        height_cm: parseInt(heightCm, 10),
        weight_kg: parseInt(weightKg, 10),
        fit_preference: fitPreference || undefined,
        usual_size: usualSize || undefined,
      });
      setResult(data);
      setSheetState('result');
    } catch (err) {
      if (err instanceof NotSizedException) {
        setIsSized(false);
        setSheetState('idle');
      } else if (err instanceof AiUnavailableException) {
        setSheetState('unavailable');
      } else {
        setSheetState('error');
      }
    }
  };

  const handleUseSize = () => {
    if (result) {
      onSelectSize(result.recommended_size);
      handleClose();
    }
  };

  const confidenceLabel: Record<string, string> = {
    high: t('buyerAi.sizeAdvisor.confidenceHigh', 'High confidence'),
    medium: t('buyerAi.sizeAdvisor.confidenceMedium', 'Medium confidence'),
    low: t('buyerAi.sizeAdvisor.confidenceLow', 'Low confidence — verify with size chart'),
  };

  const isSheetOpen = sheetState !== 'idle';

  return (
    <>
      {/* Entry link */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label={t('buyerAi.sizeAdvisor.entryAriaLabel', 'Find my size')}
        className="inline-flex items-center gap-1.5 text-sm text-indigo-700 hover:text-indigo-900 underline underline-offset-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
      >
        <Ruler className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {t('buyerAi.sizeAdvisor.entry', 'Find my size')}
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-medium ring-1 ring-amber-200 ms-0.5">
          <Sparkles size={10} className="shrink-0" aria-hidden />
          AI
        </span>
      </button>

      {/* Bottom sheet overlay */}
      {isSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('buyerAi.sizeAdvisor.sheetTitle', 'AI Size Advisor')}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-950/50"
            onClick={handleClose}
            aria-hidden
          />

          {/* Sheet panel */}
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 pb-8 z-10 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium ring-1 ring-amber-200">
                  <Sparkles size={12} className="shrink-0" aria-hidden />
                  {t('buyerAi.sizeAdvisor.chipLabel', 'AI Size Advisor')}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label={t('common.close', 'Close')}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Form state */}
            {(sheetState === 'open' || sheetState === 'loading') && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="size-height"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {t('buyerAi.sizeAdvisor.heightLabel', 'Height (cm)')}
                    </label>
                    <input
                      id="size-height"
                      type="number"
                      min="100"
                      max="250"
                      required
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="175"
                      aria-label={t('buyerAi.sizeAdvisor.heightLabel', 'Height (cm)')}
                      className="w-full rounded-xl ring-1 ring-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/40"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="size-weight"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {t('buyerAi.sizeAdvisor.weightLabel', 'Weight (kg)')}
                    </label>
                    <input
                      id="size-weight"
                      type="number"
                      min="30"
                      max="250"
                      required
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="70"
                      aria-label={t('buyerAi.sizeAdvisor.weightLabel', 'Weight (kg)')}
                      className="w-full rounded-xl ring-1 ring-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/40"
                    />
                  </div>
                </div>

                {/* Fit preference — 3-segment control */}
                <fieldset>
                  <legend className="text-sm font-medium text-gray-700 mb-2">
                    {t('buyerAi.sizeAdvisor.fitLabel', 'Fit preference (optional)')}
                  </legend>
                  <div className="flex gap-2">
                    {(['slim', 'regular', 'loose'] as FitPreference[]).map((fit) => (
                      <button
                        key={fit}
                        type="button"
                        onClick={() => setFitPreference(fitPreference === fit ? '' : fit)}
                        className={cn(
                          'flex-1 py-2 text-xs font-medium rounded-full transition-all duration-200 ring-1',
                          fitPreference === fit
                            ? 'bg-indigo-700 text-white ring-indigo-700'
                            : 'bg-white text-gray-600 ring-gray-200 hover:ring-indigo-300'
                        )}
                        aria-pressed={fitPreference === fit}
                      >
                        {t(`buyerAi.sizeAdvisor.fit_${fit}`, fit.charAt(0).toUpperCase() + fit.slice(1))}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Usual size */}
                <div>
                  <label
                    htmlFor="size-usual"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t('buyerAi.sizeAdvisor.usualSizeLabel', 'Your usual size (optional)')}
                  </label>
                  <select
                    id="size-usual"
                    value={usualSize}
                    onChange={(e) => setUsualSize(e.target.value)}
                    className="w-full rounded-xl ring-1 ring-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-700/40"
                  >
                    <option value="">
                      {t('buyerAi.sizeAdvisor.selectSizePlaceholder', 'Select...')}
                    </option>
                    {availableSizes.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={sheetState === 'loading' || !heightCm || !weightKg}
                  className={cn(
                    'w-full rounded-full py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
                    sheetState === 'loading' || !heightCm || !weightKg
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed ring-1 ring-gray-200'
                      : 'bg-[hsl(var(--primary))] bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm active:scale-[0.98]'
                  )}
                >
                  {sheetState === 'loading'
                    ? t('buyerAi.sizeAdvisor.loading', 'Calculating…')
                    : t('buyerAi.sizeAdvisor.submitLabel', 'Get recommendation')}
                </button>
              </form>
            )}

            {/* Result state */}
            {sheetState === 'result' && result && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-indigo-50 ring-1 ring-indigo-100 p-5 text-center">
                  <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-2">
                    {t('buyerAi.sizeAdvisor.recommendedLabel', 'Recommended size')}
                  </p>
                  <div className="text-5xl font-bold text-indigo-700 mb-3">
                    {result.recommended_size}
                  </div>
                  <p className="text-xs text-indigo-500 font-mono uppercase tracking-wider">
                    {confidenceLabel[result.confidence] ?? result.confidence}
                  </p>
                </div>

                {/* Available sizes — highlight recommended */}
                {availableSizes.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {availableSizes.map((s) => (
                      <span
                        key={s}
                        className={cn(
                          'px-4 py-1.5 rounded-full text-sm font-medium ring-1 transition-all duration-200',
                          s === result.recommended_size
                            ? 'bg-indigo-700 text-white ring-indigo-700 shadow-sm'
                            : 'bg-white text-gray-500 ring-gray-200'
                        )}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Note */}
                {result.note && (
                  <p dir="auto" className="text-sm text-gray-600 text-center leading-relaxed">
                    {result.note}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleUseSize}
                  className="w-full rounded-full py-3 text-sm font-semibold bg-amber-400 hover:bg-amber-300 text-gray-900 shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 active:scale-[0.98]"
                >
                  {t('buyerAi.sizeAdvisor.useThisSize', 'Use this size')}
                </button>

                <button
                  type="button"
                  onClick={() => setSheetState('open')}
                  className="w-full rounded-full py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 ring-1 ring-gray-200 hover:ring-gray-300 transition-colors"
                >
                  {t('buyerAi.sizeAdvisor.tryAgain', 'Try different measurements')}
                </button>
              </div>
            )}

            {/* AI unavailable fallback */}
            {sheetState === 'unavailable' && (
              <div className="text-center py-4 space-y-3">
                <p className="text-sm text-gray-600">
                  {t(
                    'buyerAi.sizeAdvisor.unavailableMessage',
                    'AI size advisor is temporarily unavailable. Please refer to the size chart or contact the seller.'
                  )}
                </p>
                <a
                  href="/services/tailoring"
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-700 underline underline-offset-2 hover:text-indigo-900 transition-colors"
                >
                  {t('buyerAi.sizeAdvisor.sizeChartLink', 'View size chart')}
                </a>
              </div>
            )}

            {/* Generic error state */}
            {sheetState === 'error' && (
              <div className="text-center py-4 space-y-3">
                <p className="text-sm text-gray-600">
                  {t('buyerAi.sizeAdvisor.errorMessage', 'Something went wrong. Please try again.')}
                </p>
                <button
                  type="button"
                  onClick={() => setSheetState('open')}
                  className="text-sm text-indigo-700 underline"
                >
                  {t('common.try_again', 'Try again')}
                </button>
              </div>
            )}

            {/* AI provenance */}
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gray-400 mt-4 text-center">
              {t('buyerAi.sizeAdvisor.provenance', 'AI powered · beldify assistant')}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
