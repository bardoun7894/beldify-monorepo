'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, AlertCircle, Star } from 'lucide-react';
import {
  rankProposals,
  RankedProposal,
  ProposalRankAvailable,
} from '@/services/openSoukAiService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ProposalAiRankingProps {
  postId: number;
  isOwner: boolean;
  isRTL?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fit score badge color
// ─────────────────────────────────────────────────────────────────────────────

function fitScoreClasses(score: number): { badge: string; bar: string } {
  if (score >= 80) return { badge: 'text-emerald-800 bg-emerald-50 ring-1 ring-emerald-200', bar: 'bg-emerald-500' };
  if (score >= 60) return { badge: 'text-amber-800 bg-amber-50 ring-1 ring-amber-200', bar: 'bg-amber-400' };
  return { badge: 'text-gray-700 bg-gray-100 ring-1 ring-gray-200', bar: 'bg-gray-400' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Ranked item
// ─────────────────────────────────────────────────────────────────────────────

function RankedItem({
  item,
  rank,
  postId,
  t,
}: {
  item: RankedProposal;
  rank: number;
  postId: number;
  t: (key: string, fallback: string, opts?: Record<string, unknown>) => string;
}) {
  const classes = fitScoreClasses(item.fit_score);

  return (
    <li className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      {/* Rank badge */}
      <div className="w-6 h-6 rounded-full bg-indigo-50 ring-1 ring-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-indigo-700">{rank}</span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Score bar + score */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full motion-safe:transition-all motion-safe:duration-500 ${classes.bar}`}
              style={{ width: `${item.fit_score}%` }}
            />
          </div>
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${classes.badge}`}>
            {item.fit_score}
          </span>
        </div>

        {/* Summary */}
        <p className="text-xs text-gray-700 leading-relaxed">{item.summary}</p>

        {/* Link to actual proposal */}
        <a
          href={`#response-${item.response_id}`}
          className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 motion-safe:transition-colors"
          aria-label={t('opensoukAi.view_proposal_aria', 'View proposal #{{id}}', { id: item.response_id })}
        >
          {t('opensoukAi.view_proposal', 'View proposal')} #{item.response_id}
        </a>
      </div>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function ProposalAiRanking({ postId, isOwner, isRTL }: ProposalAiRankingProps) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ranked, setRanked] = useState<RankedProposal[] | null>(null);
  const [overallSummary, setOverallSummary] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  // Owner-only guard — render nothing for non-owners
  if (!isOwner) return null;

  const handleRank = async () => {
    setLoading(true);
    setError(null);
    setRanked(null);
    setOverallSummary(null);
    setUnavailable(false);

    try {
      const result = await rankProposals(postId);

      if (!result.available) {
        setUnavailable(true);
        return;
      }

      const data = result as ProposalRankAvailable;
      setRanked(data.ranked);
      setOverallSummary(data.overall_summary);
    } catch (err) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 403) {
        setError(t('opensoukAi.rank_error_forbidden', 'You do not have access to rank these proposals.'));
      } else {
        setError(t('opensoukAi.rank_error', 'Could not rank proposals. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="bg-white rounded-2xl ring-1 ring-indigo-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-50 ring-1 ring-indigo-100 flex items-center justify-center shrink-0">
            <Trophy size={13} className="text-indigo-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {t('opensoukAi.rank_title', 'AI Proposal Ranking')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRank}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[32px] text-xs font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-full ring-1 ring-indigo-200 motion-safe:transition-all motion-safe:duration-150 disabled:opacity-60"
          aria-label={
            loading
              ? t('opensoukAi.rank_loading', 'Ranking…')
              : t('opensoukAi.rank_cta', 'Rank with AI')
          }
        >
          {loading ? (
            <>
              <span
                role="status"
                aria-label={t('opensoukAi.rank_loading', 'Ranking…')}
                className="w-3 h-3 rounded-full border-2 border-indigo-300 border-t-indigo-700 animate-spin shrink-0"
              />
              {t('opensoukAi.rank_loading', 'Ranking…')}
            </>
          ) : (
            <>
              <Star size={12} className="shrink-0" />
              {t('opensoukAi.rank_cta', 'Rank with AI')}
            </>
          )}
        </button>
      </div>

      {/* Results region */}
      <section
        role="region"
        aria-label={t('opensoukAi.rank_region_label', 'AI Ranking')}
        aria-live="polite"
        className="p-5"
      >
        {error && (
          <div className="flex items-start gap-2 bg-rose-50 ring-1 ring-rose-200 text-rose-700 px-3 py-2 rounded-xl text-sm">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {unavailable && !error && (
          <p className="text-xs text-gray-500 text-center py-2">
            {t('opensoukAi.rank_unavailable', 'AI ranking is currently unavailable.')}
          </p>
        )}

        {!error && !ranked && !loading && !unavailable && (
          <p className="text-xs text-gray-400 text-center py-2">
            {t('opensoukAi.rank_hint', 'Click "Rank with AI" to see which proposals best match your brief.')}
          </p>
        )}

        {ranked && ranked.length > 0 && (
          <>
            {overallSummary && (
              <div className="mb-4 px-3 py-2.5 bg-indigo-50 rounded-xl ring-1 ring-indigo-100">
                <p className="text-xs font-semibold text-indigo-700 mb-0.5">
                  {t('opensoukAi.rank_summary_label', 'AI Summary')}
                </p>
                <p className="text-sm text-indigo-900 leading-relaxed">{overallSummary}</p>
              </div>
            )}

            <ul className="divide-y divide-gray-50 -mx-1">
              {ranked.map((item, idx) => (
                <RankedItem
                  key={item.response_id}
                  item={item}
                  rank={idx + 1}
                  postId={postId}
                  t={t}
                />
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

export default ProposalAiRanking;
