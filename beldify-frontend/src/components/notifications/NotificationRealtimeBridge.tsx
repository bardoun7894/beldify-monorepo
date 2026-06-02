'use client';

import { useEffect } from 'react';
import { useRealtimeChat } from '@/contexts/RealtimeChatContext';
import { useNotifications } from '@/contexts/NotificationContext';

/**
 * Bridges the realtime `notification-created` event to the notification badge.
 * Rendered inside RealtimeChatProvider (which is nested under NotificationProvider),
 * so both hooks are in scope. When a notification broadcast arrives it refreshes the
 * unread count immediately instead of waiting for the 30s poll. Renders nothing.
 */
export default function NotificationRealtimeBridge() {
  const { onNotificationReceived } = useRealtimeChat();
  const { refreshUnreadCount } = useNotifications();

  useEffect(() => {
    onNotificationReceived(() => {
      void refreshUnreadCount();
    });
  }, [onNotificationReceived, refreshUnreadCount]);

  return null;
}
