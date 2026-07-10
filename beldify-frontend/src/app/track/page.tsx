'use client';

import React, { useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  Search,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { orderService, GuestTracking } from '@/services/orderService';
import logger from '@/utils/consoleLogger';

const STEP_ICONS: Record<string, React.ElementType> = {
  placed: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
};

function TrackOrderContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const [orderNumber, setOrderNumber] = useState(searchParams.get('number') ?? '');
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GuestTracking | null>(null);

  const stepLabel = useCallback(
    (key: string) =>
      ({
        placed: t('track.step_placed', 'Order placed'),
        processing: t('track.step_processing', 'Processing'),
        shipped: t('track.step_shipped', 'Shipped'),
        delivered: t('track.step_delivered', 'Delivered'),
      }[key] ?? key),
    [t]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!orderNumber.trim() || !email.trim()) return;
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const data = await orderService.trackGuestOrder(orderNumber, email);
        setResult(data);
      } catch (err: any) {
        logger.error('Track order failed:', err);
        if (err.message === 'invalid_input') {
          setError(t('track.error_invalid', 'Please enter a valid order number and email.'));
        } else {
          setError(
            t('track.error_not_found', 'No order found for that number and email. Please check and try again.')
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [orderNumber, email, t]
  );

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t('track.title', 'Track your order')}
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {t('track.subtitle', 'Enter your order number and the email you used at checkout.')}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="order-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('track.order_number', 'Order number')}
          </label>
          <input
            id="order-number"
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="ORD-XXXXXX"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="track-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('track.email', 'Email')}
          </label>
          <input
            id="track-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          {loading ? t('track.searching', 'Searching…') : t('track.track_button', 'Track order')}
        </button>
      </form>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                {t('track.order_number', 'Order number')}
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">{result.order_number}</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">
              {t(`track.status_${result.status}`, result.status.replace(/_/g, ' '))}
            </span>
          </div>

          {result.tracking_number && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <MapPin className="h-4 w-4" />
              <span>
                {t('track.carrier', 'Carrier')}: {result.carrier ?? '—'} · {result.tracking_number}
              </span>
            </div>
          )}

          <ol className="mt-6 space-y-5">
            {result.timeline.map((step) => {
              const Icon = STEP_ICONS[step.key] ?? Clock;
              return (
                <li key={step.key} className="flex items-start gap-3">
                  <span
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                      step.completed
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="pt-1">
                    <p
                      className={`text-sm font-medium ${
                        step.current
                          ? 'text-primary'
                          : step.completed
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-400'
                      }`}
                    >
                      {stepLabel(step.key)}
                    </p>
                    {step.at && <p className="text-xs text-gray-400">{fmt(step.at)}</p>}
                  </div>
                </li>
              );
            })}
          </ol>

          {result.events.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('track.history', 'History')}
              </p>
              <ul className="space-y-2">
                {result.events.map((ev, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="capitalize">{ev.description || ev.status.replace(/_/g, ' ')}</span>
                    {ev.location && <span className="text-gray-400"> · {ev.location}</span>}
                    {ev.happened_at && (
                      <span className="block text-xs text-gray-400">{fmt(ev.happened_at)}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            href={`/orders/${result.order_number}`}
            className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
          >
            {t('track.view_details', 'View full order details')}
          </Link>
        </section>
      )}
    </main>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-10 text-sm text-gray-400">Loading…</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
