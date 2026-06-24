'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, ArrowRight } from 'lucide-react';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

export default function EmptyCartState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      {/* Icon container */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-indigo-50 ring-2 ring-indigo-100 flex items-center justify-center shadow-atlas-sm">
          <ShoppingBag className="w-12 h-12 text-indigo-700" aria-hidden="true" />
        </div>
        {/* Decorative amber dot */}
        <span className="absolute top-1 end-1 w-5 h-5 rounded-full bg-amber-500 ring-2 ring-white" aria-hidden="true" />
      </div>

      {/* Headline */}
      <h2
        className="text-3xl sm:text-4xl font-bold text-indigo-950 mb-3 leading-tight"
        style={playfair}
      >
        {t('cart.empty.heading', 'Your bag is empty.')}
      </h2>

      {/* Subtitle */}
      <p className="text-indigo-600 text-base mb-8 max-w-xs leading-relaxed">
        {t(
          'cart.empty.subtitle',
          'Discover timeless Moroccan craft. Find something made to last.',
        )}
      </p>

      {/* CTA */}
      <Link
        href="/categories"
        className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-full py-3 px-8 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 shadow-atlas-sm"
      >
        {t('cart.empty.cta', 'Browse the souk')}
        <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
      </Link>

      {/* Trust hint */}
      <p className="mt-6 text-xs text-indigo-600">
        {t('cart.empty.trust', 'Free 14-day returns · Authentic Moroccan craft')}
      </p>
    </div>
  );
}
