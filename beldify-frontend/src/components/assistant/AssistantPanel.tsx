'use client';

/**
 * AssistantPanel — The expandable chat panel for the Darija Shopping Assistant
 *
 * Rendered lazily by AssistantWidget on first open (ssr:false).
 * All heavy dependencies (ProductCard, etc.) live here, not in the launcher.
 *
 * Responsibilities:
 *   - Message list with ARIA live region (a11y, FR3)
 *   - Text input (500-char cap + trim)
 *   - Send button
 *   - Suggestion chips
 *   - Product cards (maps AssistantProduct → Product shape, in-app PDP links)
 *   - History management (cap to last 10 turns, FR contract)
 *   - RTL layout for ar/ma (dir="rtl" on panel container)
 *   - prefers-reduced-motion honours
 *   - Graceful error display (FR6)
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Send, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  assistant,
  AssistantProduct,
  AssistantResponse,
  ConversationTurn,
  AssistantLocale,
} from '@/services/assistantService';
import { getImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '@/utils/imageUtils';
import { formatPrice } from '@/utils/formatters';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: AssistantProduct[];
  suggestions?: string[];
  isError?: boolean;
}

interface AssistantPanelProps {
  onClose: () => void;
  isRTL: boolean;
}

const MAX_CHARS = 500;
const MAX_HISTORY = 10;

// Allowed assistant locales (maps from i18n language)
const SUPPORTED_LOCALES: AssistantLocale[] = ['ar', 'ma', 'fr', 'en', 'es'];

function toAssistantLocale(lang: string): AssistantLocale {
  if (SUPPORTED_LOCALES.includes(lang as AssistantLocale)) {
    return lang as AssistantLocale;
  }
  // Fallback: nl/de → en (nearest match)
  return 'en';
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini product card (maps AssistantProduct → display; links in-app only)
// ─────────────────────────────────────────────────────────────────────────────

function AssistantProductCard({
  product,
  t,
}: {
  product: AssistantProduct;
  t: (k: string, fb?: string) => string;
}) {
  const imageSrc = getImageUrl(product.image, DEFAULT_PLACEHOLDER_IMAGE);

  // PDP href: /products/{id} (in-app link, matching ProductCard.tsx pattern)
  const pdpHref = `/products/${product.id}`;

  return (
    <Link
      href={pdpHref}
      className={cn(
        'flex items-center gap-3 p-2 rounded-xl border border-gray-100',
        'bg-white hover:bg-gray-50 transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
      )}
      aria-label={`${product.name} — ${t('assistant.view_product', 'View product')}`}
    >
      <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className="object-cover"
          sizes="56px"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = DEFAULT_PLACEHOLDER_IMAGE;
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
        {product.price != null && (
          <p className="text-xs font-semibold text-amber-600 mt-0.5">
            {formatPrice(product.price)}
          </p>
        )}
      </div>
      <span className="text-xs text-indigo-700 font-medium flex-shrink-0">
        {t('assistant.view_product', 'View')}
      </span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────────────────────

export function AssistantPanel({ onClose, isRTL }: AssistantPanelProps) {
  const { t, i18n } = useTranslation();
  const locale = toAssistantLocale(i18n.language);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus input when panel opens
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  // Build history from messages for the API call (cap to last MAX_HISTORY turns)
  const buildHistory = useCallback(
    (msgs: Message[]): ConversationTurn[] => {
      const turns: ConversationTurn[] = msgs
        .filter((m) => !m.isError)
        .map((m) => ({ role: m.role, content: m.content }));
      return turns.slice(-MAX_HISTORY);
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
      };

      setMessages((prev) => {
        const next = [...prev, userMsg];
        return next;
      });
      setInputValue('');
      setIsLoading(true);

      try {
        const history = buildHistory([...messages, userMsg]);
        const response: AssistantResponse = await assistant({
          message: trimmed,
          history,
          locale,
        });

        const assistantMsg: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.reply,
          products: response.products,
          suggestions: response.suggestions,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (_err) {
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: t('assistant.error', 'Something went wrong. Please try again.'),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
        // Re-focus input after response
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    },
    [isLoading, messages, locale, buildHistory, t]
  );

  const handleSubmit = () => {
    sendMessage(inputValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const charsLeft = MAX_CHARS - inputValue.length;
  const isOverLimit = inputValue.length > MAX_CHARS;

  return (
    <>
      {/* ── Backdrop (mobile) ─────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 bg-black/30 z-40 md:hidden motion-reduce:transition-none"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* ── Panel ─────────────────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-panel-title"
        dir={isRTL ? 'rtl' : 'ltr'}
        className={cn(
          // Positioning: bottom-sheet on mobile, floating panel on desktop
          'fixed z-50',
          'bottom-0 inset-x-0 md:bottom-6',
          isRTL ? 'md:left-4 md:right-auto' : 'md:right-4 md:left-auto',
          // Size
          'w-full md:w-[400px] max-h-[90vh] md:max-h-[600px]',
          // Visual
          'flex flex-col bg-white rounded-t-2xl md:rounded-2xl shadow-2xl',
          'border border-gray-100',
          // Motion
          'motion-reduce:transition-none'
        )}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-indigo-700 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
            <h2 id="assistant-panel-title" className="text-sm font-semibold text-white">
              {t('assistant.panel_title', 'Shopping Assistant')}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t('assistant.close', 'Close assistant')}
            className={cn(
              'text-white/80 hover:text-white rounded-lg p-1',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
              'transition-colors duration-150 motion-reduce:transition-none'
            )}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* ── Message list with ARIA live region ─────────────────────────── */}
        <div
          ref={messageListRef}
          aria-live="polite"
          aria-label={t('assistant.messages_label', 'Conversation')}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth"
        >
          {/* Welcome / empty state */}
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-8 px-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-6 h-6 text-indigo-700"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-800">
                {t('assistant.welcome_title', 'Welcome!')}
              </p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {t(
                  'assistant.welcome_message',
                  'Ask me about caftans, djellabas, jewellery — in Darija, Arabic, French or English.'
                )}
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex flex-col gap-2',
                msg.role === 'user'
                  ? isRTL ? 'items-start' : 'items-end'
                  : isRTL ? 'items-end' : 'items-start'
              )}
            >
              {/* Bubble */}
              <div
                className={cn(
                  'max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-indigo-700 text-white rounded-br-sm'
                    : msg.isError
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 rounded-bl-sm flex items-start gap-2'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                )}
                data-testid={msg.isError ? 'error-message' : undefined}
                role={msg.isError ? 'alert' : undefined}
              >
                {msg.isError && (
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <span>{msg.content}</span>
              </div>

              {/* Product cards (assistant messages only) */}
              {msg.role === 'assistant' &&
                msg.products &&
                msg.products.length > 0 && (
                  <div className="w-full max-w-[95%] space-y-2">
                    {msg.products.map((product) => (
                      <AssistantProductCard key={product.id} product={product} t={t} />
                    ))}
                  </div>
                )}

              {/* Suggestion chips (bottom of latest assistant message) */}
              {msg.role === 'assistant' &&
                msg.suggestions &&
                msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-w-[95%]">
                    {msg.suggestions.map((suggestion, i) => (
                      <button
                        key={`${msg.id}-chip-${i}`}
                        onClick={() => handleChipClick(suggestion)}
                        disabled={isLoading}
                        className={cn(
                          'text-xs px-3 py-1.5 rounded-full border',
                          'border-indigo-200 text-indigo-700 bg-indigo-50',
                          'hover:bg-indigo-100 hover:border-indigo-300',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                          'transition-colors duration-150 motion-reduce:transition-none',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          ))}

          {/* Thinking indicator — no aria-live; outer message-list region announces it */}
          {isLoading && (
            <div
              className={cn(
                'flex',
                isRTL ? 'justify-end' : 'justify-start'
              )}
              aria-label={t('assistant.thinking', 'Assistant is thinking…')}
            >
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce motion-reduce:animate-none"
                    style={{ animationDelay: `${i * 150}ms` }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Input area ─────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-gray-100 px-3 py-2 bg-gray-50 rounded-b-2xl">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(
                'assistant.input_placeholder',
                'Ask about any product, style, or price…'
              )}
              aria-label={t('assistant.input_aria', 'Message to assistant')}
              rows={1}
              maxLength={MAX_CHARS + 1} // +1 so we can show the over-limit error
              disabled={isLoading}
              className={cn(
                'flex-1 resize-none rounded-xl border border-gray-200 bg-white',
                'px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'max-h-28 overflow-y-auto',
                isOverLimit && 'border-rose-400 focus:ring-rose-500'
              )}
              style={{ direction: isRTL ? 'rtl' : 'ltr' }}
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !inputValue.trim() || isOverLimit}
              aria-label={t('assistant.send', 'Send')}
              className={cn(
                'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center',
                'bg-indigo-700 text-white',
                'hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-indigo-500 focus-visible:ring-offset-1',
                'transition-colors duration-150 motion-reduce:transition-none',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {/* Character counter — only show when near limit */}
          {inputValue.length > MAX_CHARS * 0.8 && (
            <p
              className={cn(
                'text-[10px] mt-1 text-end',
                isOverLimit ? 'text-rose-500 font-semibold' : 'text-gray-400'
              )}
            >
              {charsLeft < 0
                ? t('assistant.over_limit', { count: Math.abs(charsLeft) })
                : `${charsLeft} ${t('assistant.chars_left', 'chars left')}`}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default AssistantPanel;
