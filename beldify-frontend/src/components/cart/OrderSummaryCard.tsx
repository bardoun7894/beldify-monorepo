'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Tag,
  X,
} from 'lucide-react';
import { intlLocale } from '@/i18n/config';
import ShippingCalculator from './ShippingCalculator';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

interface OrderSummaryCardProps {
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string;
  couponInputValue: string;
  onCouponInputChange: (value: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  onCheckout: () => void;
  loading?: boolean;
}

export default function OrderSummaryCard({
  subtotal,
  shippingAmount,
  taxAmount,
  discountAmount,
  totalAmount,
  couponCode,
  couponInputValue,
  onCouponInputChange,
  onApplyCoupon,
  onRemoveCoupon,
  onCheckout,
  loading = false,
}: OrderSummaryCardProps) {
  const { t, i18n } = useTranslation();

  const fmt = (n: number) =>
    n.toLocaleString(intlLocale(i18n.language), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <aside className="bg-white ring-1 ring-indigo-100 rounded-2xl p-6 shadow-atlas-sm lg:sticky lg:top-24">
      {/* Section label */}
      <p className="text-xs uppercase tracking-[0.18em] text-indigo-400 font-medium mb-4">
        {t('cart.summary.kicker', 'Order Summary')}
      </p>

      {/* Price rows */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-indigo-500">
            {t('cart.summary.subtotal', 'Subtotal')}
          </span>
          <span className="currency-mad text-indigo-950 font-medium tabular-nums">
            {fmt(subtotal)} {t('common.mad', 'MAD')}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-indigo-500">
            {t('cart.summary.shipping', 'Shipping')}
          </span>
          {shippingAmount > 0 ? (
            <span className="currency-mad text-indigo-950 font-medium tabular-nums">
              {fmt(shippingAmount)} {t('common.mad', 'MAD')}
            </span>
          ) : subtotal >= 500 ? (
            <span className="font-medium" style={{ color: '#855300' }}>
              {t('cart.summary.free', 'Free')}
            </span>
          ) : (
            <span className="text-indigo-300">—</span>
          )}
        </div>

        {taxAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-indigo-500">
              {t('cart.summary.tax', 'Tax')}
            </span>
            <span className="currency-mad text-indigo-950 font-medium tabular-nums">
              {fmt(taxAmount)} {t('common.mad', 'MAD')}
            </span>
          </div>
        )}

        {discountAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-indigo-500">
              {t('cart.summary.discount', 'Discount')}
            </span>
            <span className="currency-mad font-medium tabular-nums" style={{ color: '#855300' }}>
              −{fmt(discountAmount)} {t('common.mad', 'MAD')}
            </span>
          </div>
        )}
      </div>

      {/* Free shipping progress hint */}
      {subtotal < 500 && shippingAmount === 0 && (
        <div className="mt-3 bg-amber-50 rounded-xl px-3 py-2">
          <p className="text-xs text-amber-800">
            {t('cart.summary.freeShippingHint', 'Add {{amount}} MAD more for free shipping', {
              amount: fmt(500 - subtotal),
            })}
          </p>
          <div className="mt-1.5 h-1 bg-amber-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((subtotal / 500) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="border-t border-indigo-100 my-4" />

      {/* Total */}
      <div className="flex justify-between items-baseline mb-5">
        <span className="text-indigo-600 font-medium text-sm">
          {t('cart.summary.total', 'Total')}
        </span>
        <span
          className="currency-mad text-2xl font-bold text-indigo-950 leading-tight tabular-nums"
          style={playfair}
        >
          {fmt(totalAmount)}{' '}
          <span className="text-sm font-medium">{t('common.mad', 'MAD')}</span>
        </span>
      </div>

      {/* Promo code */}
      {!couponCode ? (
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Tag
              className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-300"
              aria-hidden="true"
            />
            <input
              type="text"
              value={couponInputValue}
              onChange={(e) => onCouponInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onApplyCoupon()}
              placeholder={t('cart.coupon.placeholder', 'Promo code')}
              aria-label={t('cart.coupon.placeholder', 'Promo code')}
              className="w-full ps-9 pe-4 rounded-2xl bg-indigo-50/60 ring-1 ring-indigo-100 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 transition text-indigo-950 placeholder:text-indigo-300"
            />
          </div>
          <button
            onClick={onApplyCoupon}
            disabled={loading || !couponInputValue.trim()}
            className="rounded-2xl bg-white ring-1 ring-indigo-200 text-indigo-700 px-4 py-2 text-sm font-semibold hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('cart.coupon.apply', 'Apply')}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50 ring-1 ring-indigo-100 mb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm text-indigo-700 font-medium">{couponCode}</span>
            <span className="text-xs text-indigo-400">
              {t('cart.coupon.applied_label', 'applied')}
            </span>
          </div>
          <button
            onClick={onRemoveCoupon}
            disabled={loading}
            aria-label={t('cart.coupon.remove', 'Remove promo code')}
            className="p-1 text-indigo-400 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-300/50 rounded disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Shipping calculator */}
      <div className="mb-5">
        <ShippingCalculator subtotal={subtotal} />
      </div>

      {/* Checkout CTA */}
      <button
        onClick={onCheckout}
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-full py-3.5 text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 shadow-atlas-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t('common.loading', 'Loading...')}
          </span>
        ) : (
          <>
            {t('cart.summary.checkout', 'Proceed to checkout')}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </>
        )}
      </button>

      {/* Trust micro-row */}
      <div className="flex justify-center gap-2 mt-4 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 ring-1 ring-indigo-100 rounded-full px-3 py-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" aria-hidden="true" />
          {t('cart.trust.secure', 'Secure payment')}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 ring-1 ring-indigo-100 rounded-full px-3 py-1.5">
          <RotateCcw className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" aria-hidden="true" />
          {t('cart.trust.returns', 'Free 14-day returns')}
        </span>
      </div>

      {/* Payment methods */}
      <p className="text-center text-xs text-indigo-600 mt-3">
        {t('cart.payment_methods', 'Visa · Mastercard · Cash on Delivery')}
      </p>
    </aside>
  );
}
