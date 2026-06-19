'use client';

/**
 * T036 — Buyer: made-to-order tracking page (extended for Open Souk OS-P1-8)
 *
 * Route: /custom-orders/[id]
 * Fetches GET /api/v1/custom-orders/{id} and renders:
 * - Status + quote details (quote_amount, eta)
 * - Deposit payment panel (quoted orders, buyer only) — DepositPaymentPanel
 * - Progress timeline via MadeToOrderTimeline
 *
 * Ownership is inferred from order.customer.id vs auth user.id.
 * Non-buyer: deposit panel is hidden (403 guard is enforced server-side too).
 *
 * LIVE WIRING (WS-A): fetchCustomOrder in customOrderService.ts (USE_MOCK flag)
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, XCircle, ExternalLink } from 'lucide-react';
import { fetchCustomOrder, CustomOrder } from '@/services/customOrderService';
import MadeToOrderTimeline from '@/components/checkout/MadeToOrderTimeline';
import DepositPaymentPanel from '@/components/checkout/DepositPaymentPanel';
import JewelryFields from '@/components/products/JewelryFields';
import { useAuth } from '@/contexts/AuthContext';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

export default function CustomOrderTrackingPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';
  const params = useParams();
  const id = params ? Number(params.id) : null;

  const { user } = useAuth();

  const [order, setOrder] = useState<CustomOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(() => {
    if (!id || isNaN(id)) {
      setError(t('customOrders.error.invalid_id', 'Invalid order ID.'));
      setLoading(false);
      return;
    }

    // LIVE WIRING (WS-A): fetchCustomOrder uses USE_MOCK flag in customOrderService.ts
    fetchCustomOrder(id)
      .then(data => setOrder(data))
      .catch(() => setError(t('customOrders.error.load_order', 'Failed to load order.')))
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-label={t('customOrders.loading_aria', 'Loading')} />
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
            {t('customOrders.my_orders', 'My Orders')}
          </Link>
        </div>
      </div>
    );
  }

  const isJewelry = order.vertical === 'jewelry';

  // Determine buyer ownership: compare auth user id with order.customer.id
  const isBuyer = !!user && Number(user.id) === order.customer.id;

  // Back link — if order has a community_post_id, offer "Back to post" too
  const communityPostId = (order as CustomOrder & { community_post_id?: number | null }).community_post_id;

  return (
    <div className="min-h-screen bg-canvas pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Link
            href="/orders"
            className="rounded-full p-1.5 hover:bg-amber-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
            aria-label={t('customOrders.back_to_orders', 'Back to orders')}
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180 text-gray-600" aria-hidden />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
              {t('customOrders.tracking_eyebrow', 'Order Tracking')} · #{order.id}
            </p>
            <h1 className="text-xl font-bold text-gray-900 truncate" style={isRTL ? undefined : playfair}>
              {order.store.name}
            </h1>
          </div>
          {/* Link back to the originating Open Souk post */}
          {communityPostId && (
            <Link
              href={`/community/posts/${communityPostId}`}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-900 font-medium transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              {t('community.back_to_post', 'Back to Post')}
            </Link>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <main className="max-w-xl mx-auto px-6 pt-8 space-y-6">
        {/* ── Deposit payment panel (quoted status, buyer only) ── */}
        {order.status === 'quoted' && (
          <DepositPaymentPanel
            order={order as CustomOrder & { community_post_id?: number | null; post_response_id?: number | null }}
            isBuyer={isBuyer}
            onSuccess={(updated) => {
              setOrder(updated);
            }}
          />
        )}

        {/* Spec summary */}
        {isJewelry && (
          <JewelryFields spec={order.spec} />
        )}

        {!isJewelry && Object.keys(order.spec).length > 0 && (
          <div className="rounded-2xl ring-1 ring-gray-200 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-3">
              {t('customOrders.order_spec', 'Order Spec')}
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
          <div className="rounded-2xl ring-1 ring-gray-200 bg-white px-5 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-1">
              {t('customOrders.your_notes', 'Your Notes')}
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
