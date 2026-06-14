'use client';

/**
 * ListingAiAssistant — inline AI analysis panel for seller product create/edit forms
 *
 * Shows an "Analyze with AI" button. On click, calls listingAiService.analyzeListing
 * and renders the results inline:
 *   - Category + vertical suggestion (apply-able via onApplyCategory callback)
 *   - Attribute chips (apply-able via onApplyAttribute callback)
 *   - Quality score meter (0–100) + tips list
 *   - Flag banners: policy (amber/warning) + duplicate (rose/warning)
 *
 * Design constraints:
 *   - Atlas tokens: primary=amber, secondary=indigo (inverted per KB)
 *   - RTL-correct via `dir` prop; uses logical CSS (ms-/me- for margins)
 *   - ARIA: button role, aria-live="polite" for results, aria-busy during load
 *   - Mobile-first, no fixed widths
 *
 * FR7: purely additive — zero dependency on the product form save path.
 */

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  analyzeListing,
  ListingAnalysisResult,
  ListingAnalysisAvailable,
  ListingFlag,
} from '@/services/listingAiService';
import logger from '@/utils/consoleLogger';

// ─── Icons (inline SVG — avoids lucide import weight in this component) ───────

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const WarningIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ListingAiAssistantProps {
  /** Current product title (fed into analysis). */
  title: string;
  /** Current product description (optional, fed into analysis). */
  description?: string;
  /** Current category_id hint (optional). */
  category_id?: number;
  /** Called when seller clicks "Apply" on the category suggestion. */
  onApplyCategory: (id: number, name: string) => void;
  /** Called when seller clicks "Apply" on an attribute chip. */
  onApplyAttribute: (key: string, value: string) => void;
  /** Controls RTL text direction. */
  isRTL?: boolean;
}

// ─── Quality score tier helper ────────────────────────────────────────────────
// Returns Tailwind class names only — no raw HSL values, keeping Atlas tokens.
// High (≥70): amber (primary)  Mid (≥40): green-700  Low: rose-600 (destructive)

