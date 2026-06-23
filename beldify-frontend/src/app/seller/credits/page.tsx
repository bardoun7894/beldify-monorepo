'use client';

/**
 * Seller Credits Page
 *
 * Sections:
 *  1. Balance card — current balance + sparkle icon, with feature-cost grid.
 *  2. Buy credits — pack cards → purchase flow (bank RIB + receipt upload +
 *     optional reference → submit → "pending review" success state).
 *     Gracefully degrades when bank_details is empty (shows packs but defers purchase).
 *  3. Purchase history — status badges (pending/approved/rejected) + admin notes.
 *  4. Transaction ledger — signed amounts (+/-), balance_after, date.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import {
  getSellerCredits,
  getSellerCreditPacks,
  purchaseCredits,
  getSellerCreditPurchases,
  SellerCreditsResponse,
  SellerCreditPacksResponse,
  CreditPurchaseRecord,
  CreditPack,
} from '@/services/sellerCreditService';
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  Upload,
  ArrowLeft,
} from 'lucide-react';
import toast from '@/utils/toast';

// ─── Types ────────────────────────────────────────────────────────────────────
type PurchaseStep = 'packs' | 'payment' | 'success';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className ?? ''}`} />;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Status badge for purchase history */
function StatusBadge({ status, t }: { status: string; t: (k: string, f: string) => string }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
        {t('credits.status.approved', 'approved')}
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
        <XCircle className="w-3 h-3" aria-hidden="true" />
        {t('credits.status.rejected', 'rejected')}
      </span>
    );
  }
  // pending (default)
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <Clock className="w-3 h-3" aria-hidden="true" />
      {t('credits.status.pending', 'pending')}
    </span>
  );
}

