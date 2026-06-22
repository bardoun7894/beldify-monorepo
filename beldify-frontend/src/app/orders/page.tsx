'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { orderService, Order, OrderItem } from '@/services/orderService';
import toast from '@/utils/toast';
import { syncUrlLocale, intlLocale } from '@/i18n/config';
import { OrdersLoadingScreen } from '@/components/ui/LoadingManager';
import ModernOrderFilters from '@/components/orders/ModernOrderFilters';
import ModernSearchBar from '@/components/orders/ModernSearchBar';
import {
  ShoppingBag,
  Search,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  CreditCard,
  MapPin,
  Archive,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import logger from '@/utils/consoleLogger';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Format number based on locale
  const formatNumber = (num: number | string | null | undefined): string => {
    if (num === null || num === undefined || isNaN(Number(num))) return '0.00';
    return new Intl.NumberFormat(intlLocale(i18n.language), {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(num));
  };

  // Format date based on locale - Modern style
  const formatOrderDate = (date: string | null | undefined): string => {
    if (!date) return '';
    try {
      const d = new Date(date);
      const now = new Date();
      const diffTime = Math.max(0, now.getTime() - d.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const locale = intlLocale(i18n.language);
      // If less than 7 days, show relative time
      if (diffDays < 7) {
        return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-diffDays, 'day');
      }

      // Otherwise show formatted date
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(d);
    } catch (e) {
      return '';
    }
  };

  // Status and filter labels from translations
  const statusLabel = (status: string) => {
    const key = (status || '').toLowerCase();
    return t(`orders.status.${key}`) as string;
  };
  const filterLabel = (key: string) => {
    const k = (key || '').toLowerCase();
    return t(`orders.filter.${k}`, { defaultValue: k }) as string;
  };

  // Get status color - Clean flat style
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      processing: 'bg-blue-50 text-blue-700 border-blue-200',
      shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      cancelled: 'bg-gray-50 text-gray-600 border-gray-200',
    };
    return colors[status.toLowerCase() as keyof typeof colors] || colors.pending;
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    const icons = {
      pending: Clock,
      processing: Sparkles,
      shipped: Truck,
      delivered: CheckCircle,
      cancelled: XCircle,
    };
    const Icon = icons[status.toLowerCase() as keyof typeof icons] || Clock;
    return <Icon className="w-4 h-4" strokeWidth={1.5} />;
  };

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        syncUrlLocale(i18n.language);
        setLoading(true);
        const data = await orderService.getOrders();
        setOrders(data || []);
        logger.log('Orders loaded:', data.length);
      } catch (error: any) {
        logger.error('Error loading orders:', error);
        setError(t('orders.error.loading'));
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [i18n.language, t]);

  // Filter and search logic
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(order =>
        order.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply search query
    if (query) {
      const searchQuery = query.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number?.toLowerCase().includes(searchQuery) ||
        order.items?.some(item => item.product_name?.toLowerCase().includes(searchQuery))
      );
    }

    return filtered;
  }, [orders, statusFilter, query]);

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: orders.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach(order => {
      const status = order.status?.toLowerCase() || 'pending';
      if (status in counts) {
        counts[status]++;
      }
    });

    return counts;
  }, [orders]);

  const hasActiveFilters = statusFilter !== 'all' || query !== '';

  if (loading) {
    return (
      <OrdersLoadingScreen
        isRTL={isRTL}
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-amber-50/40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl ring-1 ring-rose-100 p-10 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-rose-700" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('orders.error.title')}</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-indigo-700 text-white rounded-2xl hover:bg-indigo-800 transition hover:-translate-y-0.5 hover:shadow-md font-medium"
          >
            {t('orders.actions.try_again')}
          </button>
        </motion.div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-amber-50/40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl ring-1 ring-amber-100 p-10 max-w-md w-full text-center"
        >
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <ShoppingBag className="w-12 h-12 text-indigo-700" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('orders.empty.title')}</h2>
          <p className="text-gray-600 mb-8">{t('orders.empty.description')}</p>
          <Link
            href="/products"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-indigo-700 text-white rounded-2xl hover:bg-indigo-800 transition hover:-translate-y-0.5 hover:shadow-md font-medium"
          >
            <ShoppingBag className="w-5 h-5 me-2" strokeWidth={1.5} />
            {t('orders.actions.start_shopping')}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen bg-amber-50/40 ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Modern Header with Gradient */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 sm:py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  {t('orders.title')}
                </h1>
                <p className="mt-2 text-gray-600 flex items-center gap-2">
                  <Archive className="w-5 h-5 text-indigo-700" strokeWidth={1.5} />
                  {filteredOrders.length} {t('orders.subtitle', { count: filteredOrders.length })}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-4">
                {statusFilter === 'all' && (
                  <div className="flex gap-3">
                    <div className="px-4 py-2 bg-amber-50 rounded-2xl ring-1 ring-amber-200">
                      <p className="text-xs text-amber-700 font-medium">{t('orders.filter.pending', 'Pending')}</p>
                      <p className="text-lg font-bold text-amber-700">{statusCounts.pending}</p>
                    </div>
                    <div className="px-4 py-2 bg-emerald-50 rounded-2xl ring-1 ring-emerald-200">
                      <p className="text-xs text-emerald-700 font-medium">{t('orders.filter.delivered', 'Delivered')}</p>
                      <p className="text-lg font-bold text-emerald-700">{statusCounts.delivered}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modern Search Bar */}
            <div className="space-y-4">
              <ModernSearchBar
                query={query}
                setQuery={setQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                placeholder={t('orders.search.placeholder')}
                isRTL={isRTL}
                t={t}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Modern Filter Pills */}
        <ModernOrderFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          statusCounts={statusCounts}
          filterLabel={filterLabel}
          isRTL={isRTL}
        />

        {/* Results Section */}
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl shadow-xl ring-1 ring-amber-100 overflow-hidden text-center p-16">
            <div className="mx-auto w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mb-8 animate-pulse">
              <Search className="w-12 h-12 text-indigo-700" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {t('orders.no_results.title', { defaultValue: 'No matching orders found' })}
            </h2>
            <p className="text-gray-600 mb-8">
              {t('orders.no_results.subtitle', { defaultValue: 'Try adjusting your filters or search term.' })}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => { setStatusFilter('all'); setQuery(''); }}
                className="inline-flex items-center justify-center px-8 py-3 rounded-2xl bg-indigo-700 text-white hover:bg-indigo-800 transition hover:-translate-y-0.5 hover:shadow-md font-medium"
              >
                <XCircle className="w-5 h-5 me-2" strokeWidth={1.5} />
                {t('orders.actions.clear_filters', { defaultValue: 'Clear filters' })}
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid gap-6">
            {filteredOrders.map((order: Order, index: number) => (
              <motion.div
                key={order.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {/* Order Header */}
                <div className="p-6 pb-4 border-b border-amber-100 bg-amber-50/40">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          Order #{order.order_number || '-'}
                        </h3>
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {statusLabel(order.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" strokeWidth={1.5} />
                          {formatOrderDate(order.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4" strokeWidth={1.5} />
                          {order.payment_method || 'Cash'}
                        </span>
                      </div>
                    </div>

                    {/* Order Total */}
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">{t('orders.summary.total', 'Total')}</p>
                      <p className="text-2xl font-bold text-indigo-700">
                        {formatNumber(order.total_amount)} {t('product.currency')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6 pb-4">
                  <div className="space-y-3">
                    {(order.items ?? []).slice(0, 3).map((item: OrderItem) => (
                      <div key={`${order.id}-item-${item.id}`} className="flex items-center gap-4 p-3 rounded-2xl bg-amber-50/40 hover:bg-amber-50 transition-colors">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-sm flex-shrink-0">
                          <Image
                            src={item.primary_image || item.product_image || '/images/placeholder-product.jpg'}
                            alt={item.product_name || 'Product'}
                            fill
                            sizes="64px"
                            className="object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/placeholder-product.jpg';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {item.product_name || 'Unknown Product'}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-gray-500">
                              {t('orders.items.qty', 'Qty')}: <span className="font-semibold text-gray-700">{item.quantity}</span>
                            </span>
                            <span className="text-sm font-semibold text-indigo-700">
                              {formatNumber(item.unit_price)} {t('product.currency')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {order.items && order.items.length > 3 && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        +{order.items.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Actions */}
                <div className="p-6 pt-4 bg-amber-50/30 border-t border-amber-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {order.shipping_address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-indigo-700" strokeWidth={1.5} />
                          {t('orders.list.shipping_to', 'Shipping to')} {order.shipping_address.city}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/orders/${order.order_number}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-700 text-white text-sm font-medium rounded-2xl hover:bg-indigo-800 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <Eye className="w-4 h-4" strokeWidth={1.5} />
                      {t('orders.actions.view_details')}
                      <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}