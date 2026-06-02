'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRecentMessages } from '@/services/messagingService';
import { Message } from '@/types/community';
import { useAuth } from '@/contexts/AuthContext';
import { useMessaging } from '@/contexts/MessagingContext';
import logger from '@/utils/consoleLogger';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useDirection } from '@/hooks/useDirection';
import { convertStorageUrl } from '@/utils/storageUrls';
import Image from 'next/image';
import {
  MessagesSquare,
  Sparkles,
  RefreshCw,
  Search,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface Shop {
  id: number | string;
  name: string;
  avatar?: string;
  logo?: string;
  isOnline?: boolean;
}

interface ExtendedMessage extends Message {
  is_online?: boolean;
  name?: string;
  logo?: string | null;
  avatar?: string | null;
  last_message?: {
    id: number | string;
    content: string;
    is_read: boolean;
    created_at: string;
    attachments: any[];
  };
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ExtendedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { refreshUnreadCount } = useMessaging();
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const prefersReducedMotion = useReducedMotion();

  const fetchConversations = useCallback(async () => {
      setIsLoading(true);
      try {
        const messages = await getRecentMessages() as ExtendedMessage[];
        
        // Debug log to see what we're getting from the API
        if (process.env.NODE_ENV === 'development') {
          logger.log('Messages received:', messages);
          logger.log('Messages count:', messages.length);
          if (messages.length > 0) {
            logger.log('Sample message structure:', JSON.stringify(messages[0], null, 2));
          } else {
            logger.log('No messages received from API');
          }
        }
        
        // Group messages by shop/sender
        const conversationMap = new Map<string, ExtendedMessage>();
        
        messages.forEach(message => {
          // Try to extract shop ID from various possible properties
          // For the new API format, we use the message ID as the key if shop ID is not available
          const shopId = message.shop_id || message.shopId || 
                        (message.shop && message.shop.id) || 
                        message.receiver_id || 
                        message.id; // Use message ID as fallback
          
          if (!shopId) {
            logger.warn('Message missing both shop ID and message ID:', message);
            return;
          }
          
          const key = String(shopId);
          
          // Debug which shop/conversation IDs we're processing
          if (process.env.NODE_ENV === 'development') {
            logger.log(`Processing message for conversation ID: ${key}`);
          }
          
          // Only keep the most recent message for each conversation
          const messageDate = new Date(message.createdAt || message.created_at || 
                                      (message.last_message && message.last_message.created_at) || 
                                      message.updated_at || Date.now());
          const existingMessage = conversationMap.get(key);
          const existingDate = conversationMap.has(key) && existingMessage ? 
            new Date(existingMessage.createdAt || 
                    existingMessage.created_at || 
                    (existingMessage.last_message && existingMessage.last_message.created_at) || 
                    existingMessage.updated_at || 
                    0) : new Date(0);
          
          if (!conversationMap.has(key) || messageDate > existingDate) {
            conversationMap.set(key, message);
          }
        }); 
        
        // Convert map to array and sort by date (newest first)
        const sortedConversations = Array.from(conversationMap.values())
          .sort((a, b) => {
            const dateA = new Date(a.createdAt || a.created_at || a.updated_at || 0);
            const dateB = new Date(b.createdAt || b.created_at || b.updated_at || 0);
            return dateB.getTime() - dateA.getTime();
          });
        
        if (process.env.NODE_ENV === 'development') {
          logger.log('Sorted conversations:', sortedConversations.length);
        }
        
        setConversations(sortedConversations);
        
        // Refresh the unread count after loading conversations
        refreshUnreadCount();
      } catch (error) {
        logger.error('Error fetching conversations:', error);
      } finally {
        setIsLoading(false);
      }
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    } else {
      // Redirect to login if not authenticated
      router.push('/login?redirect=/community/messages');
    }
  }, [isAuthenticated, router, fetchConversations]);

  const formatMessageDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return '';
      }
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale: isRTL ? ar : enUS
      });
    } catch (error) {
      console.warn('Invalid date string:', dateString, error);
      return '';
    }
  };

  const getAvatarUrl = (message: ExtendedMessage) => {
    // Check all possible avatar locations in the message object
    const shopAvatar = message.avatar || 
                      message.shop?.avatar || 
                      message.shopAvatar || 
                      (message.shop?.logo || message.logo);
                      
    if (!shopAvatar) return '/images/default-avatar.png';
    
    return convertStorageUrl(shopAvatar);
  };

  const getShopName = (message: ExtendedMessage) => {
    return message.name || message.shop?.name || message.shopName || t('community.messages.unknown_shop');
  };

  const handleConversationClick = (shopId: string | number) => {
    router.push(`/community/messages/${shopId}`);
  };

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    const shopName = getShopName(conversation).toLowerCase();
    const lastMessage = conversation.last_message?.content || conversation.content || '';
    return shopName.includes(searchQuery.toLowerCase()) || 
           lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-background">
      {/* ── Editorial Hero Band — Atlas indigo ──────────────────────────── */}
      <section className="bg-atlas-primary text-white">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-6 sm:py-14">
          <h1
            className="font-heading text-3xl font-bold leading-tight sm:text-4xl"
            style={{ textWrap: 'balance' }}
          >
            {t('community.messages.title', 'Your Conversations')}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#a8a7e1]">
            {t('community.messages.subtitle', 'Stay connected with ateliers and buyers, all in one place.')}
          </p>
          {conversations.length > 0 && (
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-atlas-secondary px-3 py-1 text-xs font-semibold text-on-secondary">
              <Sparkles size={13} className="shrink-0" aria-hidden="true" />
              {conversations.length}{' '}
              {conversations.length === 1
                ? t('community.messages.conversation', 'conversation')
                : t('community.messages.conversations', 'conversations')}
            </span>
          )}
        </div>
      </section>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {isLoading ? (
          <div className="space-y-3" aria-busy="true" aria-label={t('common.loading', 'Loading')}>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-4 rounded-2xl bg-card p-4 shadow-atlas-sm ring-1 ring-outline/15"
              >
                <div className="h-12 w-12 shrink-0 rounded-full bg-outline/15" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-3.5 w-1/3 rounded-full bg-outline/15" />
                  <div className="h-3 w-2/3 rounded-full bg-outline/10" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-2xl bg-card px-6 py-16 text-center shadow-atlas-sm ring-1 ring-outline/15">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-atlas-secondary/15 ring-1 ring-atlas-secondary/30">
              <MessagesSquare size={40} className="text-atlas-secondary" aria-hidden="true" />
            </div>
            <h3 className="font-heading text-xl font-bold text-on-surface">
              {t('community.messages.no_conversations', 'No conversations yet')}
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-on-surface-variant">
              {t('community.messages.start_conversation', 'Start browsing products and connect with sellers to begin your first conversation')}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/community"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-atlas-primary px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-container focus:outline-none focus-visible:ring-2 focus-visible:ring-atlas-primary focus-visible:ring-offset-2"
              >
                <Sparkles size={16} aria-hidden="true" />
                {t('community.explore_community', 'Explore Community')}
              </Link>
              <Link
                href="/products"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-on-surface ring-1 ring-outline/30 transition-colors duration-200 hover:bg-atlas-secondary/10 hover:ring-outline/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-atlas-primary focus-visible:ring-offset-2"
              >
                <Search size={16} aria-hidden="true" />
                {t('common.browse_products', 'Browse Products')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Search and Actions Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-md">
                <Search
                  size={15}
                  className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[44px] rounded-full bg-card py-2.5 ps-10 pe-4 text-sm text-on-surface shadow-atlas-sm ring-1 ring-outline/20 transition placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-atlas-primary"
                  placeholder={t('community.messages.search_conversations', 'Search conversations...')}
                  aria-label={t('community.messages.search_conversations', 'Search conversations...')}
                />
              </div>
              <button
                onClick={() => fetchConversations()}
                disabled={isLoading}
                aria-label={t('common.refresh', 'Refresh')}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-card px-5 py-2.5 text-sm font-semibold text-on-surface shadow-atlas-sm ring-1 ring-outline/20 transition-colors duration-200 hover:bg-atlas-secondary/10 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-atlas-primary focus-visible:ring-offset-2"
              >
                <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} aria-hidden="true" />
                {t('common.refresh', 'Refresh')}
              </button>
            </div>

            {/* Conversations List */}
            <div className="overflow-hidden rounded-2xl bg-card shadow-atlas-sm ring-1 ring-outline/15">
              <div className="border-b border-outline/12 px-5 py-4">
                <h2 className="text-sm font-semibold text-on-surface">
                  {t('community.messages.recent_conversations', 'Recent Conversations')}
                </h2>
              </div>

              <div className="divide-y divide-outline/10">
                <AnimatePresence>
                  {filteredConversations.map((message: ExtendedMessage) => {
                    const shopId = message.shop_id || message.shopId || message.id;
                    if (!shopId) return null;

                    const hasUnread = message.unread_count && message.unread_count > 0;
                    const lastActive = formatMessageDate(message.updated_at || message.createdAt || message.created_at);
                    const shopName = getShopName(message);

                    return (
                      <motion.div
                        key={String(message.id)}
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Link
                          href={`/community/messages/${shopId}`}
                          className={`flex items-center gap-4 px-5 py-4 transition-colors duration-200 focus:outline-none focus-visible:bg-atlas-secondary/10 ${
                            hasUnread ? 'bg-atlas-secondary/[0.07] hover:bg-atlas-secondary/[0.12]' : 'hover:bg-atlas-secondary/[0.06]'
                          }`}
                        >
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            <div
                              className={`relative h-12 w-12 overflow-hidden rounded-full ring-1 ${
                                hasUnread ? 'ring-atlas-secondary' : 'ring-outline/20'
                              }`}
                            >
                              <Image src={getAvatarUrl(message)} alt={shopName} fill className="object-cover" />
                            </div>
                            {message.is_online === true && (
                              <span className="absolute -bottom-0.5 end-0 block h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-card" aria-hidden="true" />
                            )}
                          </div>

                          {/* Conversation Info */}
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-baseline justify-between gap-3">
                              <h3 className="truncate text-sm font-semibold text-on-surface">{shopName}</h3>
                              <span className="shrink-0 whitespace-nowrap text-[11px] text-on-surface-variant">
                                {lastActive}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <p
                                className={`min-w-0 flex-1 truncate text-[13px] ${
                                  hasUnread ? 'font-medium text-on-surface' : 'text-on-surface-variant'
                                }`}
                              >
                                {message.last_message?.content || message.content || t('community.messages.no_messages')}
                              </p>
                              {hasUnread ? (
                                <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-atlas-secondary px-1.5 text-[11px] font-bold text-on-secondary">
                                  {message.unread_count}
                                </span>
                              ) : (
                                <ChevronRight
                                  size={15}
                                  className="shrink-0 text-on-surface-variant/50 rtl:rotate-180"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {filteredConversations.length === 0 && searchQuery && (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-atlas-secondary/15 ring-1 ring-atlas-secondary/30">
                    <Search size={20} className="text-atlas-secondary" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-semibold text-on-surface">
                    {t('common.no_results', 'No results found')}
                  </h3>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    {t('community.messages.no_search_results', 'Try adjusting your search to find what you\'re looking for')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
