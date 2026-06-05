'use client';

/**
 * T036 — Buyer: made-to-order tracking page
 *
 * Route: /custom-orders/[id]
 * Fetches GET /api/v1/custom-orders/{id} and renders:
 * - Status + quote details (quote_amount, eta)
 * - Progress timeline via MadeToOrderTimeline
 *
 * LIVE WIRING (WS-A): fetchCustomOrder in customOrderService.ts (USE_MOCK flag)
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, XCircle } from 'lucide-react';
import { fetchCustomOrder, CustomOrder } from '@/services/customOrderService';
import MadeToOrderTimeline from '@/components/checkout/MadeToOrderTimeline';
import JewelryFields from '@/components/products/JewelryFields';
import { cn } from '@/lib/utils';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

export default function CustomOrderTrackingPage() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const params = useParams();
  const id = params ? Number(params.id) : null;

  const [order, setOrder] = useState<CustomOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || isNaN(id)) {
      setError(isRTL ? 'معرّف الطلب غير صحيح.' : 'Invalid order ID.');
      setLoading(false);
      return;
    }

    // LIVE WIRING (WS-A): fetchCustomOrder uses USE_MOCK flag in customOrderService.ts
    fetchCustomOrder(id)
      .then(data => setOrder(data))
      .catch(() => setError(isRTL ? 'تعذّر تحميل الطلب.' : 'Failed to load order.'))
      .finally(() => setLoading(false));
  }, [id, isRTL]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-label={isRTL ? 'جارٍ التحميل' : 'Loading'} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="h-16 w-16 rounded-2xl bg-rose-50 ring-1 ring-rose-200 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-rose-600" aria-hidden />
          </div>
          <p className="text-base font-semibold text-gray-700">{error}</p>
          <Link
            href="/orders"
            className="rounded-full bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
          >
            {isRTL ? 'طلباتي' : 'My Orders'}
          </Link>
        </div>
      </div>
    );
  }

  const isJewelry = order.vertical === 'jewelry';

  return (
    <div className="min-h-screen bg-canvas pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-amber-200 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Link
            href="/orders"
            className="rounded-full p-1.5 hover:bg-amber-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
            aria-label={isRTL ? 'رجوع' : 'Back to orders'}
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180 text-gray-600" aria-hidden />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
              {isRTL ? 'تتبع الطلب' : 'Order Tracking'} · #{order.id}
            </p>
            <h1 className="text-xl font-bold text-gray-900" style={isRTL ? undefined : playfair}>
              {order.store.name}
            </h1>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="max-w-xl mx-auto px-6 pt-8 space-y-6">
        {/* Spec summary */}
        {isJewelry && (
          <JewelryFields spec={order.spec} />
        )}

        {!isJewelry && Object.keys(order.spec).length > 0 && (
          <div className="rounded-2xl ring-1 ring-amber-200 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-3">
              {isRTL ? 'تفاصيل الطلب' : 'Order Spec'}
            </p>
            <dl className="grid grid-cols-2 gap-3">
              {Object.entries(order.spec)
                .filter(([, v]) => v !== null && v !== '')
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">{k}</dt>
                    <dd className="text-sm font-medium text-gray-800 mt-0.5 capitalize">{String(v)}</dd>
                  </div>
                ))}
            </dl>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="rounded-2xl ring-1 ring-amber-200 bg-white px-5 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-1">
              {isRTL ? 'ملاحظاتك' : 'Your Notes'}
            </p>
            <p className="text-sm text-gray-700">{order.notes}</p>
          </div>
        )}

        {/* Quote amount / eta / status timeline */}
        <MadeToOrderTimeline order={order} />
      </main>
    </div>
  );
}
