'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, ArrowRight, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/utils/formatters';

interface PdpBuyBarProps {
  price: number;
  quantity: number;
  disabled: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onHowToBuy: () => void;
  addToCartLabel?: string;
  buyNowLabel?: string;
}

/**
 * PdpBuyBar — sticky bottom bar for the PDP (mobile only, md:hidden).
 *
 * Layout (RTL-first):
 *   [ price ] [ زيد للسلة (indigo outline) ] [ شري دابا (amber solid) ]
 *   [ كيفاش نشري? (text link, centered below) ]
 *
 * Design constraints:
 * - amber-500 solid only on شري دابا (primary buy CTA)
 * - indigo-700 outline for زيد للسلة (secondary, add-to-bag)
 * - min-h-[48px] on both buttons for WCAG 2.5.5
 * - safe-area-inset-bottom awareness
 * - NO amber-50 background washes (per project rule)
 */
export function PdpBuyBar({
  price,
  quantity,
  disabled,
  onAddToCart,
  onBuyNow,
  onHowToBuy,
  addToCartLabel,
  buyNowLabel,
}: PdpBuyBarProps) {
  const { t } = useTranslation();

  const atcLabel = addToCartLabel ?? t('cart.add_to_bag', 'زيد للسلة');
  const buyLabel = buyNowLabel ?? t('product.buy_now', 'شري دابا');

  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 shadow-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="region"
      aria-label={t('cart.sticky_bar', 'خيارات الشراء')}
    >
      {/* Main button row */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 max-w-lg mx-auto">
        {/* Price — shrink-0 */}
        <div className="shrink-0 min-w-[72px]">
          <p
            className="text-base font-bold text-indigo-700 tabular-nums currency-mad leading-tight"
            aria-label={t('product.total', 'المجموع')}
          >
            {formatPrice(price * quantity)}
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider leading-none mt-0.5">
            {t('product.total', 'المجموع')}
          </p>
        </div>

        {/* Add to cart — indigo outline, flex-1 */}
        <button
          type="button"
          onClick={onAddToCart}
          disabled={disabled}
          className={cn(
            'flex-1 rounded-full min-h-[48px] flex items-center justify-center gap-1.5',
            'text-sm font-semibold transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
            disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed ring-1 ring-gray-200'
              : 'bg-white ring-2 ring-indigo-700 text-indigo-700 hover:bg-indigo-50 active:scale-[0.98]'
          )}
          aria-label={atcLabel}
        >
          <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{atcLabel}</span>
        </button>

        {/* Buy now — amber-500 solid, flex-1 */}
        <button
          type="button"
          onClick={onBuyNow}
          disabled={disabled}
          className={cn(
            'flex-1 rounded-full min-h-[48px] flex items-center justify-center gap-1.5',
            'text-sm font-bold transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40',
            disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed ring-1 ring-gray-200'
              : 'bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-sm active:scale-[0.98]'
          )}
          aria-label={buyLabel}
        >
          <span>{buyLabel}</span>
          <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden="true" />
        </button>
      </div>

      {/* How to buy trigger */}
      <div className="pb-1.5 flex justify-center">
        <button
          type="button"
          onClick={onHowToBuy}
          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded px-2 py-1"
          aria-label={t('pdp.howToBuy.trigger', 'كيفاش نشري؟')}
        >
          <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {t('pdp.howToBuy.trigger', 'كيفاش نشري؟')}
        </button>
      </div>
    </div>
  );
}

export default PdpBuyBar;
