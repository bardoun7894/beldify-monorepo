'use client';

import React from 'react';
import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SellerStripProps {
  store_name?: string;
  store_slug?: string;
  store_rating?: number;
  store_is_verified?: boolean;
}

/**
 * SellerStrip — compact single-row seller identity shown on product cards.
 *
 * Renders nothing when store_name is absent (graceful when payload lacks seller data).
 * Links to /shops/[store_slug] only when store_slug is present.
 * Verified badge gated strictly on store_is_verified === true.
 * RTL-safe: logical properties only (ms-/me-/ps-/pe-).
 */
export default function SellerStrip({
  store_name,
  store_slug,
  store_rating,
  store_is_verified,
}: SellerStripProps) {
  const { t } = useTranslation();

  if (!store_name) return null;

  return (
    <div className="flex items-center gap-1 min-w-0 mt-1">
      {/* Shop name — linkified when store_slug is present */}
      {store_slug ? (
        <Link
          href={`/shops/${store_slug}`}
          aria-label={t('shop.visit_label', 'Visit {{name}}', { name: store_name })}
          className="text-[10px] font-medium text-indigo-700 hover:text-indigo-800 hover:underline truncate min-w-0 leading-none transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {store_name}
        </Link>
      ) : (
        <span className="text-[10px] font-medium text-indigo-700 truncate min-w-0 leading-none">
          {store_name}
        </span>
      )}

      {/* Verified badge — only when store_is_verified === true */}
      {store_is_verified === true && (
        <BadgeCheck
          className="h-3 w-3 shrink-0 text-indigo-600"
          aria-label={t('shop.verified', 'Verified')}
        />
      )}

      {/* Seller rating — shown when store_rating is a positive number */}
      {typeof store_rating === 'number' && store_rating > 0 && (
        <div className="flex items-center gap-0.5 ms-auto shrink-0">
          <span className="text-amber-500 text-[10px] leading-none" aria-hidden="true">★</span>
          <span className="text-[10px] font-semibold text-amber-600 tabular-nums leading-none">
            {store_rating.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}
