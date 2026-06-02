'use client';

/**
 * T032 — Seller: custom-order management page
 *
 * Lists incoming custom orders and allows the seller to:
 * - Send a quote (requested → quoted via QuoteForm)
 * - Advance status through lifecycle (via CustomOrderTimeline)
 *
 * LIVE WIRING (WS-A): replace MOCK_SELLER_ORDERS with GET /api/v1/seller/custom-orders
 * (seller-scoped endpoint, different from buyer /api/v1/custom-orders)
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, ChevronLeft } from 'lucide-react';
import {
  CustomOrder,
  STATUS_META,
  fetchCustomOrder,
} from '@/services/customOrderService';
import QuoteForm from '@/components/seller/QuoteForm';
import CustomOrderTimeline from '@/components/seller/CustomOrderTimeline';
import { cn } from '@/lib/utils';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

// MOCK seller order list — LIVE WIRING (WS-A): GET /api/v1/seller/custom-orders
const MOCK_SELLER_ORDERS: CustomOrder[] = [
  {
    id: 87,
    store_id: 12,
    vertical: 'jewelry',
    spec: { material: 'gold', purity: '18k', engraving: 'لنا' },
    notes: 'For a wedding, needed by end of month',
    status: 'requested',
    quote_amount: null,
    deposit_amount: null,
    deposit_paid: false,
    eta: null,
    delivery_date: null,
    customer: { id: 44, display_name: 'FATIMA Z.' },
    store: { id: 12, name: 'Atlas Bijoux', slug: 'atlas-bijoux' },
    progress: [
      { id: 1, status: 'requested', note: null, created_by: 44, created_at: '2026-06-02T10:00:00Z' },
    ],
    created_at: '2026-06-02T10:00:00Z',
    updated_at: '2026-06-02T10:00:00Z',
  },
];

export default function SellerCustomOrdersPage() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [orders, setOrders] = useState<CustomOrder[]>(MOCK_SELLER_ORDERS);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedOrder = orders.find(o => o.id === selectedId) ?? null;

  const handleUpdate = (updated: CustomOrder) => {
    setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
  };

  return (
    <div className="min-h-screen bg-amber-50/50 pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-amber-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          {selectedOrder && (
            <button
              onClick={() => setSelectedId(null)}
              className="me-1 rounded-full p-1.5 hover:bg-amber-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
              aria-label={isRTL ? 'رجوع' : 'Back to list'}
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180 text-gray-600" aria-hidden />
            </button>
          )}
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
              {isRTL ? 'لوحة تحكم البائع' : 'Seller Dashboard'}
            </p>
            <h1 className="text-2xl font-bold text-gray-900" style={isRTL ? undefined : playfair}>
              {selectedOrder
                ? (isRTL ? `طلب #${selectedOrder.id}` : `Order #${selectedOrder.id}`)
                : (isRTL ? 'طلبات التصنيع المخصص' : 'Custom Orders')}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-8 space-y-6">
        {!selectedOrder ? (
          <>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-amber-600" aria-hidden />
                </div>
                <p className="text-base font-semibold text-gray-700">
                  {isRTL ? 'لا توجد طلبات مخصصة بعد' : 'No custom orders yet'}
                </p>
                <p className="text-sm text-gray-400">
                  {isRTL ? 'ستظهر الطلبات الجديدة هنا.' : 'New requests will appear here.'}
                </p>
              </div>
            ) : (
              <ul className="space-y-3" role="list" aria-label={isRTL ? 'قائمة الطلبات' : 'Orders list'}>
                {orders.map(order => {
                  const meta = STATUS_META[order.status];
                  const spec = order.spec;
                  return (
                    <li key={order.id}>
                      <button
                        onClick={() => setSelectedId(order.id)}
                        className="w-full text-start rounded-2xl ring-1 ring-amber-200 bg-white p-5 hover:ring-indigo-300 hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-sm font-semibold text-gray-900">
                                #{order.id} · {order.customer.display_name}
                              </span>
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1',
                                  meta.pillClass
                                )}
                              >
                                {isRTL ? meta.labelAr : meta.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {order.vertical} · {Object.entries(spec).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </p>
                          </div>
                          <ChevronLeft className="shrink-0 h-4 w-4 text-gray-300 rtl:rotate-180" aria-hidden />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {/* Spec summary */}
            <div className="rounded-2xl ring-1 ring-amber-200 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-3">
                {isRTL ? 'تفاصيل الطلب' : 'Order Spec'}
              </p>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(selectedOrder.spec)
                  .filter(([, v]) => v !== null && v !== undefined && v !== '')
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">{k}</dt>
                      <dd className="text-sm font-medium text-gray-800 mt-0.5">{String(v)}</dd>
                    </div>
                  ))}
              </dl>
              {selectedOrder.notes && (
                <div className="mt-4 pt-4 border-t border-amber-100">
                  <p className="text-xs text-gray-400 mb-1">{isRTL ? 'ملاحظات المشتري' : 'Buyer notes'}</p>
                  <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Quote form — only for requested orders */}
            <QuoteForm order={selectedOrder} onQuoted={handleUpdate} />

            {/* Progress timeline */}
            <CustomOrderTimeline order={selectedOrder} onAdvanced={handleUpdate} />
          </div>
        )}
      </main>
    </div>
  );
}
