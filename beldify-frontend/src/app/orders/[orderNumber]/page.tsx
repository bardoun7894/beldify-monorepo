'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { orderService, Order, OrderItem } from '@/services/orderService';
import toast from '@/utils/toast';
import { useTranslation } from 'react-i18next';
import { OrdersLoadingScreen } from '@/components/ui/LoadingManager';
import PlaceholderImage from '@/components/PlaceholderImage';
import { formatMAD } from '@/components/orders/formatMAD';
import { useParams, useSearchParams } from 'next/navigation';
import { syncUrlLocale } from '@/i18n/config';
import {
  ShoppingBag,
  Truck,
  CheckCircle,
  Clock,
  ChevronLeft,
  MapPin,
  CreditCard,
  FileText,
  MessageSquare,
  XCircle,
  Star,
} from 'lucide-react';
import logger from '@/utils/consoleLogger';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

const TIMELINE_STATUSES = ['order_placed', 'processing', 'shipped', 'delivered'] as const;
type TimelineStatus = typeof TIMELINE_STATUSES[number];

/**
 * Map API status strings to timeline index.
 * The API may return 'pending' (new order) which maps to step 0 (order_placed).
 * 'cancelled' is handled separately with a distinct panel.
 */
function getTimelineIndex(status: string): number {
  const s = status.toLowerCase();
  // pending is the API's synonym for order_placed (step 0)
  if (s === 'pending' || s === 'order_placed') return 0;
  if (s === 'processing') return 1;
  if (s === 'shipped') return 2;
  if (s === 'delivered') return 3;
  return -1; // cancelled or unknown
}

