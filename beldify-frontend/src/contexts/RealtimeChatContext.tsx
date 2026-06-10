'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import Pusher from 'pusher-js';
import { useAuth } from './AuthContext';
import logger from '@/utils/consoleLogger';
import { API_BASE_URL } from '@/config/constants';

interface RealtimeChatContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, message: any) => void;
  onMessageReceived: (callback: (message: any) => void) => void;
  onNotificationReceived: (callback: (data: any) => void) => void;
  onUserTyping: (callback: (data: { userId: string; isTyping: boolean }) => void) => void;
  sendTypingIndicator: (roomId: string, isTyping: boolean) => void;
  activeRooms: string[];
  pusher: Pusher | null;
}

const defaultContext: RealtimeChatContextType = {
  isConnected: false,
  connectionStatus: 'disconnected',
  joinRoom: () => {},
  leaveRoom: () => {},
  sendMessage: () => {},
  onMessageReceived: () => {},
  onNotificationReceived: () => {},
  onUserTyping: () => {},
  sendTypingIndicator: () => {},
  activeRooms: [],
  pusher: null,
};

const RealtimeChatContext = createContext<RealtimeChatContextType>(defaultContext);

export const useRealtimeChat = () => useContext(RealtimeChatContext);

export const RealtimeChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [activeRooms, setActiveRooms] = useState<string[]>([]);
  const { isAuthenticated, user } = useAuth();

  // Refs for Pusher and callbacks
  const pusherRef = useRef<Pusher | null>(null);
  const messageCallbackRef = useRef<((message: any) => void) | null>(null);
  const notificationCallbackRef = useRef<((data: any) => void) | null>(null);
  const typingCallbackRef = useRef<((data: { userId: string; isTyping: boolean }) => void) | null>(null);
  const channelsRef = useRef<Map<string, any>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;

  // Connect to Pusher/Laravel Reverb
  const connect = useCallback(() => {
    if (!isAuthenticated || !user) {
      logger.log('RealtimeChat: Not authenticated, skipping connection');
      return;
    }

    if (pusherRef.current?.connection.state === 'connected') {
      logger.log('RealtimeChat: Already connected');
      return;
    }

    try {
      setConnectionStatus('connecting');

      // Get auth token (with SSR guard)
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';
      if (!token) {
        logger.log('RealtimeChat: No token available, skipping connection');
        setConnectionStatus('disconnected');
        return;
      }

      const reverbKey = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
      if (!reverbKey) {
        logger.warn('RealtimeChat: NEXT_PUBLIC_REVERB_APP_KEY is not set; skipping realtime connection (polling fallback stays active)');
        setConnectionStatus('disconnected');
        return;
      }

      // TLS scheme drives both the wss/ws transport and forceTLS. Defaults to https.
      const useTLS = (process.env.NEXT_PUBLIC_REVERB_SCHEME || 'https') !== 'http';

      // Configure Pusher for Laravel Reverb.
      // Auth goes DIRECTLY to the Laravel backend: pusher-js POSTs a
      // application/x-www-form-urlencoded body which Laravel parses natively.
      // (The Next proxy at /api/broadcasting/auth does req.json() and would 500
      // on that body, so it is intentionally bypassed here.)
      pusherRef.current = new Pusher(reverbKey, {
        wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || new URL(API_BASE_URL).hostname,
        wsPort: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || '8082'),
        wssPort: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || '8082'),
        forceTLS: useTLS,
        enabledTransports: useTLS ? ['wss'] : ['ws'],
        cluster: 'mt1', // Required for Pusher compatibility
        authEndpoint: `${process.env.NEXT_PUBLIC_API_URL}/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          }
        },
        // Additional options for better connection handling
        disableStats: true,
        enableLogging: process.env.NODE_ENV === 'development',
      });

      // Connection event handlers
      pusherRef.current.connection.bind('connected', () => {
        logger.log('RealtimeChat: Connected to WebSocket');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
      });

      pusherRef.current.connection.bind('disconnected', () => {
        logger.log('RealtimeChat: Disconnected from WebSocket');
        setIsConnected(false);
        setConnectionStatus('disconnected');

        // Attempt to reconnect if authenticated and under max attempts
        if (isAuthenticated && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          logger.log(`RealtimeChat: Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      });

      pusherRef.current.connection.bind('error', (error: any) => {
        logger.error('RealtimeChat: Connection error:', error);
        setConnectionStatus('error');
      });

      // Subscribe to user's private channel for incoming messages
      const userId = user.id;
      const privateChannel = pusherRef.current.subscribe(`private-user.${userId}`);

      privateChannel.bind('message-sent', (data: any) => {
        logger.log('RealtimeChat: New message received:', data);
        if (messageCallbackRef.current) {
          messageCallbackRef.current(data.message);
        }
      });

      privateChannel.bind('notification-created', (data: any) => {
        logger.log('RealtimeChat: Notification received:', data);
        if (notificationCallbackRef.current) {
          notificationCallbackRef.current(data);
        }
      });

      privateChannel.bind('typing-indicator', (data: any) => {
        logger.log('RealtimeChat: Typing indicator:', data);
        if (typingCallbackRef.current) {
          typingCallbackRef.current(data);
        }
      });

      // Store the private channel
      channelsRef.current.set(`private-user.${userId}`, privateChannel);

    } catch (error) {
      logger.error('RealtimeChat: Failed to create connection:', error);
      setConnectionStatus('error');
    }
  }, [isAuthenticated, user]);

  // Disconnect from Pusher
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Unsubscribe from all channels
    channelsRef.current.forEach((channel, name) => {
      pusherRef.current?.unsubscribe(name);
    });
    channelsRef.current.clear();

    if (pusherRef.current) {
      pusherRef.current.disconnect();
      pusherRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    setActiveRooms([]);
  }, []);

  // Join a chat room/conversation
  const joinRoom = useCallback((roomId: string) => {
    if (!pusherRef.current || pusherRef.current.connection.state !== 'connected') {
      logger.warn('RealtimeChat: Cannot join room - not connected');
      return;
    }

    // Subscribe to conversation channel if not already subscribed
    const channelName = `private-conversation.${roomId}`;
    if (!channelsRef.current.has(channelName)) {
      const channel = pusherRef.current.subscribe(channelName);

      channel.bind('message-sent', (data: any) => {
        logger.log(`RealtimeChat: Message in room ${roomId}:`, data);
        if (messageCallbackRef.current) {
          messageCallbackRef.current(data.message);
        }
      });

      channel.bind('typing', (data: any) => {
        logger.log(`RealtimeChat: Typing in room ${roomId}:`, data);
        if (typingCallbackRef.current) {
          typingCallbackRef.current(data);
        }
      });

      channelsRef.current.set(channelName, channel);
    }

    setActiveRooms(prev => [...new Set([...prev, roomId])]);
    logger.log(`RealtimeChat: Joined room ${roomId}`);
  }, []);

  // Leave a chat room
  const leaveRoom = useCallback((roomId: string) => {
    const channelName = `private-conversation.${roomId}`;
    const channel = channelsRef.current.get(channelName);

    if (channel) {
      pusherRef.current?.unsubscribe(channelName);
      channelsRef.current.delete(channelName);
    }

    setActiveRooms(prev => prev.filter(id => id !== roomId));
    logger.log(`RealtimeChat: Left room ${roomId}`);
  }, []);

  // Send a message to a room (via API, not WebSocket)
  const sendMessage = useCallback((roomId: string, message: any) => {
    logger.log(`RealtimeChat: Sending message to room ${roomId}:`, message);
    // Messages are sent via API endpoints, not directly through WebSocket
    // The backend will broadcast the message via WebSocket after saving
  }, []);

  // Send typing indicator
  const sendTypingIndicator = useCallback((roomId: string, isTyping: boolean) => {
    const channelName = `private-conversation.${roomId}`;
    const channel = channelsRef.current.get(channelName);

    if (channel && user) {
      // Trigger client event for typing indicator
      channel.trigger('client-typing', {
        userId: user.id,
        isTyping: isTyping
      });
    }
  }, [user]);

  // Set message received callback
  const onMessageReceived = useCallback((callback: (message: any) => void) => {
    messageCallbackRef.current = callback;
  }, []);

  // Set notification received callback
  const onNotificationReceived = useCallback((callback: (data: any) => void) => {
    notificationCallbackRef.current = callback;
  }, []);

  // Set typing indicator callback
  const onUserTyping = useCallback((callback: (data: { userId: string; isTyping: boolean }) => void) => {
    typingCallbackRef.current = callback;
  }, []);

  // Connect when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user, connect, disconnect]);

  const contextValue: RealtimeChatContextType = {
    isConnected,
    connectionStatus,
    joinRoom,
    leaveRoom,
    sendMessage,
    onMessageReceived,
    onNotificationReceived,
    onUserTyping,
    sendTypingIndicator,
    activeRooms,
    pusher: pusherRef.current,
  };

  return (
    <RealtimeChatContext.Provider value={contextValue}>
      {children}
    </RealtimeChatContext.Provider>
  );
};

export default RealtimeChatContext;