'use client';

/**
 * TryOnModal — virtual try-on flow (free + paid modes)
 *
 * FREE MODE (config.paid === false):
 *   Step 1: Photo picker → Step 2: Generating → Step 3: Result
 *   Error handling: 403 → hide feature, 429 → daily-limit message
 *
 * PAID MODE (config.paid === true):
 *   Guest:  Sign-in gate (no upload step exposed)
 *   Authed: Balance chip → upload → generate (charges 1 credit)
 *           402 / zero balance → top-up sheet (pack picker + bank RIB + receipt upload)
 *           Failed with refunded:true → refund notice
 *
 * Accessibility: focus-trapped dialog, Esc/backdrop close, RTL-aware
 */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  X,
  Wand2,
  RotateCcw,
  ShoppingBag,
  AlertCircle,
  Upload,
  Copy,
  Check,
  LogIn,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from '@/utils/toast';
import {
  submitTryon,
  fetchTryonStatus,
  fetchWalletBalance,
  submitTopup,
  fetchTopups,
  TryonConfig,
  TryonCreditPack,
  TryonTopupRecord,
} from '@/services/tryonService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Step =
  | 'guest_gate'    // paid mode, unauthenticated
  | 'pick'          // photo upload
  | 'generating'    // polling
  | 'success'       // result
  | 'fail'          // error
  | 'limit'         // 429 daily limit (free mode)
  | 'topup';        // 402 / zero balance → credit purchase sheet

interface TryOnModalProps {
  open: boolean;
  onClose: () => void;
  onHideFeature: () => void;
  productId: string | number;
  onBuyNow: () => void;
  /** Pre-fetched config from the parent PDP (avoids duplicate network call).
   *  Defaults to free mode when omitted (backward compat). */
  config?: TryonConfig;
  /** Whether the current viewer is an authenticated buyer.
   *  Defaults to false when omitted. */
  isAuthenticated?: boolean;
}

const MAX_LONG_EDGE = 2048;
// Mirror the backend cap (POST /api/tryon rejects >8MB) so we fail fast on the
// client instead of wasting an upload on a slow connection.
const MAX_FILE_BYTES = 8 * 1024 * 1024;
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
// TopupSheet sub-component
// ─────────────────────────────────────────────────────────────────────────────

interface TopupSheetProps {
  packs: TryonCreditPack[];
  rib: string;
  topups: TryonTopupRecord[];
  onSubmit: (packIndex: number, file: File) => Promise<void>;
  submitting: boolean;
  confirmed: boolean;
}

