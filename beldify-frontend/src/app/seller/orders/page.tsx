'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import {
  getSellerOrders,
  SellerOrderSummary,
  SellerOrdersMeta,
  OrderStatus,
} from '@/services/sellerDashboardService';
import { ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

const ORDER_STATUSES: Array<{ value: string; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pending:    { label: 'Pending',    classes: 'bg-amber-100 text-amber-800' },
  processing: { label: 'Processing', classes: 'bg-indigo-100 text-indigo-800' },
  shipped:    { label: 'Shipped',    classes: 'bg-blue-100 text-blue-800' },
  delivered:  { label: 'Delivered',  classes: 'bg-emerald-100 text-emerald-800' },
  cancelled:  { label: 'Cancelled',  classes: 'bg-rose-100 text-rose-800' },
  refunded:   { label: 'Refunded',   classes: 'bg-gray-100 text-gray-700' },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, classes: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-amber-100 rounded-xl ${className ?? ''}`} />;
}

function fmtMAD(n: number) {
  return n.toLocaleString('fr-MA', { minimumFractionDigits: 0 });
}

export default function SellerOrdersPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const [orders, setOrders] = useState<SellerOrderSummary[]>([]);
  const [meta, setMeta] = useState<SellerOrdersMeta>({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    getSellerOrders({ status: statusFilter || undefined, page })
      .then((res) => {
        setOrders(res.data);
        setMeta(res.meta);
      })
      .catch(() => {
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, statusFilter, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-amber-600 font-medium mb-1">
            {t('seller.orders.eyebrow', 'Seller Hub')}
          </p>
          <h1 className="text-xl font-bold text-gray-900" style={playfair}>
            {t('seller.orders.title', 'Orders')}
          </h1>
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          aria-label={t('seller.orders.filter_label', 'Filter by status')}
          className="rounded-xl px-3 py-2 text-sm bg-white ring-1 ring-amber-200 focus:ring-2 focus:ring-indigo-700/40 focus:outline-none text-gray-700"
        >
          {ORDER_STATUSES.map(({ value, label }) => (
            <option key={value} value={value}>
              {t(`seller.orders.status_${value || 'all'}`, label)}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14" />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl ring-1 ring-amber-200">
          <ShoppingBag className="w-10 h-10 text-amber-300 mb-4" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            {t('seller.orders.no_orders', 'No orders yet')}
          </p>
          <p className="text-xs text-gray-400">
            {t('seller.orders.no_orders_sub', 'Orders will appear here once customers purchase from your store.')}
          </p>
        </div>
      )}

      {/* Orders table */}
      {!loading && orders.length > 0 && (
        <div className="bg-white rounded-2xl ring-1 ring-amber-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide bg-amber-50/50 border-b border-amber-100">
                  <th className="px-5 py-3 font-medium">
                    {t('seller.orders.col_number', 'Order')}
                  </th>
                  <th className="px-5 py-3 font-medium">
                    {t('seller.orders.col_customer', 'Customer')}
                  </th>
                  <th className="px-5 py-3 font-medium">
                    {t('seller.orders.col_items', 'Items')}
                  </th>
                  <th className="px-5 py-3 font-medium">
                    {t('seller.orders.col_status', 'Status')}
                  </th>
                  <th className="px-5 py-3 font-medium text-right">
                    {t('seller.orders.col_total', 'Total')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/seller/orders/${order.id}`}
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{order.customer_name}</td>
                    <td className="px-5 py-3.5 text-gray-500">{order.items_count}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-gray-900">
                      {fmtMAD(order.total_amount)} DH
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-amber-100 text-sm">
              <p className="text-gray-400 text-xs">
                {t('seller.orders.pagination_info', `Page ${meta.current_page} of ${meta.last_page} — ${meta.total} orders`)}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label={t('seller.orders.prev_page', 'Previous page')}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  disabled={page === meta.last_page}
                  aria-label={t('seller.orders.next_page', 'Next page')}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
