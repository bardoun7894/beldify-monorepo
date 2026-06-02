'use client';

/**
 * T035 — Buyer: "Request custom piece" page
 *
 * Route: /custom-orders/new?vertical=jewelry&store_id=12
 * Renders CustomOrderForm with the correct vertical and store.
 *
 * LIVE WIRING (WS-A): storeId comes from query param; vertical from query param.
 * Replace MOCK_STORE with GET /api/v1/stores/{id} once available.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Gem } from 'lucide-react';
import CustomOrderForm from '@/components/checkout/CustomOrderForm';
import { VerticalSlug } from '@/services/verticalService';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

const SUPPORTED_VERTICALS: VerticalSlug[] = ['jewelry', 'menswear', 'womenswear', 'tailor'];

// LIVE WIRING (WS-A): replace with GET /api/v1/stores/{store_id}
const MOCK_STORE = { id: 12, name: 'Atlas Bijoux' };

export default function NewCustomOrderPage() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const searchParams = useSearchParams();

  const rawVertical = (searchParams.get('vertical') ?? 'jewelry') as VerticalSlug;
  const storeIdParam = searchParams.get('store_id');

  const vertical = SUPPORTED_VERTICALS.includes(rawVertical) ? rawVertical : 'jewelry';
  const storeId = storeIdParam ? parseInt(storeIdParam) : MOCK_STORE.id;
  const storeName = MOCK_STORE.name;

  return (
    <div className="min-h-screen bg-amber-50/50 pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-amber-200 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Link
            href={`/categories/jewelry`}
            className="rounded-full p-1.5 hover:bg-amber-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
            aria-label={isRTL ? 'رجوع' : 'Back'}
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180 text-gray-600" aria-hidden />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
              {isRTL ? 'طلب مخصص' : 'Custom Order'}
            </p>
            <h1 className="text-2xl font-bold text-gray-900" style={isRTL ? undefined : playfair}>
              {isRTL ? 'اطلب قطعة مخصصة' : 'Request a Custom Piece'}
            </h1>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="max-w-xl mx-auto px-6 pt-8">
        <p className="text-sm text-gray-500 mb-6">
          {isRTL
            ? 'أخبرنا بالمواصفات التي تريدها. المجال المطلوب فقط هو المادة — كل الباقي اختياري.'
            : 'Tell us what you need. The only required field is Material — everything else is optional.'}
        </p>

        <div className="bg-white rounded-2xl ring-1 ring-amber-200 p-6 shadow-sm">
          <CustomOrderForm
            storeId={storeId}
            storeName={storeName}
            vertical={vertical}
          />
        </div>

        {/* Trust signals */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '🔒', en: 'Secure', ar: 'آمن' },
            { icon: '💬', en: 'Direct contact', ar: 'تواصل مباشر' },
            { icon: '⭐', en: 'Verified artisans', ar: 'حرفيون موثوقون' },
          ].map(item => (
            <div key={item.en} className="rounded-xl bg-white ring-1 ring-amber-200 px-3 py-4">
              <div className="text-2xl mb-1">{item.icon}</div>
              <p className="text-xs text-gray-500 font-medium">{isRTL ? item.ar : item.en}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
