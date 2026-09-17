'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface CheckoutMobileBarProps {
  /** Pre-formatted total amount (e.g. "150.00 MAD") — page.tsx already owns
   *  the locale-aware Intl.NumberFormat instance, so this stays presentational. */
  totalLabel: string;
  ctaLabel: string;
  /** 1 = delivery step (submits the delivery form), 2 = payment step. */
  step: 1 | 2;
  /** id of the delivery <form> — step 1's button submits it via the `form` attribute. */
  formId: string;
  /** Called on click when step === 2 (payment submit has no native form to bind to). */
  onSubmitStep2: () => void;
  isProcessing: boolean;
}

/**
 * CheckoutMobileBar — sticky bottom action bar for /checkout (mobile only, md:hidden).
 *
 * Beldify buyers are overwhelmingly on small Android phones. Without this bar,
 * the "place order" CTA sits inside the order-summary card, which is the SECOND
 * column and only becomes sticky on lg+ — on mobile a buyer must scroll past the
 * contact, address, and shipping-method cards to find it. This is the single
 * conversion element of the checkout flow, so it must always be reachable.
 *
 * Reuses the exact same submit paths already wired in checkout/page.tsx:
 * - Step 1: <button type="submit" form={formId}> — submits #checkout-delivery
 *   (validated by handleShippingSubmit, same as the in-card button).
 * - Step 2: onClick={onSubmitStep2} — calls handlePaymentSubmit, same as the
 *   in-card button.
 */
export function CheckoutMobileBar({
  totalLabel,
  ctaLabel,
  step,
  formId,
  onSubmitStep2,
  isProcessing,
}: CheckoutMobileBarProps) {
  const { t } = useTranslation();

  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 shadow-2xl px-4 pt-3 pb-[env(safe-area-inset-bottom,12px)]"
      role="region"
      aria-label={t('checkout.mobileBar.label', 'Order total and confirm')}
    >
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        {/* Total — shrink-0 so long labels never squeeze the CTA */}
        <div className="shrink-0 min-w-[88px]">
          <p
            className="text-base font-bold text-indigo-700 tabular-nums currency-mad leading-tight"
            aria-label={t('checkout.summary.total', 'Total')}
          >
            {totalLabel}
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider leading-none mt-0.5">
            {t('checkout.summary.total', 'Total')}
          </p>
        </div>

        {step === 1 ? (
          <button
            type="submit"
            form={formId}
            className="flex-1 rounded-full min-h-[48px] flex items-center justify-center text-sm font-bold bg-amber-500 hover:bg-amber-400 text-amber-950 transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ctaLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmitStep2}
            disabled={isProcessing}
            className="flex-1 rounded-full min-h-[48px] flex items-center justify-center text-sm font-bold bg-amber-500 hover:bg-amber-400 text-amber-950 transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default CheckoutMobileBar;
