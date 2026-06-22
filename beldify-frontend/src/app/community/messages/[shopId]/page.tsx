'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { MessageSquare, ChevronLeft, Send, Loader2 } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { useAuth } from '@/contexts/AuthContext';
import * as messagingService from '@/services/messagingService';
import { Message } from '@/types/community';
import i18nInstance from '@/i18n/config';
import logger from '@/utils/consoleLogger';

/**
 * Conversation detail page — a single customer↔seller thread.
 *
 * Route: /community/messages/[shopId]  (the conversation id IS the shop id).
 * Loads history via messagingService.getConversation() and sends via
 * messagingService.sendMessage(); both are keyed by the shop id.
 */
export default function ConversationPage() {
  const { t } = useTranslation('common');
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const shopId = String(params?.shopId ?? '');
  const postId = searchParams?.get('postId') || undefined;

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<{ name?: string; logo?: string | null; avatar?: string | null }>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = user?.id != null ? String(user.id) : null;

  // True when the message was sent by the logged-in customer (right-aligned).
  const isMine = useCallback(
    (m: Message) => {
      const sender = String((m as any).sender_id ?? m.senderId ?? '');
      return currentUserId != null && sender === currentUserId;
    },
    [currentUserId]
  );

  const sortChrono = (list: Message[]) =>
    [...list].sort((a, b) => {
      const da = new Date((a as any).created_at ?? (a as any).createdAt ?? 0).getTime();
      const db = new Date((b as any).created_at ?? (b as any).createdAt ?? 0).getTime();
      return da - db;
    });

  const fetchMessages = useCallback(
    async (showSpinner = false) => {
      if (!shopId) return;
      try {
        if (showSpinner) setLoading(true);
        const data = await messagingService.getConversation(shopId, 1, 50, postId);
        setMessages(sortChrono(data.messages || []));
        if (data.otherUser) setOtherUser(data.otherUser);
        setError(null);
      } catch (err) {
        logger.error('Error loading conversation:', err);
        setError(t('messages.error_loading') || 'Failed to load conversation');
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [shopId, postId, t]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchMessages(true);
    // Light polling so replies appear without a manual refresh.
    const id = setInterval(() => fetchMessages(false), 8000);
    return () => clearInterval(id);
  }, [isAuthenticated, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      const localeMap: Record<string, string> = { en: 'en-US', fr: 'fr-FR', ar: 'ar-MA', ma: 'ar-MA', es: 'es-ES' };
      return d.toLocaleTimeString(localeMap[i18nInstance.language] || 'fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput('');
    try {
      const sent = await messagingService.sendMessage(shopId, content, postId);
      setMessages((prev) => sortChrono([...prev, sent]));
      // Reconcile with server (ids, read flags) shortly after.
      fetchMessages(false);
    } catch (err) {
      logger.error('Error sending message:', err);
      setError(t('messages.error_sending') || 'Failed to send message');
      setInput(content); // restore so the user doesn't lose their text
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="tw-min-h-screen tw-flex tw-items-center tw-justify-center tw-px-4">
        <div className="tw-text-center">
          <MessageSquare className="tw-w-16 tw-h-16 tw-text-gray-300 tw-mx-auto tw-mb-4" />
          <h2 className="tw-text-xl tw-font-semibold tw-text-gray-700 tw-mb-2">
            {t('messages.sign_in_required') || 'Sign in to view messages'}
          </h2>
          <Link
            href="/login"
            className="tw-inline-flex tw-items-center tw-px-6 tw-py-3 tw-bg-indigo-600 tw-text-white tw-rounded-lg hover:tw-bg-indigo-700 tw-transition"
          >
            {t('messages.sign_in') || 'Sign In'}
          </Link>
        </div>
      </div>
    );
  }

  const title = otherUser.name || t('messages.conversation') || 'Conversation';
  const avatarUrl = otherUser.logo || otherUser.avatar || null;
  const initial = (otherUser.name || '?').charAt(0).toUpperCase();

  return (
    <div className="tw-min-h-screen tw-bg-gray-50 tw-flex tw-flex-col">
      <div className="tw-max-w-2xl tw-mx-auto tw-w-full tw-flex tw-flex-col tw-flex-1 tw-px-0 sm:tw-px-4">
        {/* Header */}
        <div className="tw-sticky tw-top-0 tw-z-10 tw-flex tw-items-center tw-gap-3 tw-bg-white tw-border-b tw-border-gray-100 tw-px-4 tw-py-3">
          <button
            onClick={() => router.back()}
            aria-label={t('common.back') || 'Back'}
            className="tw-p-2 tw-rounded-full hover:tw-bg-gray-100 tw-transition"
          >
            <ChevronLeft className="tw-w-5 tw-h-5" />
          </button>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={title} className="tw-w-9 tw-h-9 tw-rounded-full tw-object-cover" />
          ) : (
            <span className="tw-w-9 tw-h-9 tw-rounded-full tw-bg-indigo-100 tw-text-indigo-700 tw-flex tw-items-center tw-justify-center tw-font-semibold">
              {initial}
            </span>
          )}
          <h1 className="tw-text-base tw-font-semibold tw-text-gray-900 tw-truncate">{title}</h1>
        </div>

        {/* Messages */}
        <div className="tw-flex-1 tw-overflow-y-auto tw-px-4 tw-py-4 tw-space-y-2">
          {loading ? (
            <div className="tw-flex tw-justify-center tw-py-10">
              <Loader2 className="tw-w-6 tw-h-6 tw-text-indigo-500 tw-animate-spin" />
            </div>
          ) : error ? (
            <div className="tw-text-center tw-text-red-500 tw-py-6 tw-text-sm">{error}</div>
          ) : messages.length === 0 ? (
            <div className="tw-text-center tw-text-gray-400 tw-py-10 tw-text-sm">
              {t('messages.no_messages_yet') || 'No messages yet. Say hello!'}
            </div>
          ) : (
            messages.map((m) => {
              const mine = isMine(m);
              return (
                <div key={String(m.id)} className={`tw-flex ${mine ? 'tw-justify-end' : 'tw-justify-start'}`}>
                  <div
                    className={`tw-max-w-[75%] tw-rounded-2xl tw-px-3.5 tw-py-2 tw-text-sm tw-break-words ${
                      mine
                        ? 'tw-bg-indigo-600 tw-text-white tw-rounded-br-sm'
                        : 'tw-bg-white tw-text-gray-800 tw-border tw-border-gray-100 tw-rounded-bl-sm'
                    }`}
                  >
                    <p className="tw-whitespace-pre-wrap tw-m-0">{m.content}</p>
                    <span className={`tw-block tw-mt-1 tw-text-[10px] ${mine ? 'tw-text-indigo-200' : 'tw-text-gray-400'}`}>
                      {formatTime((m as any).created_at ?? (m as any).createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSend}
          className="tw-sticky tw-bottom-0 tw-flex tw-items-end tw-gap-2 tw-bg-white tw-border-t tw-border-gray-100 tw-px-4 tw-py-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as unknown as React.FormEvent);
              }
            }}
            rows={1}
            placeholder={t('messages.type_a_message') || 'Type a message…'}
            className="tw-flex-1 tw-resize-none tw-rounded-2xl tw-border tw-border-gray-200 tw-px-4 tw-py-2.5 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-indigo-400 tw-max-h-32"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label={t('messages.send') || 'Send'}
            className="tw-flex tw-items-center tw-justify-center tw-w-11 tw-h-11 tw-rounded-full tw-bg-indigo-600 tw-text-white disabled:tw-opacity-50 hover:tw-bg-indigo-700 tw-transition tw-flex-shrink-0"
          >
            {sending ? <Loader2 className="tw-w-5 tw-h-5 tw-animate-spin" /> : <Send className="tw-w-5 tw-h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
