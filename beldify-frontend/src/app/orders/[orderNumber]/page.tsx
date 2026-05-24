'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { orderService, Order, OrderItem } from '@/services/orderService';
import toast from '@/utils/toast';
import { useTranslation } from 'react-i18next';
import { OrdersLoadingScreen } from '@/components/ui/LoadingManager';
import PlaceholderImage from '@/components/PlaceholderImage';
import { useParams, useSearchParams } from 'next/navigation';
import { syncUrlLocale } from '@/i18n/config';
import {
  ShoppingBagIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronLeftIcon,
  MapPinIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import logger from '@/utils/consoleLogger';

export default function OrderDetailsPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  const params = useParams();
  const searchParams = useSearchParams();
  const isRTL = i18n.language === 'ar';
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

  // Format amount based on locale
  const formatAmount = (amount: number | string) => {
    if (!amount || isNaN(Number(amount))) return '0.00';
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  };

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

  const getStatusIcon = (status: string, size: string = 'w-6 h-6') => {
    switch (status) {
      case 'order_placed':
        return <ShoppingBagIcon className={size} />;
      case 'processing':
        return <ClockIcon className={size} />;
      case 'shipped':
        return <TruckIcon className={size} />;
      case 'delivered':
        return <CheckCircleIcon className={size} />;
      default:
        return <ClockIcon className={size} />;
    }
  };

  const getTrackColor = (currentStatus: string, thisStatus: string) => {
    const statuses = ['order_placed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statuses.indexOf(currentStatus.toLowerCase());
    const thisIndex = statuses.indexOf(thisStatus);

    if (currentIndex === -1 || thisIndex === -1) return 'bg-gray-100 text-gray-400 border-gray-200';

    // Color all steps up to and including current status
    if (thisIndex <= currentIndex) return 'bg-indigo-600 text-white border-indigo-600';
    return 'bg-gray-100 text-gray-400 border-gray-200';
  };

  const getLineColor = (currentStatus: string, index: number) => {
    const statuses = ['order_placed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statuses.indexOf(currentStatus.toLowerCase());

    if (currentIndex === -1) return 'bg-gray-200';

    // Color all lines up to current status - using indigo theme
    return index < currentIndex ? 'bg-indigo-600' : 'bg-gray-200';
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
        className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg border border-red-100 p-12 text-center"
          >
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('orders.error.title')}</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/orders"
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-2" />
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
        className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg border border-amber-100 p-12 text-center"
          >
            <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.624-2.57M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('orders.not_found.title')}</h2>
            <p className="text-gray-600 mb-6">{t('orders.not_found.message')}</p>
            <Link
              href="/orders"
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-2" />
              {t('orders.actions.back_to_orders')}
            </Link>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Clean Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <Link href="/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Order #{order.order_number}
                </h1>
                <p className="text-xs text-gray-500">
                  {t('orders.placed_on')} {formatDate(order.created_at)}
                </p>
              </div>
            </div>
            
            {/* Quick Actions for Desktop */}
            <div className="hidden md:flex items-center space-x-3">
              <button className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <DocumentTextIcon className="w-4 h-4 inline mr-1" />
                {t('orders.actions.invoice')}
              </button>
              <button className="px-4 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                <ChatBubbleLeftIcon className="w-4 h-4 inline mr-1" />
                {t('orders.actions.support')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Tracking Card - Clean and Prominent */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('orders.tracking.title')}</h2>
              
              {/* Mobile: Vertical Timeline */}
              <div className="md:hidden space-y-4">
                {['order_placed', 'processing', 'shipped', 'delivered'].map((status, index) => {
                  const isActive = ['order_placed', 'processing', 'shipped', 'delivered'].indexOf(order.status.toLowerCase()) >= index;
                  return (
                    <div key={status} className="flex items-start space-x-4">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                          isActive ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-400'
                        }`}>
                          {getStatusIcon(status, 'w-5 h-5')}
                        </div>
                        {index < 3 && (
                          <div className={`absolute left-5 top-10 w-0.5 h-8 -ml-px ${
                            isActive && ['order_placed', 'processing', 'shipped', 'delivered'].indexOf(order.status.toLowerCase()) > index
                              ? 'bg-indigo-600' : 'bg-gray-300'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          isActive ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {tl(status)}
                        </p>
                        {index === 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(order.created_at)}
                          </p>
                        )}
                        {order.status.toLowerCase() === status && (
                          <p className="text-xs text-indigo-600 font-medium mt-1">{t('orders.tracking.current_status')}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: Horizontal Timeline */}
              <div className="hidden md:block">
                <div className="relative">
                  <div className="flex items-center justify-between">
                    {['order_placed', 'processing', 'shipped', 'delivered'].map((status, index) => {
                      const isActive = ['order_placed', 'processing', 'shipped', 'delivered'].indexOf(order.status.toLowerCase()) >= index;
                      return (
                        <div key={status} className="flex flex-col items-center relative flex-1">
                          <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center z-10 bg-white ${
                            isActive ? 'border-indigo-600 text-indigo-600' : 'border-gray-300 text-gray-400'
                          }`}>
                            {getStatusIcon(status, 'w-6 h-6')}
                          </div>
                          <p className={`mt-3 text-xs font-medium text-center ${
                            isActive ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {tl(status)}
                          </p>
                          {index === 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(order.created_at)}
                            </p>
                          )}
                          {order.status.toLowerCase() === status && (
                            <p className="text-xs text-indigo-600 font-medium mt-1">{t('orders.tracking.current')}</p>
                          )}
                          
                          {/* Progress Line */}
                          {index < 3 && (
                            <div className="absolute left-1/2 top-6 w-full h-0.5 -z-10">
                              <div className={`h-full ${
                                isActive && ['order_placed', 'processing', 'shipped', 'delivered'].indexOf(order.status.toLowerCase()) > index
                                  ? 'bg-indigo-600' : 'bg-gray-300'
                              }`} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tracking Info */}
              {(order.tracking_number || order.estimated_delivery) && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  {order.tracking_number && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('orders.tracking.number')}</span>
                      <span className="text-sm font-mono font-medium text-gray-900">{order.tracking_number}</span>
                    </div>
                  )}
                  {order.estimated_delivery && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('orders.tracking.estimated_delivery')}</span>
                      <span className="text-sm font-medium text-gray-900">{formatDate(order.estimated_delivery)}</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Order Items */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{t('orders.items.title')} ({order.items.length})</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {order.items.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
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
                        <h3 className="text-sm font-medium text-gray-900">
                          {item.product_name || 'Unknown Product'}
                        </h3>
                        <div className="mt-1 flex items-center space-x-3">
                          {item.variant?.color && (
                            <span className="text-xs text-gray-500">
                              {t('orders.items.color')}: {item.variant.color}
                            </span>
                          )}
                          {item.variant?.size && (
                            <span className="text-xs text-gray-500">
                              {t('orders.items.size')}: {item.variant.size}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {t('orders.items.quantity', { count: item.quantity })}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatAmount(item.unit_price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('orders.summary.subtotal')}</span>
                    <span className="font-medium text-gray-900">{formatAmount(order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('orders.summary.shipping')}</span>
                    <span className="font-medium text-green-600">{t('orders.summary.free')}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-base font-medium text-gray-900">{t('orders.summary.total')}</span>
                      <span className="text-base font-bold text-gray-900">{formatAmount(order.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Right Side */}
          <div className="lg:col-span-1 space-y-6">
            {/* Shipping Information Card */}
            {order.shipping_info && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('orders.shipping.title')}</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">{t('orders.shipping.contact')}</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {order.shipping_info.first_name} {order.shipping_info.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{order.shipping_info.email}</p>
                    <p className="text-sm text-gray-500">{order.shipping_info.phone}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">{t('orders.shipping.address')}</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {order.shipping_info.address}<br />
                      {order.shipping_info.city}, {order.shipping_info.state} {order.shipping_info.zip_code}<br />
                      {order.shipping_info.country}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Order Summary Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('orders.summary.title')}</h3>
              
              {/* Status Badge */}
              <div className="mb-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {getStatusIcon(order.status, 'w-4 h-4')}
                  {statusLabel(order.status)}
                </div>
              </div>

              <div className="space-y-3">
                <div className="pb-3 border-b border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('orders.summary.order_number')}</span>
                    <span className="font-medium text-gray-900">#{order.order_number}</span>
                  </div>
                </div>
                
                <div className="pb-3 border-b border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('orders.summary.order_date')}</span>
                    <span className="font-medium text-gray-900">{formatDate(order.created_at)}</span>
                  </div>
                </div>

                <div className="pb-3 border-b border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('orders.summary.items')}</span>
                    <span className="font-medium text-gray-900">{order.items?.length || 0}</span>
                  </div>
                </div>

                <div className="pb-3 border-b border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('orders.summary.payment_status')}</span>
                    <span className="font-medium text-gray-900">
                      {t(`orders.payment_status.${order.payment_status.toLowerCase()}`)}
                    </span>
                  </div>
                </div>

                <div className="pt-3">
                  <div className="flex justify-between">
                    <span className="text-base font-medium text-gray-900">{t('orders.summary.total_amount')}</span>
                    <span className="text-lg font-bold text-indigo-600">{formatAmount(order.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                  <DocumentTextIcon className="w-4 h-4 inline mr-2" />
                  {t('orders.actions.download_invoice')}
                </button>
                <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  <ChatBubbleLeftIcon className="w-4 h-4 inline mr-2" />
                  {t('orders.actions.contact_support')}
                </button>
                {order.status === 'delivered' && (
                  <button className="w-full px-4 py-2 border border-indigo-600 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors">
                    {t('orders.actions.write_review')}
                  </button>
                )}
              </div>
            </motion.div>

            {/* Mobile Quick Actions - Fixed Bottom */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
              <div className="grid grid-cols-2 gap-3">
                <button className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg">
                  <DocumentTextIcon className="w-4 h-4 inline mr-1" />
                  {t('orders.actions.invoice')}
                </button>
                <button className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg">
                  <ChatBubbleLeftIcon className="w-4 h-4 inline mr-1" />
                  {t('orders.actions.support')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