function scoreTierClasses(score: number): { text: string; bar: string } {
  if (score >= 70) return { text: 'text-amber-600', bar: 'bg-amber-500' };
  if (score >= 40) return { text: 'text-green-700', bar: 'bg-green-600' };
  return { text: 'text-rose-600', bar: 'bg-rose-500' };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ListingAiAssistant({
  title,
  description,
  category_id,
  onApplyCategory,
  onApplyAttribute,
  isRTL = false,
}: ListingAiAssistantProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ListingAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!title.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await analyzeListing({
        title: title.trim(),
        description: description?.trim() || undefined,
        category_id,
      });
      setResult(data);
    } catch (err: unknown) {
      logger.error('ListingAiAssistant: analysis failed', err);
      setError(t('listingAi.error', 'Analysis failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [title, description, category_id, t]);

  // When AI is unavailable and we have a result, show the graceful fallback
  const isUnavailable = result !== null && !result.available;
  const analysisResult = result?.available ? (result as ListingAnalysisAvailable) : null;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="listing-ai-assistant">
      {/* ─── Trigger button ──────────────────────────────────────────────── */}
      {!isUnavailable && (
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading || !title.trim()}
          aria-busy={loading}
          className={[
            'inline-flex items-center gap-2',
            'rounded-full ring-1 ring-amber-300 bg-amber-50',
            'hover:bg-amber-100 hover:ring-amber-400',
            'text-amber-800 px-4 py-2 text-xs font-semibold',
            'motion-safe:transition-all motion-safe:duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
          ].join(' ')}
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          {loading
            ? t('listingAi.analyzing', 'Analyzing...')
            : t('listingAi.cta', 'Analyze with AI')}
        </button>
      )}

      {/* ─── Results live region ─────────────────────────────────────────── */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="mt-3"
      >
        {/* Error state */}
        {error && (
          <div
            role="alert"
            className="rounded-xl bg-rose-50 ring-1 ring-rose-200 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        {/* AI unavailable */}
        {isUnavailable && (
          <div className="rounded-xl bg-gray-50 ring-1 ring-gray-200 px-4 py-3 text-sm text-gray-500">
            {t('listingAi.unavailable', 'AI analysis is not available right now.')}
          </div>
        )}

        {/* Analysis results */}
        {analysisResult && (
          <div className="rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">
                {t('listingAi.results_title', 'AI Analysis')}
              </p>
            </div>

            <div className="p-5 space-y-5">
              {/* ── Flags ──────────────────────────────────────────────────── */}
              {analysisResult.flags.length > 0 && (
                <FlagBanners flags={analysisResult.flags} t={t} />
              )}

              {/* ── Quality Score ───────────────────────────────────────────── */}
              <QualityMeter score={analysisResult.quality_score} t={t} />

              {/* ── Tips ────────────────────────────────────────────────────── */}
              {analysisResult.tips.length > 0 && (
                <TipsList tips={analysisResult.tips} t={t} />
              )}

              {/* ── Category suggestion ─────────────────────────────────────── */}
              {analysisResult.suggested_category && (
                <CategorySuggestion
                  category={analysisResult.suggested_category}
                  vertical={analysisResult.suggested_vertical}
                  onApply={onApplyCategory}
                  t={t}
                />
              )}

              {/* ── Attribute chips ──────────────────────────────────────────── */}
              {Object.keys(analysisResult.attributes).length > 0 && (
                <AttributeChips
                  attributes={analysisResult.attributes}
                  onApply={onApplyAttribute}
                  t={t}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FlagBanners({
  flags,
  t,
}: {
  flags: ListingFlag[];
  t: (key: string, fallback?: string) => string;
}) {
  return (
    <div className="space-y-2" role="list" aria-label={t('listingAi.flags_label', 'Warnings')}>
      {flags.map((flag) => {
        const isPolicy = flag.type === 'policy';
        return (
          <div
            key={flag.type}
            role="listitem"
            className={[
              'flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm ring-1',
              isPolicy
                ? 'bg-amber-50 ring-amber-200 text-amber-800'
                : 'bg-rose-50 ring-rose-200 text-rose-700',
            ].join(' ')}
          >
            <WarningIcon
              className={`w-4 h-4 mt-0.5 shrink-0 ${isPolicy ? 'text-amber-600' : 'text-rose-500'}`}
            />
            <span>{flag.message}</span>
          </div>
        );
      })}
    </div>
  );
}

function QualityMeter({
  score,
  t,
}: {
  score: number;
  t: (key: string, fallback?: string) => string;
}) {
  const pct = Math.min(100, Math.max(0, score));
  const { text: textClass, bar: barClass } = scoreTierClasses(pct);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {t('listingAi.quality_label', 'Quality score')}
        </p>
        <span className={`text-sm font-bold tabular-nums ${textClass}`}>
          {score}
          <span className="text-xs font-normal text-gray-400">/100</span>
        </span>
      </div>
      <div
        className="w-full h-2 rounded-full bg-gray-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('listingAi.quality_aria', 'Listing quality {{score}} out of 100').replace('{{score}}', String(score))}
      >
        <div
          className={`h-full rounded-full motion-safe:transition-all motion-safe:duration-500 ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TipsList({
  tips,
  t,
}: {
  tips: string[];
  t: (key: string, fallback?: string) => string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
        {t('listingAi.tips_label', 'Tips')}
      </p>
      <ul className="space-y-1.5">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span
              className="mt-0.5 w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 text-[10px] font-bold"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategorySuggestion({
  category,
  vertical,
  onApply,
  t,
}: {
  category: { id: number; name: string };
  vertical: string | null;
  onApply: (id: number, name: string) => void;
  t: (key: string, fallback?: string) => string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
        {t('listingAi.category_label', 'Suggested category')}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 ring-1 ring-indigo-200 text-indigo-800 text-xs font-medium px-3 py-1.5">
          {category.name}
          {vertical && (
            <span className="text-indigo-500 text-[10px]">· {vertical}</span>
          )}
        </span>
        <button
          type="button"
          onClick={() => onApply(category.id, category.name)}
          className="inline-flex items-center gap-1.5 rounded-full bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold px-3 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          aria-label={t(
            'listingAi.apply_category_aria',
            'Apply category {{name}}'
          ).replace('{{name}}', category.name)}
        >
          <CheckIcon className="w-3 h-3" />
          {t('listingAi.apply_category', 'Apply {{name}}').replace('{{name}}', category.name)}
        </button>
      </div>
    </div>
  );
}

function AttributeChips({
  attributes,
  onApply,
  t,
}: {
  // The API contract says Record<string, string>, but the backend may
  // occasionally return non-string values (arrays, nested objects) from
  // the AI model before server-side casting is in place (P1 #3 backend fix).
  // We defensively coerce each value to string here.
  attributes: Record<string, unknown>;
  onApply: (key: string, value: string) => void;
  t: (key: string, fallback?: string) => string;
}) {
  const entries = Object.entries(attributes)
    // Skip entries whose value isn't renderable as a meaningful string
    .map(([k, v]): [string, string] => [k, Array.isArray(v) ? (v as unknown[]).join(', ') : String(v ?? '')])
    .filter(([, v]) => v !== '' && v !== 'null' && v !== 'undefined');

  if (entries.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
        {t('listingAi.attributes_label', 'Suggested attributes')}
      </p>
      <div className="flex flex-wrap gap-2">
        {entries.map(([key, value]) => (
          <button
            key={key}
            type="button"
            onClick={() => onApply(key, value)}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 ring-1 ring-amber-200 text-amber-800 text-xs font-medium px-3 py-1.5 hover:bg-amber-100 hover:ring-amber-300 motion-safe:transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1"
            aria-label={t(
              'listingAi.apply_attribute_aria',
              'Apply {{key}}: {{value}}'
            ).replace('{{key}}', key).replace('{{value}}', value)}
          >
            <span className="text-amber-600 font-semibold capitalize">{key}:</span>
            <span>{value}</span>
            <CheckIcon className="w-3 h-3 text-amber-500" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default ListingAiAssistant;
