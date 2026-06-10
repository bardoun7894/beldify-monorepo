'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import toast from '@/utils/toast';
import {
  getSellerOrder,
  updateOrderStatus,
  SellerOrderDetail,
  OrderStatus,
} from '@/services/sellerDashboardService';
import { ArrowLeft, MapPin, Calendar } from 'lucide-react';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

const UPDATABLE_STATUSES: Array<{ value: OrderStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
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
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className ?? ''}`} />;
}

function fmtMAD(n: number) {
  return n.toLocaleString('fr-MA', { minimumFractionDigits: 0 });
}

function fmtDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-MA', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function SellerOrderDetailPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const params = useParams();
  const orderId = Number(params?.id);
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const [order, setOrder] = useState<SellerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('pending');
  const selectedStatusRef = React.useRef<OrderStatus>('pending');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !orderId) return;
    setLoading(true);
    getSellerOrder(orderId)
      .then((res) => {
        setOrder(res.data);
        setSelectedStatus(res.data.status);
        selectedStatusRef.current = res.data.status;
      })
      .catch(() => {
        setError(t('seller.order_detail.fetch_error', 'Could not load order.'));
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, orderId, t]);

  const handleUpdateStatus = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!order) return;
    // Read current value directly from form DOM — avoids stale closure on selectedStatus state
    const formEl = e.currentTarget;
    const selectEl = formEl.querySelector('select') as HTMLSelectElement | null;
    const currentStatus = (selectEl?.value ?? selectedStatusRef.current) as OrderStatus;
    setUpdating(true);
    try {
      const res = await updateOrderStatus(order.id, currentStatus);
      setOrder((prev) => prev ? { ...prev, status: res.data.status } : prev);
      toast.success(t('seller.order_detail.status_updated', 'Order status updated'));
    } catch (err: any) {
      if (err?.response?.status === 403) {
        toast.error(t('seller.order_detail.suspended_error', 'Your store is suspended — cannot update orders.'));
      } else {
        toast.error(t('seller.order_detail.update_error', 'Failed to update order status.'));
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Back link */}
      <div>
        <Link
          href="/seller/orders"
          className="inline-flex items-center gap-1.5 text-sm text-indigo-700 hover:text-indigo-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
          {t('seller.order_detail.back', 'Orders')}
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="p-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Order detail */}
      {!loading && order && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-amber-600 font-medium mb-1">
                {t('seller.order_detail.eyebrow', 'Order Detail')}
              </p>
              <h1 className="text-xl font-bold text-gray-900" style={playfair}>
                {order.order_number}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={order.status} />
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" aria-hidden="true" />
                  {fmtDate(order.created_at)}
                </span>
              </div>
            </div>

            {/* Status update form */}
            <form onSubmit={handleUpdateStatus} className="flex items-center gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  const s = e.target.value as OrderStatus;
                  setSelectedStatus(s);
                  selectedStatusRef.current = s;
                }}
                aria-label={t('seller.order_detail.update_status_label', 'Update order status')}
                className="rounded-xl px-3 py-2 text-sm bg-white ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-700/40 focus:outline-none text-gray-700"
              >
                {UPDATABLE_STATUSES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {t(`seller.order_detail.status_${value}`, label)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={updating || selectedStatus === order.status}
                className="inline-flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              >
                {updating
                  ? t('seller.order_detail.updating', 'Updating…')
                  : t('seller.order_detail.update_btn', 'Update status')}
              </button>
            </form>
          </div>

          {/* 2-col grid: items + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order items table */}
            <div className="lg:col-span-2 bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">
                  {t('seller.order_detail.items_heading', 'Items')}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                      <th className="px-5 py-3 font-medium">
                        {t('seller.order_detail.col_product', 'Product')}
                      </th>
                      <th className="px-5 py-3 font-medium">
                        {t('seller.order_detail.col_variant', 'Variant')}
                      </th>
                      <th className="px-5 py-3 font-medium text-right">
                        {t('seller.order_detail.col_qty', 'Qty')}
                      </th>
                      <th className="px-5 py-3 font-medium text-right">
                        {t('seller.order_detail.col_unit', 'Unit')}
                      </th>
                      <th className="px-5 py-3 font-medium text-right">
                        {t('seller.order_detail.col_total', 'Total')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-900">{item.product_name}</td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{item.variant ?? '—'}</td>
                        <td className="px-5 py-3.5 text-right text-gray-700">{item.quantity}</td>
                        <td className="px-5 py-3.5 text-right text-gray-700">{fmtMAD(item.unit_price)} DH</td>
                        <td className="px-5 py-3.5 text-right font-medium text-gray-900">{fmtMAD(item.line_total)} DH</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sidebar: financials + customer + shipping */}
            <div className="space-y-4">
              {/* Financial summary */}
              <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">
                  {t('seller.order_detail.financials_heading', 'Summary')}
                </h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t('seller.order_detail.subtotal', 'Subtotal')}</dt>
                    <dd className="text-gray-900 font-medium">{fmtMAD(order.subtotal)} DH</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">
                      {t('seller.order_detail.commission', `Commission (${order.commission_rate}%)`)}
                    </dt>
                    <dd className="text-rose-600 font-medium">−{fmtMAD(order.commission_amount)} DH</dd>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <dt className="text-gray-900 font-semibold">{t('seller.order_detail.net', 'Net to you')}</dt>
                    <dd className="text-emerald-700 font-bold text-base">{fmtMAD(order.net_amount)} DH</dd>
                  </div>
                </dl>
              </div>

              {/* Customer */}
              <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">
                  {t('seller.order_detail.customer_heading', 'Customer')}
                </h2>
                <p className="text-sm text-gray-700">{order.customer.name}</p>
              </div>

              {/* Shipping */}
              <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">
                  {t('seller.order_detail.shipping_heading', 'Shipping address')}
                </h2>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" aria-hidden="true" />
                  <p>{order.shipping_address}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
