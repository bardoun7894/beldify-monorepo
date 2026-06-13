'use client';

/**
 * AiImageGenerator — AI-powered product image generation for the seller edit page
 *
 * Usage:
 *   1. Seller selects one existing product image thumbnail
 *   2. Seller chooses a style (studio / lifestyle / white_bg)
 *   3. POST /api/seller/products/{id}/ai-image → task_id
 *   4. Poll GET /api/seller/ai-image/status/{task_id}?product_id=N every 3s
 *   5. On success: call onRefresh (parent re-fetches product images)
 *   6. On 403: hide the control gracefully
 *
 * Atlas design tokens: indigo-700 primary, amber-50 backgrounds
 */

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  submitAiImage,
  fetchAiImageStatus,
  AiImageStyle,
} from '@/services/tryonService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductImageItem {
  id: number;
  url: string;
}

interface AiImageGeneratorProps {
  productId: string | number;
  existingImages: ProductImageItem[];
  onRefresh: () => void;
}

type GenStatus = 'idle' | 'generating' | 'success' | 'fail';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_MS = 180_000;
const STYLES: { value: AiImageStyle; label: string; i18nKey: string }[] = [
  { value: 'studio',     label: 'Studio',            i18nKey: 'seller.ai_image.style_studio' },
  { value: 'lifestyle',  label: 'Lifestyle',         i18nKey: 'seller.ai_image.style_lifestyle' },
  { value: 'white_bg',   label: 'White background',  i18nKey: 'seller.ai_image.style_white_bg' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function AiImageGenerator({
  productId,
  existingImages,
  onRefresh,
}: AiImageGeneratorProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<AiImageStyle>('studio');
  const [status, setStatus] = useState<GenStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  // Clean up on unmount
  useEffect(() => () => { clearPoll(); }, []);

  const clearPoll = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    elapsedRef.current = 0;
  };

  const startPolling = (taskId: string) => {
    clearPoll();
    intervalRef.current = setInterval(async () => {
      elapsedRef.current += POLL_INTERVAL_MS;
      if (elapsedRef.current >= MAX_POLL_MS) {
        clearPoll();
        setStatus('fail');
        setErrorMsg(t('seller.ai_image.timeout', 'Processing timed out.'));
        return;
      }
      try {
        const res = await fetchAiImageStatus(taskId, productId);
        setProgress(res.progress ?? 0);
        if (res.status === 'success') {
          clearPoll();
          setStatus('success');
          onRefresh();
        } else if (res.status === 'fail') {
          clearPoll();
          setStatus('fail');
          setErrorMsg(res.error ?? t('seller.ai_image.error_generic', 'Generation failed.'));
        }
      } catch {
        // Continue polling on transient errors
      }
    }, POLL_INTERVAL_MS);
  };

  const handleGenerate = async () => {
    if (selectedImageId === null) return;
    setStatus('generating');
    setProgress(0);
    setErrorMsg(null);
    try {
      const { task_id } = await submitAiImage(productId, {
        source_image_id: selectedImageId,
        style: selectedStyle,
      });
      startPolling(task_id);
    } catch (err: unknown) {
      const anyErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (anyErr?.response?.status === 403) {
        clearPoll();
        setVisible(false);
        return;
      }
      setStatus('fail');
      setErrorMsg(anyErr?.response?.data?.message ?? t('seller.ai_image.error_generic', 'Generation failed.'));
    }
  };

  const handleReset = () => {
    clearPoll();
    setStatus('idle');
    setProgress(0);
    setErrorMsg(null);
  };

  if (!visible) return null;

  return (
    <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-6 space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" aria-hidden />
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {t('seller.ai_image.section_title', 'Generate with AI')}
        </h3>
      </div>

      {/* Thumbnail picker */}
      {existingImages.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            {t('seller.ai_image.pick_source', 'Select a source image')}
          </p>
          <div
            className="flex flex-wrap gap-3"
            role="radiogroup"
            aria-label={t('seller.ai_image.pick_source', 'Select a source image')}
          >
            {existingImages.map((img) => (
              <button
                key={img.id}
                type="button"
                role="radio"
                aria-checked={selectedImageId === img.id}
                onClick={() => setSelectedImageId(img.id)}
                className={cn(
                  'relative w-16 h-16 rounded-xl overflow-hidden ring-1 transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40',
                  selectedImageId === img.id
                    ? 'ring-2 ring-indigo-600 shadow-sm'
                    : 'ring-gray-200 opacity-70 hover:opacity-100 hover:ring-gray-300'
                )}
                aria-label={t('seller.ai_image.select_image_n', 'Select image {{n}}', { n: img.id })}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={t('seller.ai_image.thumbnail_alt', 'Product image')}
                  className="w-full h-full object-cover"
                />
                {selectedImageId === img.id && (
                  <span
                    aria-hidden
                    className="absolute inset-0 ring-2 ring-inset ring-indigo-600 rounded-xl"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Style selector */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500">
          {t('seller.ai_image.pick_style', 'Choose a style')}
        </p>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {STYLES.map(({ value, label, i18nKey }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selectedStyle === value}
              onClick={() => setSelectedStyle(value)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40',
                selectedStyle === value
                  ? 'bg-indigo-700 text-white'
                  : 'bg-amber-50 ring-1 ring-amber-200 text-gray-700 hover:ring-indigo-300'
              )}
            >
              {t(i18nKey, label)}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      {status === 'idle' && (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={selectedImageId === null}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-full py-2.5',
            'text-sm font-semibold transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40',
            selectedImageId === null
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed ring-1 ring-gray-200'
              : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm active:scale-[0.98]'
          )}
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          {t('seller.ai_image.generate_cta', 'Generate with AI')}
        </button>
      )}

      {/* Generating state */}
      {status === 'generating' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{t('seller.ai_image.generating', 'Generating…')}</span>
            <span>{progress}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('seller.ai_image.progress_label', 'Generation progress')}
            className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {t('seller.ai_image.generating_note', 'This usually takes 20–60 seconds')}
          </p>
        </div>
      )}

      {/* Success state */}
      {status === 'success' && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
          <p className="text-sm text-emerald-700 font-medium">
            {t('seller.ai_image.success', 'Image generated and added to your product!')}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="ms-auto text-xs text-emerald-600 underline underline-offset-2 hover:text-emerald-800"
          >
            {t('seller.ai_image.generate_another', 'Generate another')}
          </button>
        </div>
      )}

      {/* Error state */}
      {status === 'fail' && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 ring-1 ring-rose-200 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" aria-hidden />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-rose-700">
              {errorMsg ?? t('seller.ai_image.error_generic', 'Generation failed.')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="shrink-0 text-xs text-rose-600 underline underline-offset-2 hover:text-rose-800"
          >
            {t('common.retry', 'Retry')}
          </button>
        </div>
      )}
    </div>
  );
}
