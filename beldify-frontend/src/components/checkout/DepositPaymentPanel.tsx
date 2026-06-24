'use client';

/**
 * DepositPaymentPanel — Open Souk buyer deal flow (OS-P1-8)
 *
 * Shown on /custom-orders/[id] when order.status === 'quoted' AND isBuyer.
 * Provides two payment paths:
 *   1. COD (Cash on Delivery) — one-click confirm
 *   2. Bank Transfer — reference input + proof-image upload
 *
 * Reuses Atlas token palette: amber accent, indigo primary, gray hairlines.
 * RTL-safe (uses start/end logical properties via Tailwind).
 * i18n: all string literals go through t() with English fallbacks.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  CreditCard,
  Upload,
  FileText,
  Loader2,
  Banknote,
} from 'lucide-react';
import { CustomOrder, payDeposit } from '@/services/customOrderService';
import { formatPrice } from '@/utils/formatters';
import toast from '@/utils/toast';
import logger from '@/utils/consoleLogger';

type PaymentMethod = 'cod' | 'bank_transfer';

export interface DepositPaymentPanelProps {
  order: CustomOrder & {
    community_post_id?: number | null;
    post_response_id?: number | null;
  };
  /** True if the current user is the buyer who owns this order */
  isBuyer: boolean;
  /** Called after a successful deposit payment (passes updated order) */
  onSuccess: (updated: CustomOrder) => void;
}

