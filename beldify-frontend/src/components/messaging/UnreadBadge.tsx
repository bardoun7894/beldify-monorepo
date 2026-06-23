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
  const lastCheckRef = useRef<number>(Date.now());
  const unreadCountRef = useRef<number>(0);
  const onNewMessagesRef = useRef(onNewMessages);

  // Keep callback ref current without re-running the polling effect
  useEffect(() => {
    onNewMessagesRef.current = onNewMessages;
  }, [onNewMessages]);

  useEffect(() => {
    let cancelled = false;

    const fetchUnreadCount = async () => {
      try {
        const result = await getUnreadCount(lastCheckRef.current);
        if (cancelled) return;

        if (result.count !== unreadCountRef.current) {
          unreadCountRef.current = result.count;
          setUnreadCount(result.count);

          if (onNewMessagesRef.current && result.hasNew) {
            onNewMessagesRef.current(result.count);
          }
        }

        lastCheckRef.current = result.currentTimestamp || Date.now();
      } catch (error) {
        if (!cancelled) logger.error('Failed to fetch unread count:', error);
      }
    };

    // Initial fetch
    fetchUnreadCount();

    // Set up polling
    const interval = setInterval(fetchUnreadCount, pollInterval);

    // Also fetch when window regains focus
    const handleFocus = () => {
      fetchUnreadCount();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      cancelled = true;
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
        text-xs font-semibold text-amber-950
        bg-amber-500 rounded-full
        ${className}
      `}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
};

export default UnreadBadge;