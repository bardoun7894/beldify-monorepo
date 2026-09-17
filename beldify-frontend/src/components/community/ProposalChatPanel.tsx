'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Loader2,
  Wallet,
  Clock,
  BadgeCheck,
  MessageSquare,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeChat } from '@/contexts/RealtimeChatContext';
import { useDirection } from '@/hooks/useDirection';
import * as messagingService from '@/services/messagingService';
import type { CommunityResponse, Message } from '@/types/community';
import logger from '@/utils/consoleLogger';
import { groupMessagesByDay } from '@/utils/groupMessagesByDay';
import { ConversationDateDivider } from '@/components/messaging/ConversationDateDivider';
import { TypingIndicator } from '@/components/messaging/TypingIndicator';

/**
 * Inline proposal chat — a slide-over drawer rendered ON the post detail page so
 * the buyer never navigates away. It reuses the same messagingService thread the
 * standalone /community/messages/[shopId] page uses (keyed by shopId + postId),
 * but pins the FULL proposal details (shop, price, delivery, cover message) as a
 * context header above the conversation. Anti-disintermediation is preserved:
 * everything stays in-app, scoped to a seller who has already submitted a proposal.
 */
interface ProposalChatPanelProps {
  /** Shop / seller id — the conversation key. */
  shopId: string;
  /** Post id so the thread is scoped to this job. */
  postId: string;
  /** The proposal being discussed — drives the context header. */
  response: CommunityResponse;
  /** Resolved shop display name for the header. */
  shopName: string;
  /** Whether this proposal was already accepted (changes the header label). */
  isAccepted?: boolean;
  onClose: () => void;
}