export default function DepositPaymentPanel({ order, isBuyer, onSuccess }: DepositPaymentPanelProps) {
  const { t } = useTranslation();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [reference, setReference] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Guard: not the buyer ───────────────────────────────────────────────────
  if (!isBuyer) return null;

  // ── Guard: already paid ────────────────────────────────────────────────────
  if (order.status !== 'quoted') {
    if (order.deposit_paid || order.status === 'deposit_paid') {
      return (
        <div className="rounded-2xl bg-teal-50 ring-1 ring-teal-200 px-5 py-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" aria-hidden />
          <p className="text-sm font-semibold text-teal-800">
            {t('customOrders.deposit.already_paid', 'Deposit paid — your order is now in progress.')}
          </p>
        </div>
      );
    }
    return null;
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCodConfirm = async () => {
    setSubmitting(true);
    try {
      const updated = await payDeposit(order.id, { method: 'cod' });
      toast.success(t('customOrders.deposit.success_cod', 'Deposit confirmed! Your order is now in progress.'));
      onSuccess(updated);
    } catch (err: unknown) {
      logger.error('COD deposit failed:', err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t('customOrders.deposit.error', 'Could not process payment. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBankTransferSubmit = async () => {
    if (!file) {
      toast.error(t('customOrders.deposit.file_required', 'Please attach your transfer receipt.'));
      return;
    }
    setSubmitting(true);
    try {
      const updated = await payDeposit(order.id, {
        method: 'bank_transfer',
        reference: reference.trim() || undefined,
        file,
      });
      toast.success(t('customOrders.deposit.success_transfer', 'Receipt uploaded — we will verify it shortly.'));
      onSuccess(updated);
    } catch (err: unknown) {
      logger.error('Bank-transfer deposit failed:', err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t('customOrders.deposit.error', 'Could not process payment. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const depositAmount = order.deposit_amount ? formatPrice(parseFloat(order.deposit_amount)) : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl ring-1 ring-amber-200 bg-amber-50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-amber-200 bg-white">
        <p className="text-[10px] uppercase tracking-[0.18em] text-amber-700 font-semibold mb-0.5">
          {t('customOrders.deposit.eyebrow', 'Deposit Required')}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900 tabular-nums">
            {depositAmount ?? '—'}
          </span>
          {order.quote_amount && (
            <span className="text-xs text-gray-500">
              {t('customOrders.deposit.of_total', 'of {{total}} total', {
                total: formatPrice(parseFloat(order.quote_amount)),
              })}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {t(
            'customOrders.deposit.subtitle',
            'Pay the deposit to confirm your custom order and start production.'
          )}
        </p>
      </div>

      {/* Method selector */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">
          {t('customOrders.deposit.choose_method', 'Choose payment method')}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* COD */}
          <button
            type="button"
            onClick={() => setSelectedMethod('cod')}
            aria-pressed={selectedMethod === 'cod'}
            className={[
              'flex flex-col items-center gap-2 rounded-xl px-3 py-4 text-sm font-semibold transition-all duration-200 ring-1',
              selectedMethod === 'cod'
                ? 'bg-indigo-700 text-white ring-indigo-700 shadow-md'
                : 'bg-white text-gray-700 ring-gray-200 hover:ring-indigo-300',
            ].join(' ')}
          >
            <Banknote className="h-5 w-5" aria-hidden />
            {t('customOrders.deposit.method_cod', 'Cash on Delivery')}
          </button>

          {/* Bank Transfer */}
          <button
            type="button"
            onClick={() => setSelectedMethod('bank_transfer')}
            aria-pressed={selectedMethod === 'bank_transfer'}
            className={[
              'flex flex-col items-center gap-2 rounded-xl px-3 py-4 text-sm font-semibold transition-all duration-200 ring-1',
              selectedMethod === 'bank_transfer'
                ? 'bg-indigo-700 text-white ring-indigo-700 shadow-md'
                : 'bg-white text-gray-700 ring-gray-200 hover:ring-indigo-300',
            ].join(' ')}
          >
            <CreditCard className="h-5 w-5" aria-hidden />
            {t('customOrders.deposit.method_transfer', 'Bank Transfer')}
          </button>
        </div>
      </div>

      {/* COD panel */}
      {selectedMethod === 'cod' && (
        <div className="px-5 pb-5">
          <div className="mt-4 rounded-xl bg-white ring-1 ring-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-4">
              {t(
                'customOrders.deposit.cod_description',
                'You will pay the deposit in cash when your order is delivered. Confirm to proceed.'
              )}
            </p>
            <button
              type="button"
              onClick={handleCodConfirm}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-full py-2.5 px-6 text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {t('common.loading', 'Loading…')}</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" aria-hidden /> {t('customOrders.deposit.confirm_cod', 'Confirm order')}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Bank-transfer panel */}
      {selectedMethod === 'bank_transfer' && (
        <div className="px-5 pb-5">
          <div className="mt-4 rounded-xl bg-white ring-1 ring-gray-200 p-4 space-y-4">
            <p className="text-sm text-gray-600">
              {t(
                'customOrders.deposit.transfer_description',
                'Transfer the deposit amount and upload your payment receipt below.'
              )}
            </p>

            {/* Reference input */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="deposit-reference">
                {t('customOrders.deposit.reference_label', 'Transfer reference')}
                <span className="text-gray-400 font-normal ms-1">
                  ({t('customOrders.optional', 'optional')})
                </span>
              </label>
              <input
                id="deposit-reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={t('customOrders.deposit.reference_placeholder', 'e.g. TXN-2026-001')}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
              />
            </div>

            {/* File upload */}
            <div>
              <label
                htmlFor="deposit-proof"
                className="block text-xs font-semibold text-gray-600 mb-1"
              >
                {t('customOrders.deposit.proof_label', 'Payment proof / receipt')}
              </label>
              <label
                htmlFor="deposit-proof"
                className="flex items-center gap-3 border border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                aria-label={t('customOrders.deposit.proof_aria', 'Upload payment proof or receipt')}
              >
                <Upload className="h-5 w-5 text-indigo-700 shrink-0" aria-hidden />
                <span className="text-sm text-gray-600 truncate">
                  {file ? (
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4" aria-hidden />
                      {file.name}
                    </span>
                  ) : (
                    t('customOrders.deposit.choose_file', 'Choose receipt (image or PDF)')
                  )}
                </span>
                <input
                  id="deposit-proof"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="sr-only"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleBankTransferSubmit}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-full py-2.5 px-6 text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {t('common.loading', 'Loading…')}</>
              ) : (
                <><Upload className="h-4 w-4" aria-hidden /> {t('customOrders.deposit.upload_receipt', 'Upload receipt & confirm')}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
