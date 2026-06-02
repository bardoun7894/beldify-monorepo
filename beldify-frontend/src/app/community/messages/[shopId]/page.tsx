'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { MessageSquare, ChevronLeft, Send, Loader2, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeChat } from '@/contexts/RealtimeChatContext';
import * as messagingService from '@/services/messagingService';
import { Message } from '@/types/community';
import logger from '@/utils/consoleLogger';
import { groupMessagesByDay } from '@/utils/groupMessagesByDay';
import { ConversationDateDivider } from '@/components/messaging/ConversationDateDivider';
import { TypingIndicator } from '@/components/messaging/TypingIndicator';

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
  const { onMessageReceived, onUserTyping, sendTypingIndicator, isConnected, connectionStatus } = useRealtimeChat();
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
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Append a single message, de-duplicating by id so a socket payload and the
  // poll/optimistic copy of the same message never double up.
  const appendMessage = useCallback((incoming: Message) => {
    setMessages((prev) => {
      const incomingId = String(incoming.id);
      if (prev.some((m) => String(m.id) === incomingId)) return prev;
      return sortChrono([...prev, incoming]);
    });
  }, []);

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
    // Polling is the graceful fallback. When the websocket is live we can poll
    // far less often (20s) since replies arrive in real time; when it is down we
    // keep the responsive 8s cadence.
    const id = setInterval(() => fetchMessages(false), isConnected ? 20000 : 8000);
    return () => clearInterval(id);
  }, [isAuthenticated, fetchMessages, isConnected]);

  // ── Realtime: append seller replies to THIS conversation as they arrive ────
  // Backend broadcasts MessageSent on PrivateChannel("user.{recipient_id}") as
  // "message-sent". The context already subscribes the current user's private
  // channel; here we just register a handler scoped to this open conversation.
  useEffect(() => {
    if (!isAuthenticated) return;
    onMessageReceived((msg: any) => {
      if (!msg) return;
      // The conversation is keyed by the shop (store_id). store_id arrives as a
      // number in JSON while shopId is a string from the route param, so coerce.
      if (String(msg.store_id ?? msg.shop_id ?? '') !== shopId) return;
      appendMessage(msg as Message);
    });
    // The context uses a single-writer callback ref (no unregister API), so on
    // unmount we replace it with a no-op to drop this conversation's closure.
    return () => {
      onMessageReceived(() => {});
    };
  }, [isAuthenticated, shopId, onMessageReceived, appendMessage]);

  // ── Realtime: typing indicator ────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    onUserTyping(({ isTyping }) => {
      setIsOtherTyping(isTyping);
      // Auto-clear after 4 s in case the stop event is missed.
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 4000);
      }
    });
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [isAuthenticated, onUserTyping]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isOtherTyping]);

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      appendMessage(sent);
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

  // ── Not authenticated ──────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-atlas-secondary/15 ring-1 ring-atlas-secondary/30">
            <MessageSquare className="h-9 w-9 text-atlas-secondary" aria-hidden="true" />
          </div>
          <h2 className="mb-3 font-heading text-2xl font-bold text-on-surface">
            {t('messages.sign_in_required') || 'Sign in to view messages'}
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
            {t('messages.sign_in_description') || 'Access your conversations with artisan ateliers.'}
          </p>
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-atlas-primary px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-container focus:outline-none focus-visible:ring-2 focus-visible:ring-atlas-primary focus-visible:ring-offset-2"
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

  const statusLabel = isConnected
    ? t('messages.live') || 'Live'
    : connectionStatus === 'connecting'
    ? t('messages.connecting') || 'Connecting…'
    : t('messages.offline') || 'Offline';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">

        {/* ── Sticky Header — Atlas indigo ────────────────────────────────── */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-atlas-primary px-3 py-3 text-white shadow-atlas-md">
          <button
            onClick={() => router.back()}
            aria-label={t('common.back') || 'Back'}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white/90 transition-colors duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rtl:rotate-180"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Avatar */}
          {avatarUrl ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt={title} className="h-full w-full object-cover" />
            </div>
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-atlas-secondary text-sm font-bold text-on-secondary ring-2 ring-white/20">
              {initial}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-semibold leading-tight">{title}</h1>
            {/* Subtle realtime indicator: live (emerald) / connecting (amber-pulse) / offline (gray) */}
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-[#a8a7e1]">
              <span
                aria-hidden="true"
                className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                  isConnected
                    ? 'bg-emerald-400'
                    : connectionStatus === 'connecting'
                    ? 'bg-atlas-secondary animate-pulse'
                    : 'bg-white/40'
                }`}
              />
              {statusLabel}
            </p>
          </div>

          {/* Back to all messages */}
          <Link
            href="/community/messages"
            aria-label={t('messages.all_conversations') || 'All conversations'}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white/80 transition-colors duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </header>

        {/* ── Message Thread ──────────────────────────────────────────────── */}
        <div
          role="log"
          aria-live="polite"
          aria-label={t('messages.conversation') || 'Conversation'}
          className="flex-1 space-y-2.5 overflow-y-auto px-4 py-6"
        >
          {loading ? (
            /* Loading skeleton */
            <div className="space-y-3" aria-busy="true" aria-label={t('common.loading') || 'Loading'}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`animate-pulse rounded-2xl ${
                      i % 2 === 0 ? 'rounded-es-md bg-card ring-1 ring-outline/15' : 'rounded-ee-md bg-atlas-primary/20'
                    }`}
                    style={{ width: `${40 + i * 12}%`, height: '44px' }}
                  />
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error state */
            <div className="flex items-center justify-center py-12">
              <div className="w-full max-w-sm rounded-2xl bg-card p-6 text-center shadow-atlas-sm ring-1 ring-destructive/25">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <MessageSquare className="h-5 w-5 text-destructive" aria-hidden="true" />
                </div>
                <p className="mb-4 text-sm font-medium text-destructive">{error}</p>
                <button
                  onClick={() => fetchMessages(true)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-atlas-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-container focus:outline-none focus-visible:ring-2 focus-visible:ring-atlas-primary focus-visible:ring-offset-2"
                >
                  {t('common.retry') || 'Retry'}
                </button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-atlas-secondary/15 ring-1 ring-atlas-secondary/30">
                <MessageSquare className="h-9 w-9 text-atlas-secondary" aria-hidden="true" />
              </div>
              <h3 className="mb-2 font-heading text-xl font-bold text-on-surface">
                {t('messages.no_messages_yet') || 'No messages yet'}
              </h3>
              <p className="max-w-xs text-sm leading-relaxed text-on-surface-variant">
                {t('messages.start_conversation_hint') || 'Start the conversation, say hello to the atelier.'}
              </p>
            </div>
          ) : (
            /* Messages grouped by day with date dividers */
            <>
              {groupMessagesByDay(messages).map((group) => (
                <React.Fragment key={group.dateKey}>
                  <ConversationDateDivider label={group.label} />
                  {group.messages.map((m) => {
                    const mine = isMine(m);
                    const timestamp = formatTime((m as any).created_at ?? (m as any).createdAt);
                    return (
                      <div
                        key={String(m.id)}
                        className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Other user avatar — only on theirs */}
                        {!mine && (
                          <div className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-atlas-secondary text-[11px] font-bold text-on-secondary">
                            {initial}
                          </div>
                        )}

                        <div
                          className={`max-w-[78%] break-words rounded-2xl px-3.5 py-2.5 text-sm shadow-atlas-sm ${
                            mine
                              ? 'rounded-ee-md bg-atlas-primary text-white'
                              : 'rounded-es-md bg-card text-on-surface ring-1 ring-outline/15'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                          {timestamp && (
                            <span
                              className={`mt-1 block text-[10px] tabular-nums ${
                                mine ? 'text-[#a8a7e1] text-end' : 'text-on-surface-variant/70'
                              }`}
                            >
                              {timestamp}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
              {/* Typing indicator — shown when the other party is typing */}
              {isOtherTyping && <TypingIndicator />}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Composer ────────────────────────────────────────────────────── */}
        <form
          onSubmit={handleSend}
          className="sticky bottom-0 flex items-end gap-2 border-t border-outline/12 bg-card px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-2px_8px_0_hsl(240_39%_24%/0.06)]"
        >
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Emit typing indicator on every keystroke; the context debounces.
              sendTypingIndicator(shopId, e.target.value.length > 0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as unknown as React.FormEvent);
              }
            }}
            rows={1}
            placeholder={t('messages.type_a_message') || 'Type a message…'}
            aria-label={t('messages.type_a_message') || 'Type a message…'}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl bg-background px-4 py-3 text-sm text-on-surface ring-1 ring-outline/25 transition placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-atlas-primary"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label={t('messages.send') || 'Send'}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-atlas-secondary text-on-secondary transition-colors duration-200 hover:bg-atlas-secondary/90 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-atlas-primary focus-visible:ring-offset-2"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
