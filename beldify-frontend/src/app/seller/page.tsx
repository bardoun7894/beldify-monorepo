'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import {
  getSellerEarnings,
  SellerEarningsData,
  SellerOrderSummary,
  getSellerOrders,
} from '@/services/sellerDashboardService';
import { getOnboardingStatus, OnboardingStatusData } from '@/services/sellerOnboardingService';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  BarChart2,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Plus,
} from 'lucide-react';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

function fmtMAD(n: number) {
  return n.toLocaleString('fr-MA', { minimumFractionDigits: 0 });
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pending:    { label: 'Pending',    classes: 'bg-amber-100 text-amber-800' },
  processing: { label: 'Processing', classes: 'bg-indigo-100 text-indigo-800' },
  shipped:    { label: 'Shipped',    classes: 'bg-blue-100 text-blue-800' },
  delivered:  { label: 'Delivered',  classes: 'bg-emerald-100 text-emerald-800' },
  cancelled:  { label: 'Cancelled',  classes: 'bg-rose-100 text-rose-800' },
  refunded:   { label: 'Refunded',   classes: 'bg-gray-100 text-gray-700' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, classes: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

// ── Onboarding banner ─────────────────────────────────────────────────────────
function OnboardingBanner({ status }: { status: OnboardingStatusData }) {
  const { t } = useTranslation();

  if (status.store_status === 'suspended') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-sm">
        <XCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
        <span className="text-rose-800 font-medium">Store suspended — contact support</span>
      </div>
    );
  }

  if (status.store_status === 'active' && (status.overall_percentage ?? 100) >= 100) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 text-sm">
        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
        <span className="text-emerald-800 font-medium">{t('seller.onboarding_banner.active', 'Store active and live')}</span>
        <Link href="/seller/onboarding" className="ms-auto text-xs text-emerald-600 hover:underline shrink-0">
          {t('seller.onboarding_banner.view_journey', 'View journey')}
        </Link>
      </div>
    );
  }

  // Onboarding nudge — active store with incomplete profile OR pending application
  const pct = status.overall_percentage ?? 0;
  const isPending = status.store_status === 'pending';

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 ring-1 ring-amber-200 text-sm">
      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-amber-800 font-medium">
          {isPending
            ? t('seller.onboarding_banner.pending', 'Application under review')
            : t('seller.onboarding_banner.progress', 'Complete your store setup — {{pct}}% done', { pct })}
        </p>
        {!isPending && (
          <p className="text-amber-700 text-xs mt-0.5">
            {t('seller.onboarding_banner.finish_hint', 'Finish your profile to unlock all features and start selling.')}
          </p>
        )}
      </div>
      <Link
        href="/seller/onboarding"
        className="shrink-0 text-xs font-medium text-amber-700 hover:text-amber-900 hover:underline"
      >
        {isPending ? 'Track progress' : 'Complete setup'}
      </Link>
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-5 flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className ?? ''}`} />;
}

export default function SellerDashboardPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const [earnings, setEarnings] = useState<SellerEarningsData | null>(null);
  const [earningsLoading, setEarningsLoading] = useState(true);

  const [orders, setOrders] = useState<SellerOrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [onboarding, setOnboarding] = useState<OnboardingStatusData | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Independent parallel fetches — each degrades gracefully on failure
    getSellerEarnings(30)
      .then((res) => setEarnings(res.data))
      .catch(() => { /* earnings stays null — handled in render */ })
      .finally(() => setEarningsLoading(false));

    getSellerOrders({ page: 1 })
      .then((res) => setOrders(res.data.slice(0, 5)))
      .catch(() => { /* orders stays empty */ })
      .finally(() => setOrdersLoading(false));

    getOnboardingStatus()
      .then((res) => setOnboarding(res.data))
      .catch(() => { /* onboarding stays null — silent */ });
  }, [isAuthenticated]);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-amber-600 font-medium mb-1">
          {t('seller.dashboard.eyebrow', 'Seller Hub')}
        </p>
        <h1 className="text-xl font-bold text-gray-900" style={playfair}>
          {t('seller.dashboard.title', 'Dashboard')}
        </h1>
      </div>

      {/* Onboarding banner */}
      {onboarding && <OnboardingBanner status={onboarding} />}

      {/* KPI grid */}
      {earningsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : earnings ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            label={t('seller.dashboard.kpi_gross', 'Gross Revenue')}
            value={`${fmtMAD(earnings.gross_revenue)} DH`}
            sub={`Last ${earnings.period} days`}
            icon={TrendingUp}
            accent="bg-amber-100 text-amber-700"
          />
          <KpiCard
            label={t('seller.dashboard.kpi_net', 'Net Revenue')}
            value={`${fmtMAD(earnings.net_revenue)} DH`}
            sub={`After ${earnings.total_commission} DH commission`}
            icon={DollarSign}
            accent="bg-emerald-100 text-emerald-700"
          />
          <KpiCard
            label={t('seller.dashboard.kpi_orders', 'Orders')}
            value={earnings.orders_count}
            sub={`Avg ${fmtMAD(earnings.average_order_value)} DH`}
            icon={ShoppingBag}
            accent="bg-indigo-100 text-indigo-700"
          />
          <KpiCard
            label={t('seller.dashboard.kpi_commission', 'Commission')}
            value={`${fmtMAD(earnings.total_commission)} DH`}
            sub={`${Math.round((earnings.total_commission / (earnings.gross_revenue || 1)) * 100)}% rate`}
            icon={BarChart2}
            accent="bg-rose-100 text-rose-700"
          />
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-amber-50 ring-1 ring-amber-200 text-sm text-amber-700">
          {t('seller.dashboard.earnings_error', 'Could not load earnings data.')}
        </div>
      )}

      {/* Recent orders */}
      <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            {t('seller.dashboard.recent_orders', 'Recent Orders')}
          </h2>
          <Link
            href="/seller/orders"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-900"
          >
            {t('seller.dashboard.view_all_orders', 'View all orders')}
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6 gap-3">
            <Clock className="w-8 h-8 text-amber-300" aria-hidden="true" />
            <p className="text-sm text-gray-500">
              {t('seller.dashboard.no_orders', 'No orders yet — share your store to get started!')}
            </p>
            <Link
              href="/seller/products/new"
              className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full px-5 py-2 text-xs font-semibold transition-colors mt-1"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              {t('seller.dashboard.add_first_product_cta', 'Add your first product')}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide bg-gray-50">
                  <th className="px-5 py-3 font-medium">
                    {t('seller.orders.col_number', 'Order')}
                  </th>
                  <th className="px-5 py-3 font-medium">
                    {t('seller.orders.col_customer', 'Customer')}
                  </th>
                  <th className="px-5 py-3 font-medium">
                    {t('seller.orders.col_status', 'Status')}
                  </th>
                  <th className="px-5 py-3 font-medium text-right">
                    {t('seller.orders.col_total', 'Total')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/seller/orders/${order.id}`}
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{order.customer_name}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">
                      {fmtMAD(order.total_amount)} DH
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
