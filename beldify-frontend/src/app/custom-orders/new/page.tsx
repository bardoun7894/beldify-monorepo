'use client';

/**
 * "Request a Custom Piece" — ONE simple flow for everyone.
 *
 * Renders the single RequestCustomPieceForm (posts to the community Open Souk so
 * artisans/sellers can see and respond). Deliberately no "public vs specific shop"
 * choice — most users are non-technical, so the flow is one form: pick a material,
 * describe it, optionally add a photo, post.
 *
 * Requesting directly from one specific shop is handled from that shop's own page,
 * not as a choice here.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import RequestCustomPieceForm from '@/components/community/RequestCustomPieceForm';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

export default function NewCustomOrderPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="min-h-screen bg-canvas pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Link
            href="/categories/jewelry"
            className="rounded-full p-1.5 hover:bg-amber-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
            aria-label={t('customOrders.back', 'Back')}
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180 text-gray-600" aria-hidden />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
              {t('customOrders.custom_order_eyebrow', 'Custom Order')}
            </p>
            <h1 className="text-2xl font-bold text-gray-900" style={isRTL ? undefined : playfair}>
              {t('customOrders.request_title', 'Request a Custom Piece')}
            </h1>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="max-w-xl mx-auto px-6 pt-8">
        <p className="text-sm text-gray-500 mb-6">
          {t('customOrders.new_intro', 'Tell us what you want. The only required field is Material — everything else is optional. Artisans will see it and reply.')}
        </p>

        <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-6 shadow-sm">
          <RequestCustomPieceForm />
        </div>

        {/* Trust signals */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '🔒', key: 'customOrders.trust.secure', fallback: 'Secure' },
            { icon: '💬', key: 'customOrders.trust.seen_by_artisans', fallback: 'Seen by artisans' },
            { icon: '⭐', key: 'customOrders.trust.verified_artisans', fallback: 'Verified artisans' },
          ].map(item => (
            <div key={item.key} className="rounded-xl bg-white ring-1 ring-gray-200 px-3 py-4">
              <div className="text-2xl mb-1">{item.icon}</div>
              <p className="text-xs text-gray-500 font-medium">{t(item.key, item.fallback)}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
