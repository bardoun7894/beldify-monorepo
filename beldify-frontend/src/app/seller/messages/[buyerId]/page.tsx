'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import {
  getSellerThread,
  sendSellerMessage,
  markSellerThreadRead,
  SellerMessageItem,
  SellerOtherUser,
  SellerPagination,
} from '@/services/messagingService';
import {
  ChevronLeft,
  Send,
  Loader2,
  MessageSquare,
  ChevronUp,
} from 'lucide-react';
import { groupMessagesByDay } from '@/utils/groupMessagesByDay';
import { ConversationDateDivider } from '@/components/messaging/ConversationDateDivider';
import logger from '@/utils/consoleLogger';

// ── Polling interval while thread is open ────────────────────────────────────
const POLL_INTERVAL_MS = 15_000;

function formatTime(dateString: string | undefined): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function OtherUserAvatar({ user }: { user: SellerOtherUser }) {
  const initial = (user.display_name || '?').charAt(0).toUpperCase();
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[11px] font-bold text-indigo-950">
      {initial}
    </span>
  );
}

function HeaderAvatar({ user }: { user: SellerOtherUser }) {
  const initial = (user.display_name || '?').charAt(0).toUpperCase();
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-indigo-950 ring-2 ring-white/20">
      {initial}
    </span>
  );
}

