'use client';

import React, { useEffect, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { orderStatusVariant, ORDER_STATUS_LABEL } from '@/constants/orderStatusColors';
import { intlLocale } from '@/i18n/config';

const ORDER_STATUSES: Array<{ value: string; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  return (
    <Badge variant={orderStatusVariant(status)}>
      {t(`seller.orders.status_${status}`, ORDER_STATUS_LABEL[status] ?? status)}
    </Badge>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className ?? ''}`} />;
}

function fmtMAD(n: number, numLocale: string = 'fr-MA') {
  return n.toLocaleString(numLocale, { minimumFractionDigits: 0 });
}

export default function SellerOrdersPage() {
  const { t, i18n } = useTranslation();
  const numLocale = intlLocale(i18n.language);
  const { isAuthenticated } = useAuth();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const [orders, setOrders] = useState<SellerOrderSummary[]>([]);
  const [meta, setMeta] = useState<SellerOrdersMeta>({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    getSellerOrders({ status: statusFilter || undefined, page })
      .then((res) => {
        if (cancelled) return;
        setOrders(res.data);
        setMeta(res.meta);
      })
      .catch(() => {
        if (cancelled) return;
        setOrders([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, statusFilter, page]);

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
          <h1 className="text-xl font-bold text-gray-900 font-heading">
            {t('seller.orders.title', 'Orders')}
          </h1>
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          aria-label={t('seller.orders.filter_label', 'Filter by status')}
          className="rounded-xl px-3 py-2 text-sm bg-white ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-700/40 focus:outline-none text-gray-700"
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
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl ring-1 ring-gray-200">
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
        <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-100">
                <TableHead>{t('seller.orders.col_number', 'Order')}</TableHead>
                <TableHead>{t('seller.orders.col_customer', 'Customer')}</TableHead>
                <TableHead numeric>{t('seller.orders.col_items', 'Items')}</TableHead>
                <TableHead>{t('seller.orders.col_status', 'Status')}</TableHead>
                <TableHead numeric>{t('seller.orders.col_total', 'Total')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50">
                  <TableCell className="py-3.5">
                    <Link
                      href={`/seller/orders/${order.id}`}
                      className="font-medium text-indigo-700 hover:underline"
                    >
                      {order.order_number}
                    </Link>
                  </TableCell>
                  <TableCell className="py-3.5 text-gray-700">{order.customer_name}</TableCell>
                  <TableCell numeric className="py-3.5 text-gray-500">{order.items_count}</TableCell>
                  <TableCell className="py-3.5">
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell numeric className="py-3.5 font-medium text-gray-900">
                    <span className="currency-mad">{fmtMAD(order.total_amount, numLocale)} DH</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm">
              <p className="text-gray-400 text-xs">
                {t('seller.orders.pagination_info', 'Page {{currentPage}} of {{lastPage}} — {{total}} orders', {
                  currentPage: meta.current_page,
                  lastPage: meta.last_page,
                  total: meta.total,
                })}
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
