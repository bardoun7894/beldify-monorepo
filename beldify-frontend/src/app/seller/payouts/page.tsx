'use client';

/**
 * Seller Payouts Page
 *
 * Sections:
 *  1. Balance card — withdrawable amount in MAD + min payout note.
 *  2. Bank-details section — shows current {account_holder, bank_name, rib}
 *     or an editor when null / when the seller clicks "Edit".
 *     Bank details are REQUIRED before submitting a request.
 *  3. Request-payout form — amount input with client validation
 *     (≥ min_amount, ≤ available). Gated on:
 *       a. bank details present
 *       b. no open (pending/approved) request
 *       c. available ≥ min_amount
 *     422 error codes → friendly localized messages.
 *     Success → "pending review" state.
 *  4. History — list of payout requests with status badges:
 *       pending (amber) / approved (blue) / rejected (red + reason) / paid (green + ref + date)
 *     Skeletons while loading + empty state.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import {
  getSellerPayouts,
  requestPayout,
  updateBankDetails,
  SellerPayoutsResponse,
  PayoutRequest,
  BankDetails,
} from '@/services/sellerPayoutService';
import {
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Pencil,
  Building2,
} from 'lucide-react';
import toast from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { payoutStatusVariant } from '@/constants/payoutStatusColors';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className ?? ''}`} />;
}

const BCP47_MAP: Record<string, string> = { ar: 'ar-MA', ma: 'ar-MA', fr: 'fr-FR' };

function fmtMAD(n: number, lang?: string): string {
  const locale = BCP47_MAP[lang ?? ''] ?? 'fr-MA';
  return n.toLocaleString(locale, { minimumFractionDigits: 0 });
}

function fmtDate(iso: string, lang?: string): string {
  try {
    const locale = BCP47_MAP[lang ?? ''] ?? 'en-US';
    return new Date(iso).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Normalise RIB for display — strip extra spaces, group in 6-4-13-2 blocks */
function normaliseRIB(rib: string): string {
  return rib.replace(/\s+/g, '').trim();
}

