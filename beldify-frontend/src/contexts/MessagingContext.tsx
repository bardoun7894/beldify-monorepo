'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getUnreadCount } from '@/services/messagingService';
import logger from '@/utils/consoleLogger';
import { useAuth } from './AuthContext';
import useFCM from '@/hooks/useFCM';
import { requestNotificationPermission } from '@/utils/fcm';
import toast from '@/utils/toast';

interface MessagingContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  isLoading: boolean;
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
  
  // FCM Integration – useFCM always returns a safe state, even when messaging is disabled
  const { token: fcmToken, notification: fcmNotification, setNotification: setFCMNotification, error: fcmError } = useFCM();
  
  // Use refs to track the last check time and prevent duplicate calls
  const lastCheckedRef = useRef<number>(0);
  const isRefreshingRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track latest count in a ref so refreshUnreadCount stays referentially stable
  // (referencing unreadCount in deps would tear down the 30s polling interval on every change).
  const unreadCountRef = useRef<number>(0);
  useEffect(() => {
    unreadCountRef.current = unreadCount;
  }, [unreadCount]);

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
        logger.log('Skipping unread count check - last check was', Math.round(timeSinceLastCheck/1000), 'seconds ago');
      }
      return;
    }

    try {
      isRefreshingRef.current = true;
      setIsLoading(true);

      // Pass the last checked timestamp to the API for optimization
      const result = await getUnreadCount(lastCheckedRef.current);

      // Only update state if the count has changed (compare against ref to avoid stale-closure dep).
      if (result.count !== unreadCountRef.current) {
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
  }, [isAuthenticated, user]);

  // Debounced wrapper — useRef + useCallback so the debounced fn shares the same
  // pending-timeout slot across renders and stays referentially stable.
  const debouncedRefresh = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      refreshUnreadCount();
    }, 300);
  }, [refreshUnreadCount]);

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

  // Handle FCM notification permission request
  const handleRequestNotificationPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Guard: Notification API requires secure context (HTTPS or localhost)
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return false;
      }
      const granted = await requestNotificationPermission();
      setHasNotificationPermission(granted);
      return granted;
    } catch (error) {
      logger.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Handle FCM notifications globally
  useEffect(() => {
    if (fcmNotification) {
      // Show notification toast
      toast.success(`${fcmNotification.title}: ${fcmNotification.body}`, {
        duration: 5000,
        onClick: () => {
          // Navigate to conversation if we're not already there
          if (fcmNotification.data?.sender_id) {
            window.location.href = `/community/messages/${fcmNotification.data.sender_id}`;
          }
        }
      });
      
      // Refresh unread count when we receive a notification
      refreshUnreadCount();
      
      // Clear notification
      setFCMNotification(null);
    }
  }, [fcmNotification, setFCMNotification, refreshUnreadCount]);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = Notification.permission === 'granted';
        setHasNotificationPermission(permission);
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
        fcmToken,
        hasNotificationPermission,
        requestNotificationPermission: handleRequestNotificationPermission,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
};

export default MessagingContext;
