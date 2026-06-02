'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

interface CartMobileBarProps {
  totalAmount: number;
  itemCount: number;
  onCheckout: () => void;
  loading?: boolean;
}

export default function CartMobileBar({
  totalAmount,
  itemCount,
  onCheckout,
  loading = false,
}: CartMobileBarProps) {
  const { t } = useTranslation();

  const fmt = (n: number) =>
    n.toLocaleString('ar-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div
      className="md:hidden fixed bottom-0 start-0 end-0 z-40 bg-indigo-950 border-t border-indigo-800 px-4 pt-3 pb-[env(safe-area-inset-bottom,12px)]"
      role="complementary"
      aria-label={t('cart.mobileBar.label', 'Cart summary')}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Total info */}
        <div className="min-w-0">
          <p className="text-xs text-indigo-400 leading-none mb-0.5">
            {t('cart.mobileBar.itemCount', `${itemCount} items`, { count: itemCount })}
          </p>
          <p
            className="currency-mad text-lg font-bold text-white tabular-nums leading-tight"
            style={playfair}
          >
            {fmt(totalAmount)}{' '}
            <span className="text-sm font-medium text-indigo-300">
              {t('common.mad', 'MAD')}
            </span>
          </p>
        </div>

        {/* Checkout button */}
        <button
          onClick={onCheckout}
          disabled={loading}
          className="flex-shrink-0 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-full px-6 py-3 text-sm font-bold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-indigo-950 disabled:opacity-50 disabled:cursor-not-allowed shadow-atlas-sm"
        >
          {t('cart.summary.checkout', 'Checkout')}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
