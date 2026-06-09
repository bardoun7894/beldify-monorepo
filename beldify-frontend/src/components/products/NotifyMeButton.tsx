'use client';

/**
 * NotifyMeButton — one-tap "Notify me" affordance for the PDP.
 *
 * Behavior:
 * 1. Auth gate: redirects to /login if unauthenticated.
 * 2. Calls useWebPush().subscribe() to ensure permission + SW subscription.
 * 3. Always writes to wishlist with notify flags ON (save-regardless rule):
 *    - Not yet wishlisted → addToWishlist(productId, opts)
 *    - Already wishlisted  → updateWishlistNotifications(productId, opts)
 * 4. Shows a calm toast keyed off the push outcome:
 *    - Push granted  → "You will be notified" (AR: "سنبلغك")
 *    - Push denied/unsupported → calm message: push is off but item is saved
 *
 * Ethics copy rules (hooked §1, non-negotiable):
 *   - Second person, calm, no exclamation marks, no fake urgency/scarcity.
 *   - ≤12 words per string.
 *   - AR strings are hardcoded below — i18n keys DO NOT EXIST yet in the
 *     locale JSONs (out of scope to edit). FLAG: add keys listed in the
 *     comment block below to ar.json / en.json in a follow-up task.
 *
 * FLAGGED i18n keys to add in a future task:
 *   notify_me.back_in_stock_ar = "نبّهني عند توفّره"
 *   notify_me.back_in_stock_en = "Notify me when it's back"
 *   notify_me.price_drop_ar = "نبّهني عند انخفاض السعر"
 *   notify_me.price_drop_en = "Notify me about price drops"
 *   notify_me.notified_ar = "سنبلغك حين يتوفر"
 *   notify_me.notified_en = "You will be notified"
 *   notify_me.saved_push_off_ar = "تم الحفظ. الإشعارات معطّلة في المتصفح"
 *   notify_me.saved_push_off_en = "Saved. Enable browser notifications to get alerts"
 *   notify_me.unsupported_ar = "تم الحفظ. المتصفح لا يدعم الإشعارات"
 *   notify_me.unsupported_en = "Saved. Your browser does not support notifications"
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useWebPush } from '@/hooks/useWebPush';
import toast from '@/utils/toast';
import { cn } from '@/lib/utils';

export interface NotifyMeButtonProps {
  productId: number;
  /** Current effective price as a raw number (used as target_price). */
  currentPrice: number;
  /**
   * Surface the back-in-stock variant of the label.
   * Pass true when the product / selected variant is out of stock.
   */
  isOutOfStock?: boolean;
  className?: string;
  /** If true, renders a compact icon-only pill (for image overlay). */
  compact?: boolean;
  /** RTL-aware — parent passes this so the button inherits direction. */
  isRTL?: boolean;
}

/** Copy strings — hardcoded AR+EN until i18n keys are added (see FLAG above). */
const COPY = {
  label: {
    backInStock: { ar: 'نبّهني عند توفّره', en: "Notify me when it's back" },
    priceDrop: { ar: 'نبّهني عند انخفاض السعر', en: 'Notify me about price drops' },
  },
  success: {
    withPush: { ar: 'سنبلغك حين يتوفر', en: 'You will be notified' },
    pushOff: {
      ar: 'تم الحفظ. فعّل الإشعارات للحصول على تنبيهات',
      en: 'Saved. Enable notifications to receive alerts',
    },
    unsupported: {
      ar: 'تم الحفظ. المتصفح لا يدعم الإشعارات',
      en: 'Saved. Your browser does not support notifications',
    },
  },
  saving: { ar: 'جارٍ الحفظ…', en: 'Saving…' },
};

function get(node: { ar: string; en: string }, isRTL: boolean) {
  return isRTL ? node.ar : node.en;
}

export default function NotifyMeButton({
  productId,
  currentPrice,
  isOutOfStock = false,
  className = '',
  compact = false,
  isRTL = false,
}: NotifyMeButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isInWishlist, addToWishlist, updateWishlistNotifications } = useWishlist();
  const { subscribe, isSupported } = useWebPush();
  const [isBusy, setIsBusy] = useState(false);

  const handleNotifyMe = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isBusy) return;

    // Auth gate — calm redirect
    if (!isAuthenticated) {
      const redirect = encodeURIComponent(window.location.pathname);
      router.push(`/login?redirect=${redirect}`);
      return;
    }

    setIsBusy(true);

    try {
      // Step 1: Attempt push subscription (never gate wishlist write on this)
      let pushGranted = false;
      if (isSupported) {
        pushGranted = await subscribe();
      }

      // Step 2: Always write to wishlist with flags ON
      const opts = {
        notify_back_in_stock: isOutOfStock,
        notify_price_drop: true,
        target_price: currentPrice,
      };

      const alreadyWishlisted = isInWishlist(productId);
      if (alreadyWishlisted) {
        await updateWishlistNotifications(productId, opts);
      } else {
        await addToWishlist(productId, opts);
      }

      // Step 3: Calm toast keyed off push outcome
      if (!isSupported) {
        toast.success(get(COPY.success.unsupported, isRTL));
      } else if (!pushGranted) {
        toast.success(get(COPY.success.pushOff, isRTL));
      } else {
        toast.success(get(COPY.success.withPush, isRTL));
      }
    } finally {
      setIsBusy(false);
    }
  };

  const label = get(
    isOutOfStock ? COPY.label.backInStock : COPY.label.priceDrop,
    isRTL
  );

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleNotifyMe}
        disabled={isBusy}
        aria-label={label}
        aria-busy={isBusy}
        className={cn(
          'inline-flex items-center justify-center rounded-full p-2.5 transition-all duration-200',
          'bg-white/90 backdrop-blur-sm shadow-atlas-sm',
          'hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
          isBusy && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <Bell className="h-5 w-5 text-indigo-700 shrink-0" aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleNotifyMe}
      disabled={isBusy}
      aria-label={label}
      aria-busy={isBusy}
      data-testid="notify-me-button"
      className={cn(
        'w-full rounded-full py-3 flex items-center justify-center gap-2 text-sm font-medium',
        'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
        'bg-indigo-50 ring-1 ring-indigo-200 text-indigo-700',
        'hover:bg-indigo-100 hover:ring-indigo-300',
        isBusy && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isBusy ? (
        <>
          {/* Minimal spinner — CSS-only, respects prefers-reduced-motion */}
          <span
            className="h-4 w-4 rounded-full border-2 border-indigo-300 border-t-indigo-700 animate-spin shrink-0"
            style={{ animationDuration: '0.6s' }}
            aria-hidden
          />
          <span>{get(COPY.saving, isRTL)}</span>
        </>
      ) : (
        <>
          <Bell className="h-4 w-4 shrink-0" aria-hidden />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