export default function SellerThreadPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const buyerId = String(params?.buyerId ?? '');
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const [messages, setMessages] = useState<SellerMessageItem[]>([]);
  const [otherUser, setOtherUser] = useState<SellerOtherUser>({ id: '', display_name: '', avatar: null });
  const [pagination, setPagination] = useState<SellerPagination>({ current_page: 1, last_page: 1, total: 0 });

  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // de-duplicate + sort by created_at ascending
  const mergeMessages = useCallback((existing: SellerMessageItem[], incoming: SellerMessageItem[]): SellerMessageItem[] => {
    const map = new Map(existing.map((m) => [String(m.id), m]));
    incoming.forEach((m) => map.set(String(m.id), m));
    return [...map.values()].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, []);

  const fetchThread = useCallback(
    async (page: number = 1, showSpinner = false) => {
      if (!buyerId) return;
      try {
        if (showSpinner) setLoading(true);
        const data = await getSellerThread(buyerId, page);
        if (page === 1) {
          setMessages(
            [...data.messages].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
          );
        } else {
          setMessages((prev) => mergeMessages(prev, data.messages));
        }
        setOtherUser(data.otherUser);
        setPagination(data.pagination);
        setError(null);
        setIsForbidden(false);
      } catch (err: any) {
        if (err?.response?.status === 403 || String(err).includes('403')) {
          setIsForbidden(true);
        } else {
          setError(t('seller.messages.error_loading', 'Failed to load conversation.'));
          logger.error('getSellerThread error:', err);
        }
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [buyerId, t, mergeMessages]
  );

  // Initial load + mark read
  useEffect(() => {
    if (!isAuthenticated || !buyerId) return;
    fetchThread(1, true);
    markSellerThreadRead(buyerId).catch(() => {});
  }, [isAuthenticated, buyerId, fetchThread]);

  // Polling for new messages
  useEffect(() => {
    if (!isAuthenticated || !buyerId) return;
    const id = setInterval(() => fetchThread(1, false), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, buyerId, fetchThread]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleLoadOlder = async () => {
    if (loadingOlder || pagination.current_page >= pagination.last_page) return;
    setLoadingOlder(true);
    try {
      await fetchThread(pagination.current_page + 1, false);
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput('');

    // Optimistic append
    const optimistic: SellerMessageItem = {
      id: `opt-${Date.now()}`,
      sender_id: 'me',
      recipient_id: buyerId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
      read_at: null,
      attachments: [],
      isSentByMe: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const sent = await sendSellerMessage(buyerId, content);
      // Replace optimistic with real message
      setMessages((prev) =>
        mergeMessages(
          prev.filter((m) => m.id !== optimistic.id),
          [sent]
        )
      );
      // Reconcile
      fetchThread(1, false);
    } catch (err) {
      logger.error('sendSellerMessage error:', err);
      setError(t('seller.messages.error_sending', 'Failed to send message. Please try again.'));
      setInput(content); // restore text
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  // ── Forbidden / no-thread state ───────────────────────────────────────────
  if (isForbidden) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 ring-1 ring-gray-200">
          <MessageSquare size={36} className="text-gray-400" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 font-heading">
          {t('seller.messages.not_found_title', 'Conversation not found')}
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-500">
          {t(
            'seller.messages.not_found_body',
            'This conversation does not exist or you do not have access to it.'
          )}
        </p>
        <Link
          href="/seller/messages"
          className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-indigo-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          <ChevronLeft size={16} className="rtl:rotate-180" aria-hidden="true" />
          {t('seller.messages.back_to_messages', 'Back to messages')}
        </Link>
      </div>
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="flex min-h-[calc(100vh-7rem)] flex-col">

      {/* ── Thread header ─────────────────────────────────────────────────── */}
      <header className="sticky top-14 z-20 flex items-center gap-3 border-b border-gray-200 bg-indigo-700 px-3 py-3 text-white shadow-md">
        <button
          onClick={() => router.push('/seller/messages')}
          aria-label={t('common.back', 'Back')}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rtl:rotate-180"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        {!loading && <HeaderAvatar user={otherUser} />}

        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="h-4 w-32 animate-pulse rounded-full bg-white/20" />
          ) : (
            <h1 className="truncate text-[15px] font-semibold leading-tight font-heading">
              {otherUser.display_name || t('seller.messages.buyer', 'Buyer')}
            </h1>
          )}
          {!loading && otherUser.email && (
            <p className="mt-0.5 truncate text-[11px] text-white/60">{otherUser.email}</p>
          )}
        </div>
      </header>

      {/* ── Message thread ───────────────────────────────────────────────── */}
      <div
        role="log"
        aria-live="polite"
        aria-label={t('seller.messages.thread_aria', 'Message thread')}
        className="flex-1 space-y-2.5 overflow-y-auto px-4 py-5"
      >
        {/* Load older messages */}
        {!loading && pagination.current_page < pagination.last_page && (
          <div className="flex justify-center py-2">
            <button
              onClick={handleLoadOlder}
              disabled={loadingOlder}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-semibold text-gray-600 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-50 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            >
              {loadingOlder ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <ChevronUp size={12} aria-hidden="true" />
              )}
              {t('seller.messages.load_older', 'Load older messages')}
            </button>
          </div>
        )}

        {loading ? (
          /* Skeleton */
          <div className="space-y-3" aria-busy="true">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`animate-pulse rounded-2xl ${
                    i % 2 === 0 ? 'bg-gray-100 ring-1 ring-gray-200' : 'bg-indigo-200'
                  }`}
                  style={{ width: `${38 + i * 11}%`, height: '44px' }}
                />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error */
          <div className="flex items-center justify-center py-12">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-rose-200">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
                <MessageSquare size={20} className="text-rose-500" aria-hidden="true" />
              </div>
              <p className="mb-4 text-sm font-medium text-rose-600">{error}</p>
              <button
                onClick={() => fetchThread(1, true)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              >
                {t('common.try_again', 'Try again')}
              </button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* Empty */
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mb-5 flex h-18 w-18 items-center justify-center rounded-full bg-gray-100 ring-1 ring-gray-200">
              <MessageSquare size={32} className="text-gray-400" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-gray-900 font-heading">
              {t('seller.messages.no_messages_title', 'No messages yet')}
            </h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-400">
              {t('seller.messages.no_messages_body', 'Start the conversation below.')}
            </p>
          </div>
        ) : (
          /* Messages grouped by day */
          <>
            {groupMessagesByDay(messages as any).map((group) => (
              <React.Fragment key={group.dateKey}>
                <ConversationDateDivider label={group.label} />
                {group.messages.map((m: any) => {
                  const mine = (m as SellerMessageItem).isSentByMe;
                  const timestamp = formatTime(m.created_at);
                  return (
                    <div
                      key={String(m.id)}
                      className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      {!mine && <OtherUserAvatar user={otherUser} />}
                      <div
                        className={`max-w-[78%] break-words rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                          mine
                            ? 'rounded-ee-md bg-indigo-700 text-white'
                            : 'rounded-es-md bg-white text-gray-900 ring-1 ring-gray-200'
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
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Composer ──────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSend}
        className="sticky bottom-0 flex items-end gap-2 border-t border-gray-200 bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-2px_8px_0_rgba(0,0,0,0.05)]"
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
          disabled={isForbidden}
          placeholder={t('seller.messages.type_message', 'Type a message…')}
          aria-label={t('seller.messages.type_message', 'Type a message…')}
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-900 ring-1 ring-gray-200 transition placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !input.trim() || isForbidden}
          aria-label={t('seller.messages.send', 'Send')}
          className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-amber-400 text-indigo-950 transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          {sending ? (
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          ) : (
            <Send size={18} className="rtl:rotate-180" aria-hidden="true" />
          )}
        </button>
      </form>
    </div>
  );
}
