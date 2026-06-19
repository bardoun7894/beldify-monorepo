'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import {
  getSellerConversations,
  SellerConversation,
} from '@/services/messagingService';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { MessagesSquare, RefreshCw, Search, ChevronRight } from 'lucide-react';
import { convertStorageUrl } from '@/utils/storageUrls';
import Image from 'next/image';

function Skeleton() {
  return (
    <div className="space-y-2" aria-busy="true">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 rounded-xl bg-gray-50 px-5 py-4 ring-1 ring-gray-200"
        >
          <div className="h-11 w-11 shrink-0 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 rounded-full bg-gray-200" />
            <div className="h-3 w-2/3 rounded-full bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  const initial = (name || '?').charAt(0).toUpperCase();

  if (src) {
    const url = convertStorageUrl(src);
    return (
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-gray-200">
        <Image src={url} alt={name} fill className="object-cover" sizes="44px" />
      </div>
    );
  }

  // Deterministic color from first char — indigo on the canvas
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-700 text-sm font-bold text-white ring-1 ring-indigo-200">
      {initial}
    </span>
  );
}

export default function SellerMessagesPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const [conversations, setConversations] = useState<SellerConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await getSellerConversations();
      setConversations(result.conversations);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      return formatDistanceToNow(d, { addSuffix: true, locale: isRTL ? ar : enUS });
    } catch {
      return '';
    }
  };

  const filtered = conversations.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.display_name.toLowerCase().includes(q) ||
      c.last_message_preview.toLowerCase().includes(q)
    );
  });

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 font-heading">
          {t('seller.messages.eyebrow', 'Seller Hub')}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 font-heading">
          {t('seller.messages.title', 'Messages')}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('seller.messages.subtitle', 'Conversations with your buyers')}
        </p>
      </div>

      {/* ── Search + Refresh bar ──────────────────────────────────────────── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search
            size={15}
            className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] rounded-full bg-white py-2.5 ps-10 pe-4 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200 transition placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            placeholder={t('seller.messages.search_placeholder', 'Search conversations…')}
            aria-label={t('seller.messages.search_placeholder', 'Search conversations…')}
          />
        </div>
        <button
          onClick={fetchConversations}
          disabled={isLoading}
          aria-label={t('common.refresh', 'Refresh')}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-amber-50 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} aria-hidden="true" />
          {t('common.refresh', 'Refresh')}
        </button>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {isLoading ? (
        <Skeleton />
      ) : hasError ? (
        /* Error state */
        <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-gray-200">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 ring-1 ring-rose-200">
            <MessagesSquare size={24} className="text-rose-500" aria-hidden="true" />
          </div>
          <h3 className="font-semibold text-gray-900 font-heading">
            {t('seller.messages.error_title', 'Could not load messages')}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {t('seller.messages.error_body', 'Check your connection and try again.')}
          </p>
          <button
            onClick={fetchConversations}
            className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-indigo-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            {t('common.try_again', 'Try again')}
          </button>
        </div>
      ) : conversations.length === 0 ? (
        /* Empty state */
        <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-200">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 ring-1 ring-indigo-200">
            <MessagesSquare size={36} className="text-indigo-700" aria-hidden="true" />
          </div>
          <h3 className="font-bold text-gray-900 font-heading">
            {t('seller.messages.empty_title', 'No messages yet')}
          </h3>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-500">
            {t(
              'seller.messages.empty_body',
              'When buyers contact you, their messages will appear here.'
            )}
          </p>
        </div>
      ) : (
        /* Conversations list */
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-100 px-5 py-3.5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              {t('seller.messages.list_heading', 'Recent conversations')}
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {filtered.map((conv) => {
              const hasUnread = conv.unread_count > 0;

              return (
                <Link
                  key={String(conv.id)}
                  href={`/seller/messages/${conv.id}`}
                  className={[
                    'flex items-center gap-4 px-5 py-4 transition-colors focus:outline-none focus-visible:bg-indigo-50',
                    hasUnread
                      ? 'bg-indigo-50/60 hover:bg-indigo-50'
                      : 'hover:bg-gray-50',
                  ].join(' ')}
                >
                  <Avatar src={conv.avatar} name={conv.display_name} />

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span
                        className={`truncate text-sm ${
                          hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-800'
                        }`}
                      >
                        {conv.display_name}
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-[11px] text-gray-400">
                        {formatDate(conv.updated_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <p
                        className={`min-w-0 flex-1 truncate text-[13px] ${
                          hasUnread ? 'font-medium text-gray-700' : 'text-gray-400'
                        }`}
                      >
                        {conv.last_message_preview ||
                          t('seller.messages.no_preview', 'No messages')}
                      </p>

                      {hasUnread ? (
                        <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-indigo-950">
                          {conv.unread_count > 99 ? '99+' : conv.unread_count}
                        </span>
                      ) : (
                        <ChevronRight
                          size={14}
                          className="shrink-0 text-gray-300 rtl:rotate-180"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}

            {filtered.length === 0 && searchQuery && (
              <div className="px-6 py-10 text-center">
                <Search size={20} className="mx-auto mb-3 text-gray-300" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-700">
                  {t('common.no_results', 'No results found')}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {t('seller.messages.no_search_results', 'Try a different search term.')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
