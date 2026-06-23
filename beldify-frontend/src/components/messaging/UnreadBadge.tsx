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
  // Use a ref for lastCheck so polling doesn't restart the effect on every fetch
  const lastCheckRef = useRef<number>(Date.now());
  const onNewMessagesRef = useRef(onNewMessages);
  onNewMessagesRef.current = onNewMessages;

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const result = await getUnreadCount(lastCheckRef.current);
        lastCheckRef.current = result.currentTimestamp || Date.now();

        setUnreadCount((prev) => {
          if (result.count !== prev) {
            if (onNewMessagesRef.current && result.hasNew) {
              onNewMessagesRef.current(result.count);
            }
            return result.count;
          }
          return prev;
        });
      } catch (error) {
        logger.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, pollInterval);

    const handleFocus = () => fetchUnreadCount();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [pollInterval]);

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
