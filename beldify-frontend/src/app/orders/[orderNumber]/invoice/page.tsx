'use client';

/**
 * Invoice page — /orders/[orderNumber]/invoice
 *
 * Print-optimised invoice for any non-cancelled order.
 * Uses existing orderService.getOrderDetails data — no new API calls.
 * @media print hides navigation, buttons, and non-invoice chrome.
 * RTL-aware (Arabic dir="rtl").
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { orderService, Order } from '@/services/orderService';
import { formatMAD } from '@/components/orders/formatMAD';
import { ChevronLeft, Printer, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import logger from '@/utils/consoleLogger';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

function PaymentStatusBadge({ status }: { status: string }) {
  const isPaid = status === 'paid';
  const isPending =
    status === 'pending' ||
    status === 'awaiting_payment' ||
    status === 'pending_verification';
  if (isPaid) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 text-xs font-semibold">
        <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />
        Paid
      </span>
    );
  }
  if (isPending) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 text-xs font-semibold">
        <Clock className="w-3.5 h-3.5" strokeWidth={2} />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200 text-xs font-semibold">
      <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
      {status}
    </span>
  );
}

export default function InvoicePage() {
  const params = useParams();
  const orderNumber = params?.orderNumber as string;
  const { t, i18n } = useTranslation();
  const isRTL =
    i18n.language === 'ar' ||
    i18n.language === 'ma' ||
    i18n.language.startsWith('ar') ||
    i18n.language.startsWith('ma');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = useCallback(
    (dateStr: string | null | undefined) => {
      if (!dateStr) return '—';
      try {
        return new Intl.DateTimeFormat(isRTL ? 'ar-MA' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(new Date(dateStr));
      } catch {
        return dateStr;
      }
    },
    [isRTL]
  );

  useEffect(() => {
    if (!orderNumber) return;
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await orderService.getOrderDetails(orderNumber);
        if (!cancelled) setOrder(data);
      } catch (err: unknown) {
        logger.error('Invoice fetch error:', err);
        if (!cancelled) setError('Could not load order');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-700 animate-spin" />
          <p className="text-sm text-gray-500">{t('orders.loading.message', 'Loading…')}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Order not found'}</p>
          <Link href="/orders" className="text-indigo-700 underline text-sm">
            {t('orders.actions.back_to_orders', 'Back to orders')}
          </Link>
        </div>
      </div>
    );
  }

  const isCancelled = order.status.toLowerCase() === 'cancelled';
  if (isCancelled) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            {t('orders.invoice.cancelled_msg', 'No invoice available for cancelled orders.')}
          </p>
          <Link
            href={`/orders/${orderNumber}`}
            className="text-indigo-700 underline text-sm"
          >
            {t('orders.actions.back_to_order', 'Back to order')}
          </Link>
        </div>
      </div>
    );
  }

  // Calculate subtotal from items
  const itemsSubtotal = order.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
  const shippingAmount = order.shipping_amount ?? 0;
  const taxAmount = order.tax_amount ?? 0;
  const totalAmount = order.total_amount;

  return (
    <div
      className={`min-h-screen bg-canvas ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ── Screen-only header with nav + print button ───────────────────── */}
      <div className="print:hidden bg-white border-b border-amber-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/orders/${orderNumber}`}
              className="p-2 hover:bg-amber-50 rounded-xl transition-colors flex-shrink-0"
              aria-label={t('orders.actions.back_to_order', 'Back to order')}
            >
              <ChevronLeft
                className={`w-5 h-5 text-gray-600 ${isRTL ? 'rotate-180' : ''}`}
                strokeWidth={1.5}
              />
            </Link>
            <h1
              className="text-base font-bold text-gray-900 truncate"
              style={playfair}
            >
              {t('orders.invoice.title', 'Invoice')} #{order.order_number}
            </h1>
          </div>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-semibold rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-atlas-md focus:outline-none focus:ring-2 focus:ring-indigo-700/30 flex-shrink-0"
            aria-label={t('orders.invoice.download_print', 'Download / Print invoice')}
          >
            <Printer className="w-4 h-4" strokeWidth={1.5} />
            {t('orders.invoice.download_print', 'Download / Print invoice')}
          </button>
        </div>
      </div>

      {/* ── Invoice document ─────────────────────────────────────────────── */}
      {/* max-w-3xl centers on screen; print:w-full fills the page */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 print:p-0 print:max-w-none">
        <div
          id="invoice-document"
          className="bg-white rounded-2xl ring-1 ring-amber-100 shadow-atlas-sm print:rounded-none print:shadow-none print:ring-0 overflow-hidden"
        >
          {/* ── Brand header ─────────────────────────────────────────────── */}
          <div className="p-8 sm:p-10 border-b border-amber-100 flex items-start justify-between gap-6">
            <div className="flex flex-col gap-1">
              {/* Wordmark — Playfair gives it crafted-brand feel (Atlas) */}
              <span
                className="text-2xl font-extrabold text-indigo-700 tracking-tight leading-none"
                style={playfair}
              >
                beldify
              </span>
              <span className="text-[11px] text-gray-500 tracking-widest uppercase font-medium">
                {t('orders.invoice.brand_tagline', 'Moroccan Craft Marketplace')}
              </span>
              <span className="text-xs text-gray-400 mt-1">
                beldify.com
              </span>
            </div>

            <div className={`text-end ${isRTL ? 'text-start' : 'text-end'}`}>
              <p
                className="text-2xl font-bold text-gray-900 uppercase tracking-wide"
                style={playfair}
              >
                {t('orders.invoice.invoice_label', 'INVOICE')}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                #{order.order_number}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>

          {/* ── Billing / shipping address block ─────────────────────────── */}
          {order.shipping_info && (
            <div className="p-8 sm:p-10 border-b border-amber-100 grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Bill to */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-amber-700 mb-3">
                  {t('orders.invoice.bill_to', 'Bill to')}
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {order.shipping_info.first_name} {order.shipping_info.last_name}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{order.shipping_info.email}</p>
                <p className="text-sm text-gray-500">{order.shipping_info.phone}</p>
              </div>

              {/* Ship to */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-amber-700 mb-3">
                  {t('orders.invoice.ship_to', 'Ship to')}
                </p>
                <address className="not-italic text-sm text-gray-700 leading-relaxed">
                  {order.shipping_info.address}
                  <br />
                  {order.shipping_info.city}, {order.shipping_info.state}{' '}
                  {order.shipping_info.zip_code}
                  <br />
                  {order.shipping_info.country}
                </address>
              </div>
            </div>
          )}

          {/* ── Payment info row ─────────────────────────────────────────── */}
          <div className="px-8 sm:px-10 py-5 border-b border-amber-100 flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {t('orders.invoice.payment_method', 'Payment method')}:
              </span>
              <span className="text-xs font-semibold text-gray-900 capitalize">
                {(order.payment_method || '—').replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {t('orders.invoice.payment_status', 'Payment status')}:
              </span>
              <PaymentStatusBadge status={order.payment_status} />
            </div>
          </div>

          {/* ── Items table ───────────────────────────────────────────────── */}
          <div className="px-8 sm:px-10 py-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-amber-200">
                  <th
                    className="py-3 text-start text-[10px] uppercase tracking-[0.15em] font-semibold text-amber-700"
                    scope="col"
                  >
                    {t('orders.invoice.col_item', 'Item')}
                  </th>
                  <th
                    className="py-3 text-center text-[10px] uppercase tracking-[0.15em] font-semibold text-amber-700 w-16"
                    scope="col"
                  >
                    {t('orders.invoice.col_qty', 'Qty')}
                  </th>
                  <th
                    className="py-3 text-end text-[10px] uppercase tracking-[0.15em] font-semibold text-amber-700 w-28"
                    scope="col"
                  >
                    {t('orders.invoice.col_unit', 'Unit')}
                  </th>
                  <th
                    className="py-3 text-end text-[10px] uppercase tracking-[0.15em] font-semibold text-amber-700 w-28"
                    scope="col"
                  >
                    {t('orders.invoice.col_total', 'Total')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {order.items.map((item, idx) => (
                  <tr key={item.id ?? idx} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-4 pe-4">
                      <p className="font-medium text-gray-900 leading-snug">
                        {item.product_name}
                      </p>
                      {(item.variant?.color || item.variant?.size) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {[item.variant.color, item.variant.size]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                    </td>
                    <td className="py-4 text-center text-gray-700 tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="py-4 text-end text-gray-700 tabular-nums currency-mad">
                      {formatMAD(item.unit_price, i18n.language)}
                    </td>
                    <td className="py-4 text-end font-semibold text-gray-900 tabular-nums currency-mad">
                      {formatMAD(item.unit_price * item.quantity, i18n.language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Totals block ─────────────────────────────────────────────── */}
          <div className="px-8 sm:px-10 pb-8 flex justify-end">
            <div className="w-full sm:w-72 space-y-2">
              {/* Subtotal */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {t('orders.summary.subtotal', 'Subtotal')}
                </span>
                <span className="font-medium text-gray-900 tabular-nums currency-mad">
                  {formatMAD(itemsSubtotal, i18n.language)}
                </span>
              </div>

              {/* Shipping */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {t('orders.summary.shipping', 'Shipping')}
                </span>
                <span className="font-medium text-gray-900 tabular-nums currency-mad">
                  {shippingAmount > 0
                    ? formatMAD(shippingAmount, i18n.language)
                    : t('orders.summary.free', 'Free')}
                </span>
              </div>

              {/* Tax */}
              {taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {t('checkout.summary.tax', 'Tax')}
                  </span>
                  <span className="font-medium text-gray-900 tabular-nums currency-mad">
                    {formatMAD(taxAmount, i18n.language)}
                  </span>
                </div>
              )}

              {/* Separator + Grand total */}
              <div className="pt-3 border-t border-amber-200">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-gray-700">
                    {t('orders.summary.total', 'Total')}
                  </span>
                  <span
                    className="text-xl font-extrabold text-indigo-700 tabular-nums currency-mad"
                    style={playfair}
                  >
                    {formatMAD(totalAmount, i18n.language)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <div className="px-8 sm:px-10 py-6 bg-amber-50/40 border-t border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
            <div>
              <p className="text-xs font-semibold text-indigo-700" style={playfair}>
                beldify.com
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {t(
                  'orders.invoice.footer_tagline',
                  'Thank you for supporting Moroccan craft.'
                )}
              </p>
            </div>
            <p className="text-[10px] text-gray-400">
              {t(
                'orders.invoice.footer_note',
                'This is a computer-generated invoice and does not require a signature.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Global print styles (injected inline) ─────────────────────────── */}
      <style
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              /* Hide everything outside the invoice */
              body * { visibility: hidden; }
              #invoice-document, #invoice-document * { visibility: visible; }
              #invoice-document {
                position: absolute;
                inset: 0;
                margin: 0;
                padding: 1.5cm 2cm;
                width: 100%;
                box-shadow: none !important;
                border-radius: 0 !important;
              }
              /* Force light background on print */
              #invoice-document { background: white !important; }
              /* Remove screen-only shadows */
              * { box-shadow: none !important; }
            }
          `,
        }}
      />
    </div>
  );
}
