'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDirection } from '@/hooks/useDirection';

interface FollowShopButtonProps {
  /** Display name of the shop — used in investment-framing copy. */
  shopName: string;
  isFollowing: boolean;
  isLoading: boolean;
  onToggle: () => void;
  /** Extra Tailwind classes forwarded to the wrapper. */
  className?: string;
}

/**
 * Follow / Following toggle for the shop page.
 *
 * Ethics compliance (hooked §1):
 *   - Second-person, calm tone. No "!", no fake urgency, no loss-aversion.
 *   - Investment framing: "Follow {shop} to see new pieces first."
 *   - Arabic is first-class: "تابِع المتجر" / "تتابِع".
 *   - RTL logical props via Tailwind (ms-*, me-*).
 */
export default function FollowShopButton({
  shopName,
  isFollowing,
  isLoading,
  onToggle,
  className = '',
}: FollowShopButtonProps) {
  const { t } = useTranslation();
  const { isRTL } = useDirection();

  /**
   * Investment-framing hint — shown below the button.
   * Non-negotiable per packet ethics spec (hooked §1).
   * AR: "تابِع {shop} لترى القطع الجديدة أولاً."
   * EN: "Follow {shop} to see new pieces first."
   */
  const hintText = isRTL
    ? t('shop.follow.hint_ar', `تابِع ${shopName} لترى القطع الجديدة أولاً.`, { shop: shopName })
    : t('shop.follow.hint', `Follow ${shopName} to see new pieces first.`, { shop: shopName });

  const followLabel = isRTL
    ? t('shop.follow.label_ar', 'تابِع المتجر')
    : t('shop.follow.label', `Follow ${shopName}`, { shop: shopName });

  const followingLabel = isRTL
    ? t('shop.follow.following_ar', 'تتابِع')
    : t('shop.follow.following', 'Following');

  const loadingLabel = t('common.loading', 'Loading…');

  const label = isLoading ? loadingLabel : isFollowing ? followingLabel : followLabel;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        disabled={isLoading}
        aria-pressed={isFollowing}
        aria-label={label}
        className={[
          'inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition',
          'disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-700',
          isFollowing
            ? 'bg-white ring-1 ring-amber-200 text-gray-900 hover:bg-amber-50'
            : 'bg-indigo-700 text-white hover:bg-indigo-800',
        ].join(' ')}
      >
        <Heart
          className={`h-4 w-4 ${isFollowing ? 'fill-rose-500 text-rose-500' : ''}`}
          aria-hidden="true"
        />
        {label}
      </button>

      {/* Investment-framing hint — second-person, calm, no exclamation mark */}
      {!isFollowing && (
        <p
          className="text-xs text-gray-500 leading-relaxed max-w-xs"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {hintText}
        </p>
      )}
    </div>
  );
}
