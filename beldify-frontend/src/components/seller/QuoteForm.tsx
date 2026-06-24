'use client';

/**
 * T032 — Seller: quote form
 *
 * Submits POST /api/v1/custom-orders/{id}/quote.
 * Only renders when order.status === 'requested' (D4-RESOLVED: A5 is exclusive).
 *
 * LIVE WIRING (WS-A): submitQuote in customOrderService.ts (USE_MOCK flag)
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Loader2 } from 'lucide-react';
import { submitQuote, QuotePayload, CustomOrder } from '@/services/customOrderService';
import { cn } from '@/lib/utils';

export interface QuoteFormProps {
  order: CustomOrder;
  onQuoted: (updated: CustomOrder) => void;
}

export default function QuoteForm({ order, onQuoted }: QuoteFormProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const [quoteAmount, setQuoteAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [eta, setEta] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only renders when status === 'requested' (contracts.md D4-RESOLVED)
  if (order.status !== 'requested') return null;

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qa = parseFloat(quoteAmount);
    const da = parseFloat(depositAmount);

    if (!qa || qa <= 0) {
      setError(t('seller.quote.error_amount', 'Quote amount is required and must be > 0'));
      return;
    }
    if (da < 0 || da > qa) {
      setError(t('seller.quote.error_deposit', 'Deposit must be between 0 and quote amount'));
      return;
    }
    if (!eta || eta <= today) {
      setError(t('seller.quote.error_eta', 'ETA must be a future date'));
      return;
    }

    try {
      setSubmitting(true);
      const payload: QuotePayload = {
        quote_amount: qa,
        deposit_amount: da,
        eta,
      };
      const updated = await submitQuote(order.id, payload);
      onQuoted(updated);
    } catch {
      setError(t('seller.quote.error_submit', 'Failed to submit quote. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl ring-1 ring-gray-200 bg-white p-5 space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
        {t('seller.quote.section_title', 'Send a Quote')}
      </p>

      {error && (
        <div className="rounded-xl bg-rose-50 ring-1 ring-rose-200 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Quote amount */}
        <div className="space-y-1.5">
          <label htmlFor="quote_amount" className="text-sm font-medium text-gray-700">
            {t('seller.quote.amount_label', 'Quote Amount (MAD)')}
            <span className="text-rose-600 ms-1" aria-label="required">*</span>
          </label>
          <input
            id="quote_amount"
            name="quote_amount"
            type="number"
            min="1"
            step="0.01"
            required
            value={quoteAmount}
            onChange={e => setQuoteAmount(e.target.value)}
            placeholder="1200.00"
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white focus:border-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
          />
        </div>

        {/* Deposit amount */}
        <div className="space-y-1.5">
          <label htmlFor="deposit_amount" className="text-sm font-medium text-gray-700">
            {t('seller.quote.deposit_label', 'Deposit (MAD)')}
            <span className="text-rose-600 ms-1" aria-label="required">*</span>
          </label>
          <input
            id="deposit_amount"
            name="deposit_amount"
            type="number"
            min="0"
            step="0.01"
            required
            value={depositAmount}
            onChange={e => setDepositAmount(e.target.value)}
            placeholder="400.00"
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white focus:border-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
          />
        </div>
      </div>

      {/* ETA */}
      <div className="space-y-1.5">
        <label htmlFor="eta" className="text-sm font-medium text-gray-700">
          {t('seller.quote.eta_label', 'Estimated Delivery Date (ETA)')}
          <span className="text-rose-600 ms-1" aria-label="required">*</span>
        </label>
        <input
          id="eta"
          name="eta"
          type="date"
          required
          min={today}
          value={eta}
          onChange={e => setEta(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white focus:border-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          'w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
          submitting
            ? 'bg-indigo-400 text-white cursor-wait'
            : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm'
        )}
      >
        {submitting
          ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          : <Send className="h-4 w-4" aria-hidden />}
        {submitting
          ? t('seller.quote.sending', 'Sending…')
          : t('seller.quote.send_cta', 'Send Quote')}
      </button>
    </form>
  );
}
