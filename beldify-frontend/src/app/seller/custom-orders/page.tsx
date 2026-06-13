'use client';

/**
 * T032 — Seller: custom-order management page
 *
 * Lists incoming custom orders and allows the seller to:
 * - Send a quote (requested → quoted via QuoteForm)
 * - Advance status through lifecycle (via CustomOrderTimeline)
 *
 * F2 LIVE WIRING: replaced MOCK_SELLER_ORDERS with fetchSellerCustomOrders().
 * The list response (detailed=false) omits spec/progress/customer.
 * Selecting an order triggers fetchCustomOrder(id) to load the full detail.
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, ChevronLeft } from 'lucide-react';
import {
  CustomOrder,
  CustomOrderListItem,
  STATUS_META,
  fetchCustomOrder,
  fetchSellerCustomOrders,
} from '@/services/customOrderService';
import QuoteForm from '@/components/seller/QuoteForm';
import CustomOrderTimeline from '@/components/seller/CustomOrderTimeline';
import { cn } from '@/lib/utils';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

export default function SellerCustomOrdersPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const [orders, setOrders] = useState<CustomOrderListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the seller's order list on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchSellerCustomOrders();
        setOrders(res.data);
      } catch {
        setError(t('customOrders.error.load_orders', 'Failed to load orders'));
      } finally {
        setIsLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When a list item is selected, load the full detail (spec + progress + customer)
  useEffect(() => {
    if (selectedId === null) {
      setSelectedOrder(null);
      return;
    }
    const loadDetail = async () => {
      setIsDetailLoading(true);
      try {
        const full = await fetchCustomOrder(selectedId);
        setSelectedOrder(full);
      } catch {
        setSelectedOrder(null);
        setError(t('customOrders.error.load_detail', 'Failed to load order detail'));
      } finally {
        setIsDetailLoading(false);
      }
    };
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const handleUpdate = (updated: CustomOrder) => {
    // Refresh selected order in detail pane
    setSelectedOrder(updated);
    // Also patch the list row status so it reflects without a full reload
    setOrders(prev =>
      prev.map(o => (o.id === updated.id ? { ...o, status: updated.status } : o))
    );
  };

  const handleBack = () => {
    setSelectedId(null);
    setSelectedOrder(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gray-100 animate-pulse" />
          <p className="text-sm text-gray-500">{t('customOrders.loading', 'Loading…')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          {selectedOrder && (
            <button
              onClick={handleBack}
              className="me-1 rounded-full p-1.5 hover:bg-amber-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
              aria-label={t('customOrders.back_to_list', 'Back to list')}
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180 text-gray-600" aria-hidden />
            </button>
          )}
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
              {t('customOrders.seller_dashboard', 'Seller Dashboard')}
            </p>
            <h1 className="text-2xl font-bold text-gray-900" style={isRTL ? undefined : playfair}>
              {selectedOrder
                ? t('customOrders.order_title', 'Order #{{id}}', { id: selectedOrder.id })
                : t('customOrders.page_title', 'Custom Orders')}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-8 space-y-6">
        {/* Error banner */}
        {error && (
          <div className="rounded-2xl bg-rose-50 ring-1 ring-rose-200 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!selectedId ? (
          <>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-amber-600" aria-hidden />
                </div>
                <p className="text-base font-semibold text-gray-700">
                  {t('customOrders.empty_title', 'No custom orders yet')}
                </p>
                <p className="text-sm text-gray-400">
                  {t('customOrders.empty_sub', 'New requests will appear here.')}
                </p>
              </div>
            ) : (
              <ul className="space-y-3" role="list" aria-label={t('customOrders.orders_list_aria', 'Orders list')}>
                {orders.map(order => {
                  const meta = STATUS_META[order.status];
                  return (
                    <li key={order.id}>
                      <button
                        onClick={() => setSelectedId(order.id)}
                        className="w-full text-start rounded-2xl ring-1 ring-gray-200 bg-white p-5 hover:ring-indigo-300 hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-sm font-semibold text-gray-900">
                                #{order.id}
                                {order.store && ` · ${order.store.name}`}
                              </span>
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1',
                                  meta.pillClass
                                )}
                              >
                                {t(`customOrders.status.${order.status}`, meta.label)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {order.vertical}
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
        ) : isDetailLoading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="h-10 w-10 rounded-2xl bg-gray-100 animate-pulse" />
            <p className="text-sm text-gray-500">{t('customOrders.loading_order', 'Loading order…')}</p>
          </div>
        ) : selectedOrder ? (
          <div className="space-y-6">
            {/* Spec summary */}
            <div className="rounded-2xl ring-1 ring-gray-200 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-3">
                {t('customOrders.order_spec', 'Order Spec')}
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
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">{t('customOrders.buyer_notes', 'Buyer notes')}</p>
                  <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
                </div>
              )}
              {selectedOrder.customer && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">{t('customOrders.customer', 'Customer')}</p>
                  <p className="text-sm font-medium text-gray-800">{selectedOrder.customer.display_name}</p>
                </div>
              )}
            </div>

            {/* Quote form — only for requested orders */}
            <QuoteForm order={selectedOrder} onQuoted={handleUpdate} />

            {/* Progress timeline */}
            <CustomOrderTimeline order={selectedOrder} onAdvanced={handleUpdate} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
