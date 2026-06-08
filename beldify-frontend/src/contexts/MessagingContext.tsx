'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getUnreadCount } from '@/services/messagingService';
import logger from '@/utils/consoleLogger';
import { useAuth } from './AuthContext';
import toast from '@/utils/toast';

// Note: Firebase/FCM removed. Push notifications now handled via native Web Push
// through useWebPush hook + the Serwist service worker push/notificationclick handlers.

interface MessagingContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  isLoading: boolean;
  /** @deprecated FCM removed — always empty string. Will be removed. */
  fcmToken: string;
  hasNotificationPermission: boolean;
  requestNotificationPermission: () => Promise<boolean>;
}

const defaultContext: MessagingContextType = {
  unreadCount: 0,
  refreshUnreadCount: async () => {},
  isLoading: false,
  fcmToken: '',
  hasNotificationPermission: false,
  requestNotificationPermission: async () => false,
};

const MessagingContext = createContext<MessagingContextType>(defaultContext);

export const useMessaging = () => useContext(MessagingContext);

export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(false);
  const { isAuthenticated, user } = useAuth();

  // Use refs to track the last check time and prevent duplicate calls
  const lastCheckedRef = useRef<number>(0);
  const isRefreshingRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce function to prevent multiple rapid calls
  const debounce = (func: (...args: unknown[]) => void, wait: number) => {
    return (...args: unknown[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        func(...args);
      }, wait);
    };
  };

  const refreshUnreadCount = useCallback(async () => {
    // Don't proceed if not authenticated, already refreshing, or checked recently (within 5 seconds)
    if (!isAuthenticated || !user || isRefreshingRef.current) {
      return;
    }

    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckedRef.current;

    // Prevent checking more than once every 5 seconds
    if (timeSinceLastCheck < 5000 && lastCheckedRef.current !== 0) {
      if (process.env.NODE_ENV === 'development') {
        logger.log('Skipping unread count check - last check was', Math.round(timeSinceLastCheck / 1000), 'seconds ago');
      }
      return;
    }

    try {
      isRefreshingRef.current = true;
      setIsLoading(true);

      // Pass the last checked timestamp to the API for optimization
      const result = await getUnreadCount(lastCheckedRef.current);

      // Only update state if the count has changed
      if (result.count !== unreadCount) {
        setUnreadCount(result.count);
        if (process.env.NODE_ENV === 'development') {
          logger.log('Updated unread message count:', result.count);
        }
      } else if (process.env.NODE_ENV === 'development') {
        logger.log('Unread count unchanged:', result.count);
      }

      // Update the last checked timestamp
      lastCheckedRef.current = now;
    } catch (error) {
      logger.error('Failed to fetch unread message count:', error);
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  }, [isAuthenticated, user, unreadCount]);

  // Create a debounced version of refreshUnreadCount
  const debouncedRefresh = useCallback(debounce(refreshUnreadCount, 300), [refreshUnreadCount]);

  // Initial fetch when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      debouncedRefresh();
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated, user, debouncedRefresh]);

  // Set up polling to check for new messages every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Initial check
    debouncedRefresh();

    const interval = setInterval(() => {
      debouncedRefresh();
    }, 30000); // 30 seconds

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAuthenticated, user, debouncedRefresh]);

  // Native notification permission handler (no Firebase dependency)
  const handleRequestNotificationPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Guard: Notification API requires secure context (HTTPS or localhost)
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return false;
      }
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setHasNotificationPermission(granted);

      if (!granted) {
        logger.log('Notification permission denied');
      } else {
        logger.log('Notification permission granted');
      }
      return granted;
    } catch (error) {
      logger.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const granted = Notification.permission === 'granted';
        setHasNotificationPermission(granted);
      } catch {
        // Notification API may throw in insecure contexts
        setHasNotificationPermission(false);
      }
    }
  }, []);

  // Request notification permission when user is authenticated
  // Only attempt if Notification API is available (requires secure context)
  useEffect(() => {
    if (isAuthenticated && !hasNotificationPermission && typeof window !== 'undefined' && 'Notification' in window) {
      handleRequestNotificationPermission();
    }
  }, [isAuthenticated, hasNotificationPermission, handleRequestNotificationPermission]);

  return (
    <MessagingContext.Provider
      value={{
        unreadCount,
        refreshUnreadCount,
        isLoading,
        fcmToken: '', // deprecated — FCM removed
        hasNotificationPermission,
        requestNotificationPermission: handleRequestNotificationPermission,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
};

export default MessagingContext;
