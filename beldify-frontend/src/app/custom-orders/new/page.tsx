'use client';

/**
 * "Request a Custom Piece" page.
 *
 * Default (primary): posts the request into the community **Open Souk** so other
 * users / sellers can see it and respond — via RequestCustomPieceForm. Open to any
 * logged-in (normal) user. Only Material is required.
 *
 * Secondary (?direct=1&store_id=&vertical=): the store-targeted custom-order
 * pipeline (CustomOrderForm) for requesting directly from one specific seller.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import RequestCustomPieceForm from '@/components/community/RequestCustomPieceForm';
import CustomOrderForm from '@/components/checkout/CustomOrderForm';
import { VerticalSlug } from '@/services/verticalService';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

const SUPPORTED_VERTICALS: VerticalSlug[] = ['jewelry', 'menswear', 'womenswear', 'tailor'];

export default function NewCustomOrderPage() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const searchParams = useSearchParams();

  // Direct-to-seller mode (secondary): keeps the store-targeted pipeline reachable.
  const isDirect = searchParams.get('direct') === '1';
  const rawVertical = (searchParams.get('vertical') ?? 'jewelry') as VerticalSlug;
  const vertical = SUPPORTED_VERTICALS.includes(rawVertical) ? rawVertical : 'jewelry';
  const storeIdParam = searchParams.get('store_id');
  const storeId = storeIdParam ? parseInt(storeIdParam) : 0;

  return (
    <div className="min-h-screen bg-amber-50/50 pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-amber-200 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Link
            href="/categories/jewelry"
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
          {isDirect && storeId ? (
            <CustomOrderForm storeId={storeId} storeName="" vertical={vertical} />
          ) : (
            <RequestCustomPieceForm />
          )}
        </div>

        {!isDirect && (
          <p className="mt-4 text-center text-xs text-gray-500">
            {isRTL ? 'تعرف على البائع الذي تريده؟ ' : 'Know the seller you want? '}
            <Link href="/shops" className="font-medium text-indigo-700 hover:underline">
              {isRTL ? 'اطلب مباشرة من متجر' : 'request directly from a shop'}
            </Link>
          </p>
        )}

        {/* Trust signals */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '🔒', en: 'Secure', ar: 'آمن' },
            { icon: '💬', en: 'Seen by artisans', ar: 'يراه الحرفيون' },
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
