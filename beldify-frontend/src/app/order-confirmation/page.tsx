'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Truck, Clock } from 'lucide-react';
import { orderService, Order, OrderItem } from '@/services/orderService';
import { useTranslation } from 'react-i18next';
import toast from '@/utils/toast';
import logger from '@/utils/consoleLogger';
import { usePWATriggers } from '@/hooks/usePWATriggers';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

export default function OrderConfirmationPage() {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const orderId = searchParams ? searchParams.get('orderId') : null;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { triggerOnOrderComplete } = usePWATriggers();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const localeMap: Record<string, string> = { en: 'en-US', fr: 'fr-FR', ar: 'ar-MA', ma: 'ar-MA', es: 'es-ES' };
  const bcp47 = localeMap[i18n.language] || 'fr-FR';
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(bcp47, {
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

      try {
        const orderDetails = await orderService.getOrderDetails(orderId);
        setOrder(orderDetails);
        // Trigger PWA install prompt after successful order
        triggerOnOrderComplete();
      } catch (error) {
        logger.error('Error fetching order:', error);
        toast.error(t('order_confirmation.error.fetch_failed', 'Failed to load order details'));
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50/40 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-700" />
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="min-h-screen bg-amber-50/40 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h1
                className="text-2xl font-bold text-gray-900 mb-4"
                style={playfair}
              >
                {t('order_confirmation.not_found.title', 'Order Not Found')}
              </h1>
              <p className="text-gray-600 mb-6">
                {t('order_confirmation.not_found.description', "We couldn't find the order you're looking for.")}
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-2xl text-white bg-indigo-700 hover:bg-indigo-800 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {t('order_confirmation.not_found.cta', 'Return to Home')}
              </Link>
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

  return (
    <div
      className={`min-h-screen bg-amber-50/40 py-12 ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-indigo-700" strokeWidth={1.5} />
              </div>
            </div>

            <div className="text-center mb-8">
              <h1
                className="text-2xl font-semibold text-gray-900 mb-4"
                style={playfair}
              >
                {t('order_confirmation.success.title', 'Thank you for your order!')}
              </h1>
              <p className="text-gray-600">
                {t(
                  'order_confirmation.success.message',
                  "Your order has been placed and is being processed. You'll receive a confirmation email shortly."
                )}
              </p>
              <p className="text-gray-600 mt-4">
                {t('order_confirmation.order_number', 'Order Number')}:{' '}
                <span className="font-medium text-indigo-700">{order?.order_number}</span>
              </p>
            </div>

            {/* Order Status */}
            <div className="bg-amber-50 rounded-2xl p-6 mb-8 ring-1 ring-amber-200">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-6 w-6 text-amber-600" strokeWidth={1.5} />
                <h2
                  className="text-lg font-medium text-gray-900"
                  style={playfair}
                >
                  {t('order_confirmation.status.label', 'Order Status')}:{' '}
                  <span className="text-indigo-700">{order?.status}</span>
                </h2>
              </div>
              <div className="flex items-start gap-3">
                <Truck className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {t('order_confirmation.shipping.title', 'Shipping Address')}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {order?.shipping_info?.first_name} {order?.shipping_info?.last_name}
                    <br />
                    {order?.shipping_info?.address}
                    <br />
                    {order?.shipping_info?.city}, {order?.shipping_info?.state}{' '}
                    {order?.shipping_info?.zip_code}
                    <br />
                    {order?.shipping_info?.country}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="rounded-2xl ring-1 ring-gray-200 p-6 mb-8">
              <h2
                className="text-lg font-medium text-gray-900 mb-4"
                style={playfair}
              >
                {t('order_confirmation.details.title', 'Order Details')}
              </h2>
              <div className="space-y-4">
                {order.items.map((item: OrderItem) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 truncate">
                        {item.product_name || item.product?.name || 'Unknown Product'}
                        {item.variant?.color && ` - ${item.variant.color}`}
                        {item.variant?.size && ` - ${item.variant.size}`}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {t('order_confirmation.items.qty', 'Qty')}: {item.quantity}
                      </p>
                    </div>
                    <p className="text-gray-900 font-medium tabular-nums whitespace-nowrap">
                      {formatAmount(item.unit_price * item.quantity)} {t('product.currency')}
                    </p>
                  </div>
                ))}

                <div className="border-t border-amber-100 pt-4 mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {t('order_confirmation.summary.subtotal', 'Subtotal')}
                    </span>
                    <span className="text-gray-900 tabular-nums">
                      {formatAmount(itemsSubtotal)} {t('product.currency')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {t('order_confirmation.summary.shipping', 'Shipping')}
                    </span>
                    <span className="text-gray-900 tabular-nums">
                      {formatAmount(order.shipping_amount ?? 0)} {t('product.currency')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {t('order_confirmation.summary.tax', 'Tax')}
                    </span>
                    <span className="text-gray-900 tabular-nums">
                      {formatAmount(order.tax_amount ?? 0)} {t('product.currency')}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold mt-4 pt-4 border-t border-amber-100">
                    <span className="text-gray-900">
                      {t('order_confirmation.summary.total', 'Total')}
                    </span>
                    <span className="text-indigo-700 tabular-nums">
                      {formatAmount(order.total_amount)} {t('product.currency')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/orders"
                className="block w-full bg-indigo-700 text-white text-center py-3 px-4 rounded-2xl hover:bg-indigo-800 transition hover:-translate-y-0.5 hover:shadow-md font-medium"
              >
                {t('order_confirmation.actions.view_status', 'View Order Status')}
              </Link>

              <Link
                href="/"
                className="block w-full bg-amber-50 text-indigo-700 text-center py-3 px-4 rounded-2xl ring-1 ring-amber-200 hover:bg-amber-100 transition hover:-translate-y-0.5 font-medium"
              >
                {t('order_confirmation.actions.continue_shopping', 'Continue Shopping')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
