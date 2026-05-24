'use client';

import React, { useState, useEffect } from 'react';
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
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  MessagesSquare,
  Sparkles,
  RefreshCw,
  Search,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  useEffect(() => {
    const fetchConversations = async () => {
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
    };

    if (isAuthenticated) {
      fetchConversations();
    } else {
      // Redirect to login if not authenticated
      router.push('/login?redirect=/community/messages');
    }
  }, [isAuthenticated, router, refreshUnreadCount]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Editorial Hero Band */}
      <section className="bg-indigo-700 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-amber-300 text-xs uppercase tracking-[0.18em] font-medium mb-3">
            {t('community.messages.hub', 'Messages Hub')}
          </p>
          <h1
            className="text-3xl sm:text-4xl font-bold leading-tight mb-3"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('community.messages.title', 'Your Conversations')}
          </h1>
          <p className="text-indigo-200 text-base max-w-xl mb-4">
            {t('community.messages.subtitle', 'Stay connected with ateliers and buyers — all in one place.')}
          </p>
          {conversations.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-medium">
              <Sparkles size={12} className="shrink-0" />
              {conversations.length} {conversations.length === 1 ? t('community.messages.conversation') : t('community.messages.conversations')}
            </span>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <div className="text-center">
              <LoadingSpinner className="h-12 w-12 mx-auto mb-4 text-indigo-700" />
              <p className="text-indigo-700 font-medium">{t('common.loading')}</p>
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 rounded-full bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center mb-6">
              <MessagesSquare size={40} className="text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {t('community.messages.no_conversations', 'No conversations yet')}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {t('community.messages.start_conversation', 'Start browsing products and connect with sellers to begin your first conversation')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/community"
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-indigo-700 text-white font-medium rounded-full hover:bg-indigo-800 transition-colors duration-200"
              >
                <Sparkles size={16} />
                {t('community.explore_community', 'Explore Community')}
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] ring-1 ring-amber-200 text-gray-700 font-medium rounded-full hover:ring-amber-300 hover:bg-amber-50 transition-all duration-200"
              >
                <Search size={16} />
                {t('common.browse_products', 'Browse Products')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search and Actions Bar */}
            <div className="bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search size={14} className="text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-2xl focus:ring-2 focus:ring-amber-300 focus:border-indigo-500"
                      placeholder={t('community.messages.search_conversations', 'Search conversations...')}
                    />
                  </div>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium text-gray-700 ring-1 ring-amber-200 rounded-full hover:ring-amber-300 hover:bg-amber-50 transition-all duration-200"
                >
                  <RefreshCw size={14} />
                  {t('common.refresh')}
                </button>
              </div>
            </div>

            {/* Conversations List */}
            <div className="bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 overflow-hidden">
              <div className="border-b border-amber-200 px-6 py-4">
                <h2 className="text-base font-semibold text-gray-900">
                  {t('community.messages.recent_conversations', 'Recent Conversations')}
                </h2>
              </div>

              <div className="divide-y divide-amber-100">
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
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Link
                          href={`/community/messages/${shopId}`}
                          className={`block p-5 hover:bg-amber-50 transition-all duration-200 ${hasUnread ? 'bg-amber-50/70 ring-2 ring-amber-500 rounded-2xl mx-1 my-1' : ''}`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              <div className={`relative w-12 h-12 rounded-full overflow-hidden ring-1 ${hasUnread ? 'ring-amber-400' : 'ring-amber-200'}`}>
                                <Image
                                  src={getAvatarUrl(message)}
                                  alt={shopName}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              {message.is_online === true && (
                                <span className="absolute -bottom-0.5 -right-0.5 block h-3.5 w-3.5 rounded-full bg-amber-500 ring-2 ring-white"></span>
                              )}
                            </div>

                            {/* Conversation Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="text-sm font-semibold text-gray-900 truncate">
                                  {shopName}
                                </h3>
                                <div className="flex items-center gap-2">
                                  {message.is_online === true && (
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 ring-1 ring-amber-200 uppercase tracking-wide">
                                      {t('common.online')}
                                    </span>
                                  )}
                                  <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-gray-500 whitespace-nowrap">
                                    {lastActive}
                                  </span>
                                </div>
                              </div>

                              <p className={`text-xs truncate mb-2 ${hasUnread ? 'text-indigo-700 font-medium' : 'text-gray-600'}`}>
                                {message.last_message?.content || message.content || t('community.messages.no_messages')}
                              </p>

                              <div className="flex items-center justify-between">
                                {hasUnread && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 ring-1 ring-amber-200">
                                    {message.unread_count} {message.unread_count === 1 ? t('community.messages.new_message') : t('community.messages.new_messages')}
                                  </span>
                                )}
                                <ChevronRight size={14} className="text-gray-400 ml-auto" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
              
              {filteredConversations.length === 0 && searchQuery && (
                <div className="text-center py-12">
                  <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center mb-4">
                    <Search size={20} className="text-amber-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">
                    {t('common.no_results', 'No results found')}
                  </h3>
                  <p className="text-sm text-gray-600">
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