function TopupSheet({ packs, rib, topups, onSubmit, submitting, confirmed }: TopupSheetProps) {
  const { t } = useTranslation();
  const [selectedPack, setSelectedPack] = useState<number | null>(
    // pre-select middle pack as "best value"
    packs.length >= 3 ? 1 : packs.length > 0 ? 0 : null
  );
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [ribCopied, setRibCopied] = useState(false);

  const handleCopyRib = async () => {
    try {
      await navigator.clipboard.writeText(rib);
      setRibCopied(true);
      setTimeout(() => setRibCopied(false), 2000);
    } catch {
      // clipboard API not available in test env — ignore
    }
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setReceiptFile(file);
  };

  const handleSubmit = async () => {
    if (selectedPack === null || !receiptFile) return;
    await onSubmit(selectedPack, receiptFile);
  };

  if (confirmed) {
    return (
      <div
        data-testid="tryon-topup-pending"
        className="flex flex-col items-center gap-4 py-8 text-center"
      >
        <div className="h-14 w-14 rounded-full bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center">
          <Clock className="h-7 w-7 text-amber-600" aria-hidden />
        </div>
        <p className="text-sm font-semibold text-gray-900">
          {t('tryon.topup_pending_title', 'Top-up pending approval')}
        </p>
        <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
          {t(
            'tryon.topup_pending_desc',
            'Your receipt has been submitted. An admin will validate your transfer shortly — credits will appear in your wallet once approved.'
          )}
        </p>
      </div>
    );
  }

  const selectedPrice = selectedPack !== null ? packs[selectedPack]?.price_mad : null;

  return (
    <div data-testid="tryon-topup-sheet" className="space-y-5">
      {/* Pack picker */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          {t('tryon.choose_pack', 'Choose a pack')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {packs.map((pack, idx) => {
            const isBestValue = packs.length >= 3 && idx === 1;
            const isSelected = selectedPack === idx;
            return (
              <button
                key={idx}
                type="button"
                data-testid={`tryon-pack-card-${idx}`}
                onClick={() => setSelectedPack(idx)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1',
                  'rounded-xl p-3 ring-1 transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40',
                  isSelected
                    ? 'bg-indigo-50 ring-indigo-400 shadow-sm'
                    : 'bg-white ring-gray-200 hover:ring-indigo-200'
                )}
                aria-pressed={isSelected}
              >
                {isBestValue && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-indigo-700 px-2 py-0.5 text-[9px] font-bold text-white">
                    {t('tryon.best_value', 'Best value')}
                  </span>
                )}
                <span className="text-xl font-bold text-gray-900">{pack.credits}</span>
                <span className="text-[10px] text-gray-500 font-medium">
                  {t('tryon.credits_label', 'credits')}
                </span>
                <span className="text-sm font-semibold text-indigo-700 mt-0.5">
                  {pack.price_mad} {t('common.currency_mad', 'MAD')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bank transfer instructions */}
      {selectedPack !== null && selectedPrice !== null && (
        <div className="rounded-xl bg-gray-50 ring-1 ring-gray-200 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-700">
            {t('tryon.bank_transfer_title', 'Bank transfer details')}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">
                  {t('tryon.rib_label', 'RIB')}
                </p>
                <p
                  data-testid="tryon-rib-display"
                  className="text-xs font-mono text-gray-800 break-all"
                >
                  {rib}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyRib}
                className="shrink-0 rounded-lg bg-white ring-1 ring-gray-200 p-1.5 text-gray-500 hover:text-indigo-700 hover:ring-indigo-300 transition-colors"
                aria-label={t('tryon.copy_rib', 'Copy RIB')}
              >
                {ribCopied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                )}
              </button>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">
                {t('tryon.amount_label', 'Exact amount')}
              </p>
              <p className="text-sm font-bold text-gray-900">
                {selectedPrice} {t('common.currency_mad', 'MAD')}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            {t(
              'tryon.bank_transfer_note',
              'Transfer the exact amount then upload your receipt below. Credits are added within 24 hours.'
            )}
          </p>
        </div>
      )}

      {/* Receipt upload */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2">
          {t('tryon.upload_receipt', 'Upload receipt')}
        </p>
        <label
          htmlFor="tryon-receipt-file"
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl ring-1 ring-dashed p-4 cursor-pointer transition-colors',
            receiptFile
              ? 'ring-emerald-300 bg-emerald-50'
              : 'ring-gray-300 bg-gray-50 hover:bg-gray-100'
          )}
        >
          {receiptFile ? (
            <Check className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
          ) : (
            <Upload className="h-4 w-4 text-gray-400 shrink-0" aria-hidden />
          )}
          <span className="text-xs text-gray-600 truncate">
            {receiptFile
              ? receiptFile.name
              : t('tryon.receipt_hint', 'JPG, PNG, WebP or PDF — max 8 MB')}
          </span>
        </label>
        <input
          id="tryon-receipt-file"
          data-testid="tryon-receipt-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="sr-only"
          onChange={handleReceiptChange}
        />
      </div>

      {/* Submit */}
      <button
        type="button"
        data-testid="tryon-topup-submit"
        onClick={handleSubmit}
        disabled={selectedPack === null || !receiptFile || submitting}
        className={cn(
          'w-full flex items-center justify-center gap-2 rounded-full py-3.5',
          'text-sm font-semibold transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40',
          selectedPack === null || !receiptFile || submitting
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed ring-1 ring-gray-200'
            : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm active:scale-[0.98]'
        )}
      >
        {submitting
          ? t('tryon.submitting_receipt', 'Submitting…')
          : t('tryon.submit_receipt', 'Submit receipt')}
      </button>

      {/* My top-ups history */}
      {topups.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {t('tryon.my_topups', 'My top-ups')}
          </p>
          <ul className="space-y-1.5">
            {topups.map((record) => (
              <li
                key={record.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 ring-1 ring-gray-100 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  {record.status === 'approved' ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden />
                  ) : record.status === 'rejected' ? (
                    <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" aria-hidden />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-hidden />
                  )}
                  <span className="text-xs text-gray-700">
                    +{record.credits} {t('tryon.credits_label', 'credits')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{record.price_mad} MAD</span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      record.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        : record.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                        : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                    )}
                  >
                    {record.status === 'approved'
                      ? t('tryon.status_approved', 'Approved')
                      : record.status === 'rejected'
                      ? t('tryon.status_rejected', 'Rejected')
                      : t('tryon.status_pending', 'Pending')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_FREE_CONFIG: TryonConfig = { enabled: true, paid: false, free_credits: 0, packs: [], rib: '' };

export function TryOnModal({
  open,
  onClose,
  onHideFeature,
  productId,
  onBuyNow,
  config = DEFAULT_FREE_CONFIG,
  isAuthenticated = false,
}: TryOnModalProps) {
  const { t } = useTranslation();
  const pathname = usePathname();

  // ── Core state ──
  const [step, setStep] = useState<Step>('pick');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [wasRefunded, setWasRefunded] = useState(false);

  // ── Paid-mode state ──
  const [balance, setBalance] = useState<number | null>(null);
  const [topupPacks, setTopupPacks] = useState<TryonCreditPack[]>(config.packs ?? []);
  const [topupRib, setTopupRib] = useState<string>(config.rib ?? '');
  const [topups, setTopups] = useState<TryonTopupRecord[]>([]);
  const [topupSubmitting, setTopupSubmitting] = useState(false);
  const [topupConfirmed, setTopupConfirmed] = useState(false);

  const isPaid = config.paid === true;

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

  // ── Esc / backdrop close ──
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // ── Reset on re-open ──
  useEffect(() => {
    if (open) {
      const initialStep: Step =
        isPaid && !isAuthenticated ? 'guest_gate' : 'pick';
      setStep(initialStep);
      setPhotoFile(null);
      setPreviewUrl(null);
      setProgress(0);
      setResultUrl(null);
      setErrorMsg(null);
      setGenerating(false);
      setWasRefunded(false);
      setTopupConfirmed(false);
      clearPoll();

      // Fetch wallet balance + topup history when authed + paid
      if (isPaid && isAuthenticated) {
        fetchWalletBalance()
          .then((w) => setBalance(w.balance))
          .catch(() => setBalance(null));
        fetchTopups()
          .then(setTopups)
          .catch(() => setTopups([]));
      }
    }
  }, [open, isPaid, isAuthenticated, clearPoll]);

  // ── Clean up on unmount ──
  useEffect(() => () => { clearPoll(); }, [clearPoll]);

  // ── Revoke the preview blob URL whenever it changes or on unmount ──
  // Cleanup runs with the *previous* previewUrl before the next value is set,
  // so this single effect covers reset, remove-photo, re-pick, and unmount —
  // no blob leak per modal-open cycle.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  // ── Polling ──
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
          if (status.refunded) setWasRefunded(true);
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
    if (file.size > MAX_FILE_BYTES) {
      toast.error(
        t('tryon.file_too_large', 'Photo is too large. Please choose an image under 8MB.')
      );
      // Clear the input so re-picking the same (resized) file still fires onChange.
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const url = URL.createObjectURL(file);
    setPhotoFile(file);
    setPreviewUrl(url);
  };

  const handleGenerate = async () => {
    if (!photoFile) return;
    setGenerating(true);
    try {
      const scaledFile = await downscaleImage(photoFile);
      const res = await submitTryon(productId, scaledFile);
      taskIdRef.current = res.task_id;
      // Update balance from response (paid mode)
      if (res.balance !== undefined) setBalance(res.balance);
      setStep('generating');
      setProgress(0);
      startPolling(res.task_id);
    } catch (err: unknown) {
      const anyErr = err as { response?: { status?: number; data?: { packs?: TryonCreditPack[]; rib?: string } } };
      const status = anyErr?.response?.status;
      if (status === 401) {
        // Session expired mid-flow (paid mode) — fall back to the sign-in gate
        // rather than an opaque error.
        setStep('guest_gate');
      } else if (status === 403) {
        onHideFeature();
        onClose();
      } else if (status === 429) {
        setStep('limit');
      } else if (status === 402) {
        // Insufficient credits — show top-up sheet
        const data = anyErr?.response?.data;
        if (data?.packs) setTopupPacks(data.packs);
        if (data?.rib) setTopupRib(data.rib);
        setStep('topup');
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
    setWasRefunded(false);
    setPhotoFile(null);
    setPreviewUrl(null);
    // Reset the input so re-selecting the same photo fires onChange again.
    if (fileInputRef.current) fileInputRef.current.value = '';
    clearPoll();
  };

  const handleTopupSubmit = async (packIndex: number, file: File) => {
    setTopupSubmitting(true);
    try {
      await submitTopup(packIndex, file);
      setTopupConfirmed(true);
    } catch {
      // Keep sheet open — user can retry
    } finally {
      setTopupSubmitting(false);
    }
  };

  if (!open) return null;

  // usePathname() is SSR-safe (unlike window.location.pathname which is undefined on the server).
  const loginHref = `/login?redirect=${encodeURIComponent(pathname ?? '/')}`;

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
          <div className="flex items-center gap-2 min-w-0">
            <Wand2 className="h-5 w-5 text-indigo-700 shrink-0" aria-hidden />
            <h2 className="text-base font-semibold text-gray-900 truncate">
              {t('tryon.modal_title', 'Virtual try-on')}
            </h2>
            {/* Balance chip — shown when paid + authed */}
            {isPaid && isAuthenticated && balance !== null && (
              <span
                data-testid="tryon-balance-chip"
                className={cn(
                  'inline-flex items-center gap-1 rounded-full',
                  'bg-indigo-50 ring-1 ring-indigo-200 text-indigo-700',
                  'px-2 py-0.5 text-[10px] font-semibold shrink-0',
                  'ltr:ml-1 rtl:mr-1'
                )}
              >
                <Wallet className="h-2.5 w-2.5" aria-hidden />
                {balance}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40 shrink-0"
            aria-label={t('actions.close', 'Close')}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── Guest gate (paid mode, unauthenticated) ── */}
          {step === 'guest_gate' && (
            <div
              data-testid="tryon-guest-gate"
              className="flex flex-col items-center gap-5 py-8 text-center"
            >
              <div className="h-16 w-16 rounded-full bg-indigo-50 ring-1 ring-indigo-200 flex items-center justify-center">
                <LogIn className="h-8 w-8 text-indigo-700" aria-hidden />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-gray-900">
                  {t('tryon.guest_gate_title', 'Sign in to try on clothes')}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                  {t(
                    'tryon.guest_gate_desc',
                    'Your first try is free — sign in to get started.'
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <a
                  data-testid="tryon-signin-link"
                  href={loginHref}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-full py-3',
                    'bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-semibold shadow-sm',
                    'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40'
                  )}
                >
                  <LogIn className="h-4 w-4" aria-hidden />
                  {t('tryon.signin_cta', 'Sign in')}
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    'inline-flex items-center justify-center rounded-full py-3',
                    'ring-1 ring-gray-200 text-gray-600 text-sm font-medium',
                    'hover:ring-gray-300 hover:text-gray-900 transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40'
                  )}
                >
                  {t('tryon.continue_browsing', 'Continue browsing')}
                </button>
              </div>
            </div>
          )}

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
                    onClick={() => {
                      setPhotoFile(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
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

              {/* AI approximation disclaimer — provenance / safety copy */}
              <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-gray-400 text-center leading-relaxed px-1">
                {t(
                  'tryon.disclaimer',
                  'AI-generated approximation — fit and cut may differ from the real product'
                )}
              </p>

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

          {/* ── Daily limit (free mode 429) ── */}
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
                  "You've reached today's try-on limit. Try again tomorrow."
                )}
              </p>
            </div>
          )}

          {/* ── Top-up sheet (paid mode 402 / zero balance) ── */}
          {step === 'topup' && (
            <TopupSheet
              packs={topupPacks}
              rib={topupRib}
              topups={topups}
              onSubmit={handleTopupSubmit}
              submitting={topupSubmitting}
              confirmed={topupConfirmed}
            />
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
              {/* Refund notice */}
              {wasRefunded && (
                <p
                  data-testid="tryon-refund-notice"
                  className="text-xs text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 rounded-lg px-3 py-2"
                >
                  {t('tryon.refund_notice', 'Your credit has been returned to your wallet.')}
                </p>
              )}
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
