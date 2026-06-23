'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  getUnreadCount,
  getNotifications,
  markAsRead as serviceMarkAsRead,
  markAllAsRead as serviceMarkAllAsRead,
  Notification,
} from '@/services/notificationService';
import logger from '@/utils/consoleLogger';
import { useAuth } from './AuthContext';

// ── Context shape ─────────────────────────────────────────────────────────────

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  isLoading: boolean;
  refreshUnreadCount: () => Promise<void>;
  fetchNotifications: (page?: number) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  onNotificationReceived?: (cb: (data: any) => void) => void;
}

const defaultContext: NotificationContextType = {
  unreadCount: 0,
  notifications: [],
  isLoading: false,
  refreshUnreadCount: async () => {},
  fetchNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
};

const NotificationContext = createContext<NotificationContextType>(defaultContext);

export const useNotifications = () => useContext(NotificationContext);

// ── Provider ──────────────────────────────────────────────────────────────────

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isAuthenticated, user } = useAuth();

  const lastCheckedRef = useRef<number>(0);
  const isRefreshingRef = useRef<boolean>(false);
  const notificationCallbackRef = useRef<((data: any) => void) | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleAuthoritativeRefresh = useCallback((delayMs: number) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = setTimeout(() => {
      lastCheckedRef.current = 0;
      refreshTimerRef.current = null;
      void refreshUnreadCountRef.current?.();
    }, delayMs);
  }, []);

  // refreshUnreadCount is defined below; we keep a ref so scheduleAuthoritativeRefresh
  // doesn't need to depend on it (and risk recreating timers on every render).
  const refreshUnreadCountRef = useRef<(() => Promise<void>) | null>(null);

  // ── Throttled unread count refresh (mirrors MessagingContext) ──────────────

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user || isRefreshingRef.current) return;

    const now = Date.now();
    const elapsed = now - lastCheckedRef.current;

    // 5-second throttle guard
    if (elapsed < 5000 && lastCheckedRef.current !== 0) {
      if (process.env.NODE_ENV === 'development') {
        logger.log(
          'NotificationContext: throttling — last check was',
          Math.round(elapsed / 1000),
          's ago'
        );
      }
      return;
    }

    try {
      isRefreshingRef.current = true;
      const result = await getUnreadCount();

      // unread_count matches the backend /api/v1/notifications/unread-count response
      // Functional setState so this callback doesn't depend on `unreadCount` — otherwise
      // the captured `unreadCount` goes stale after optimistic markAsRead decrement.
      const incoming = result.unread_count ?? 0;
      setUnreadCount((prev) => (incoming !== prev ? incoming : prev));

      lastCheckedRef.current = now;
    } catch (error) {
      logger.error('NotificationContext: refreshUnreadCount error:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [isAuthenticated, user]);

  // Keep the latest refreshUnreadCount accessible to the scheduler without
  // adding it to scheduleAuthoritativeRefresh's deps.
  useEffect(() => {
    refreshUnreadCountRef.current = refreshUnreadCount;
  }, [refreshUnreadCount]);

  // ── Fetch notification list ────────────────────────────────────────────────

  const fetchNotifications = useCallback(
    async (page: number = 1) => {
      if (!isAuthenticated || !user) return;
      try {
        setIsLoading(true);
        const result = await getNotifications(page);
        setNotifications(result.data ?? []);
      } catch (error) {
        logger.error('NotificationContext: fetchNotifications error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, user]
  );

  // ── Optimistic mark-as-read ────────────────────────────────────────────────

  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic: decrement badge and flip read_at in list immediately
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      await serviceMarkAsRead(id);
      // Authoritative refresh after a short delay — scheduled via ref so rapid
      // mark-as-read taps don't stack timers or call setState after unmount.
      scheduleAuthoritativeRefresh(1000);
    },
    [scheduleAuthoritativeRefresh]
  );

  const markAllAsRead = useCallback(async () => {
    // Optimistic: zero badge and mark all items read
    setUnreadCount(0);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    await serviceMarkAllAsRead();
    scheduleAuthoritativeRefresh(1000);
  }, [scheduleAuthoritativeRefresh]);

  // ── Optional realtime: expose setter for RealtimeChatContext ──────────────

  const onNotificationReceived = useCallback((cb: (data: any) => void) => {
    notificationCallbackRef.current = cb;
  }, []);

  // ── Polling — 30-second interval + window focus ────────────────────────────

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    refreshUnreadCount();

    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 30000);

    const handleFocus = () => {
      lastCheckedRef.current = 0; // bypass throttle on focus
      refreshUnreadCount();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        isLoading,
        refreshUnreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        onNotificationReceived,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