/** Validate a Moroccan RIB: 24 digits (spaces allowed) */
function isValidRIB(rib: string): boolean {
  return /^\d[\d\s]{22,46}\d$/.test(rib) && normaliseRIB(rib).length === 24;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const PAYOUT_STATUS_ICON: Record<string, React.ElementType> = {
  paid: CheckCircle2,
  approved: CheckCircle2,
  rejected: XCircle,
  pending: Clock,
};

function StatusBadge({
  id,
  status,
  t,
}: {
  id: number;
  status: string;
  t: (k: string, f: string) => string;
}) {
  const Icon = PAYOUT_STATUS_ICON[status] ?? Clock;
  const key = ['paid', 'approved', 'rejected', 'pending'].includes(status) ? status : 'pending';
  return (
    <Badge
      data-testid={`badge-${key}-${id}`}
      variant={payoutStatusVariant(status)}
      className="font-semibold"
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      {t(`payouts.status.${key}`, key)}
    </Badge>
  );
}

// ─── Balance card ─────────────────────────────────────────────────────────────

function BalanceCard({
  available,
  minAmount,
  currency,
  t,
}: {
  available: number;
  minAmount: number;
  currency: string;
  t: (k: string, f: string) => string;
}) {
  return (
    <div className="bg-indigo-700 rounded-2xl p-6 text-white">
      <p className="text-xs uppercase tracking-[0.18em] text-amber-300 font-medium mb-3">
        {t('payouts.balance_card.eyebrow', 'Your Earnings')}
      </p>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center shrink-0">
          <Wallet className="w-6 h-6 text-indigo-950" aria-hidden="true" />
        </div>
        <div>
          <p
            className="text-4xl font-bold leading-none tabular-nums"
            data-testid="payout-available"
          >
            {fmtMAD(available)}
          </p>
          <p className="text-sm text-indigo-300 mt-0.5">
            {currency} {t('payouts.balance_card.available_label', 'withdrawable')}
          </p>
        </div>
      </div>
      <p
        className="text-xs text-indigo-300 border-t border-indigo-600 pt-3"
        data-testid="payout-min-note"
      >
        {t('payouts.balance_card.min_note', `Minimum payout: ${minAmount} ${currency}`)
          .replace('{{min}}', String(minAmount))
          .replace('{{currency}}', currency)}
        {/* Fallback: inline the values since some locales may not use placeholders */}
        {` — `}
        {t('payouts.balance_card.framing', 'your earnings ready to withdraw')}
      </p>
    </div>
  );
}

// ─── Bank-details display ─────────────────────────────────────────────────────

function BankDetailsDisplay({
  details,
  onEdit,
  t,
}: {
  details: BankDetails;
  onEdit: () => void;
  t: (k: string, f: string) => string;
}) {
  return (
    <div
      data-testid="bank-details-display"
      className="bg-white ring-1 ring-gray-200 rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-600" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-gray-900 font-heading">
            {t('payouts.bank_details.title', 'Bank account')}
          </h2>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={t('payouts.bank_details.edit_aria', 'Edit bank details')}
          className="flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-900 transition-colors"
        >
          <Pencil className="w-3 h-3" aria-hidden="true" />
          {t('payouts.bank_details.edit', 'Edit')}
        </button>
      </div>
      <dl className="divide-y divide-gray-100 text-sm px-5 py-1">
        <div className="flex justify-between py-2.5">
          <dt className="text-gray-500">{t('payouts.bank_details.account_holder', 'Account holder')}</dt>
          <dd className="font-medium text-gray-900">{details.account_holder}</dd>
        </div>
        <div className="flex justify-between py-2.5">
          <dt className="text-gray-500">{t('payouts.bank_details.bank_name', 'Bank')}</dt>
          <dd className="font-medium text-gray-900">{details.bank_name}</dd>
        </div>
        <div className="flex justify-between py-2.5">
          <dt className="text-gray-500">{t('payouts.bank_details.rib', 'RIB')}</dt>
          <dd className="font-mono text-xs text-gray-900 break-all text-end max-w-[60%]">
            {details.rib}
          </dd>
        </div>
      </dl>
    </div>
  );
}

// ─── Bank-details editor ──────────────────────────────────────────────────────

function BankDetailsEditor({
  initial,
  onSaved,
  onCancel,
  t,
}: {
  initial: BankDetails | null;
  onSaved: (details: BankDetails) => void;
  onCancel: (() => void) | null;
  t: (k: string, f: string) => string;
}) {
  const [form, setForm] = useState<BankDetails>({
    account_holder: initial?.account_holder ?? '',
    bank_name: initial?.bank_name ?? '',
    rib: initial?.rib ?? '',
  });
  const [ribError, setRibError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof BankDetails) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (field === 'rib') setRibError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedRIB = form.rib.trim();
    if (!isValidRIB(cleanedRIB)) {
      setRibError(t('payouts.bank_details.rib_invalid', 'RIB must be exactly 24 digits'));
      return;
    }
    setSaving(true);
    try {
      const result = await updateBankDetails({ ...form, rib: cleanedRIB });
      onSaved(result.bank_details);
      toast.success(t('payouts.bank_details.saved_toast', 'Bank details saved'));
    } catch {
      toast.error(t('payouts.bank_details.save_error', 'Could not save bank details. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      data-testid="bank-details-editor"
      className="bg-white ring-1 ring-gray-200 rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Building2 className="w-4 h-4 text-indigo-600" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-gray-900 font-heading">
          {initial
            ? t('payouts.bank_details.edit_title', 'Edit bank account')
            : t('payouts.bank_details.add_title', 'Add bank account')}
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
        {/* Account holder */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            {t('payouts.bank_details.account_holder', 'Account holder')}
            <span className="text-rose-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            required
            value={form.account_holder}
            onChange={handleChange('account_holder')}
            placeholder={t('payouts.bank_details.account_holder_placeholder', 'Full name as on your bank account')}
            className="w-full rounded-xl ring-1 ring-gray-200 focus:ring-indigo-400 focus:outline-none px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Bank name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            {t('payouts.bank_details.bank_name', 'Bank')}
            <span className="text-rose-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            required
            value={form.bank_name}
            onChange={handleChange('bank_name')}
            placeholder={t('payouts.bank_details.bank_name_placeholder', 'e.g. CIH Bank, Attijariwafa, BMCE')}
            className="w-full rounded-xl ring-1 ring-gray-200 focus:ring-indigo-400 focus:outline-none px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* RIB */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            {t('payouts.bank_details.rib', 'RIB')}
            <span className="text-rose-500 ml-0.5">*</span>
            <span className="text-gray-400 font-normal ml-1">
              ({t('payouts.bank_details.rib_hint', '24 digits')})
            </span>
          </label>
          <input
            type="text"
            required
            value={form.rib}
            onChange={handleChange('rib')}
            placeholder={t('payouts.bank_details.rib_placeholder', '230 780 4823412300048754 91')}
            className={[
              'w-full rounded-xl ring-1 focus:outline-none px-3 py-2.5 text-sm font-mono placeholder:text-gray-400 placeholder:font-sans',
              ribError ? 'ring-rose-400 bg-rose-50' : 'ring-gray-200 focus:ring-indigo-400',
            ].join(' ')}
            inputMode="numeric"
          />
          {ribError && (
            <p className="text-xs text-rose-600 mt-1">{ribError}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            {saving
              ? t('payouts.bank_details.saving', 'Saving…')
              : t('payouts.bank_details.save_cta', 'Save bank details')}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors px-3 py-2.5"
            >
              {t('payouts.bank_details.cancel', 'Cancel')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── Request payout form ──────────────────────────────────────────────────────

function RequestPayoutForm({
  available,
  minAmount,
  currency,
  onSuccess,
  t,
}: {
  available: number;
  minAmount: number;
  currency: string;
  onSuccess: () => void;
  t: (k: string, f: string) => string;
}) {
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = (value: string): string | null => {
    const n = parseInt(value, 10);
    if (!value || isNaN(n) || n <= 0) {
      return t('payouts.form.amount_required', 'Please enter an amount');
    }
    if (n < minAmount) {
      return t('payouts.form.below_min', `Minimum payout amount is ${minAmount} ${currency}`)
        .replace('{{min}}', String(minAmount))
        .replace('{{currency}}', currency);
    }
    if (n > available) {
      return t('payouts.form.above_available', `Maximum available is ${fmtMAD(available)} ${currency}`)
        .replace('{{available}}', fmtMAD(available))
        .replace('{{currency}}', currency);
    }
    return null;
  };

  const map422 = (code: string): string => {
    switch (code) {
      case 'below_min':
        return t('payouts.form.error_below_min', `Amount is below the minimum of ${minAmount} ${currency}`)
          .replace('{{min}}', String(minAmount))
          .replace('{{currency}}', currency);
      case 'above_available':
        return t('payouts.form.error_above_available', `Amount exceeds your available balance of ${fmtMAD(available)} ${currency}`)
          .replace('{{available}}', fmtMAD(available))
          .replace('{{currency}}', currency);
      case 'no_bank_details':
        return t('payouts.form.error_no_bank_details', 'Please add your bank details (RIB) before requesting a payout');
      case 'open_request_exists':
        return t('payouts.form.error_open_request', 'You already have a pending payout request. Wait for it to be processed.');
      default:
        return t('payouts.form.error_generic', 'Could not submit your request. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const err = validate(amount);
    if (err) {
      setAmountError(err);
      return;
    }
    setSubmitting(true);
    try {
      await requestPayout(parseInt(amount, 10));
      onSuccess();
    } catch (ex: unknown) {
      const err = ex as { response?: { status?: number; data?: { code?: string } } };
      if (err?.response?.status === 422 && err?.response?.data?.code) {
        setSubmitError(map422(err.response.data.code));
      } else {
        setSubmitError(t('payouts.form.error_generic', 'Could not submit your request. Please try again.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      data-testid="payout-form"
      onSubmit={handleSubmit}
      className="bg-white ring-1 ring-gray-200 rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 font-heading">
          {t('payouts.form.title', 'Request a payout')}
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {t('payouts.form.subtitle', 'The amount will be transferred to your bank account by the platform.')}
        </p>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Submit error (from 422) */}
        {submitError && (
          <div
            data-testid="submit-error"
            className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-xs text-rose-700"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            {submitError}
          </div>
        )}

        {/* Amount input */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            {t('payouts.form.amount_label', 'Amount')}
            <span className="text-gray-400 font-normal ml-1">({currency})</span>
            <span className="text-rose-500 ml-0.5">*</span>
          </label>
          <input
            data-testid="payout-amount-input"
            type="number"
            min={minAmount}
            max={available}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setAmountError(null);
            }}
            placeholder={String(minAmount)}
            className={[
              'w-full rounded-xl ring-1 focus:outline-none px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 tabular-nums',
              amountError ? 'ring-rose-400 bg-rose-50' : 'ring-gray-200 focus:ring-indigo-400',
            ].join(' ')}
          />
          {amountError && (
            <p data-testid="amount-error" className="text-xs text-rose-600 mt-1">
              {amountError}
            </p>
          )}
        </div>

        {/* Helper: available balance */}
        <p className="text-xs text-gray-400">
          {t('payouts.form.available_hint', `Available: ${fmtMAD(available)} ${currency}`)
            .replace('{{available}}', fmtMAD(available))
            .replace('{{currency}}', currency)}
        </p>

        {/* Submit */}
        <button
          data-testid="payout-submit-btn"
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl px-5 py-3 text-sm font-semibold transition-colors"
        >
          {submitting
            ? t('payouts.form.submitting', 'Submitting…')
            : t('payouts.form.submit_cta', 'Request payout')}
        </button>
      </div>
    </form>
  );
}

// ─── Payout history ───────────────────────────────────────────────────────────

function PayoutHistory({
  requests,
  t,
}: {
  requests: PayoutRequest[];
  t: (k: string, f: string) => string;
}) {
  return (
    <div className="bg-white ring-1 ring-gray-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 font-heading">
          {t('payouts.history.title', 'Payout history')}
        </h2>
      </div>

      {requests.length === 0 ? (
        <div
          data-testid="payout-history-empty"
          className="px-5 py-10 text-center"
        >
          <p className="text-sm text-gray-400">{t('payouts.history.empty', 'No payout requests yet.')}</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 text-sm">
          {requests.map((req) => (
            <li
              key={req.id}
              data-testid={`payout-row-${req.id}`}
              className="px-5 py-4 flex items-start gap-4"
            >
              {/* Left: status + metadata */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <StatusBadge id={req.id} status={req.status} t={t} />
                  <span className="text-xs font-bold text-gray-900 tabular-nums currency-mad">
                    {fmtMAD(req.amount)} MAD
                  </span>
                </div>

                <p className="text-xs text-gray-400">
                  {t('payouts.history.requested_on', 'Requested')}{' '}
                  {fmtDate(req.created_at)}
                </p>

                {/* Rejection reason */}
                {req.status === 'rejected' && req.reject_reason && (
                  <p className="text-xs text-rose-600 mt-1">{req.reject_reason}</p>
                )}

                {/* Payment info */}
                {req.status === 'paid' && (
                  <div className="mt-1 space-y-0.5">
                    {req.reference && (
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">{t('payouts.history.reference', 'Ref:')}</span>{' '}
                        <span className="font-mono">{req.reference}</span>
                      </p>
                    )}
                    {req.paid_at && (
                      <p className="text-xs text-emerald-600">
                        {t('payouts.history.paid_on', 'Paid on')} {fmtDate(req.paid_at)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SellerPayoutsPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const [data, setData] = useState<SellerPayoutsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bank-details edit mode
  const [editingBank, setEditingBank] = useState(false);

  // Request success state
  const [requestSuccess, setRequestSuccess] = useState(false);

  const fetchPayouts = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getSellerPayouts();
      setData(res);
    } catch {
      setError(t('payouts.fetch_error', 'Could not load payout data. Please refresh.'));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, t]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleBankSaved = (details: BankDetails) => {
    if (data) {
      setData({ ...data, bank_details: details });
    }
    setEditingBank(false);
  };

  const handleRequestSuccess = () => {
    setRequestSuccess(true);
    // Refresh after a short delay so history updates
    setTimeout(() => {
      fetchPayouts();
    }, 1500);
  };

  // ── Determine request form gate ──────────────────────────────────────────────
  const noBankDetails = data ? data.bank_details === null : false;
  const hasOpenRequest = data?.has_open_request ?? false;
  const belowMin = data ? data.available < data.min_amount : false;

  const showRequestForm =
    !noBankDetails && !hasOpenRequest && !belowMin && !requestSuccess;

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page header */}
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-amber-600 font-medium mb-1">
          {t('payouts.eyebrow', 'Seller Hub')}
        </p>
        <h1 className="text-xl font-bold text-gray-900 font-heading">
          {t('payouts.page_title', 'Payouts')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('payouts.page_subtitle', 'Withdraw your earnings to your bank account.')}
        </p>
      </div>

      {/* Fetch error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Skeleton while loading */}
      {loading && (
        <div data-testid="payouts-skeleton" className="space-y-4">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {/* Content */}
      {!loading && data && (
        <>
          {/* 1. Balance card */}
          <BalanceCard
            available={data.available}
            minAmount={data.min_amount}
            currency={data.currency}
            t={t}
          />

          {/* 2. Bank-details section */}
          {editingBank ? (
            <BankDetailsEditor
              initial={data.bank_details}
              onSaved={handleBankSaved}
              onCancel={() => setEditingBank(false)}
              t={t}
            />
          ) : data.bank_details ? (
            <BankDetailsDisplay
              details={data.bank_details}
              onEdit={() => setEditingBank(true)}
              t={t}
            />
          ) : (
            <div
              data-testid="bank-details-missing"
              className="bg-amber-50 ring-1 ring-amber-200 rounded-2xl p-5 flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    {t('payouts.bank_details.missing_title', 'No bank account added')}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {t(
                      'payouts.bank_details.missing_body',
                      'Add your RIB to be able to request a payout. Your bank details are required before submitting a withdrawal.'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingBank(true)}
                className="self-start inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl px-4 py-2 text-xs font-semibold transition-colors"
              >
                {t('payouts.bank_details.add_cta', 'Add bank account')}
              </button>
            </div>
          )}

          {/* 3. Request-payout section */}
          {requestSuccess ? (
            <div
              data-testid="payout-success"
              className="bg-white ring-1 ring-emerald-200 rounded-2xl px-6 py-10 flex flex-col items-center text-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 font-heading">
                  {t('payouts.success.title', 'Request submitted!')}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {t(
                    'payouts.success.body',
                    'Your payout request is under review. The platform owner will transfer the funds by bank transfer and mark it as paid.'
                  )}
                </p>
              </div>
            </div>
          ) : noBankDetails ? (
            <div
              data-testid="gate-no-bank-details"
              className="bg-gray-50 ring-1 ring-gray-200 rounded-2xl px-5 py-8 text-center"
            >
              <p className="text-sm text-gray-500">
                {t(
                  'payouts.form.gate_no_bank_details',
                  'Add your bank account details above to request a payout.'
                )}
              </p>
            </div>
          ) : hasOpenRequest ? (
            <div
              data-testid="gate-open-request"
              className="bg-amber-50 ring-1 ring-amber-200 rounded-2xl px-5 py-8 text-center"
            >
              <p className="text-sm text-amber-800 font-medium">
                {t('payouts.form.gate_open_request', 'You already have a pending payout request.')}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {t('payouts.form.gate_open_request_sub', 'Only one request can be open at a time. Wait for it to be processed.')}
              </p>
            </div>
          ) : belowMin ? (
            <div
              data-testid="gate-below-min"
              className="bg-gray-50 ring-1 ring-gray-200 rounded-2xl px-5 py-8 text-center"
            >
              <p className="text-sm text-gray-500">
                {t(
                  'payouts.form.gate_below_min',
                  `Your balance (${fmtMAD(data.available)} MAD) is below the minimum payout of ${data.min_amount} MAD.`
                )
                  .replace('{{available}}', fmtMAD(data.available))
                  .replace('{{min}}', String(data.min_amount))}
              </p>
            </div>
          ) : showRequestForm ? (
            <RequestPayoutForm
              available={data.available}
              minAmount={data.min_amount}
              currency={data.currency}
              onSuccess={handleRequestSuccess}
              t={t}
            />
          ) : null}

          {/* 4. History */}
          <PayoutHistory requests={data.requests} t={t} />
        </>
      )}
    </div>
  );
}