export default function OrderDetailsPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  const params = useParams();
  const searchParams = useSearchParams();
  const isRTL = i18n.language === 'ar';
  const shouldReduceMotion = useReducedMotion();
  const orderNumber = params?.orderNumber as string;

  // Format date based on locale
  const formatDate = (date: string | null | undefined) => {
    if (!date) return '';
    try {
      const lang = i18n.language || 'en';
      const isDarijaOrArabic = lang === 'ar' || lang === 'ma' || lang.startsWith('ar') || lang.startsWith('ma');
      return new Intl.DateTimeFormat(isDarijaOrArabic ? 'ar-MA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(new Date(date));
    } catch (e) {
      return '';
    }
  };

  // Darija overrides for timeline and status labels
  const isMa = (i18n.language || '').toLowerCase().startsWith('ma');
  const darijaTimelineOverrides: Record<string, string> = {
    track_order: 'تتبّع لكوموند',
    order_placed: 'تدار لكوموند',
    processing: 'كتوجد',
    shipped: 'تسيفطات',
    delivered: 'وصلات',
  };
  const tl = (key: string) => {
    const k = (key || '').toLowerCase();
    if (isMa && darijaTimelineOverrides[k]) return darijaTimelineOverrides[k];
    return t(`orders.tracking.${k}`, { defaultValue: t(`orders.status.${k}`) }) as string;
  };
  const statusLabel = (status: string) => {
    const k = (status || '').toLowerCase();
    if (isMa && darijaTimelineOverrides[k]) return darijaTimelineOverrides[k];
    return t(`order.status.${k}`, { defaultValue: t(`orders.status.${k}`) }) as string;
  };

  // Format amount based on locale — shared with the orders list (literal "MAD"
  // suffix, no currency glyph), bidi-isolated by the caller's `.currency-mad`.
  const formatAmount = (amount: number | string) => formatMAD(amount, i18n.language);

  useEffect(() => {
    const locale = searchParams?.get('locale');
    if (locale) {
      i18n.changeLanguage(locale);
    }
    syncUrlLocale();
  }, [searchParams, i18n]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await orderService.getOrderDetails(orderNumber);
        setOrder(response);
      } catch (error: any) {
        logger.error('Error fetching order:', error);
        if (error.message === 'order_not_found') {
          setError('not_found');
        } else {
          setError('error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber]);

  // Timeline icon per step
  const getTimelineIcon = (status: string, size: string = 'w-5 h-5') => {
    const props = { className: size, strokeWidth: 1.5 };
    switch (status) {
      case 'order_placed': return <ShoppingBag {...props} />;
      case 'processing':   return <Clock {...props} />;
      case 'shipped':      return <Truck {...props} />;
      case 'delivered':    return <CheckCircle {...props} />;
      default:             return <Clock {...props} />;
    }
  };

  // Status pill color — Atlas palette
  const getStatusPillColor = (status: string) => {
    const map: Record<string, string> = {
      pending:    'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      processing: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
      shipped:    'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
      delivered:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      cancelled:  'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    };
    return map[status?.toLowerCase()] ?? map.pending;
  };

  if (loading) {
    return (
      <OrdersLoadingScreen
        title={t('orders.loading.title')}
        message={t('orders.loading.message')}
      />
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`min-h-screen bg-amber-50/40 ${isRTL ? 'rtl' : 'ltr'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={shouldReduceMotion ? false : { scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
            className="bg-white rounded-2xl shadow-atlas-lg ring-1 ring-rose-100 p-12 text-center"
          >
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-rose-700" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2" style={playfair}>
              {t('orders.error.title')}
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/orders"
              className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-2xl text-white bg-indigo-700 hover:bg-indigo-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-atlas-md focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
            >
              <ChevronLeft className="w-4 h-4 me-2" strokeWidth={1.5} />
              {t('orders.actions.back_to_orders')}
            </Link>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (!order) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`min-h-screen bg-amber-50/40 ${isRTL ? 'rtl' : 'ltr'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={shouldReduceMotion ? false : { scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
            className="bg-white rounded-2xl shadow-atlas-lg ring-1 ring-amber-100 p-12 text-center"
          >
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-8 h-8 text-amber-700" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2" style={playfair}>
              {t('orders.not_found.title')}
            </h2>
            <p className="text-gray-600 mb-6">{t('orders.not_found.message')}</p>
            <Link
              href="/orders"
              className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-2xl text-white bg-indigo-700 hover:bg-indigo-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-atlas-md focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
            >
              <ChevronLeft className="w-4 h-4 me-2" strokeWidth={1.5} />
              {t('orders.actions.back_to_orders')}
            </Link>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  const currentStatusIndex = getTimelineIndex(order.status);
  const isCancelledOrder = order.status.toLowerCase() === 'cancelled';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
      className={`min-h-screen bg-amber-50/40 ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Solid parchment sticky header (no glassmorphism) */}
      <div className="bg-white border-b border-amber-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/orders"
                className="p-2 hover:bg-amber-50 rounded-xl transition-colors focus:ring-2 focus:ring-indigo-700/30 focus:outline-none flex-shrink-0"
                aria-label={t('orders.actions.back_to_orders')}
              >
                <ChevronLeft className={`w-5 h-5 text-gray-600 ${isRTL ? 'rotate-180' : ''}`} strokeWidth={1.5} />
              </Link>
              <div className="min-w-0">
                <h1
                  className="text-lg font-bold text-gray-900 truncate"
                  style={playfair}
                >
                  {t('orders.list.order_number', { orderNumber: order.order_number, defaultValue: `Order #${order.order_number}` })}
                </h1>
                <p className="text-xs text-gray-500 truncate">
                  {t('orders.placed_on')} {formatDate(order.created_at)}
                </p>
              </div>
            </div>

            {/* Desktop quick actions */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              <button
                className="px-4 py-2 text-sm text-gray-700 bg-amber-50 rounded-2xl ring-1 ring-amber-200 hover:bg-amber-100 transition-all duration-200 flex items-center gap-1.5 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
                aria-label={t('orders.actions.invoice')}
              >
                <FileText className="w-4 h-4" strokeWidth={1.5} />
                {t('orders.actions.invoice')}
              </button>
              <button
                className="px-4 py-2 text-sm text-indigo-700 bg-indigo-50 rounded-2xl ring-1 ring-indigo-200 hover:bg-indigo-100 transition-all duration-200 flex items-center gap-1.5 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
                aria-label={t('orders.actions.support')}
              >
                <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
                {t('orders.actions.support')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Status timeline — or cancelled panel */}
            <motion.div
              initial={shouldReduceMotion ? false : { y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
              className={`bg-white rounded-2xl ring-1 p-6 shadow-atlas-sm ${isCancelledOrder ? 'ring-rose-100' : 'ring-amber-100'}`}
            >
              <h2
                className="text-lg font-semibold text-gray-900 mb-6"
                style={playfair}
              >
                {t('orders.tracking.title')}
              </h2>

              {/* Cancelled state — distinct rose panel, no broken tracker */}
              {isCancelledOrder ? (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-rose-50 ring-1 ring-rose-100">
                  <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-6 h-6 text-rose-700" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-semibold text-rose-700 text-sm">
                      {t('orders.status.cancelled', 'Order Cancelled')}
                    </p>
                    <p className="text-xs text-rose-600/70 mt-0.5">
                      {t('orders.tracking.cancelled_message', 'This order was cancelled. Please contact support if you have questions.')}
                    </p>
                  </div>
                </div>
              ) : (
                <>
              {/* Mobile: vertical timeline */}
              <div className="md:hidden space-y-0">
                {TIMELINE_STATUSES.map((status, index) => {
                  const isCompleted = currentStatusIndex >= index;
                  const isCurrent = currentStatusIndex === index;
                  const isLast = index === TIMELINE_STATUSES.length - 1;

                  return (
                    <div key={status} className="flex gap-4">
                      {/* Track */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div
                          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isCompleted
                              ? 'bg-indigo-700 border-indigo-700 text-white'
                              : 'bg-white border-amber-200 text-gray-400'
                          }`}
                        >
                          {getTimelineIcon(status)}
                        </div>
                        {!isLast && (
                          <div
                            className={`w-0.5 flex-1 min-h-[2rem] transition-colors ${
                              isCompleted && currentStatusIndex > index
                                ? 'bg-indigo-700'
                                : 'bg-amber-100'
                            }`}
                          />
                        )}
                      </div>

                      {/* Label */}
                      <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
                        <p className={`text-sm font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                          {tl(status)}
                        </p>
                        {index === 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
                        )}
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full ring-1 ring-indigo-200">
                            {t('orders.tracking.current_status')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: horizontal timeline */}
              <div className="hidden md:block">
                <div className="flex items-start">
                  {TIMELINE_STATUSES.map((status, index) => {
                    const isCompleted = currentStatusIndex >= index;
                    const isCurrent = currentStatusIndex === index;
                    const isLast = index === TIMELINE_STATUSES.length - 1;

                    return (
                      <div key={status} className="flex flex-col items-center flex-1 relative">
                        {/* Connecting line before this step */}
                        {index > 0 && (
                          <div
                            className={`absolute top-6 end-1/2 w-full h-0.5 -z-10 transition-colors ${
                              isCompleted ? 'bg-indigo-700' : 'bg-amber-100'
                            }`}
                          />
                        )}

                        {/* Step circle — the active step is larger + ring-accented so
                            the current state reads at a glance */}
                        <div
                          className={`rounded-full border-2 flex items-center justify-center z-10 transition-all duration-200 ${
                            isCurrent
                              ? 'w-14 h-14 bg-indigo-700 border-indigo-700 text-white shadow-atlas-md ring-4 ring-indigo-100'
                              : isCompleted
                                ? 'w-12 h-12 bg-indigo-700 border-indigo-700 text-white shadow-atlas-sm'
                                : 'w-12 h-12 bg-white border-amber-200 text-gray-400'
                          }`}
                        >
                          {getTimelineIcon(status, isCurrent ? 'w-6 h-6' : 'w-5 h-5')}
                        </div>

                        {/* Label block */}
                        <div className="text-center mt-3 px-1">
                          <p
                            className={`text-sm ${
                              isCurrent
                                ? 'font-bold text-indigo-700'
                                : isCompleted
                                  ? 'font-semibold text-gray-900'
                                  : 'font-medium text-gray-400'
                            }`}
                          >
                            {tl(status)}
                          </p>
                          {index === 0 && (
                            <p className="text-xs text-gray-500 mt-0.5 leading-tight">
                              {formatDate(order.created_at)}
                            </p>
                          )}
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full ring-1 ring-indigo-200">
                              {t('orders.tracking.current')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tracking metadata */}
              {!isCancelledOrder && (order.tracking_number || order.estimated_delivery) && (
                <div className="mt-6 pt-5 border-t border-amber-100 space-y-3">
                  {order.tracking_number && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{t('orders.tracking.number')}</span>
                      <span className="text-sm font-mono font-semibold text-gray-900 bg-amber-50 px-2 py-0.5 rounded-lg">
                        {order.tracking_number}
                      </span>
                    </div>
                  )}
                  {order.estimated_delivery && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{t('orders.tracking.estimated_delivery')}</span>
                      <span className="text-sm font-medium text-gray-900">{formatDate(order.estimated_delivery)}</span>
                    </div>
                  )}
                </div>
              )}
              </>
              )}
            </motion.div>

            {/* Order items */}
            <motion.div
              initial={shouldReduceMotion ? false : { y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.33, 1, 0.68, 1] }}
              className="bg-white rounded-2xl ring-1 ring-amber-100 overflow-hidden shadow-atlas-sm"
            >
              <div className="p-5 sm:p-6 border-b border-amber-100">
                <h2
                  className="text-lg font-semibold text-gray-900"
                  style={playfair}
                >
                  {t('orders.items.title')} ({order.items.length})
                </h2>
              </div>

              <div className="divide-y divide-amber-100">
                {order.items.map((item) => (
                  <div key={item.id} className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-amber-50/50 flex-shrink-0 shadow-atlas-sm">
                        <Image
                          src={item.primary_image || item.product_image || '/images/placeholder-product.jpg'}
                          alt={item.product_name || 'Unknown Product'}
                          fill
                          sizes="80px"
                          className="object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/placeholder-product.jpg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 leading-snug">
                          {item.product_name || 'Unknown Product'}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {item.variant?.color && (
                            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg">
                              {t('orders.items.color')}: {item.variant.color}
                            </span>
                          )}
                          {item.variant?.size && (
                            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg">
                              {t('orders.items.size')}: {item.variant.size}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {t('orders.items.quantity', { count: item.quantity })}
                          </span>
                          <span className="text-sm font-bold text-indigo-700 currency-mad">
                            {formatAmount(item.unit_price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order totals */}
              <div className="p-5 sm:p-6 bg-amber-50/30 border-t border-amber-100">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('orders.summary.subtotal')}</span>
                    <span className="font-medium text-gray-900 currency-mad">{formatAmount(order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('orders.summary.shipping')}</span>
                    <span className="font-medium text-emerald-700">{t('orders.summary.free')}</span>
                  </div>
                  <div className="pt-3 border-t border-amber-100">
                    <div className="flex justify-between">
                      <span className="text-base font-semibold text-gray-900">{t('orders.summary.total')}</span>
                      <span
                        className="text-xl font-bold text-indigo-700 currency-mad"
                        style={playfair}
                      >
                        {formatAmount(order.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Mobile actions — above the fold, no colliding fixed bar */}
            <motion.div
              initial={shouldReduceMotion ? false : { y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0.33, 1, 0.68, 1] }}
              className="md:hidden grid grid-cols-2 gap-3"
            >
              <button
                className="px-4 py-3 bg-amber-50 text-gray-700 text-sm font-medium rounded-2xl ring-1 ring-amber-200 hover:bg-amber-100 transition-all duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
                aria-label={t('orders.actions.invoice')}
              >
                <FileText className="w-4 h-4" strokeWidth={1.5} />
                {t('orders.actions.invoice')}
              </button>
              <button
                className="px-4 py-3 bg-indigo-700 text-white text-sm font-medium rounded-2xl hover:bg-indigo-800 transition-all duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
                aria-label={t('orders.actions.support')}
              >
                <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
                {t('orders.actions.support')}
              </button>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">

            {/* Shipping address */}
            {order.shipping_info && (
              <motion.div
                initial={shouldReduceMotion ? false : { y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1, ease: [0.33, 1, 0.68, 1] }}
                className="bg-white rounded-2xl ring-1 ring-amber-100 p-5 sm:p-6 shadow-atlas-sm"
              >
                <h3
                  className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"
                  style={playfair}
                >
                  <MapPin className="w-4 h-4 text-indigo-700 flex-shrink-0" strokeWidth={1.5} />
                  {t('orders.shipping.title')}
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      {t('orders.shipping.contact')}
                    </p>
                    <p className="font-medium text-gray-900">
                      {order.shipping_info.first_name} {order.shipping_info.last_name}
                    </p>
                    <p className="text-gray-500">{order.shipping_info.email}</p>
                    <p className="text-gray-500">{order.shipping_info.phone}</p>
                  </div>
                  <div className="pt-2 border-t border-amber-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      {t('orders.shipping.address')}
                    </p>
                    <address className="not-italic text-gray-900 leading-relaxed">
                      {order.shipping_info.address}<br />
                      {order.shipping_info.city}, {order.shipping_info.state} {order.shipping_info.zip_code}<br />
                      {order.shipping_info.country}
                    </address>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Order summary card */}
            <motion.div
              initial={shouldReduceMotion ? false : { y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0.33, 1, 0.68, 1] }}
              className="bg-white rounded-2xl ring-1 ring-amber-100 p-5 sm:p-6 shadow-atlas-sm lg:sticky lg:top-24"
            >
              <h3
                className="text-base font-semibold text-gray-900 mb-4"
                style={playfair}
              >
                {t('orders.summary.title')}
              </h3>

              {/* Status badge */}
              <div className="mb-5">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusPillColor(order.status)}`}>
                  {getTimelineIcon(order.status.toLowerCase() === 'delivered' ? 'delivered' : order.status.toLowerCase(), 'w-4 h-4')}
                  {statusLabel(order.status)}
                </span>
              </div>

              <div className="space-y-0 divide-y divide-amber-100">
                <div className="flex justify-between py-3 text-sm">
                  <span className="text-gray-500">{t('orders.summary.order_number')}</span>
                  <span className="font-semibold text-gray-900">#{order.order_number}</span>
                </div>

                <div className="flex justify-between py-3 text-sm">
                  <span className="text-gray-500">{t('orders.summary.order_date')}</span>
                  <span className="font-medium text-gray-900 text-end">{formatDate(order.created_at)}</span>
                </div>

                <div className="flex justify-between py-3 text-sm">
                  <span className="text-gray-500">{t('orders.summary.items')}</span>
                  <span className="font-semibold text-gray-900">{order.items?.length || 0}</span>
                </div>

                <div className="flex justify-between py-3 text-sm">
                  <span className="text-gray-500">{t('orders.summary.payment_status')}</span>
                  <span className="font-semibold text-gray-900">
                    {t(`orders.payment_status.${order.payment_status.toLowerCase()}`)}
                  </span>
                </div>

                <div className="flex justify-between pt-4 pb-1">
                  <span className="text-sm font-semibold text-gray-700">{t('orders.summary.total_amount')}</span>
                  <span
                    className="text-xl font-bold text-indigo-700 currency-mad"
                    style={playfair}
                  >
                    {formatAmount(order.total_amount)}
                  </span>
                </div>
              </div>

              {/* Action buttons — desktop only (mobile shows its own in-flow grid above) */}
              <div className="mt-5 space-y-2.5 hidden md:block">
                <button
                  className="w-full px-4 py-2.5 bg-indigo-700 text-white text-sm font-medium rounded-2xl hover:bg-indigo-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-atlas-md flex items-center justify-center gap-2 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
                  aria-label={t('orders.actions.download_invoice')}
                >
                  <FileText className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                  {t('orders.actions.download_invoice')}
                </button>
                <button
                  className="w-full px-4 py-2.5 bg-amber-50 text-gray-700 text-sm font-medium rounded-2xl ring-1 ring-amber-200 hover:bg-amber-100 transition-all duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
                  aria-label={t('orders.actions.contact_support')}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                  {t('orders.actions.contact_support')}
                </button>
                {order.status === 'delivered' && (
                  <button
                    className="w-full px-4 py-2.5 border border-indigo-200 text-indigo-700 text-sm font-medium rounded-2xl hover:bg-indigo-50 transition-all duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
                    aria-label={t('orders.actions.write_review')}
                  >
                    <Star className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                    {t('orders.actions.write_review')}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