export default function ProposalChatPanel({
  shopId,
  postId,
  response,
  shopName,
  isAccepted = false,
  onClose,
}: ProposalChatPanelProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { isRTL } = useDirection();
  const {
    onMessageReceived,
    onUserTyping,
    sendTypingIndicator,
    isConnected,
  } = useRealtimeChat();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = user?.id != null ? String(user.id) : null;

  const isMine = useCallback(
    (m: Message) => {
      const sender = String((m as any).sender_id ?? (m as any).senderId ?? '');
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
        setError(null);
      } catch (err) {
        logger.error('Error loading proposal conversation:', err);
        setError(t('messages.error_loading') || 'Failed to load conversation');
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [shopId, postId, t]
  );

  // Load + poll (light cadence when the socket is live, responsive when it's down).
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchMessages(true);
    const id = setInterval(() => fetchMessages(false), isConnected ? 20000 : 8000);
    return () => clearInterval(id);
  }, [isAuthenticated, fetchMessages, isConnected]);

  // Realtime: append this seller's replies as they arrive.
  useEffect(() => {
    if (!isAuthenticated) return;
    onMessageReceived((msg: any) => {
      if (!msg) return;
      if (String(msg.store_id ?? msg.shop_id ?? '') !== shopId) return;
      appendMessage(msg as Message);
    });
    return () => {
      onMessageReceived(() => {});
    };
  }, [isAuthenticated, shopId, onMessageReceived, appendMessage]);

  // Realtime: typing indicator.
  useEffect(() => {
    if (!isAuthenticated) return;
    onUserTyping(({ isTyping }) => {
      setIsOtherTyping(isTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 4000);
      }
    });
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [isAuthenticated, onUserTyping]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
      fetchMessages(false);
    } catch (err) {
      logger.error('Error sending proposal message:', err);
      setError(t('messages.error_sending') || 'Failed to send message');
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const initial = (shopName || '?').charAt(0).toUpperCase();
  const deliveryDays = response.delivery_days ?? response.deliveryDays ?? null;
  const coverMessage = response.description || '';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer */}
        <motion.div
          initial={{ x: isRTL ? '-100%' : '100%' }}
          animate={{ x: 0 }}
          exit={{ x: isRTL ? '-100%' : '100%' }}
          transition={{ type: 'tween', duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
          className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        >
          {/* ── Header — shop + close ──────────────────────────────────── */}
          <div className="flex items-center gap-3 bg-indigo-700 px-4 py-3 text-white">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white ring-2 ring-white/20">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="flex items-center gap-1 truncate text-sm font-semibold">
                {shopName}
                {response.shop?.isVerified && (
                  <BadgeCheck size={13} className="shrink-0 text-amber-300" />
                )}
              </h2>
              <p className="text-[11px] text-indigo-200">
                {isAccepted
                  ? t('community.contact_seller', 'Message')
                  : t('community.discuss_proposal', 'Discuss')}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label={t('common.close', 'Close')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Proposal context — all details ─────────────────────────── */}
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {response.price != null && response.price > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 ring-1 ring-amber-200">
                  <Wallet size={12} className="shrink-0 text-amber-700" />
                  <span className="text-xs font-bold text-amber-900">
                    {response.price.toLocaleString()}{' '}
                    <span className="font-medium text-amber-700">
                      {response.currency || 'MAD'}
                    </span>
                  </span>
                </div>
              )}
              {deliveryDays != null && (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 ring-1 ring-indigo-100">
                  <Clock size={12} className="shrink-0 text-indigo-600" />
                  <span className="text-xs font-semibold text-indigo-700">
                    {t('community.delivery_in_days', 'Delivers in {{days}} days', {
                      days: deliveryDays,
                    })}
                  </span>
                </div>
              )}
            </div>
            {coverMessage && (
              <p
                className="line-clamp-3 text-xs leading-relaxed text-gray-600"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                {coverMessage}
              </p>
            )}
          </div>

          {/* ── Thread ─────────────────────────────────────────────────── */}
          <div
            role="log"
            aria-live="polite"
            className="flex-1 space-y-2.5 overflow-y-auto bg-white px-4 py-4"
          >
            {loading ? (
              <div className="space-y-3" aria-busy="true">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`animate-pulse rounded-2xl ${
                        i % 2 === 0 ? 'bg-gray-100' : 'bg-indigo-100'
                      }`}
                      style={{ width: `${40 + i * 12}%`, height: '40px' }}
                    />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="mb-3 text-sm font-medium text-rose-600">{error}</p>
                <button
                  onClick={() => fetchMessages(true)}
                  className="rounded-full bg-indigo-700 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-800"
                >
                  {t('common.retry', 'Retry')}
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200">
                  <MessageSquare className="h-6 w-6 text-amber-400" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {t('messages.no_messages_yet', 'No messages yet')}
                </p>
                <p className="mt-1 max-w-xs text-xs text-gray-400">
                  {t('community.discuss_proposal_hint', 'Ask about the price, timeline, or details before you hire.')}
                </p>
              </div>
            ) : (
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
                          {!mine && (
                            <div className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                              {initial}
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] break-words rounded-2xl px-3.5 py-2.5 text-sm ${
                              mine
                                ? 'rounded-ee-md bg-indigo-700 text-white'
                                : 'rounded-es-md bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                            {timestamp && (
                              <span
                                className={`mt-1 block text-[10px] tabular-nums ${
                                  mine ? 'text-indigo-200 text-end' : 'text-gray-400'
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
                {isOtherTyping && <TypingIndicator />}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Composer ───────────────────────────────────────────────── */}
          <form
            onSubmit={handleSend}
            className="flex items-end gap-2 border-t border-gray-100 bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                sendTypingIndicator(response.userId, shopId, e.target.value.length > 0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e as unknown as React.FormEvent);
                }
              }}
              rows={1}
              placeholder={t('messages.type_a_message', 'Type a message…')}
              aria-label={t('messages.type_a_message', 'Type a message…')}
              dir={isRTL ? 'rtl' : 'ltr'}
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-800 ring-1 ring-gray-200 transition placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label={t('messages.send', 'Send')}
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-amber-500 text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
