'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle,
  Truck,
  Clock,
  ShoppingBag,
  ArrowRight,
  Package,
  MessageCircle,
  ShieldCheck,
  MapPin,
  Store,
} from 'lucide-react';
import { orderService, Order, OrderItem, PerSellerOrder } from '@/services/orderService';
import { useTranslation } from 'react-i18next';
import toast from '@/utils/toast';
import logger from '@/utils/consoleLogger';
import { usePWATriggers } from '@/hooks/usePWATriggers';
import { getImageUrl } from '@/utils/imageUtils';
import PaymentProofUpload from '@/components/checkout/PaymentProofUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useWebPush } from '@/hooks/useWebPush';
import PostOrderPushPrompt from '@/components/pwa/PostOrderPushPrompt';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

// ── Loading skeleton ──────────────────────────────────────────────────────────
function OrderConfirmationSkeleton() {
  return (
    <div className="min-h-screen bg-canvas py-12" aria-busy="true" aria-label="Loading order details">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Success hero skeleton */}
          <div className="bg-white rounded-2xl shadow-atlas-sm ring-1 ring-gray-200 p-10 flex flex-col items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-gray-100 animate-pulse" />
            <div className="h-8 w-72 rounded-2xl bg-gray-100 animate-pulse" />
            <div className="h-4 w-56 rounded-2xl bg-gray-100 animate-pulse" />
            <div className="h-4 w-40 rounded-2xl bg-gray-100 animate-pulse" />
          </div>
          {/* Details skeleton */}
          <div className="bg-white rounded-2xl shadow-atlas-sm ring-1 ring-gray-200 p-6 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex gap-3 items-center">
                <div className="w-14 h-14 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 rounded-full bg-gray-100 animate-pulse" />
                  <div className="h-3 w-1/3 rounded-full bg-gray-100 animate-pulse" />
                </div>
                <div className="h-4 w-20 rounded-full bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OrderConfirmationPage() {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const orderId = searchParams ? searchParams.get('orderId') : null;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { triggerOnOrderComplete } = usePWATriggers();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';
  const { isAuthenticated } = useAuth();
  const { isSubscribed, isLoading: pushLoading, subscribe } = useWebPush();

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(i18n.language, {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        logger.log('No order ID found');
        setLoading(false);
        return;
      }

      // ── Guest path: read from sessionStorage stash first ──────────────────
      // After a guest buyNow checkout, the confirmation page has no auth token
      // to call the authenticated /orders/{id} endpoint. The checkout page stashes
      // the order data in sessionStorage under `beldify_last_order`.
      try {
        const raw = typeof window !== 'undefined'
          ? sessionStorage.getItem('beldify_last_order')
          : null;
        if (raw) {
          const stash = JSON.parse(raw) as Order;
          // Only use if it matches the orderId in the URL
          if (stash.order_number === orderId) {
            setOrder(stash);
            triggerOnOrderComplete();
            setLoading(false);
            return;
          }
        }
      } catch {
        // Malformed stash — fall through to API fetch
      }

      // ── Authenticated path: fetch from server ─────────────────────────────
      try {
        const orderDetails = await orderService.getOrderDetails(orderId);
        setOrder(orderDetails);
        triggerOnOrderComplete();
      } catch (error) {
        logger.error('Error fetching order:', error);
        toast.error(t('order_confirmation.error.fetch_failed', 'Failed to load order details'));
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <OrderConfirmationSkeleton />;
  }

  // ── Not found state ───────────────────────────────────────────────────────
  if (!orderId || !order) {
    return (
      <div className="min-h-screen bg-canvas py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-atlas-sm ring-1 ring-gray-200 p-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 ring-1 ring-amber-200 mb-6">
                <Package className="w-8 h-8 text-amber-500" aria-hidden="true" />
              </div>
              <h1
                className="text-2xl font-bold text-gray-900 mb-3 text-balance"
                style={playfair}
              >
                {t('order_confirmation.not_found.title', 'Order not found')}
              </h1>
              <p className="text-gray-500 mb-8 text-sm leading-relaxed max-w-sm mx-auto">
                {t('order_confirmation.not_found.description', "We couldn't find the order you're looking for. It may have been placed under a different account.")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/orders"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-full text-white bg-indigo-700 hover:bg-indigo-800 transition-all duration-200 hover-lift focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700/50"
                >
                  {t('order_confirmation.not_found.view_orders', 'View my orders')}
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-full text-gray-700 ring-1 ring-amber-200 bg-amber-50 hover:bg-amber-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400/50"
                >
                  {t('order_confirmation.not_found.cta', 'Return to home')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const itemsSubtotal = order.items.reduce(
    (acc, item) => acc + item.unit_price * item.quantity,
    0
  );

  const productName = (item: OrderItem) => {
    const name = item.product_name || item.product?.name || '';
    const variant = [item.variant?.color, item.variant?.size].filter(Boolean).join(' · ');
    return variant ? name + ' — ' + variant : name;
  };

  // Map raw backend status enums to designed, translated copy + an Atlas tone.
  // amber → awaiting / pending; indigo → processing / shipped; gray → fallback.
  const statusMeta = (raw?: string) => {
    const key = (raw || '').toLowerCase();
    const tones: Record<string, string> = {
      pending: 'text-amber-700',
      awaiting_payment: 'text-amber-700',
      processing: 'text-indigo-700',
      confirmed: 'text-indigo-700',
      shipped: 'text-indigo-700',
      delivered: 'text-indigo-700',
      cancelled: 'text-rose-700',
      refunded: 'text-rose-700',
    };
    const fallback =
      key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
    return {
      label: key
        ? t(`order_confirmation.status.values.${key}`, fallback)
        : t('order_confirmation.status.values.pending', 'Pending'),
      tone: tones[key] || 'text-gray-800',
    };
  };

  const status = statusMeta(order?.status);

  return (
    <div
      className={`min-h-screen bg-canvas py-10 sm:py-14 ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* ── Success hero card ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-atlas-sm ring-1 ring-gray-200 p-8 sm:p-10 text-center">
            {/* Animated success ring */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-indigo-50 ring-4 ring-indigo-100 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-indigo-700" strokeWidth={1.5} aria-hidden="true" />
                </div>
                {/* Amber accent dot */}
                <span className="absolute top-0 end-0 w-5 h-5 rounded-full bg-amber-400 ring-2 ring-white flex items-center justify-center">
                  <span className="sr-only">{t('order_confirmation.success.confirmed', 'Confirmed')}</span>
                </span>
              </div>
            </div>

            <h1
              className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 text-balance"
              style={playfair}
            >
              {t('order_confirmation.success.title', 'Your order is confirmed!')}
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-5 max-w-md mx-auto">
              {t(
                'order_confirmation.success.message',
                "Your order has been placed and is being processed. You'll receive a confirmation email shortly."
              )}
            </p>

            {/* Order number badge */}
            <div className="inline-flex items-center gap-2 bg-indigo-50 ring-1 ring-indigo-200 rounded-full px-5 py-2.5 mb-6">
              <span className="text-xs text-indigo-600 font-medium uppercase tracking-wider">
                {t('order_confirmation.order_number', 'Order')}
              </span>
              <span className="font-bold text-indigo-700 tabular-nums text-sm">
                #{order?.order_number}
              </span>
            </div>

            {/* Status pill */}
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" strokeWidth={1.5} aria-hidden="true" />
              <span className="text-sm text-gray-600">
                {t('order_confirmation.status.label', 'Status')}:{' '}
                <span className={`font-semibold ${status.tone}`}>
                  {status.label}
                </span>
              </span>
            </div>
          </div>

          {/* ── Multi-seller split notice + per-seller order cards ───────── */}
          {(() => {
            const orders: PerSellerOrder[] | undefined = order?.orders;
            const isMultiSeller = Array.isArray(orders) && orders.length > 1;
            if (!isMultiSeller) return null;

            return (
              <>
                {/* Split notice banner */}
                <div className="bg-indigo-50 rounded-2xl ring-1 ring-indigo-200 px-5 py-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 ring-1 ring-indigo-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Store className="w-4 h-4 text-indigo-700" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-indigo-900">
                      {t(
                        'order_confirmation.split.title',
                        'Your order was split across {{count}} sellers',
                      ).replace('{{count}}', String(orders!.length))}
                    </p>
                    <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
                      {t(
                        'order_confirmation.split.description',
                        'Each seller will prepare and ship their part independently. All orders are covered by Beldify Buyer Guarantee.',
                      )}
                    </p>
                    {order?.checkout_group_id && (
                      <p className="text-xs text-indigo-600 mt-1.5 font-mono break-all">
                        {t('order_confirmation.split.group_ref', 'Group ref:')}
                        {' '}
                        <span className="font-semibold">{order.checkout_group_id}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Per-seller order cards */}
                {/* orders is guaranteed non-empty by isMultiSeller guard above */}
                {order.orders.map((sellerOrder, idx) => (
                  <div
                    key={sellerOrder.id}
                    className="bg-white rounded-2xl shadow-atlas-sm ring-1 ring-gray-200 p-5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center flex-shrink-0">
                        <Store className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                      </div>
                      <p className="text-xs uppercase tracking-[0.14em] text-amber-700 font-medium">
                        {t('order_confirmation.split.seller_label', 'Seller {{n}}', {
                          n: idx + 1,
                        }).replace('{{n}}', String(idx + 1))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ps-9">
                      <span className="text-xs text-gray-500">
                        {t('order_confirmation.split.seller_order', 'Order')}
                      </span>
                      <span className="font-bold text-indigo-700 text-sm tabular-nums">
                        #{sellerOrder.order_number}
                      </span>
                    </div>
                    {typeof sellerOrder.total_amount === 'number' && (
                      <div className="flex items-center gap-2 ps-9 mt-1">
                        <span className="text-xs text-gray-500">
                          {t('order_confirmation.summary.total', 'Total')}
                        </span>
                        <span className="font-semibold text-gray-900 text-sm tabular-nums currency-mad">
                          {formatAmount(sellerOrder.total_amount)} MAD
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </>
            );
          })()}

          {/* ── Shipping address card ────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-atlas-sm ring-1 ring-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-amber-600" aria-hidden="true" />
              </div>
              <h2 className="text-base font-semibold text-gray-900" style={playfair}>
                {t('order_confirmation.shipping.title', 'Shipping address')}
              </h2>
            </div>
            <address className="not-italic text-sm text-gray-600 leading-relaxed ps-10">
              <span className="font-medium text-gray-900">
                {order?.shipping_info?.first_name} {order?.shipping_info?.last_name}
              </span>
              <br />
              {order?.shipping_info?.address}
              {order?.shipping_info?.apartment && (
                <>, {order.shipping_info.apartment}</>
              )}
              <br />
              {order?.shipping_info?.city}
              {order?.shipping_info?.state && `, ${order.shipping_info.state}`}
              {order?.shipping_info?.zip_code && ` ${order.shipping_info.zip_code}`}
              <br />
              {order?.shipping_info?.country}
            </address>
          </div>

          {/* ── Order items card ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-atlas-sm ring-1 ring-gray-200 p-6">
            <h2
              className="text-base font-semibold text-gray-900 mb-5"
              style={playfair}
            >
              {t('order_confirmation.details.title', 'Order items')}
            </h2>

            <ul className="space-y-4 mb-5" aria-label={t('order_confirmation.details.items_list', 'Items in your order')}>
              {order.items.map((item: OrderItem) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3"
                >
                  {/* Product thumbnail */}
                  <div className="relative w-14 h-14 flex-shrink-0 rounded-xl ring-1 ring-amber-200 overflow-hidden bg-amber-50">
                    {item.product?.image_url ? (
                      <Image
                        src={getImageUrl(item.product.image_url, '/placeholder.png')}
                        alt={item.product_name || item.product?.name || ''}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-amber-300" aria-hidden="true" />
                      </div>
                    )}
                    <span className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-indigo-700 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {item.quantity}
                    </span>
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {productName(item) || t('order_confirmation.items.unknown', 'Unknown product')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t('order_confirmation.items.qty', 'Qty')}: {item.quantity}
                    </p>
                  </div>

                  {/* Price */}
                  <p className="text-sm font-semibold text-gray-900 tabular-nums whitespace-nowrap flex-shrink-0 currency-mad">
                    {formatAmount(item.unit_price * item.quantity)} MAD
                  </p>
                </li>
              ))}
            </ul>

            {/* Totals */}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {t('order_confirmation.summary.subtotal', 'Subtotal')}
                </span>
                <span className="text-gray-900 tabular-nums font-medium currency-mad">
                  {formatAmount(itemsSubtotal)} MAD
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {t('order_confirmation.summary.shipping', 'Shipping')}
                </span>
                {order.shipping_amount && order.shipping_amount > 0 ? (
                  <span className="text-gray-900 tabular-nums font-medium currency-mad">
                    {formatAmount(order.shipping_amount)} MAD
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold">
                    {t('order_confirmation.summary.free_shipping', 'Free')}
                  </span>
                )}
              </div>
              {order.tax_amount && order.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {t('order_confirmation.summary.tax', 'Tax')}
                  </span>
                  <span className="text-gray-900 tabular-nums font-medium currency-mad">
                    {formatAmount(order.tax_amount)} MAD
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-3 mt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900 text-sm">
                  {t('order_confirmation.summary.total', 'Total')}
                </span>
                <span className="font-bold text-indigo-700 tabular-nums text-lg currency-mad" style={playfair}>
                  {formatAmount(order.total_amount)} MAD
                </span>
              </div>
            </div>
          </div>

          {/* ── Receipt upload card (transfer orders awaiting payment) ───── */}
          {order.payment_status === 'awaiting_payment' && (
            <PaymentProofUpload order={order} />
          )}

          {/* ── What's next card ─────────────────────────────────────────── */}
          <div className="bg-indigo-50 rounded-2xl ring-1 ring-indigo-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4" style={playfair}>
              {t('order_confirmation.next_steps.title', 'What happens next?')}
            </h2>
            <ol className="space-y-3" role="list">
              {[
                {
                  icon: <ShieldCheck className="w-5 h-5 text-indigo-600" aria-hidden="true" />,
                  label: t('order_confirmation.next_steps.processing', 'Your order is being reviewed and prepared.'),
                },
                {
                  icon: <Truck className="w-5 h-5 text-indigo-600" aria-hidden="true" />,
                  label: t('order_confirmation.next_steps.dispatch', "We'll dispatch your order and send tracking information by email."),
                },
                {
                  icon: <MessageCircle className="w-5 h-5 text-indigo-600" aria-hidden="true" />,
                  label: t('order_confirmation.next_steps.support', 'Questions? Contact us anytime through the app.'),
                },
              ].map(({ icon, label }, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white ring-1 ring-indigo-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {icon}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed pt-1">{label}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* ── Push / register prompt ───────────────────────────────────── */}
          <PostOrderPushPrompt
            isAuthenticated={isAuthenticated}
            isSubscribed={isSubscribed}
            isLoading={pushLoading}
            onSubscribe={subscribe}
          />

          {/* ── Actions ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/orders"
              className="flex items-center justify-center gap-2 bg-indigo-700 text-white text-center py-3.5 px-5 rounded-full hover:bg-indigo-800 transition-all duration-200 hover-lift font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700/50"
            >
              <Package className="w-4 h-4" aria-hidden="true" />
              {t('order_confirmation.actions.view_status', 'View order status')}
            </Link>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-amber-50 text-gray-800 text-center py-3.5 px-5 rounded-full ring-1 ring-amber-200 hover:bg-amber-100 transition-all duration-200 hover-lift font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400/50"
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              {t('order_confirmation.actions.continue_shopping', 'Continue shopping')}
            </Link>
          </div>

          {/* ── Trust note ───────────────────────────────────────────────── */}
          <p className="text-center text-xs text-gray-400 pb-4">
            <ShieldCheck className="inline w-3.5 h-3.5 text-amber-500 me-1 align-middle" aria-hidden="true" />
            {t(
              'order_confirmation.trust.note',
              'Your purchase is protected by Beldify Buyer Guarantee.'
            )}
          </p>

        </div>
      </div>
    </div>
  );
}
