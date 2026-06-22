'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getUnreadCount } from '@/services/messagingService';
import logger from '@/utils/consoleLogger';

interface UnreadBadgeProps {
  className?: string;
  showZero?: boolean;
  pollInterval?: number;
  onNewMessages?: (count: number) => void;
}

/**
 * Component to display unread message count badge
 */
export const UnreadBadge: React.FC<UnreadBadgeProps> = ({
  className = '',
  showZero = false,
  pollInterval = 30000, // 30 seconds default
  onNewMessages
}) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Refs so the polling effect doesn't tear down/rebuild on every fetch
  // (previously: setLastCheck in effect → dep change → cleanup interval → re-run → fetch
  // immediately → repeat — endpoint was hit at roundtrip speed, not pollInterval).
  const lastCheckRef = useRef<number>(Date.now());
  const unreadCountRef = useRef<number>(0);
  const onNewMessagesRef = useRef(onNewMessages);

  useEffect(() => {
    unreadCountRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    onNewMessagesRef.current = onNewMessages;
  }, [onNewMessages]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const result = await getUnreadCount(lastCheckRef.current);

        if (result.count !== unreadCountRef.current) {
          setUnreadCount(result.count);

          if (onNewMessagesRef.current && result.hasNew) {
            onNewMessagesRef.current(result.count);
          }
        }

        lastCheckRef.current = result.currentTimestamp || Date.now();
      } catch (error) {
        logger.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, pollInterval);

    const handleFocus = () => {
      fetchUnreadCount();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [pollInterval]);

  // Don't show badge if count is 0 and showZero is false
  if (!showZero && unreadCount === 0) {
    return null;
  }

  return (
    <span
      className={`
        inline-flex items-center justify-center
        min-w-[20px] h-5 px-1.5
        text-xs font-semibold text-white
        bg-red-500 rounded-full
        ${className}
      `}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
};

export default UnreadBadge;