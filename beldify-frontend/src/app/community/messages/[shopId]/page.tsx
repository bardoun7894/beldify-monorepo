'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { MessageSquare, ChevronLeft, Send, Loader2, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { useAuth } from '@/contexts/AuthContext';
import * as messagingService from '@/services/messagingService';
import { Message } from '@/types/community';
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

  // ── Not authenticated ──────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full ring-1 ring-amber-200 flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-9 h-9 text-amber-500" />
          </div>
          <h2
            className="text-2xl font-bold text-gray-900 mb-3"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('messages.sign_in_required') || 'Sign in to view messages'}
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            {t('messages.sign_in_description') || 'Access your conversations with artisan ateliers.'}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-indigo-700 text-white rounded-full font-semibold text-sm hover:bg-indigo-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2"
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
    <div className="min-h-screen bg-amber-50 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1 px-0 sm:px-4">

        {/* ── Sticky Header ───────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 flex items-center gap-3 bg-white border-b border-amber-100 px-4 py-3 shadow-atlas-sm">
          <button
            onClick={() => router.back()}
            aria-label={t('common.back') || 'Back'}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-amber-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 rtl:rotate-180"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Avatar */}
          {avatarUrl ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-1 ring-amber-200 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt={title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <span className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm shrink-0 ring-1 ring-indigo-200">
              {initial}
            </span>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-gray-900 truncate">{title}</h1>
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-gray-500">
              {t('messages.conversation') || 'Conversation'}
            </p>
          </div>

          {/* Back to all messages */}
          <Link
            href="/community/messages"
            aria-label={t('messages.all_conversations') || 'All conversations'}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-amber-50 text-gray-500 hover:text-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>

        {/* ── Message Thread ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
          {loading ? (
            /* Loading skeleton */
            <div className="space-y-4" aria-busy="true" aria-label={t('common.loading') || 'Loading'}>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 animate-pulse bg-amber-100/70 ${
                      i % 2 === 0 ? 'rounded-es-sm' : 'rounded-ee-sm'
                    }`}
                    style={{ width: `${40 + i * 12}%`, height: '40px' }}
                  />
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error state */
            <div className="flex items-center justify-center py-12">
              <div className="bg-rose-50 rounded-2xl ring-1 ring-rose-200 p-6 text-center max-w-sm w-full">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-5 h-5 text-rose-600" />
                </div>
                <p className="text-sm text-rose-700 font-medium mb-4">{error}</p>
                <button
                  onClick={() => fetchMessages(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-indigo-700 text-white rounded-full text-sm font-semibold hover:bg-indigo-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
                >
                  {t('common.retry') || 'Retry'}
                </button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-20 h-20 bg-amber-50 rounded-full ring-1 ring-amber-200 flex items-center justify-center mb-6">
                <MessageSquare className="w-9 h-9 text-amber-400" />
              </div>
              <h3
                className="text-xl font-bold text-gray-900 mb-2"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('messages.no_messages_yet') || 'No messages yet'}
              </h3>
              <p className="text-sm text-gray-600 max-w-xs">
                {t('messages.start_conversation_hint') || 'Start the conversation — say hello to the atelier.'}
              </p>
            </div>
          ) : (
            /* Messages */
            messages.map((m) => {
              const mine = isMine(m);
              const timestamp = formatTime((m as any).created_at ?? (m as any).createdAt);
              return (
                <div
                  key={String(m.id)}
                  className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Other user avatar — only on theirs */}
                  {!mine && (
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold shrink-0 ring-1 ring-indigo-200 mb-1">
                      {initial}
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm break-words shadow-atlas-sm ${
                      mine
                        ? 'bg-indigo-700 text-white rounded-ee-sm'
                        : 'bg-white text-gray-800 ring-1 ring-amber-100 rounded-es-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    {timestamp && (
                      <span
                        className={`block mt-1 font-mono text-[10px] tracking-[0.1em] ${
                          mine ? 'text-indigo-200' : 'text-gray-400'
                        }`}
                      >
                        {timestamp}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Composer ────────────────────────────────────────────────────── */}
        <form
          onSubmit={handleSend}
          className="sticky bottom-0 flex items-end gap-2 bg-white border-t border-amber-100 px-4 py-3 shadow-atlas-sm"
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
            className="flex-1 resize-none rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 max-h-32 transition-all duration-200 placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label={t('messages.send') || 'Send'}
            className="flex items-center justify-center w-11 h-11 min-h-[44px] min-w-[44px] rounded-full bg-indigo-700 text-white disabled:opacity-40 hover:bg-indigo-800 transition-colors duration-200 shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 rtl:rotate-180" />
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
