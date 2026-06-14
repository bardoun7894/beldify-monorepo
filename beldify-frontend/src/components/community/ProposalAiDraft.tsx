'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, AlertCircle } from 'lucide-react';
import {
  draftProposal,
  ProposalDraftAvailable,
} from '@/services/openSoukAiService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ProposalAiDraftData {
  pitch: string;
  suggested_price_range: { min: number; max: number };
  suggested_delivery_days: number;
}

interface ProposalAiDraftProps {
  postId: number;
  onApplyDraft: (data: ProposalAiDraftData) => void;
  isRTL?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function ProposalAiDraft({ postId, onApplyDraft, isRTL }: ProposalAiDraftProps) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const handleDraft = async () => {
    setLoading(true);
    setError(null);
    setUnavailable(false);

    try {
      const result = await draftProposal(postId);

      if (!result.available) {
        setUnavailable(true);
        return;
      }

      const draft = result as ProposalDraftAvailable;
      onApplyDraft({
        pitch: draft.pitch,
        suggested_price_range: draft.suggested_price_range,
        suggested_delivery_days: draft.suggested_delivery_days,
      });
    } catch (err) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 403) {
        setError(t('opensoukAi.draft_error_suspended', 'AI drafting is unavailable for your account.'));
      } else {
        setError(t('opensoukAi.draft_error', 'Could not generate a draft. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <button
        type="button"
        onClick={handleDraft}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-full ring-1 ring-amber-200 motion-safe:transition-all motion-safe:duration-150 disabled:opacity-60"
        aria-label={
          loading
            ? t('opensoukAi.draft_generating', 'Drafting…')
            : t('opensoukAi.draft_cta', 'Draft with AI')
        }
      >
        {loading ? (
          <>
            <span
              role="status"
              aria-label={t('opensoukAi.draft_generating', 'Drafting…')}
              className="w-4 h-4 rounded-full border-2 border-amber-300 border-t-amber-700 animate-spin shrink-0"
            />
            {t('opensoukAi.draft_generating', 'Drafting…')}
          </>
        ) : (
          <>
            <Sparkles size={14} className="shrink-0" />
            {t('opensoukAi.draft_cta', 'Draft with AI')}
          </>
        )}
      </button>

      <section
        role="region"
        aria-label={t('opensoukAi.draft_region_label', 'AI Draft')}
        aria-live="polite"
        className="mt-2"
      >
        {error && (
          <div className="flex items-start gap-2 bg-rose-50 ring-1 ring-rose-200 text-rose-700 px-3 py-2 rounded-xl text-sm">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {unavailable && !error && (
          <p className="text-xs text-gray-400 mt-1">
            {t('opensoukAi.draft_unavailable', 'AI drafting is currently unavailable.')}
          </p>
        )}
      </section>
    </div>
  );
}

export default ProposalAiDraft;
