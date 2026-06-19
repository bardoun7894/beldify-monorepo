'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { orderService, Order, OrderItem, PerSellerOrder } from '@/services/orderService';
import toast from '@/utils/toast';
import { syncUrlLocale } from '@/i18n/config';
import { OrdersLoadingScreen } from '@/components/ui/LoadingManager';
import ModernOrderFilters from '@/components/orders/ModernOrderFilters';
import ModernSearchBar from '@/components/orders/ModernSearchBar';
import { formatMAD } from '@/components/orders/formatMAD';
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
  ChevronRight,
  RefreshCw,
  Store,
} from 'lucide-react';

// ── OrderGroup type alias for orders that contain sub-orders (multi-seller) ───
// plan.md: buyer sees one group card with per-seller sub-order rows.
// The API returns Order objects where `orders[]` carries PerSellerOrder sub-orders
// and `group_number` (or checkout_group_id) is the buyer-facing group reference.
interface OrderGroup extends Order {
  group_number?: string;
  orders?: PerSellerOrder[];
}
import logger from '@/utils/consoleLogger';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';
  const shouldReduceMotion = useReducedMotion();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [query, setQuery] = useState('');

  // Handle "Buy it again" — re-adds past order items to cart at current prices
  const handleReorder = async (orderNumber: string, orderId: string) => {
    if (reorderingId) return; // prevent double-tap
    setReorderingId(orderId);
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
      setReorderingId(null);
    }
  };

  // Format date based on locale - Modern style
  const formatOrderDate = (date: string | null | undefined): string => {
    if (!date) return '';
    try {
      const d = new Date(date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // If less than 7 days, show relative time
      if (diffDays < 7) {
        return new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' }).format(-diffDays, 'day');
      }

      // Otherwise show formatted date
      const lang = i18n.language || 'en';
      const isDarijaOrArabic = lang === 'ar' || lang === 'ma';
      return new Intl.DateTimeFormat(isDarijaOrArabic ? 'ar-MA' : 'en-US', {
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

  // Get status color — Atlas token mapping
  // amber=pending, indigo=processing/shipped, emerald=delivered, rose=cancelled
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      processing: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
      shipped: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
      delivered: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      cancelled: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    };
    return colors[status.toLowerCase()] ?? colors.pending;
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ElementType> = {
      pending: Clock,
      processing: Sparkles,
      shipped: Truck,
      delivered: CheckCircle,
      cancelled: XCircle,
    };
    const Icon = icons[status.toLowerCase()] ?? Clock;
    return <Icon className="w-4 h-4" strokeWidth={1.5} />;
  };

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        syncUrlLocale();
        setLoading(true);
        const data = await orderService.getOrders();
        setOrders(data || []);
        logger.log('Orders loaded:', data.length);
      } catch (error: any) {
        logger.error('Error loading orders:', error);
        setError(error?.message || t('orders.error.loading'));
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [i18n.language, t]);

  // Filter and search logic
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(order =>
        order.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

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
      <OrdersLoadingScreen />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-canvas">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
          className="bg-white rounded-2xl shadow-atlas-lg ring-1 ring-rose-100 p-10 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-rose-700" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3" style={playfair}>
            {t('orders.error.title')}
          </h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-indigo-700 text-white rounded-2xl hover:bg-indigo-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-atlas-md font-medium focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
          >
            {t('orders.actions.try_again')}
          </button>
        </motion.div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-canvas">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
          className="bg-white rounded-2xl shadow-atlas-lg ring-1 ring-gray-100 p-10 max-w-md w-full text-center"
        >
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-indigo-700" strokeWidth={1.5} />
          </div>
          <h2
            className="text-3xl font-bold text-gray-900 mb-4"
            style={playfair}
          >
            {t('orders.empty.title')}
          </h2>
          <p className="text-gray-600 mb-8">{t('orders.empty.description')}</p>
          <Link
            href="/products"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-indigo-700 text-white rounded-2xl hover:bg-indigo-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-atlas-md font-medium focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
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
      transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
      className={`min-h-screen bg-canvas ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Page header — solid parchment surface (no glassmorphism) */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 sm:py-8">
            <div className="mb-6">
              <h1
                className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight"
                style={playfair}
              >
                {t('orders.title')}
              </h1>
              <p className="mt-2 text-gray-600 flex items-center gap-2">
                <Archive className="w-4 h-4 text-indigo-700 flex-shrink-0" strokeWidth={1.5} />
                <span>
                  {filteredOrders.length} {t('orders.subtitle', { count: filteredOrders.length })}
                </span>
              </p>
            </div>

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Status filter pills */}
        <ModernOrderFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          statusCounts={statusCounts}
          filterLabel={filterLabel}
          isRTL={isRTL}
        />

        {/* Results */}
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
            className="bg-white rounded-2xl shadow-atlas-sm ring-1 ring-gray-100 overflow-hidden text-center p-16 mt-6"
          >
            <div className="mx-auto w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-8">
              <Search className="w-10 h-10 text-indigo-700" strokeWidth={1.5} />
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3"
              style={playfair}
            >
              {t('orders.no_results.title', { defaultValue: 'No matching orders found' })}
            </h2>
            <p className="text-gray-600 mb-8">
              {t('orders.no_results.subtitle', { defaultValue: 'Try adjusting your filters or search term.' })}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => { setStatusFilter('all'); setQuery(''); }}
                className="inline-flex items-center justify-center px-8 py-3 rounded-2xl bg-indigo-700 text-white hover:bg-indigo-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-atlas-md font-medium focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
              >
                <XCircle className="w-5 h-5 me-2" strokeWidth={1.5} />
                {t('orders.actions.clear_filters', { defaultValue: 'Clear filters' })}
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid gap-5 mt-6 lg:grid-cols-2 lg:items-start">
            {filteredOrders.map((order: OrderGroup, index: number) => (
              <motion.div
                key={order.id}
                initial={shouldReduceMotion ? false : { y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.35,
                  delay: shouldReduceMotion ? 0 : Math.min(index * 0.04, 0.32),
                  ease: [0.33, 1, 0.68, 1],
                }}
                className="bg-white rounded-2xl shadow-atlas-sm hover:shadow-atlas-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden ring-1 ring-gray-100"
              >
                {/* Order header */}
                <div className="p-5 sm:p-6 pb-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3
                          className="text-lg font-bold text-gray-900"
                          style={playfair}
                        >
                          {t('orders.list.order_number', { orderNumber: order.order_number, defaultValue: `Order #${order.order_number}` })}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {statusLabel(order.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
                          {formatOrderDate(order.created_at)}
                        </span>
                        {order.payment_method && (
                          <span className="flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
                            {order.payment_method}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Order total */}
                    <div className="text-end flex-shrink-0">
                      <p className="text-xs text-gray-500 mb-0.5">{t('orders.summary.total', 'Total')}</p>
                      <p className="text-xl font-bold text-indigo-700">
                        <span className="currency-mad">{formatMAD(order.total_amount, i18n.language)}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order items preview */}
                <div className="p-5 sm:p-6 pb-4">
                  <div className="space-y-2.5">
                    {(order.items ?? []).slice(0, 3).map((item: OrderItem) => (
                      <div
                        key={`${order.id}-item-${item.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white shadow-atlas-sm flex-shrink-0">
                          <Image
                            src={item.primary_image || item.product_image || '/images/placeholder-product.svg'}
                            alt={item.product_name || t('product.fallback_name')}
                            fill
                            sizes="56px"
                            className="object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/placeholder-product.svg';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-sm">
                            {item.product_name || t('product.unknown')}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-gray-500">
                              {t('orders.items.qty', 'Qty')}: <span className="font-semibold text-gray-700">{item.quantity}</span>
                            </span>
                            <span className="text-xs font-semibold text-indigo-700 currency-mad">
                              {formatMAD(item.unit_price, i18n.language)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {order.items && order.items.length > 3 && (
                      <p className="text-xs text-gray-500 text-center py-1.5">
                        +{order.items.length - 3} {t('orders.items.more', 'more items')}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Multi-seller sub-order rows (plan.md FR-011) ──────────────
                     When the group has per-seller sub-orders, show each seller's
                     order number + independent status badge, so the buyer can see
                     A is "shipped" while B is still "pending" (spec US-3 scenario 2). */}
                {Array.isArray(order.orders) && order.orders.length > 1 && (
                  <div className="px-5 sm:px-6 py-3 border-t border-gray-100 bg-indigo-50/40">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-indigo-600 font-medium mb-2">
                      {t('orders.group.sub_orders_label', '{{count}} sellers in this order', {
                        count: order.orders.length,
                      }).replace('{{count}}', String(order.orders.length))}
                    </p>
                    <ul className="space-y-1.5" role="list" aria-label={t('orders.group.sub_orders_aria', 'Per-seller sub-orders')}>
                      {order.orders.map((subOrder: PerSellerOrder) => {
                        const subOrderStatus = (subOrder as any).status || 'pending';
                        const storeName = subOrder.store_name ?? `Shop #${subOrder.store_id}`;
                        return (
                          <li
                            key={subOrder.id}
                            className="flex items-center justify-between gap-2 py-1 px-2 rounded-xl bg-white ring-1 ring-indigo-100"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center flex-shrink-0">
                                <Store className="w-3 h-3 text-amber-600" aria-hidden="true" />
                              </div>
                              <span className="text-xs font-medium text-gray-700 truncate">
                                {storeName}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono tabular-nums flex-shrink-0">
                                #{subOrder.order_number}
                              </span>
                            </div>
                            {/* Per-seller independent status badge (plan.md FR-011) */}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${getStatusColor(subOrderStatus)}`}
                            >
                              {getStatusIcon(subOrderStatus)}
                              {statusLabel(subOrderStatus)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Order footer */}
                <div className="px-5 sm:px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      {order.shipping_address && (
                        <span className="flex items-center gap-1.5 text-sm text-gray-500">
                          <MapPin className="w-3.5 h-3.5 text-indigo-700 flex-shrink-0" strokeWidth={1.5} />
                          <span className="truncate">
                            {t('orders.list.shipping_to', 'Shipping to')} {order.shipping_address.city}
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* "Buy it again" — re-adds past order items to cart at current prices.
                          Second-person, calm copy. No "!", no urgency, no shame.
                          AR: اشترِ مرة أخرى  /  EN: Buy it again  (FLAG: pending i18n key orders.actions.buy_again) */}
                      <button
                        type="button"
                        onClick={() => handleReorder(order.order_number, order.id)}
                        disabled={reorderingId === order.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-indigo-200 text-indigo-700 text-sm font-medium rounded-2xl hover:bg-indigo-50 transition-all duration-200 flex-shrink-0 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={(i18n.language === 'ar' || i18n.language === 'ma') ? 'اشترِ مرة أخرى' : 'Buy it again'}
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${reorderingId === order.id ? 'animate-spin' : ''}`}
                          strokeWidth={2}
                        />
                        {(i18n.language === 'ar' || i18n.language === 'ma') ? 'اشترِ مرة أخرى' : 'Buy it again'}
                      </button>
                      <Link
                        href={`/orders/${order.order_number}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-700 text-white text-sm font-medium rounded-2xl hover:bg-indigo-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-atlas-md flex-shrink-0 focus:ring-2 focus:ring-indigo-700/30 focus:outline-none"
                      >
                        <Eye className="w-4 h-4" strokeWidth={1.5} />
                        {t('orders.actions.view_details')}
                        <ChevronRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} strokeWidth={2} />
                      </Link>
                    </div>
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
