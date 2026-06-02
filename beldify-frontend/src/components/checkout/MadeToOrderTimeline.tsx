'use client';

/**
 * T036 — Buyer: made-to-order tracking timeline
 *
 * Displays the full progress timeline with Atlas status pills and colors.
 * Used on the buyer tracking page (/custom-orders/[id]).
 *
 * STATUS_META (from customOrderService.ts) provides Atlas pill colors.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle, Clock, Package } from 'lucide-react';
import {
  CustomOrder,
  CustomOrderStatus,
  STATUS_META,
} from '@/services/customOrderService';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/utils/formatters';

// ─── Lifecycle order for the progress visual ─────────────────────────────────

const LIFECYCLE: CustomOrderStatus[] = [
  'requested',
  'quoted',
  'deposit_paid',
  'in_progress',
  'ready',
  'delivered',
  'closed',
];

export interface MadeToOrderTimelineProps {
  order: CustomOrder;
}

export default function MadeToOrderTimeline({ order }: MadeToOrderTimelineProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const currentMeta = STATUS_META[order.status];
  const isCancelled = order.status === 'cancelled';

  const currentIdx = LIFECYCLE.indexOf(order.status);

  // Progress entries from the API — append-only audit log
  const { progress } = order;

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Current status banner ── */}
      <div
        className={cn(
          'rounded-2xl ring-1 px-5 py-4 flex items-center gap-3',
          isCancelled
            ? 'bg-rose-50 ring-rose-200'
            : 'bg-indigo-50 ring-indigo-200'
        )}
      >
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', isCancelled ? 'bg-rose-100' : 'bg-indigo-100')}>
          {isCancelled
            ? <Package className="h-5 w-5 text-rose-600" aria-hidden />
            : <Clock className="h-5 w-5 text-indigo-600" aria-hidden />}
        </div>
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            {isRTL ? 'الحالة الحالية' : 'Current Status'}
          </p>
          <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1', currentMeta.pillClass)}>
            {isRTL ? currentMeta.labelAr : currentMeta.label}
          </span>
        </div>
      </div>

      {/* ── Quote details (shown when available) ── */}
      {(order.quote_amount || order.eta) && (
        <div className="rounded-2xl ring-1 ring-amber-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-4">
            {isRTL ? 'تفاصيل العرض' : 'Quote Details'}
          </p>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {order.quote_amount && (
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-0.5">
                  {isRTL ? 'المبلغ الإجمالي' : 'Quote Amount'}
                </dt>
                <dd className="text-sm font-bold text-indigo-700 tabular-nums">
                  {formatPrice(parseFloat(order.quote_amount))}
                </dd>
              </div>
            )}
            {order.deposit_amount && (
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-0.5">
                  {isRTL ? 'العربون' : 'Deposit'}
                </dt>
                <dd className="text-sm font-semibold text-gray-900 tabular-nums">
                  {formatPrice(parseFloat(order.deposit_amount))}
                  {order.deposit_paid && (
                    <CheckCircle2 className="inline-block h-3.5 w-3.5 text-emerald-600 ms-1.5 mb-0.5" aria-label={isRTL ? 'مدفوع' : 'Paid'} />
                  )}
                </dd>
              </div>
            )}
            {order.eta && (
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-0.5">
                  {isRTL ? 'تاريخ التسليم المتوقع' : 'ETA'}
                </dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {new Date(order.eta).toLocaleDateString(isRTL ? 'ar-MA' : 'en-GB', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* ── Visual lifecycle stepper ── */}
      {!isCancelled && (
        <div className="rounded-2xl ring-1 ring-amber-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-100">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
              {isRTL ? 'مراحل الطلب' : 'Order Progress'}
            </p>
          </div>
          <ol className="px-5 py-4 space-y-4" aria-label={isRTL ? 'مراحل الطلب' : 'Order stages'}>
            {LIFECYCLE.map((status, idx) => {
              const meta = STATUS_META[status];
              const isDone = currentIdx > idx || (currentIdx === idx);
              const isCurrent = currentIdx === idx;
              const progressEntry = progress.find(p => p.status === status);

              return (
                <li key={status} className="flex items-start gap-3">
                  {/* Step icon */}
                  <div className="mt-0.5 shrink-0">
                    {isDone
                      ? <CheckCircle2 className={cn('h-5 w-5', isCurrent ? 'text-indigo-600' : 'text-emerald-500')} aria-hidden />
                      : <Circle className="h-5 w-5 text-gray-200" aria-hidden />}
                  </div>

                  <div className="flex-1 min-w-0 pb-4 border-b border-amber-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        'text-sm font-medium',
                        isCurrent ? 'text-indigo-700 font-semibold' : isDone ? 'text-gray-700' : 'text-gray-300'
                      )}>
                        {isRTL ? meta.labelAr : meta.label}
                      </span>
                      {isCurrent && (
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1', meta.pillClass)}>
                          {isRTL ? 'الحالي' : 'Current'}
                        </span>
                      )}
                    </div>
                    {progressEntry && (
                      <div className="mt-0.5 flex items-center gap-2">
                        {progressEntry.note && (
                          <p className="text-xs text-gray-500">{progressEntry.note}</p>
                        )}
                        <time dateTime={progressEntry.created_at} className="text-[10px] text-gray-400">
                          {new Date(progressEntry.created_at).toLocaleDateString(isRTL ? 'ar-MA' : 'en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </time>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* ── Cancelled banner ── */}
      {isCancelled && (
        <div className="rounded-2xl bg-rose-50 ring-1 ring-rose-200 px-5 py-4 text-sm text-rose-700">
          {isRTL ? 'تم إلغاء هذا الطلب.' : 'This order has been cancelled.'}
        </div>
      )}

      {/* ── Full audit log ── */}
      {progress.length > 0 && (
        <div className="rounded-2xl ring-1 ring-amber-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-100">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
              {isRTL ? 'سجل الأحداث' : 'Activity Log'}
            </p>
          </div>
          <ol className="divide-y divide-amber-100" aria-label={isRTL ? 'سجل الأحداث' : 'Activity log'}>
            {[...progress].reverse().map(entry => {
              const meta = STATUS_META[entry.status];
              return (
                <li key={entry.id} className="flex items-start gap-3 px-5 py-4">
                  <div className="mt-0.5 shrink-0">
                    <div className={cn('h-2 w-2 rounded-full mt-1.5', meta.pillClass.includes('indigo') ? 'bg-indigo-500' : 'bg-gray-300')} aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1', meta.pillClass)}>
                        {isRTL ? meta.labelAr : meta.label}
                      </span>
                      <time dateTime={entry.created_at} className="text-[10px] text-gray-400">
                        {new Date(entry.created_at).toLocaleDateString(isRTL ? 'ar-MA' : 'en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </time>
                    </div>
                    {entry.note && (
                      <p className="mt-1 text-sm text-gray-600">{entry.note}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
