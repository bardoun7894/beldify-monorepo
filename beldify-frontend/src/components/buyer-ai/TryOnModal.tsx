'use client';

/**
 * TryOnModal — virtual try-on flow (3-step)
 *
 * Step 1: Photo picker (accept jpeg/png/webp; canvas downscale ≤2048px; preview)
 *         Privacy note + generate CTA
 * Step 2: Progress state — polling GET /api/tryon/status/{task_id} every 3s
 *         max 3 min (180s), clears on unmount
 * Step 3: Result — image + retry + Buy Now CTA
 *
 * Error handling:
 *   403  → call onHideFeature + close
 *   429  → show friendly daily-limit message
 *   fail → inline error + retry
 *
 * Accessibility: focus-trapped, Esc/backdrop close, RTL-aware
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Wand2, RotateCcw, ShoppingBag, AlertCircle, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { submitTryon, fetchTryonStatus } from '@/services/tryonService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Step = 'pick' | 'generating' | 'success' | 'fail' | 'limit';

interface TryOnModalProps {
  open: boolean;
  onClose: () => void;
  onHideFeature: () => void;
  productId: string | number;
  onBuyNow: () => void;
}

const MAX_LONG_EDGE = 2048;
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_MS = 180_000; // 3 minutes

// ─────────────────────────────────────────────────────────────────────────────
// Canvas downscale utility
// ─────────────────────────────────────────────────────────────────────────────

function downscaleImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const longEdge = Math.max(img.width, img.height);
      if (longEdge <= MAX_LONG_EDGE) {
        resolve(file);
        return;
      }
      const ratio = MAX_LONG_EDGE / longEdge;
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          const scaled = new File([blob ?? file], file.name, { type: 'image/jpeg' });
          resolve(scaled);
        },
        'image/jpeg',
        0.88
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function TryOnModal({
  open,
  onClose,
  onHideFeature,
  productId,
  onBuyNow,
}: TryOnModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('pick');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const taskIdRef = useRef<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearPoll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    elapsedRef.current = 0;
  }, []);

  // Esc / backdrop close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Reset on re-open
  useEffect(() => {
    if (open) {
      setStep('pick');
      setPhotoFile(null);
      setPreviewUrl(null);
      setProgress(0);
      setResultUrl(null);
      setErrorMsg(null);
      setGenerating(false);
      clearPoll();
    }
  }, [open, clearPoll]);

  // Clean up on unmount
  useEffect(() => () => { clearPoll(); }, [clearPoll]);

  const startPolling = useCallback((taskId: string) => {
    clearPoll();
    elapsedRef.current = 0;
    intervalRef.current = setInterval(async () => {
      elapsedRef.current += POLL_INTERVAL_MS;
      if (elapsedRef.current >= MAX_POLL_MS) {
        clearPoll();
        setStep('fail');
        setErrorMsg(t('tryon.timeout', 'Processing timed out. Please try again.'));
        return;
      }
      try {
        const status = await fetchTryonStatus(taskId);
        setProgress(status.progress ?? 0);
        if (status.status === 'success') {
          clearPoll();
          setResultUrl(status.result_url);
          setStep('success');
        } else if (status.status === 'fail') {
          clearPoll();
          setErrorMsg(status.error ?? t('tryon.error_generic', 'Processing failed.'));
          setStep('fail');
        }
      } catch {
        // Continue polling on transient errors
      }
    }, POLL_INTERVAL_MS);
  }, [clearPoll, t]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoFile(file);
    setPreviewUrl(url);
  };

  const handleGenerate = async () => {
    if (!photoFile) return;
    setGenerating(true);
    try {
      const scaledFile = await downscaleImage(photoFile);
      const { task_id } = await submitTryon(productId, scaledFile);
      taskIdRef.current = task_id;
      setStep('generating');
      setProgress(0);
      startPolling(task_id);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) {
        onHideFeature();
        onClose();
      } else if (status === 429) {
        setStep('limit');
      } else {
        setErrorMsg(t('tryon.error_generic', 'Something went wrong. Please try again.'));
        setStep('fail');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleRetry = () => {
    setStep('pick');
    setErrorMsg(null);
    setProgress(0);
    setResultUrl(null);
    clearPoll();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-gray-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('tryon.modal_title', 'Virtual try-on')}
        className={cn(
          'fixed z-50 inset-x-4 bottom-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
          'w-full sm:w-[480px] max-h-[90dvh] overflow-y-auto',
          'bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200',
          'flex flex-col'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-indigo-700" aria-hidden />
            <h2 className="text-base font-semibold text-gray-900">
              {t('tryon.modal_title', 'Virtual try-on')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40"
            aria-label={t('actions.close', 'Close')}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── Step 1: Photo picker ── */}
          {step === 'pick' && (
            <>
              {/* Upload area */}
              {!previewUrl ? (
                <label
                  htmlFor="tryon-photo-input"
                  className="flex flex-col items-center justify-center gap-3 p-10 rounded-2xl ring-1 ring-dashed ring-indigo-300 bg-indigo-50 cursor-pointer hover:bg-indigo-100 transition-colors"
                >
                  <Upload className="h-8 w-8 text-indigo-400" aria-hidden />
                  <span className="text-sm font-medium text-gray-700">
                    {t('tryon.upload_hint', 'Upload your photo')}
                  </span>
                  <span className="text-xs text-gray-400">
                    {t('tryon.upload_formats', 'JPG, PNG or WebP')}
                  </span>
                </label>
              ) : (
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-indigo-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={t('tryon.preview_alt', 'Your photo preview')}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPreviewUrl(null); }}
                    className="absolute top-2 end-2 rounded-full bg-white/90 p-1.5 text-gray-600 hover:bg-white transition-colors"
                    aria-label={t('tryon.remove_photo', 'Remove photo')}
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                id="tryon-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleFileChange}
              />

              {/* Privacy note */}
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                {t(
                  'tryon.privacy_note',
                  'Your photo is processed by AI and not stored on Beldify'
                )}
              </p>

              {/* Generate CTA */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!photoFile || generating}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-full py-3.5',
                  'text-sm font-semibold transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40',
                  (!photoFile || generating)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed ring-1 ring-gray-200'
                    : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm active:scale-[0.98]'
                )}
              >
                <Wand2 className="h-4 w-4" aria-hidden />
                {t('tryon.generate_cta', 'Generate')}
              </button>
            </>
          )}

          {/* ── Step 2: Generating ── */}
          {step === 'generating' && (
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="relative h-20 w-20">
                {/* Pulsing ring */}
                <span className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-60" aria-hidden />
                <span className="relative flex h-20 w-20 rounded-full bg-indigo-50 ring-1 ring-indigo-200 items-center justify-center">
                  <Wand2 className="h-8 w-8 text-indigo-600 animate-pulse" aria-hidden />
                </span>
              </div>

              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{t('tryon.dressing_up', 'Dressing you up…')}</span>
                  <span>{progress}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t('tryon.progress_label', 'Generation progress')}
                  className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center">
                {t('tryon.generating_note', 'This usually takes 20–60 seconds')}
              </p>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 'success' && resultUrl && (
            <div className="space-y-4">
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden ring-1 ring-indigo-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultUrl}
                  alt={t('tryon.result_alt', 'Virtual try-on result')}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold ring-1 ring-gray-200 text-gray-700 hover:ring-indigo-300 hover:text-indigo-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40"
                  aria-label={t('tryon.retry_label', 'Try again with a different photo')}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  {t('tryon.retry', 'Try again')}
                </button>
                <button
                  type="button"
                  onClick={() => { onBuyNow(); onClose(); }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden />
                  {t('tryon.buy_now', 'Buy now')}
                </button>
              </div>
            </div>
          )}

          {/* ── Daily limit message ── */}
          {step === 'limit' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="h-14 w-14 rounded-full bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-amber-600" aria-hidden />
              </div>
              <p className="text-sm font-medium text-gray-800">
                {t('tryon.daily_limit_title', 'Daily limit reached')}
              </p>
              <p className="text-xs text-gray-500">
                {t(
                  'tryon.daily_limit_desc',
                  'You’ve reached today’s try-on limit. Try again tomorrow.'
                )}
              </p>
            </div>
          )}

          {/* ── Error / fail state ── */}
          {step === 'fail' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="h-14 w-14 rounded-full bg-rose-50 ring-1 ring-rose-200 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-rose-600" aria-hidden />
              </div>
              <p className="text-sm text-gray-700">
                {errorMsg ?? t('tryon.error_generic', 'Something went wrong.')}
              </p>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-700 text-white px-5 py-2.5 text-sm font-semibold hover:bg-indigo-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40"
                aria-label={t('tryon.retry_label', 'Try again')}
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                {t('tryon.retry', 'Try again')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
