'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { orderService, Order, OrderItem } from '@/services/orderService';
import { returnService, ReturnRequest } from '@/services/returnService';
import { reviewService } from '@/services/api';
import toast from '@/utils/toast';
import { useTranslation } from 'react-i18next';
import { OrdersLoadingScreen } from '@/components/ui/LoadingManager';
import PlaceholderImage from '@/components/PlaceholderImage';
import { formatMAD } from '@/components/orders/formatMAD';
import { useParams, useSearchParams } from 'next/navigation';
import { syncUrlLocale, intlLocale } from '@/i18n/config';
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
  RefreshCw,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import logger from '@/utils/consoleLogger';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

const SUPPORT_PHONE    = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+212708150351';
const SUPPORT_WHATSAPP = SUPPORT_PHONE.replace(/[^0-9]/g, '');

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
  const [reordering, setReordering] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnDetails, setReturnDetails] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState('');
  // ── Review state ──────────────────────────────────────────────────────────
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [reviewStatusLoading, setReviewStatusLoading] = useState(false);
  const [reviewableItems, setReviewableItems] = useState<Array<{
    order_item_id: number;
    stock_id: number;
    name: string;
    reviewed: boolean;
    review_id: number | null;
  }>>([]);
  const [reviewRatings, setReviewRatings] = useState<Record<number, number>>({});
  const [reviewComments, setReviewComments] = useState<Record<number, string>>({});
  const [reviewHover, setReviewHover] = useState<Record<number, number>>({});
  const [submittingReview, setSubmittingReview] = useState(false);
  const { t, i18n } = useTranslation();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';
  const shouldReduceMotion = useReducedMotion();
  const orderNumber = params?.orderNumber as string;

  // Handle "Buy it again" — re-adds this order's items to cart at current prices.
  // Second-person, calm copy. No "!", no urgency, no shame (hooked §1 ethics).
  const handleReorder = async () => {
    if (reordering || !orderNumber) return;
    setReordering(true);
    try {
      const result = await orderService.reorder(orderNumber);
      if (result.items_skipped > 0 && result.items_added === 0) {
        toast.error(t('orders.reorder.all_skipped', 'Items are out of stock and could not be added.'));
        return;
      }
      const skippedNote =
        result.items_skipped > 0
          ? (i18n.language === 'ar' || i18n.language === 'ma')
            ? ` (${result.items_skipped} منتج غير متوفر)`
            : ` (${result.items_skipped} item${result.items_skipped > 1 ? 's' : ''} out of stock)`
          : '';
      toast.success(t('orders.reorder.added', 'Added to your cart') + skippedNote);
      router.push('/cart');
    } catch (err) {
      logger.error('Reorder error:', err);
      toast.error(t('orders.reorder.error', 'Something went wrong. Please try again.'));
    } finally {
      setReordering(false);
    }
  };

  // Cancel order handler
  const handleCancel = async () => {
    if (cancelling || !orderNumber) return;
    setCancelling(true);
    try {
      const result = await (orderService as any).cancel(orderNumber, cancelReason || undefined);
      // Update order state locally — no full reload needed
      setOrder((prev) => (prev ? { ...prev, status: result.order.status ?? 'cancelled' } : prev));
      setShowCancelDialog(false);
      setCancelReason('');
      // Bust the cache entry so the orders list also picks up the new status
      orderService.resetCache(`order:${orderNumber}`);
      toast.success(
        (i18n.language === 'ar' || i18n.language === 'ma') ? 'تم إلغاء الطلب' : 'Order cancelled'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      toast.error(msg || ((i18n.language === 'ar' || i18n.language === 'ma') ? 'تعذّر الإلغاء' : 'Could not cancel this order'));
    } finally {
      setCancelling(false);
    }
  };

  // Return-request submit handler
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingReturn) return;
    if (!returnReason) {
      setReturnError(
        (i18n.language === 'ar' || i18n.language === 'ma') ? 'يرجى اختيار سبب' : 'Please select a reason'
      );
      return;
    }
    setSubmittingReturn(true);
    setReturnError('');
    try {
      const result = await returnService.create(orderNumber, {
        reason: returnReason,
        details: returnDetails.trim() || undefined,
      });
      setReturnRequest(result.data.return_request);
      setShowReturnModal(false);
      setReturnReason('');
      setReturnDetails('');
      toast.success(
        (i18n.language === 'ar' || i18n.language === 'ma') ? 'تم إرسال طلب الإرجاع' : 'Return request submitted'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setReturnError(
        msg || ((i18n.language === 'ar' || i18n.language === 'ma') ? 'تعذّر إرسال الطلب' : 'Could not submit return request')
      );
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Format date based on locale
  const formatDate = (date: string | null | undefined) => {
    if (!date) return '';
    try {
      return new Intl.DateTimeFormat(intlLocale(i18n.language || 'fr'), {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(new Date(date));
    } catch {
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
        // If the order is delivered, check for an existing return request
        if (response.status === 'delivered') {
          returnService.get(orderNumber).then(setReturnRequest).catch(() => {});
        }
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

  // Fetch review status once for delivered/completed orders
  useEffect(() => {
    if (!order || !orderNumber) return;
    const s = order.status.toLowerCase();
    if (s !== 'delivered' && s !== 'completed') return;
    setReviewStatusLoading(true);
    reviewService.getOrderReviewStatus(orderNumber)
      .then((data) => {
        if (data?.items) setReviewableItems(data.items);
      })
      .catch(() => {
        // Non-fatal — review status is a progressive enhancement
      })
      .finally(() => setReviewStatusLoading(false));
  }, [order, orderNumber]);

  // ── Review submit handler ──────────────────────────────────────────────────
  const handleReviewSubmit = async () => {
    if (submittingReview) return;
    const unreviewedItems = reviewableItems.filter((it) => !it.reviewed);
    const items = unreviewedItems
      .map((it) => ({
        order_item_id: it.order_item_id,
        rating: reviewRatings[it.order_item_id] ?? 0,
        comment: reviewComments[it.order_item_id]?.trim() || undefined,
      }))
      .filter((it) => it.rating > 0);

    if (items.length === 0) return;
    setSubmittingReview(true);
    try {
      await reviewService.submitOrderReview(orderNumber, items);
      toast.success(t('orders.review.moderation', 'Thanks — your review awaits moderation'));
      // Refresh review status after submit
      reviewService.getOrderReviewStatus(orderNumber)
        .then((data) => { if (data?.items) setReviewableItems(data.items); })
        .catch(() => {});
      setShowReviewPanel(false);
      setReviewRatings({});
      setReviewComments({});
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        toast.error(t('orders.review.error_duplicate', 'You have already reviewed this item.'));
      } else if (status === 422) {
        const msg = err?.response?.data?.message || t('orders.review.error_generic', 'Could not submit review. Please try again.');
        toast.error(msg);
      } else {
        toast.error(t('orders.review.error_generic', 'Could not submit review. Please try again.'));
      }
    } finally {
      setSubmittingReview(false);
    }
  };

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
        className={`min-h-screen bg-canvas ${isRTL ? 'rtl' : 'ltr'}`}
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
        className={`min-h-screen bg-canvas ${isRTL ? 'rtl' : 'ltr'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={shouldReduceMotion ? false : { scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
            className="bg-white rounded-2xl shadow-atlas-lg ring-1 ring-gray-100 p-12 text-center"
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
  const orderStatus = order.status.toLowerCase();
  const isCancellable = orderStatus === 'pending' || orderStatus === 'processing';
  const isDelivered = orderStatus === 'delivered' || orderStatus === 'completed';
  const hasUnreviewedItems = reviewableItems.some((it) => !it.reviewed);
  const allItemsReviewed = reviewableItems.length > 0 && reviewableItems.every((it) => it.reviewed);

  // 14-day return window check — only applies when order date is available
  const isWithin14Days = (() => {
    if (!order.created_at) return true; // no date → be permissive, backend validates
    try {
      const daysSince = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 14;
    } catch {
      return true;
    }
  })();
  const canRequestReturn = isDelivered && isWithin14Days && !returnRequest;
  const hasReturnRequest = isDelivered && !!returnRequest;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
      className={`min-h-screen bg-canvas ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Solid parchment sticky header (no glassmorphism) */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
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
              {!isCancelledOrder && (
                <Link
                  href={`/orders/${orderNumber}/invoice`}
                  className="px-4 py-2 text-sm text-gray-700 bg-amber-50 rounded-2xl ring-1 ring-amber-200 hover:bg-amber-100 transition-all duration-200 flex items-center gap-1.5 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
                  aria-label={t('orders.actions.invoice', 'Download / Print invoice')}
                >
                  <FileText className="w-4 h-4" strokeWidth={1.5} />
                  {t('orders.actions.invoice', 'Invoice')}
                </Link>
              )}
              <button
                onClick={() => window.open(`https://wa.me/${SUPPORT_WHATSAPP}`, '_blank', 'noopener,noreferrer')}
                className="px-4 py-2 text-sm text-indigo-700 bg-indigo-50 rounded-2xl ring-1 ring-indigo-200 hover:bg-indigo-100 transition-all duration-200 flex items-center gap-1.5 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
                aria-label={t('orders.actions.support', 'Contact support via WhatsApp')}
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
              className={`bg-white rounded-2xl ring-1 p-6 shadow-atlas-sm ${isCancelledOrder ? 'ring-rose-100' : 'ring-gray-100'}`}
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
                              : 'bg-white border-gray-200 text-gray-400'
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
                                : 'w-12 h-12 bg-white border-gray-200 text-gray-400'
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
                <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
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
              className="bg-white rounded-2xl ring-1 ring-gray-100 overflow-hidden shadow-atlas-sm"
            >
              <div className="p-5 sm:p-6 border-b border-gray-100">
                <h2
                  className="text-lg font-semibold text-gray-900"
                  style={playfair}
                >
                  {t('orders.items.title')} ({order.items.length})
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <div key={item.id} className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 shadow-atlas-sm">
                        <Image
                          src={item.primary_image || item.product_image || '/images/placeholder-product.svg'}
                          alt={item.product_name || t('orders.items.unknown_product')}
                          fill
                          sizes="80px"
                          className="object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/placeholder-product.svg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 leading-snug">
                          {item.product_name || t('orders.items.unknown_product')}
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
              <div className="p-5 sm:p-6 bg-gray-50 border-t border-gray-100">
                <div className="space-y-2">
                  {/* Subtotal = sum of (unit_price × quantity) for each line item */}
                  {(() => {
                    const itemsSubtotal = order.items.reduce(
                      (sum, item) => sum + (Number(item.unit_price) || 0) * (item.quantity || 1),
                      0
                    );
                    const shippingAmount = Number(order.shipping_amount) || 0;
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">{t('orders.summary.subtotal')}</span>
                          <span className="font-medium text-gray-900 currency-mad">{formatAmount(itemsSubtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">{t('orders.summary.shipping')}</span>
                          <span className="font-medium text-emerald-700">
                            {shippingAmount === 0
                              ? t('orders.summary.free', 'Free')
                              : <span className="currency-mad">{formatAmount(shippingAmount)}</span>}
                          </span>
                        </div>
                        <div className="pt-3 border-t border-gray-100">
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
                      </>
                    );
                  })()}
                </div>
              </div>
            </motion.div>

            {/* Mobile actions — above the fold, no colliding fixed bar */}
            <motion.div
              initial={shouldReduceMotion ? false : { y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0.33, 1, 0.68, 1] }}
              className="md:hidden space-y-3"
            >
              {/* "Buy it again" — full-width on mobile for easy thumb reach.
                  Second-person, calm copy. No "!", no urgency (hooked §1 ethics). */}
              <button
                type="button"
                onClick={handleReorder}
                disabled={reordering}
                className="w-full px-4 py-3 border border-indigo-200 text-indigo-700 text-sm font-medium rounded-2xl hover:bg-indigo-50 transition-all duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t('orders.actions.buy_again')}
              >
                <RefreshCw
                  className={`w-4 h-4 ${reordering ? 'animate-spin' : ''}`}
                  strokeWidth={1.5}
                />
                {t('orders.actions.buy_again')}
              </button>
              <div className="grid grid-cols-2 gap-3">
                {!isCancelledOrder ? (
                  <Link
                    href={`/orders/${orderNumber}/invoice`}
                    className="px-4 py-3 bg-amber-50 text-gray-700 text-sm font-medium rounded-2xl ring-1 ring-amber-200 hover:bg-amber-100 transition-all duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
                    aria-label={t('orders.actions.invoice', 'Download / Print invoice')}
                  >
                    <FileText className="w-4 h-4" strokeWidth={1.5} />
                    {t('orders.actions.invoice', 'Invoice')}
                  </Link>
                ) : (
                  <span className="px-4 py-3 bg-gray-50 text-gray-400 text-sm font-medium rounded-2xl ring-1 ring-gray-200 flex items-center justify-center gap-2 cursor-not-allowed">
                    <FileText className="w-4 h-4" strokeWidth={1.5} />
                    {t('orders.actions.invoice', 'Invoice')}
                  </span>
                )}
                <button
                  onClick={() => window.open(`https://wa.me/${SUPPORT_WHATSAPP}`, '_blank', 'noopener,noreferrer')}
                  className="px-4 py-3 bg-indigo-700 text-white text-sm font-medium rounded-2xl hover:bg-indigo-800 transition-all duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
                  aria-label={t('orders.actions.support', 'Contact support via WhatsApp')}
                >
                  <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
                  {t('orders.actions.support')}
                </button>
              </div>

              {/* Mobile: Write a review / Review submitted chip */}
              {isDelivered && !reviewStatusLoading && hasUnreviewedItems && (
                <button
                  type="button"
                  onClick={() => setShowReviewPanel(true)}
                  className="w-full px-4 py-3 bg-amber-50 text-amber-800 text-sm font-medium rounded-2xl ring-1 ring-amber-200 hover:bg-amber-100 transition-all duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-amber-600/30 focus:outline-none"
                  aria-label={t('orders.review.write_review', 'Write a review')}
                >
                  <Star className="w-4 h-4" strokeWidth={1.5} />
                  {t('orders.review.write_review', 'Write a review')}
                </button>
              )}
              {isDelivered && !reviewStatusLoading && allItemsReviewed && (
                <div className="w-full px-4 py-3 rounded-2xl ring-1 ring-emerald-200 bg-emerald-50 flex items-center gap-2 text-sm text-emerald-800">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" strokeWidth={1.5} />
                  {t('orders.review.submitted', 'Review submitted')}
                </div>
              )}

              {/* Mobile: Return + Cancel */}
              {canRequestReturn && (
                <button
                  type="button"
                  onClick={() => setShowReturnModal(true)}
                  className="w-full px-4 py-3 border border-rose-200 text-rose-700 text-sm font-medium rounded-2xl hover:bg-rose-50 transition-all duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-rose-700/30 focus:outline-none"
                  aria-label={t('orders.actions.request_return', 'Request return')}
                >
                  <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
                  {t('orders.actions.request_return', 'Request return')}
                </button>
              )}
              {hasReturnRequest && returnRequest && (
                <div className="w-full px-4 py-3 rounded-2xl ring-1 ring-amber-200 bg-amber-50 flex items-center gap-2 text-sm text-amber-800">
                  <RotateCcw className="w-4 h-4 flex-shrink-0 text-amber-600" strokeWidth={1.5} />
                  <span className="font-medium">{t('orders.actions.return_request', 'Return')}:</span>
                  <span className="capitalize">{t(`returns.status.${returnRequest.status}`, returnRequest.status)}</span>
                </div>
              )}
              {isCancellable && !isCancelledOrder && (
                <button
                  type="button"
                  onClick={() => setShowCancelDialog(true)}
                  className="w-full px-4 py-3 border border-rose-200 text-rose-700 text-sm font-medium rounded-2xl hover:bg-rose-50 transition-all duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-rose-700/30 focus:outline-none"
                  aria-label={t('orders.actions.cancel_order', 'Cancel order')}
                >
                  <XCircle className="w-4 h-4" strokeWidth={1.5} />
                  {t('orders.actions.cancel_order', 'Cancel order')}
                </button>
              )}
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
                className="bg-white rounded-2xl ring-1 ring-gray-100 p-5 sm:p-6 shadow-atlas-sm"
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
                  <div className="pt-2 border-t border-gray-100">
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
              className="bg-white rounded-2xl ring-1 ring-gray-100 p-5 sm:p-6 shadow-atlas-sm lg:sticky lg:top-24"
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

              <div className="space-y-0 divide-y divide-gray-100">
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

              {/* Action buttons — desktop only (mobile shows its own in-flow section above) */}
              <div className="mt-5 space-y-2.5 hidden md:block">
                {/* "Buy it again" — top of desktop actions, calm second-person copy.
                    No "!", no urgency (hooked §1 ethics). */}
                <button
                  type="button"
                  onClick={handleReorder}
                  disabled={reordering}
                  className="w-full px-4 py-2.5 border border-indigo-200 text-indigo-700 text-sm font-medium rounded-2xl hover:bg-indigo-50 transition-all duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={t('orders.actions.buy_again')}
                >
                  <RefreshCw
                    className={`w-4 h-4 flex-shrink-0 ${reordering ? 'animate-spin' : ''}`}
                    strokeWidth={1.5}
                  />
                  {t('orders.actions.buy_again')}
                </button>
                {!isCancelledOrder && (
                  <Link
                    href={`/orders/${orderNumber}/invoice`}
                    className="w-full px-4 py-2.5 bg-indigo-700 text-white text-sm font-medium rounded-2xl hover:bg-indigo-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-atlas-md flex items-center justify-center gap-2 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
                    aria-label={t('orders.actions.download_invoice', 'Download / Print invoice')}
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                    {t('orders.actions.download_invoice', 'Download / Print invoice')}
                  </Link>
                )}
                <button
                  onClick={() => window.open(`https://wa.me/${SUPPORT_WHATSAPP}`, '_blank', 'noopener,noreferrer')}
                  className="w-full px-4 py-2.5 bg-amber-50 text-gray-700 text-sm font-medium rounded-2xl ring-1 ring-amber-200 hover:bg-amber-100 transition-all duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
                  aria-label={t('orders.actions.contact_support', 'Contact support via WhatsApp')}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                  {t('orders.actions.contact_support')}
                </button>
                {/* Write a review — gated by review-status endpoint (delivered only) */}
                {isDelivered && !reviewStatusLoading && hasUnreviewedItems && (
                  <button
                    type="button"
                    onClick={() => setShowReviewPanel(true)}
                    className="w-full px-4 py-2.5 bg-amber-50 text-amber-800 text-sm font-medium rounded-2xl ring-1 ring-amber-200 hover:bg-amber-100 transition-all duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-amber-600/30 focus:outline-none"
                    aria-label={t('orders.review.write_review', 'Write a review')}
                  >
                    <Star className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                    {t('orders.review.write_review', 'Write a review')}
                  </button>
                )}
                {isDelivered && !reviewStatusLoading && allItemsReviewed && (
                  <div className="w-full px-4 py-2.5 rounded-2xl ring-1 ring-emerald-200 bg-emerald-50 flex items-center gap-2 text-sm text-emerald-800">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" strokeWidth={1.5} />
                    {t('orders.review.submitted', 'Review submitted')}
                  </div>
                )}

                {/* Return request button — only for delivered orders within 14d */}
                {canRequestReturn && (
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(true)}
                    className="w-full px-4 py-2.5 bg-rose-50 text-rose-700 text-sm font-medium rounded-2xl ring-1 ring-rose-100 hover:bg-rose-100 transition-all duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-rose-700/30 focus:outline-none"
                    aria-label={t('orders.actions.request_return', 'Request return')}
                  >
                    <RotateCcw className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                    {t('orders.actions.request_return', 'Request return')}
                  </button>
                )}

                {/* Return request status badge */}
                {hasReturnRequest && returnRequest && (
                  <div className="w-full px-4 py-2.5 rounded-2xl ring-1 ring-amber-200 bg-amber-50 flex items-center gap-2 text-sm text-amber-800">
                    <RotateCcw className="w-4 h-4 flex-shrink-0 text-amber-600" strokeWidth={1.5} />
                    <span className="font-medium">
                      {t('orders.actions.return_request', 'Return request')}:
                    </span>
                    <span className="capitalize">{t(`returns.status.${returnRequest.status}`, returnRequest.status)}</span>
                  </div>
                )}

                {/* Cancel button — only for pending/processing orders */}
                {isCancellable && !isCancelledOrder && (
                  <button
                    type="button"
                    onClick={() => setShowCancelDialog(true)}
                    className="w-full px-4 py-2.5 bg-rose-50 text-rose-700 text-sm font-medium rounded-2xl ring-1 ring-rose-100 hover:bg-rose-100 transition-all duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-rose-700/30 focus:outline-none"
                    aria-label={t('orders.actions.cancel_order', 'Cancel order')}
                  >
                    <XCircle className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                    {t('orders.actions.cancel_order', 'Cancel order')}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Cancel Confirm Dialog ─────────────────────────────────────────────── */}
      {showCancelDialog && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
            className="bg-white rounded-2xl w-full max-w-sm shadow-atlas-lg ring-1 ring-rose-100 p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" strokeWidth={1.5} />
              </div>
              <div>
                <h3 id="cancel-dialog-title" className="text-base font-semibold text-gray-900" style={playfair}>
                  {t('orders.cancel.title', 'Cancel this order?')}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {t('orders.cancel.desc', 'This cannot be undone. You can place a new order anytime.')}
                </p>
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('orders.cancel.reason_label', 'Reason (optional)')}
              </label>
              <textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder={t('orders.cancel.reason_placeholder', 'Let us know why you are cancelling…')}
                className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/20 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowCancelDialog(false); setCancelReason(''); }}
                className="flex-1 py-2.5 rounded-2xl border border-amber-200 text-gray-700 text-sm font-medium hover:bg-amber-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
              >
                {t('common.go_back', 'Go back')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-busy={cancelling}
              >
                {cancelling && (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin flex-shrink-0" />
                )}
                {cancelling
                  ? t('orders.cancel.cancelling', 'Cancelling…')
                  : t('orders.cancel.confirm', 'Cancel order')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Review Panel ─────────────────────────────────────────────────────── */}
      {showReviewPanel && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-panel-title"
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
            className="bg-white rounded-2xl w-full max-w-md shadow-atlas-lg ring-1 ring-amber-100 p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  id="review-panel-title"
                  className="text-base font-semibold text-gray-900"
                  style={playfair}
                >
                  {t('orders.review.panel_title', 'Review your order')}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {t('orders.review.moderation', 'Thanks — your review awaits moderation')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewPanel(false)}
                className="p-1 rounded-xl hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 flex-shrink-0"
                aria-label={t('common.close', 'Close')}
              >
                <XCircle className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-5">
              {reviewableItems
                .filter((it) => !it.reviewed)
                .map((item) => (
                  <div
                    key={item.order_item_id}
                    className="rounded-2xl ring-1 ring-gray-100 p-4 space-y-3"
                  >
                    <p className="text-sm font-semibold text-gray-900 leading-snug">
                      {item.name}
                    </p>
                    {/* 5-star picker — amber stars, 44px targets */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1.5">
                        {t('orders.review.star_label', 'Rate this item')}
                        <span className="text-rose-500 ms-0.5">*</span>
                      </p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const active = (reviewHover[item.order_item_id] || reviewRatings[item.order_item_id] || 0) >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onMouseEnter={() => setReviewHover((prev) => ({ ...prev, [item.order_item_id]: star }))}
                              onMouseLeave={() => setReviewHover((prev) => ({ ...prev, [item.order_item_id]: 0 }))}
                              onClick={() => setReviewRatings((prev) => ({ ...prev, [item.order_item_id]: star }))}
                              className="w-11 h-11 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 rounded-lg transition-transform hover:scale-110"
                              aria-label={`${star} ${t('reviews.form.your_rating', 'star')}`}
                            >
                              <Star
                                className={`w-7 h-7 transition-colors ${active ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                                strokeWidth={1.5}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Optional comment */}
                    <div>
                      <label
                        htmlFor={`review-comment-${item.order_item_id}`}
                        className="block text-xs font-medium text-gray-500 mb-1"
                      >
                        {t('orders.review.optional_comment', 'Comment (optional)')}
                      </label>
                      <textarea
                        id={`review-comment-${item.order_item_id}`}
                        value={reviewComments[item.order_item_id] ?? ''}
                        onChange={(e) =>
                          setReviewComments((prev) => ({
                            ...prev,
                            [item.order_item_id]: e.target.value,
                          }))
                        }
                        rows={2}
                        maxLength={500}
                        placeholder={t('orders.review.comment_placeholder', 'Share your experience with this product…')}
                        className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/20 resize-none"
                      />
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setShowReviewPanel(false); }}
                className="flex-1 py-2.5 rounded-2xl border border-amber-200 text-gray-700 text-sm font-medium hover:bg-amber-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                disabled={
                  submittingReview ||
                  reviewableItems.filter((it) => !it.reviewed).every(
                    (it) => !reviewRatings[it.order_item_id]
                  )
                }
                className="flex-1 py-2.5 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-busy={submittingReview}
              >
                {submittingReview && (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin flex-shrink-0" />
                )}
                {t('orders.review.submit_all', 'Submit reviews')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Return Request Modal ──────────────────────────────────────────────── */}
      {showReturnModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="return-dialog-title"
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
            className="bg-white rounded-2xl w-full max-w-sm shadow-atlas-lg ring-1 ring-gray-100 p-6"
          >
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
              </div>
              <div>
                <h3 id="return-dialog-title" className="text-base font-semibold text-gray-900" style={playfair}>
                  {t('orders.return.title', 'Request a return')}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {t('orders.return.desc', 'Tell us what went wrong and we will arrange the return.')}
                </p>
              </div>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label htmlFor="return-reason-modal" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('returns.request.reason', 'Reason')}
                </label>
                <select
                  id="return-reason-modal"
                  value={returnReason}
                  onChange={(e) => { setReturnReason(e.target.value); setReturnError(''); }}
                  className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/20"
                >
                  <option value="">{t('returns.request.reason_placeholder', '— Select a reason —')}</option>
                  {(['damaged', 'wrong_item', 'not_as_described', 'size_issue', 'other'] as const).map((r) => (
                    <option key={r} value={r}>
                      {t(`returns.reason.${r}`, r.replace(/_/g, ' '))}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="return-details-modal" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('returns.request.details', 'Details (optional)')}
                </label>
                <textarea
                  id="return-details-modal"
                  value={returnDetails}
                  onChange={(e) => setReturnDetails(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder={t('returns.request.details_placeholder', 'Describe the issue…')}
                  className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/20 resize-none"
                />
              </div>

              {returnError && (
                <p className="text-xs text-rose-700 bg-rose-50 rounded-xl px-3 py-2" role="alert">
                  {returnError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowReturnModal(false); setReturnError(''); }}
                  className="flex-1 py-2.5 rounded-2xl border border-amber-200 text-gray-700 text-sm font-medium hover:bg-amber-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="flex-1 py-2.5 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-busy={submittingReturn}
                >
                  {submittingReturn && (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin flex-shrink-0" />
                  )}
                  {submittingReturn
                    ? t('returns.request.submitting', 'Submitting…')
                    : t('returns.request.submit', 'Submit')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
