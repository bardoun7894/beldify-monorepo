'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '@/utils/imageUtils';
import {
  Minus,
  Plus,
  Trash2,
  BadgeCheck,
  AlertTriangle,
} from 'lucide-react';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

interface CartProduct {
  id: number;
  name: string;
  name_ar?: string;
  image_url?: string;
  color?: string;
  size?: string;
  price?: number;
  stock_quantity?: number;
}

interface CartStore {
  name?: string;
}

interface CartItem {
  id: number;
  quantity: number;
  unit_price: number;
  product: CartProduct;
  store?: CartStore;
}

interface CartItemRowProps {
  item: CartItem;
  loading?: boolean;
  onQuantityChange: (itemId: number, newQuantity: number) => void;
  onRemove: (itemId: number) => void;
  /** Override title class — allows page to inject RTL-aware font-arabic class */
  titleClassName?: string;
  /** Override title inline style — allows page to skip Playfair for isRTL */
  titleStyle?: React.CSSProperties;
}

export default function CartItemRow({
  item,
  loading = false,
  onQuantityChange,
  onRemove,
  titleClassName,
  titleStyle,
}: CartItemRowProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const productName =
    (i18n.language === 'ar' || i18n.language === 'ma') && item.product.name_ar
      ? item.product.name_ar
      : item.product.name;

  const lineTotal = (item.unit_price * item.quantity).toLocaleString('ar-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const unitPriceFormatted = item.unit_price.toLocaleString('ar-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const originalPriceFormatted = item.product.price
    ? item.product.price.toLocaleString('ar-MA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : null;

  const hasDiscount =
    item.product.price != null && item.product.price > item.unit_price;

  const atMax =
    item.product.stock_quantity !== undefined &&
    item.quantity >= item.product.stock_quantity;

  const nearMax =
    item.product.stock_quantity !== undefined &&
    item.quantity >= item.product.stock_quantity * 0.8;

  const remaining =
    item.product.stock_quantity !== undefined
      ? item.product.stock_quantity - item.quantity
      : null;

  return (
    <article
      className="group bg-white ring-1 ring-indigo-100 rounded-2xl p-4 shadow-atlas-sm hover:shadow-atlas-md transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="flex gap-4">
        {/* Product thumbnail */}
        <Link
          href={`/products/${item.product.id}`}
          className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gray-50 ring-1 ring-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
          aria-label={productName}
        >
          <Image
            src={getImageUrl(item.product.image_url, '/placeholder.png')}
            alt={productName}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="96px"
          />
          {hasDiscount && (
            <span className="absolute top-1.5 start-1.5 bg-rose-700 text-white text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full leading-none">
              {t('cart.items.sale', 'Sale')}
            </span>
          )}
        </Link>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            {/* Left: name + meta */}
            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${item.product.id}`}
                className="focus:outline-none focus:ring-2 focus:ring-indigo-700/30 rounded"
              >
                <h3
                  className={titleClassName ?? `text-base font-semibold text-indigo-950 hover:text-indigo-700 transition-colors leading-snug line-clamp-2${isRTL ? ' font-arabic' : ''}`}
                  style={titleStyle !== undefined ? titleStyle : (isRTL ? undefined : playfair)}
                >
                  {productName}
                </h3>
              </Link>

              {/* Size + color attributes */}
              {(item.product.color || item.product.size) && (
                <p className="text-xs text-indigo-600 mt-0.5 flex items-center gap-1.5">
                  {item.product.color && (
                    <span>{item.product.color}</span>
                  )}
                  {item.product.color && item.product.size && (
                    <span className="w-1 h-1 rounded-full bg-indigo-200 inline-block" />
                  )}
                  {item.product.size && (
                    <span>{item.product.size}</span>
                  )}
                </p>
              )}

              {/* Seller chip */}
              {item.store?.name && (
                <span className="inline-flex items-center gap-1 mt-2 bg-indigo-50 ring-1 ring-indigo-100 rounded-full px-2.5 py-1 text-xs text-indigo-700 font-medium">
                  <BadgeCheck className="w-3 h-3 text-indigo-500 flex-shrink-0" aria-hidden="true" />
                  {item.store.name}
                </span>
              )}
            </div>

            {/* Right: price + remove */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {hasDiscount && originalPriceFormatted && (
                <span className="currency-mad text-xs text-indigo-400 line-through leading-none">
                  {originalPriceFormatted}{' '}
                  {t('common.mad', 'MAD')}
                </span>
              )}
              <span className="currency-mad text-sm font-bold text-indigo-900" style={playfair}>
                {lineTotal}{' '}
                <span className="text-xs font-medium">{t('common.mad', 'MAD')}</span>
              </span>
              {item.quantity > 1 && (
                <span className="currency-mad text-[11px] text-indigo-500">
                  {unitPriceFormatted} × {item.quantity}
                </span>
              )}
              <button
                onClick={() => onRemove(item.id)}
                disabled={loading}
                aria-label={t('cart.items.remove', 'Remove item')}
                className="mt-1 p-1.5 text-indigo-300 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-300/50 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Qty stepper row */}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <div
              className="inline-flex items-center bg-indigo-50 rounded-full px-1 py-1 gap-0.5"
              role="group"
              aria-label={t('cart.quantity.label', 'Quantity')}
            >
              <button
                onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                disabled={loading}
                aria-label={t('cart.quantity.decrease', 'Decrease quantity')}
                className="w-7 h-7 flex items-center justify-center text-indigo-500 hover:text-indigo-700 transition-colors rounded-full hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-700/30 disabled:opacity-40"
              >
                <Minus className="w-3 h-3" aria-hidden="true" />
              </button>
              <span
                className="w-8 text-center text-sm font-semibold text-indigo-950 tabular-nums"
                aria-live="polite"
                aria-label={t('cart.quantity.current', `Quantity: ${item.quantity}`, { count: item.quantity })}
              >
                {item.quantity}
              </span>
              <button
                onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                disabled={loading || atMax}
                aria-label={t('cart.quantity.increase', 'Increase quantity')}
                className="w-7 h-7 flex items-center justify-center text-indigo-500 hover:text-indigo-700 transition-colors rounded-full hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-700/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>

            {/* Low-stock / max-stock warning */}
            {nearMax && (
              <p
                className="text-xs text-amber-600 flex items-center gap-1"
                role="status"
                aria-live="polite"
              >
                <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                {atMax
                  ? t('cart.stock.max', 'Maximum quantity reached')
                  : t('cart.stock.low', `Only ${remaining} left`, {
                      remaining,
                    })}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
