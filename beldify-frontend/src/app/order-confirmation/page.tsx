'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircleIcon, TruckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { orderService, Order, OrderItem } from '@/services/orderService';
import { useTranslation } from 'react-i18next';
import toast from '@/utils/toast';
import logger from '@/utils/consoleLogger';
import { usePWATriggers } from '@/hooks/usePWATriggers';
export default function OrderConfirmationPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const orderId = searchParams ? searchParams.get('orderId') : null;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { triggerOnOrderComplete } = usePWATriggers();

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
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
              <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            {/* Order Status Icon */}
            <div className="flex justify-center mb-6">
              <CheckCircleIcon className="h-16 w-16 text-green-500" />
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('Thank you for your order!')}
              </h1>
              <p className="text-gray-600">
                {t("Your order has been placed and is being processed. You'll")}{' '}
                {t('receive a confirmation email shortly.')}
              </p>
              <p className="text-gray-600 mt-4">
                {t('Order Number')}: <span className="font-medium">{order?.order_number}</span>
              </p>
            </div>

            {/* Order Status */}
            <div className="bg-amber-50 rounded-lg p-6 mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <ClockIcon className="h-6 w-6 text-amber-600" />
                <h2 className="text-lg font-medium text-gray-900">Order Status: {order?.status}</h2>
              </div>
              <div className="flex items-start space-x-3">
                <TruckIcon className="h-6 w-6 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Shipping Address:</h3>
                  <p className="text-gray-600">
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
            <div className="border rounded-lg p-6 mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Details</h2>
              <div className="space-y-4">
                {order.items.map((item: OrderItem) => (
                  <div
                    key={item.id} // Use the OrderItem's own unique ID for the key
                    className="flex justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-gray-900">
                        {item.product_name || item.product?.name || 'Unknown Product'} {item.variant?.color && `- ${item.variant.color}`}{' '}
                        {item.variant?.size && `- ${item.variant.size}`}
                      </p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-gray-900">${(item.unit_price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">
                      ${order.items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">${(order.shipping_amount ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">${(order.tax_amount ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium mt-4 pt-4 border-t">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">${order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Link
                href="/orders"
                className="block w-full bg-amber-600 text-white text-center py-3 px-4 rounded-md hover:bg-amber-700 transition-colors duration-200"
              >
                View Order Status
              </Link>

              <Link
                href="/"
                className="block w-full bg-gray-100 text-gray-700 text-center py-3 px-4 rounded-md hover:bg-gray-200 transition-colors duration-200"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
