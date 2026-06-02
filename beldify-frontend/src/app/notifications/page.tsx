'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  Package,
  MessageCircle,
  Scissors,
  ShoppingBag,
  CheckCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useDirection } from '@/hooks/useDirection';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS, fr, es } from 'date-fns/locale';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  Notification,
} from '@/services/notificationService';
import { useNotifications } from '@/contexts/NotificationContext';

// ── Type map ──────────────────────────────────────────────────────────────────

interface TypeConfig {
  icon: React.ElementType;
  href: (data: any) => string;
  labelKey: string;
  fallback: string;
  color: string;
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  order_placed: {
    icon: ShoppingBag,
    href: () => '/orders',
    labelKey: 'notifications.page.types.order_placed',
    fallback: 'New order placed',
    color: 'bg-green-100 text-green-700',
  },
  order_status: {
    icon: Package,
    href: (d: any) => (d?.order_number ? `/orders/${d.order_number}` : '/orders'),
    labelKey: 'notifications.page.types.order_status',
    fallback: 'Order status updated',
    color: 'bg-indigo-100 text-indigo-700',
  },
  community_response: {
    icon: MessageCircle,
    href: (d: any) =>
      d?.post_id ? `/community/posts/${d.post_id}` : '/community',
    labelKey: 'notifications.page.types.community_response',
    fallback: 'New response on your post',
    color: 'bg-blue-100 text-blue-700',
  },
  tailoring_booking: {
    icon: Scissors,
    href: () => '/services/tailoring',
    labelKey: 'notifications.page.types.tailoring_booking',
    fallback: 'Tailoring booking update',
    color: 'bg-amber-100 text-amber-700',
  },
  new_message: {
    icon: MessageCircle,
    href: (d: any) =>
      d?.sender_id ? `/community/messages/${d.sender_id}` : '/community/messages',
    labelKey: 'notifications.page.types.new_message',
    fallback: 'New message',
    color: 'bg-violet-100 text-violet-700',
  },
};

const getConfig = (type: string): TypeConfig | null => {
  const key = Object.keys(TYPE_CONFIG).find(
    (k) => type === k || type.toLowerCase().includes(k.replace(/_/g, ''))
  );
  return key ? TYPE_CONFIG[key] : null;
};

const getDateLocale = (lang: string) => {
  if (lang.startsWith('ar') || lang === 'ma') return ar;
  if (lang.startsWith('fr')) return fr;
  if (lang.startsWith('es')) return es;
  return enUS;
};

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 mb-4">
        <Bell className="h-8 w-8 text-amber-400" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">
        {t('notifications.page.emptyTitle', 'No notifications')}
      </h3>
      <p className="text-sm text-gray-400 max-w-xs">
        {t(
          'notifications.page.emptyDescription',
          "You're all caught up! We'll notify you when something needs your attention."
        )}
      </p>
    </div>
  );
}

// ── Single notification row ───────────────────────────────────────────────────

function NotificationRow({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const config = getConfig(notification.type);
  const Icon = config?.icon ?? Bell;
  const href = config?.href(notification.data) ?? '/notifications';
  const label = config
    ? t(config.labelKey, config.fallback)
    : notification.type;
  const colorClass = config?.color ?? 'bg-gray-100 text-gray-500';

  const message =
    notification.data?.message ||
    notification.data?.title ||
    label;

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(notification.created_at), {
        addSuffix: true,
        locale: getDateLocale(i18n.language),
      });
    } catch {
      return '';
    }
  })();

  const isUnread = notification.read_at === null;

  return (
    <div
      className={cn(
        'group flex items-start gap-4 p-4 rounded-2xl border transition',
        isUnread
          ? 'border-amber-200 bg-amber-50/30 hover:bg-amber-50/60'
          : 'border-gray-100 bg-white hover:bg-gray-50/60'
      )}
    >
      {/* Icon */}
      <span
        className={cn(
          'mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
          colorClass
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>

      {/* Content */}
      <Link
        href={href}
        onClick={() => isUnread && onRead(notification.id)}
        className="min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 rounded"
      >
        <p
          className={cn(
            'text-sm leading-snug',
            isUnread ? 'font-medium text-gray-900' : 'text-gray-600'
          )}
        >
          {message}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{timeAgo}</p>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
        {isUnread && (
          <button
            onClick={() => onRead(notification.id)}
            title={t('notifications.page.markRead', 'Mark as read')}
            aria-label={t('notifications.page.markRead', 'Mark as read')}
            className="flex h-7 w-7 items-center justify-center rounded-full text-indigo-500 hover:bg-indigo-50 transition"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          title={t('common.delete', 'Delete')}
          aria-label={t('common.delete', 'Delete')}
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Unread dot */}
      {isUnread && (
        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const { isAuthenticated } = useAuth();
  const { refreshUnreadCount } = useNotifications();
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const router = useRouter();

  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  const load = useCallback(
    async (page: number) => {
      if (!isAuthenticated) return;
      setIsLoading(true);
      try {
        const res = await getNotifications(page);
        setItems(res.data ?? []);
        setCurrentPage(res.current_page ?? 1);
        setLastPage(res.last_page ?? 1);
        setTotal(res.total ?? 0);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    load(1);
  }, [isAuthenticated, load, router]);

  const handleRead = async (id: string) => {
    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
    await markAsRead(id);
    refreshUnreadCount();
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await deleteNotification(id);
    refreshUnreadCount();
  };

  const handleMarkAll = async () => {
    setItems((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    await markAllAsRead();
    refreshUnreadCount();
  };

  const unreadInView = items.filter((n) => n.read_at === null).length;

  return (
    <main className="min-h-screen bg-[#faf9f7]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {t('notifications.page.title', 'Notifications')}
            </h1>
            {total > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">
                {t('notifications.page.total', { count: total, defaultValue: `${total} notifications` })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadInView > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {t('notifications.bell.markAllRead', 'Mark all read')}
              </button>
            )}
            <button
              onClick={() => load(currentPage)}
              aria-label={t('common.actions.tryAgain', 'Refresh')}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-amber-100 hover:text-indigo-700 transition"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="space-y-2">
              {items.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onRead={handleRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Pagination */}
            {lastPage > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => load(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label={t('common.previous', 'Previous page')}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 text-gray-600 hover:bg-amber-50 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <PrevIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="text-sm text-gray-500">
                  {t('notifications.page.pagination', {
                    current: currentPage,
                    last: lastPage,
                    defaultValue: `Page ${currentPage} of ${lastPage}`,
                  })}
                </span>
                <button
                  onClick={() => load(currentPage + 1)}
                  disabled={currentPage === lastPage}
                  aria-label={t('common.next', 'Next page')}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 text-gray-600 hover:bg-amber-50 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <NextIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
