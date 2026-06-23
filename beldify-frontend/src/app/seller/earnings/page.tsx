'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import {
  getSellerEarnings,
  SellerEarningsData,
  EarningsPeriod,
} from '@/services/sellerDashboardService';
import { TrendingUp, DollarSign, ShoppingBag, BarChart2, AlertCircle, Wallet, ArrowRight } from 'lucide-react';
import { intlLocale } from '@/i18n/config';

function fmtMAD(n: number, locale: string) {
  return n.toLocaleString(locale, { minimumFractionDigits: 0 });
}

const PERIODS: Array<{ value: EarningsPeriod; label: string }> = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

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

// ── Inline bar chart ──────────────────────────────────────────────────────────
function EarningsChart({ byDay }: { byDay: Array<{ date: string; revenue: number }> }) {
  const { t, i18n } = useTranslation();
  const numLocale = intlLocale(i18n.language);
  const max = Math.max(...byDay.map((d) => d.revenue), 1);
  const visible = byDay.slice(-30); // cap to 30 bars for readability

  if (visible.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-gray-400">
        {t('seller.earnings.no_daily_data', 'No daily data available')}
      </div>
    );
  }

  return (
    <div
      aria-label={t('seller.earnings.chart_aria', 'Earnings chart by day')}
      className="flex items-end gap-0.5 h-32 px-1"
      data-testid="earnings-chart"
    >
      {visible.map((d, i) => {
        const pct = Math.max((d.revenue / max) * 100, 4);
        return (
          <div
            key={i}
            title={`${d.date}: ${fmtMAD(d.revenue, numLocale)} DH`}
            className="flex-1 bg-amber-400 rounded-t-sm hover:bg-indigo-500 transition-colors cursor-default"
            style={{ height: `${pct}%` }}
            role="img"
            aria-label={`${d.date}: ${fmtMAD(d.revenue, numLocale)} DH`}
          />
        );
      })}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className ?? ''}`} />;
}

export default function SellerEarningsPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';
  const numLocale = intlLocale(i18n.language);

  const [period, setPeriod] = useState<EarningsPeriod>(30);
  const [earnings, setEarnings] = useState<SellerEarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = useCallback(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    getSellerEarnings(period)
      .then((res) => setEarnings(res.data))
      .catch(() => setError(t('seller.earnings.fetch_error', 'Could not load earnings data.')))
      .finally(() => setLoading(false));
  }, [isAuthenticated, period, t]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header + period switcher */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-amber-600 font-medium mb-1">
            {t('seller.earnings.eyebrow', 'Seller Hub')}
          </p>
          <h1 className="text-xl font-bold text-gray-900 font-heading">
            {t('seller.earnings.title', 'Earnings')}
          </h1>
        </div>

        {/* Period switcher */}
        <div className="flex items-center gap-1 bg-white rounded-xl ring-1 ring-gray-200 p-1">
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              aria-pressed={period === value}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                period === value
                  ? 'bg-indigo-700 text-white'
                  : 'text-gray-500 hover:bg-amber-50',
              ].join(' ')}
            >
              {t(`seller.earnings.period_${value}`, label)}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* KPI cards skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      )}

      {/* KPI cards */}
      {!loading && earnings && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              label={t('seller.earnings.kpi_gross', 'Gross Revenue')}
              value={`${fmtMAD(earnings.gross_revenue, numLocale)} DH`}
              sub={t('seller.earnings.kpi_period', 'Last {{period}} days', { period: earnings.period })}
              icon={TrendingUp}
              accent="bg-amber-100 text-amber-700"
            />
            <KpiCard
              label={t('seller.earnings.kpi_net', 'Net Revenue')}
              value={`${fmtMAD(earnings.net_revenue, numLocale)} DH`}
              sub={t('seller.earnings.kpi_after_commission', 'After commission')}
              icon={DollarSign}
              accent="bg-emerald-100 text-emerald-700"
            />
            <KpiCard
              label={t('seller.earnings.kpi_orders', 'Orders')}
              value={earnings.orders_count}
              sub={t('seller.earnings.kpi_avg', 'Avg {{avg}} DH', { avg: fmtMAD(earnings.average_order_value, numLocale) })}
              icon={ShoppingBag}
              accent="bg-indigo-100 text-indigo-700"
            />
            <KpiCard
              label={t('seller.earnings.kpi_commission', 'Commission paid')}
              value={`${fmtMAD(earnings.total_commission, numLocale)} DH`}
              icon={BarChart2}
              accent="bg-rose-100 text-rose-700"
            />
          </div>

          {/* Daily chart */}
          <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                {t('seller.earnings.chart_heading', 'Revenue by day')}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {t('seller.earnings.chart_sub', 'Showing last {{period}} days in {{currency}}', { period: earnings.period, currency: earnings.currency })}
              </p>
            </div>
            <div className="px-5 pt-4 pb-6">
              <EarningsChart byDay={earnings.by_day} />
              {/* Axis labels */}
              {earnings.by_day.length > 0 && (
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>{earnings.by_day[0]?.date}</span>
                  <span>{earnings.by_day[earnings.by_day.length - 1]?.date}</span>
                </div>
              )}
            </div>
          </div>

          {/* Breakdown table */}
          <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                {t('seller.earnings.breakdown_heading', 'Financial breakdown')}
              </h2>
            </div>
            <dl className="divide-y divide-gray-100 text-sm">
              <div className="flex justify-between px-5 py-3">
                <dt className="text-gray-500">{t('seller.earnings.gross', 'Gross revenue')}</dt>
                <dd className="font-medium text-gray-900 tabular-nums currency-mad">{fmtMAD(earnings.gross_revenue, numLocale)} DH</dd>
              </div>
              <div className="flex justify-between px-5 py-3">
                <dt className="text-gray-500">{t('seller.earnings.commission', 'Platform commission')}</dt>
                <dd className="font-medium text-rose-600 tabular-nums currency-mad">−{fmtMAD(earnings.total_commission, numLocale)} DH</dd>
              </div>
              <div className="flex justify-between px-5 py-3 bg-gray-50">
                <dt className="font-semibold text-gray-900">{t('seller.earnings.net', 'Net revenue')}</dt>
                <dd className="font-bold text-emerald-700 text-base tabular-nums currency-mad">{fmtMAD(earnings.net_revenue, numLocale)} DH</dd>
              </div>
            </dl>
          </div>

          {/* Payouts CTA */}
          <div className="bg-indigo-50 ring-1 ring-indigo-100 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-indigo-700" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-900 font-heading">
                  {t('seller.earnings.payouts_cta_title', 'Ready to withdraw?')}
                </p>
                <p className="text-xs text-indigo-600 mt-0.5">
                  {t('seller.earnings.payouts_cta_body', 'Request a bank transfer payout from your available earnings.')}
                </p>
              </div>
            </div>
            <Link
              href="/seller/payouts"
              data-testid="earnings-payout-cta"
              className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors shrink-0"
            >
              {t('seller.earnings.payouts_cta_btn', 'Request payout')}
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
