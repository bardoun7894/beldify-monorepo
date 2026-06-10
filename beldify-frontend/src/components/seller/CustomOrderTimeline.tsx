'use client';

/**
 * T032 — Seller: custom-order management timeline
 *
 * Displays current status, progress history, and allows advancing
 * to the next legal status per contracts.md §A6 transition table.
 *
 * LIVE WIRING (WS-A): advanceCustomOrder in customOrderService.ts (USE_MOCK flag)
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Circle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  CustomOrder,
  CustomOrderStatus,
  ALLOWED_NEXT_STATUSES,
  STATUS_META,
  advanceCustomOrder,
  AdvancePayload,
} from '@/services/customOrderService';
import { cn } from '@/lib/utils';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

export interface CustomOrderTimelineProps {
  order: CustomOrder;
  onAdvanced: (updated: CustomOrder) => void;
}

export default function CustomOrderTimeline({ order, onAdvanced }: CustomOrderTimelineProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [selectedNext, setSelectedNext] = useState<CustomOrderStatus | ''>('');
  const [note, setNote] = useState('');
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  const { progress } = order;
  const allowedNext = ALLOWED_NEXT_STATUSES[order.status] ?? [];
  const currentMeta = STATUS_META[order.status];

  const handleAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNext) return;
    setAdvanceError(null);

    try {
      setAdvancing(true);
      const payload: AdvancePayload = { status: selectedNext, note: note || undefined };
      const updated = await advanceCustomOrder(order.id, payload);
      onAdvanced(updated);
      setSelectedNext('');
      setNote('');
    } catch {
      setAdvanceError(isRTL ? 'تعذّر تحديث الحالة.' : 'Failed to advance order status.');
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Current status pill ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-500">
          {isRTL ? 'الحالة:' : 'Status:'}
        </span>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1',
            currentMeta.pillClass
          )}
        >
          {isRTL ? currentMeta.labelAr : currentMeta.label}
        </span>
      </div>

      {/* ── Progress timeline ── */}
      <div className="rounded-2xl ring-1 ring-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
            {isRTL ? 'سجل التقدم' : 'Progress Log'}
          </p>
        </div>

        <ol className="divide-y divide-gray-100" aria-label={isRTL ? 'سجل التقدم' : 'Progress history'}>
          {progress.length === 0 && (
            <li className="px-5 py-4 text-sm text-gray-400">
              {isRTL ? 'لا يوجد سجل بعد.' : 'No progress entries yet.'}
            </li>
          )}
          {progress.map((entry, idx) => {
            const meta = STATUS_META[entry.status];
            const isLast = idx === progress.length - 1;
            return (
              <li key={entry.id} className="flex items-start gap-3 px-5 py-4">
                <div className="mt-0.5 shrink-0">
                  {isLast
                    ? <CheckCircle2 className="h-4 w-4 text-indigo-600" aria-hidden />
                    : <Circle className="h-4 w-4 text-gray-300" aria-hidden />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1',
                        meta.pillClass
                      )}
                    >
                      {isRTL ? meta.labelAr : meta.label}
                    </span>
                    <time
                      dateTime={entry.created_at}
                      className="text-xs text-gray-400"
                    >
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

      {/* ── Advance status form (only if allowed transitions exist) ── */}
      {allowedNext.length > 0 && (
        <form onSubmit={handleAdvance} className="rounded-2xl ring-1 ring-gray-200 bg-white p-5 space-y-4">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
            {isRTL ? 'تقديم الحالة' : 'Advance Status'}
          </p>

          {advanceError && (
            <div className="rounded-xl bg-rose-50 ring-1 ring-rose-200 px-4 py-3 text-sm text-rose-700" role="alert">
              {advanceError}
            </div>
          )}

          {/* Next status selector */}
          <div className="space-y-1.5">
            <label htmlFor="next-status" className="text-sm font-medium text-gray-700">
              {isRTL ? 'الحالة التالية' : 'Next Status'}
              <span className="text-rose-600 ms-1" aria-label="required">*</span>
            </label>
            <select
              id="next-status"
              value={selectedNext}
              onChange={e => setSelectedNext(e.target.value as CustomOrderStatus)}
              required
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white focus:border-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
            >
              <option value="">
                {isRTL ? 'اختر الحالة…' : 'Select status…'}
              </option>
              {allowedNext.map(status => {
                const meta = STATUS_META[status];
                return (
                  <option key={status} value={status}>
                    {isRTL ? meta.labelAr : meta.label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Optional note */}
          <div className="space-y-1.5">
            <label htmlFor="advance-note" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              {isRTL ? 'ملاحظة' : 'Note'}
              <span className="text-[10px] text-gray-400 font-normal">{isRTL ? 'اختياري' : 'optional'}</span>
            </label>
            <textarea
              id="advance-note"
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={2000}
              placeholder={isRTL ? 'أضف ملاحظة…' : 'Add a note…'}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white focus:border-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={advancing || !selectedNext}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
              advancing || !selectedNext
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm'
            )}
          >
            {advancing
              ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              : <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />}
            {advancing
              ? (isRTL ? 'جارٍ التحديث…' : 'Updating…')
              : (isRTL ? 'تحديث الحالة' : 'Update Status')}
          </button>
        </form>
      )}

      {/* Terminal state message */}
      {allowedNext.length === 0 && (
        <div className="rounded-2xl bg-gray-50 ring-1 ring-gray-200 px-5 py-4 text-sm text-gray-500">
          {isRTL ? 'هذا الطلب في حالة نهائية.' : 'This order has reached a terminal state.'}
        </div>
      )}
    </div>
  );
}