// ─── Balance card ─────────────────────────────────────────────────────────────
function BalanceCard({
  balance,
  costs,
  t,
}: {
  balance: number;
  costs: SellerCreditsResponse['costs'];
  t: (k: string, f: string) => string;
}) {
  const featureRows = [
    { key: 'listing_writer', label: t('credits.features.listing_writer', 'Listing Writer'), cost: costs.listing_writer },
    { key: 'store_creator', label: t('credits.features.store_creator', 'Store Creator'), cost: costs.store_creator },
    { key: 'translate_listing', label: t('credits.features.translate_listing', 'Auto-Translate'), cost: costs.translate_listing },
    { key: 'marketing_copy', label: t('credits.features.marketing_copy', 'Marketing Copy'), cost: costs.marketing_copy },
  ];

  return (
    <div className="bg-indigo-700 rounded-2xl p-6 text-white">
      <p className="text-xs uppercase tracking-[0.18em] text-amber-300 font-medium mb-3">
        {t('credits.balance_card.eyebrow', 'Your AI Credits')}
      </p>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-indigo-950" aria-hidden="true" />
        </div>
        <div>
          <p className="text-4xl font-bold leading-none">{balance}</p>
          <p className="text-sm text-indigo-300 mt-0.5">
            {t('credits.balance_card.credits_label', 'credits available')}
          </p>
        </div>
      </div>

      {/* Feature cost grid */}
      <div className="border-t border-indigo-600 pt-4">
        <p className="text-xs text-indigo-300 uppercase tracking-wide mb-3">
          {t('credits.balance_card.costs_label', 'Feature costs')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {featureRows.map(({ key, label, cost }) => (
            <div key={key} className="flex items-center justify-between bg-indigo-800 rounded-xl px-3 py-2">
              <span className="text-xs text-indigo-200 truncate">{label}</span>
              <span className="text-xs font-bold text-amber-300 ml-2 shrink-0">
                {cost} {t('credits.balance_card.credits_unit', 'credits')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Pack card ────────────────────────────────────────────────────────────────
function PackCard({
  pack,
  onSelect,
  t,
}: {
  pack: CreditPack;
  onSelect: (p: CreditPack) => void;
  t: (k: string, f: string) => string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(pack)}
      aria-label={pack.name}
      className="flex flex-col items-start bg-white ring-1 ring-gray-200 hover:ring-indigo-400 rounded-2xl p-5 text-start transition-all hover:-translate-y-0.5 hover:shadow-md group w-full"
    >
      <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
        <Sparkles className="w-4 h-4 text-amber-600" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-gray-900 mb-1">{pack.name}</p>
      <p className="text-2xl font-bold text-indigo-700 leading-none mb-1">
        {pack.credits} credits
      </p>
      <p className="text-sm text-gray-500">{pack.price_mad} MAD</p>
      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-indigo-700 group-hover:gap-2.5 transition-all">
        {t('credits.pack_card.select_cta', 'Buy this pack')}
      </div>
    </button>
  );
}

// ─── Purchase form ────────────────────────────────────────────────────────────
function PurchaseForm({
  pack,
  bankDetails,
  onBack,
  onSuccess,
  t,
}: {
  pack: CreditPack;
  bankDetails: string;
  onBack: () => void;
  onSuccess: () => void;
  t: (k: string, f: string) => string;
}) {
  const [receipt, setReceipt] = useState<File | null>(null);
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current); }, []);

  const handleCopyRIB = () => {
    if (bankDetails) {
      navigator.clipboard.writeText(bankDetails).then(() => {
        setCopied(true);
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error(t('credits.purchase.receipt_too_large', 'Receipt must be smaller than 5 MB'));
      return;
    }
    setReceipt(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receipt) {
      toast.error(t('credits.purchase.receipt_required', 'Please upload your payment receipt'));
      return;
    }
    setSubmitting(true);
    try {
      await purchaseCredits({
        pack_id: pack.id,
        receipt,
        reference: reference.trim() || undefined,
      });
      onSuccess();
    } catch {
      toast.error(t('credits.purchase.submit_error', 'Submission failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white ring-1 ring-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('credits.purchase.back', 'Back to packs')}
          className="text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </button>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {t('credits.purchase.form_title', 'Complete your purchase')}
          </p>
          <p className="text-xs text-gray-500">
            {pack.name} — {pack.credits} {t('credits.pack_card.credits_unit', 'credits')} · {pack.price_mad} MAD
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
        {/* Bank details */}
        {bankDetails ? (
          <div className="bg-amber-50 ring-1 ring-amber-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
              {t('credits.purchase.bank_details_label', 'Bank transfer details')}
            </p>
            <div className="flex items-center gap-3">
              <p className="text-sm font-mono text-gray-900 flex-1 break-all">{bankDetails}</p>
              <button
                type="button"
                onClick={handleCopyRIB}
                aria-label={t('credits.purchase.copy_rib', 'Copy RIB')}
                className="shrink-0 text-amber-600 hover:text-amber-800 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 ring-1 ring-gray-200 rounded-2xl p-4 text-sm text-gray-500 text-center">
            {t(
              'credits.purchase.bank_details_unavailable',
              'Bank details not configured yet. Please contact support to complete your purchase.'
            )}
          </div>
        )}

        {/* Receipt upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('credits.purchase.receipt_label', 'Payment receipt')}{' '}
            <span className="text-rose-500">*</span>
          </label>
          <div
            className="relative flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl py-6 px-4 cursor-pointer hover:border-indigo-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={handleFileChange}
            />
            {receipt ? (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span className="truncate max-w-[220px]">{receipt.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-gray-400">
                <Upload className="w-5 h-5" aria-hidden="true" />
                <p className="text-xs text-center">
                  {t('credits.purchase.receipt_hint', 'JPG, PNG, WebP or PDF — max 5 MB')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Optional reference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('credits.purchase.reference_label', 'Transfer reference (optional)')}
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={t('credits.purchase.reference_placeholder', 'Bank transfer reference code')}
            className="w-full rounded-xl ring-1 ring-gray-200 focus:ring-indigo-400 focus:outline-none px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !receipt}
          className="w-full flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl px-5 py-3 text-sm font-semibold transition-colors"
        >
          {submitting
            ? t('credits.purchase.submitting', 'Submitting…')
            : t('credits.purchase.submit_cta', 'Submit purchase request')}
        </button>
      </form>
    </div>
  );
}

// ─── Purchase history ─────────────────────────────────────────────────────────
function PurchaseHistory({
  purchases,
  t,
}: {
  purchases: CreditPurchaseRecord[];
  t: (k: string, f: string) => string;
}) {
  if (purchases.length === 0) {
    return (
      <div className="bg-white ring-1 ring-gray-200 rounded-2xl px-5 py-10 text-center">
        <p className="text-sm text-gray-400">{t('credits.history.empty', 'No purchase history yet.')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white ring-1 ring-gray-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 font-heading">
          {t('credits.history.title', 'Purchase history')}
        </h2>
      </div>
      <ul className="divide-y divide-gray-100 text-sm">
        {purchases.map((p) => (
          <li key={p.id} className="px-5 py-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={p.status} t={t} />
              </div>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                {p.pack_name} · {p.credits} {t('credits.pack_card.credits_unit', 'credits')} · {p.price_mad} MAD ·{' '}
                {fmtDate(p.created_at)}
              </p>
              {p.notes && (
                <p className="text-xs text-rose-600 mt-1">{p.notes}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Transaction ledger ───────────────────────────────────────────────────────
function TransactionLedger({
  transactions,
  t,
}: {
  transactions: SellerCreditsResponse['transactions'];
  t: (k: string, f: string) => string;
}) {
  const TRANSACTION_TYPE_LABELS: Record<string, string> = {
    purchase: t('credits.tx_type.purchase', 'Purchase'),
    bonus: t('credits.tx_type.bonus', 'Welcome bonus'),
    consumption: t('credits.tx_type.consumption', 'Used'),
    refund: t('credits.tx_type.refund', 'Refund'),
    adjustment: t('credits.tx_type.adjustment', 'Adjustment'),
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white ring-1 ring-gray-200 rounded-2xl px-5 py-10 text-center">
        <p className="text-sm text-gray-400">{t('credits.ledger.empty', 'No transactions yet.')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white ring-1 ring-gray-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 font-heading">
          {t('credits.ledger.title', 'Transaction history')}
        </h2>
      </div>
      <ul className="divide-y divide-gray-100 text-sm">
        {transactions.map((tx) => (
          <li key={tx.id} className="px-5 py-3.5 flex items-center gap-4">
            {/* Signed amount */}
            <span
              className={[
                'text-sm font-bold tabular-nums w-14 shrink-0 text-end',
                tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600',
              ].join(' ')}
            >
              {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
            </span>
            {/* Type + feature */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}
              </p>
              {tx.feature && (
                <p className="text-xs text-gray-400 truncate">{tx.feature}</p>
              )}
            </div>
            {/* Balance after */}
            <div className="text-end shrink-0">
              <p className="text-xs text-gray-500">
                → {tx.balance_after}
              </p>
              <p className="text-xs text-gray-400">{fmtDate(tx.created_at)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SellerCreditsPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const [credits, setCredits] = useState<SellerCreditsResponse | null>(null);
  const [packsData, setPacksData] = useState<SellerCreditPacksResponse | null>(null);
  const [purchases, setPurchases] = useState<CreditPurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Purchase flow state
  const [purchaseStep, setPurchaseStep] = useState<PurchaseStep>('packs');
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);

  const fetchAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const [creditsRes, packsRes, purchasesRes] = await Promise.all([
        getSellerCredits(),
        getSellerCreditPacks(),
        getSellerCreditPurchases(),
      ]);
      setCredits(creditsRes);
      setPacksData(packsRes);
      setPurchases(purchasesRes.purchases);
    } catch {
      setError(t('credits.fetch_error', 'Could not load credit data. Please refresh.'));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, t]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handlePackSelect = (pack: CreditPack) => {
    setSelectedPack(pack);
    setPurchaseStep('payment');
  };

  const handlePurchaseSuccess = () => {
    setPurchaseStep('success');
    // Refresh data after a short delay so the new purchase shows up
    setTimeout(() => {
      fetchAll();
    }, 1500);
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page header */}
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-amber-600 font-medium mb-1">
          {t('credits.eyebrow', 'Seller Hub')}
        </p>
        <h1 className="text-xl font-bold text-gray-900 font-heading">
          {t('credits.page_title', 'AI Credits')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('credits.page_subtitle', 'Top up credits to use AI tools — listing writer, translator, and more.')}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Skeleton while loading */}
      {loading && (
        <div data-testid="credits-skeleton" className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {/* Content */}
      {!loading && credits && packsData && (
        <>
          {/* Balance card */}
          <BalanceCard balance={credits.balance} costs={credits.costs} t={t} />

          {/* Buy credits section */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3 font-heading">
              {t('credits.buy_section_title', 'Top up credits')}
            </h2>

            {/* Pack selection */}
            {purchaseStep === 'packs' && (
              <>
                {packsData.packs.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {packsData.packs.map((pack) => (
                      <PackCard key={pack.id} pack={pack} onSelect={handlePackSelect} t={t} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white ring-1 ring-gray-200 rounded-2xl px-5 py-10 text-center">
                    <p className="text-sm text-gray-400">
                      {t('credits.no_packs', 'No packs available. Check back soon.')}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Payment form */}
            {purchaseStep === 'payment' && selectedPack && (
              <PurchaseForm
                pack={selectedPack}
                bankDetails={packsData.bank_details}
                onBack={() => setPurchaseStep('packs')}
                onSuccess={handlePurchaseSuccess}
                t={t}
              />
            )}

            {/* Success state */}
            {purchaseStep === 'success' && (
              <div className="bg-white ring-1 ring-emerald-200 rounded-2xl px-6 py-10 flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 font-heading">
                    {t('credits.purchase.success_title', 'Purchase submitted!')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {t(
                      'credits.purchase.success_body',
                      'Your receipt is under review. Credits will be added once approved.'
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPurchaseStep('packs')}
                  className="text-sm font-medium text-indigo-700 hover:text-indigo-900 transition-colors"
                >
                  {t('credits.purchase.buy_more', 'Buy more credits')}
                </button>
              </div>
            )}
          </div>

          {/* Purchase history */}
          <PurchaseHistory purchases={purchases} t={t} />

          {/* Transaction ledger */}
          <TransactionLedger transactions={credits.transactions} t={t} />
        </>
      )}
    </div>
  );
}
