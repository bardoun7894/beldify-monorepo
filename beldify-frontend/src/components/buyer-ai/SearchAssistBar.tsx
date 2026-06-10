'use client';

/**
 * SearchAssistBar
 *
 * A search bar with an optional AI "✨" assist affordance.
 *
 * Natural-language trigger heuristic:
 *   A query is treated as natural language if it has MORE THAN 2 words
 *   (i.e. word count > 2, splitting on whitespace).
 *   Single/two-word queries run plain keyword search — no AI call.
 *   The user may also explicitly trigger assist via the Sparkles button.
 *
 * On non-fallback assist result:
 *   - onAssistFilters is called with the parsed filter object
 *   - A reply line is shown above results
 *
 * On fallback=true:
 *   - onSearch is called with keywords (plain search) — no chips, no reply
 *
 * Props:
 *   onSearch(query)           — fires for plain keyword searches
 *   onAssistFilters(filters)  — fires when AI produces structured filters
 *   initialValue?             — pre-fill query (e.g. from URL ?q=)
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchAssist, type AssistFilters } from '@/services/buyerAiService';

interface SearchAssistBarProps {
  onSearch: (query: string) => void;
  onAssistFilters?: (filters: AssistFilters) => void;
  initialValue?: string;
  className?: string;
}

/** Returns true when the query looks like natural language (>2 words). */
function isNaturalLanguage(query: string): boolean {
  return query.trim().split(/\s+/).length > 2;
}

export function SearchAssistBar({
  onSearch,
  onAssistFilters,
  initialValue = '',
  className,
}: SearchAssistBarProps) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState(initialValue);
  const [reply, setReply] = useState<string | null>(null);
  const [isAssisting, setIsAssisting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const runAssist = async (q: string) => {
    setIsAssisting(true);
    setReply(null);
    try {
      const result = await searchAssist(q, i18n.language);
      if (result.fallback) {
        // Plain keyword search — transparent to the user
        onSearch(result.filters.keywords || q);
      } else {
        if (result.reply) setReply(result.reply);
        if (onAssistFilters) onAssistFilters(result.filters);
        onSearch(result.filters.keywords || q);
      }
    } finally {
      setIsAssisting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (isNaturalLanguage(trimmed)) {
      await runAssist(trimmed);
    } else {
      setReply(null);
      onSearch(trimmed);
    }
  };

  const handleAssistClick = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    await runAssist(trimmed);
  };

  const handleClearReply = () => setReply(null);

  return (
    <div className={cn('w-full', className)}>
      <form onSubmit={handleSubmit} role="search" className="relative">
        {/* Search icon */}
        <Search
          className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
          aria-hidden
        />

        {/* Input */}
        <input
          ref={inputRef}
          type="search"
          role="searchbox"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('buyerAi.searchAssist.placeholder', 'Search or ask naturally…')}
          aria-label={t('buyerAi.searchAssist.inputAriaLabel', 'Search products')}
          className="w-full rounded-full bg-white ring-1 ring-gray-200 ps-10 pe-24 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/40 transition-all"
        />

        {/* Sparkles AI-assist affordance button */}
        <button
          type="button"
          onClick={handleAssistClick}
          disabled={isAssisting || !query.trim()}
          aria-label={t('buyerAi.searchAssist.assistAriaLabel', 'AI search')}
          title={t('buyerAi.searchAssist.assistTooltip', 'Search with AI assist')}
          className={cn(
            'absolute end-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40',
            isAssisting
              ? 'bg-amber-100 text-amber-500 cursor-wait ring-1 ring-amber-200'
              : 'bg-amber-100 text-amber-800 hover:bg-amber-200 ring-1 ring-amber-200 active:scale-95'
          )}
        >
          <Sparkles size={11} className={cn('shrink-0', isAssisting && 'animate-pulse')} aria-hidden />
          <span className="hidden sm:inline">AI</span>
        </button>
      </form>

      {/* AI reply line */}
      {reply && (
        <div className="mt-2 flex items-center gap-2 px-1">
          <span className="inline-flex items-center gap-1.5 text-sm text-indigo-700 font-medium animate-fade-in-up">
            <Sparkles size={13} className="text-amber-500 shrink-0" aria-hidden />
            {reply}
          </span>
          <button
            type="button"
            onClick={handleClearReply}
            aria-label={t('buyerAi.searchAssist.clearReply', 'Clear AI reply')}
            className="p-0.5 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={13} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
