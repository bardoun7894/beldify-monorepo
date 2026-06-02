'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import { Bell, CheckCheck, Package, MessageCircle, Scissors, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS, fr, es } from 'date-fns/locale';
import type { Notification } from '@/services/notificationService';

// ── Type helpers ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; href: (data: any) => string; labelKey: string; fallback: string }
> = {
  order_placed: {
    icon: ShoppingBag,
    href: () => '/orders',
    labelKey: 'notifications.bell.types.order_placed',
    fallback: 'New order placed',
  },
  order_status: {
    icon: Package,
    href: (d: any) =>
      d?.order_number ? `/orders/${d.order_number}` : '/orders',
    labelKey: 'notifications.bell.types.order_status',
    fallback: 'Order status updated',
  },
  community_response: {
    icon: MessageCircle,
    href: (d: any) =>
      d?.post_id ? `/community/posts/${d.post_id}` : '/community',
    labelKey: 'notifications.bell.types.community_response',
    fallback: 'New response on your post',
  },
  tailoring_booking: {
    icon: Scissors,
    href: () => '/services/tailoring',
    labelKey: 'notifications.bell.types.tailoring_booking',
    fallback: 'Tailoring booking update',
  },
  new_message: {
    icon: MessageCircle,
    href: (d: any) =>
      d?.sender_id ? `/community/messages/${d.sender_id}` : '/community/messages',
    labelKey: 'notifications.bell.types.new_message',
    fallback: 'New message',
  },
};

const getConfig = (type: string) => {
  // Normalise to last segment e.g. "App\\Notifications\\OrderPlaced" → try full key first
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

// ── Sub-components ────────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) {
  const { markAsRead } = useNotifications();
  const { t, i18n } = useTranslation();
  const config = getConfig(notification.type);
  const Icon = config?.icon ?? Bell;
  const href = config?.href(notification.data) ?? '/notifications';
  const label = config ? t(config.labelKey, config.fallback) : notification.type;

  // Prefer a message from data if present
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

  const handleClick = async () => {
    if (isUnread) {
      await markAsRead(notification.id);
    }
    onClose();
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 px-4 py-3 text-sm transition hover:bg-amber-50/80 focus-visible:outline-none focus-visible:bg-amber-50',
        isUnread ? 'bg-amber-50/40' : ''
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
          isUnread ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'line-clamp-2 leading-snug',
            isUnread ? 'font-medium text-gray-900' : 'text-gray-600'
          )}
        >
          {message}
        </p>
        {timeAgo && (
          <p className="mt-0.5 text-[11px] text-gray-400">{timeAgo}</p>
        )}
      </div>
      {isUnread && (
        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
      )}
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const { unreadCount, notifications, fetchNotifications, markAllAsRead } = useNotifications();
  const { t } = useTranslation();

  // Fetch notifications when the dropdown opens via Button onClick
  const handleButtonClick = () => {
    fetchNotifications();
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    fetchNotifications();
  };

  const MAX_PREVIEW = 8;
  const preview = notifications.slice(0, MAX_PREVIEW);

  return (
    <Menu as="div" className="relative">
      {() => (
          <>
            <Menu.Button
              onClick={handleButtonClick}
              aria-label={
                unreadCount > 0
                  ? t('notifications.bell.ariaWithCount', {
                      count: unreadCount,
                      defaultValue: `Notifications, ${unreadCount} unread`,
                    })
                  : t('notifications.bell.aria', 'Notifications')
              }
              className="relative flex items-center justify-center w-9 h-9 text-gray-600 hover:text-indigo-700 rounded-full hover:bg-amber-100/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -end-1 bg-amber-500 text-amber-950 text-[10px] font-bold rounded-full h-4 min-w-[1rem] px-1 flex items-center justify-center leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                className="absolute end-0 z-20 mt-2 w-80 origin-top-end bg-white shadow-xl ring-1 ring-amber-200 rounded-2xl overflow-hidden focus:outline-none"
                style={{ maxHeight: '480px' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-amber-100">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {t('notifications.bell.title', 'Notifications')}
                    {unreadCount > 0 && (
                      <span className="ms-2 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full px-1.5 py-0.5">
                        {unreadCount}
                      </span>
                    )}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAll}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition font-medium"
                      aria-label={t('notifications.bell.markAllRead', 'Mark all as read')}
                    >
                      <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t('notifications.bell.markAllRead', 'Mark all read')}</span>
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
                  {preview.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <Bell className="h-8 w-8 text-gray-200 mb-2" aria-hidden="true" />
                      <p className="text-sm text-gray-400">
                        {t('notifications.bell.empty', 'No notifications yet')}
                      </p>
                    </div>
                  ) : (
                    preview.map((n) => (
                      <Menu.Item key={n.id}>
                        {() => (
                          <NotificationItem
                            notification={n}
                            onClose={() => {}}
                          />
                        )}
                      </Menu.Item>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-amber-100 px-4 py-2.5">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/notifications"
                        className={cn(
                          'block text-center text-xs font-medium transition rounded-lg py-1',
                          active ? 'text-indigo-700 bg-amber-50' : 'text-indigo-600 hover:text-indigo-800'
                        )}
                      >
                        {t('notifications.bell.viewAll', 'View all notifications')}
                      </Link>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </>
      )}
    </Menu>
  );
}
