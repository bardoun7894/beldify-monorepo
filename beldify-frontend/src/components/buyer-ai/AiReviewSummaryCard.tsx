'use client';

/**
 * AiReviewSummaryCard
 *
 * Renders the AI-generated review summary card at the top of the PDP Reviews tab.
 * - Returns null when data is null (204 from backend or lazy-fetch not resolved yet)
 * - No skeleton: spec says "no skeleton flash into nothing; fetch lazily and render only on 200"
 * - Atlas design tokens: indigo brand surface, amber accents, Sparkles icon
 * - i18n: buyerAi namespace
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReviewSummaryAI } from '@/services/buyerAiService';

interface AiReviewSummaryCardProps {
  data: ReviewSummaryAI | null;
}

export function AiReviewSummaryCard({ data }: AiReviewSummaryCardProps) {
  const { t } = useTranslation();

  if (!data) return null;

  return (
    <div
      className="rounded-2xl ring-1 ring-indigo-100 bg-white p-5 mb-6"
      aria-label={t('buyerAi.reviewSummary.cardAriaLabel', 'AI review summary')}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium ring-1 ring-amber-200 animate-fade-in-up">
          <Sparkles size={12} className="shrink-0" aria-hidden />
          {t('buyerAi.reviewSummary.header', 'ملخص التقييمات')}
        </span>
      </div>

      {/* Summary text */}
      <p className="text-sm text-gray-700 leading-relaxed mb-4" dir="auto">
        {data.summary}
      </p>

      {/* Pros + Cons chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {data.pros.map((pro, idx) => (
          <span
            key={`pro-${idx}`}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium ring-1 ring-emerald-200 animate-fade-in-up"
            style={{ animationDelay: `${idx * 80}ms` }}
            aria-label={t('buyerAi.reviewSummary.proAriaLabel', 'Positive: {{text}}', { text: pro })}
          >
            <span className="text-emerald-500" aria-hidden>+</span>
            {pro}
          </span>
        ))}
        {data.cons.map((con, idx) => (
          <span
            key={`con-${idx}`}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium ring-1 ring-gray-200 animate-fade-in-up"
            style={{ animationDelay: `${(data.pros.length + idx) * 80}ms` }}
            aria-label={t('buyerAi.reviewSummary.conAriaLabel', 'Note: {{text}}', { text: con })}
          >
            <span className="text-gray-400" aria-hidden>−</span>
            {con}
          </span>
        ))}
      </div>

      {/* Provenance microcopy */}
      <p className={cn(
        'font-mono text-[10px] tracking-[0.2em] uppercase text-gray-500 mt-1'
      )}>
        {t('buyerAi.reviewSummary.provenance', 'AI-generated from buyer reviews')}
        {' · '}
        {data.review_count}
        {' '}
        {t('buyerAi.reviewSummary.reviewsWord', 'reviews')}
      </p>
    </div>
  );
}
