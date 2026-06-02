'use client';

import React, { useEffect, useState } from 'react';
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
  const [lastCheck, setLastCheck] = useState<number>(Date.now());

  useEffect(() => {
    // Function to fetch unread count
    const fetchUnreadCount = async () => {
      try {
        const result = await getUnreadCount(lastCheck);

        if (result.count !== unreadCount) {
          setUnreadCount(result.count);

          // Notify parent component about new messages
          if (onNewMessages && result.hasNew) {
            onNewMessages(result.count);
          }
        }

        setLastCheck(result.currentTimestamp || Date.now());
      } catch (error) {
        logger.error('Failed to fetch unread count:', error);
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
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [lastCheck, unreadCount, pollInterval, onNewMessages]);

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