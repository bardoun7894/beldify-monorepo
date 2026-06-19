'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, X, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DISMISSED_KEY = 'push-prompt-dismissed';
const GUEST_DISMISSED_KEY = 'push-prompt-guest-dismissed';

interface PostOrderPushPromptProps {
  /** Whether the current session belongs to an authenticated user */
  isAuthenticated: boolean;
  /** Whether the user is already subscribed to push notifications */
  isSubscribed: boolean;
  /** Whether a subscribe operation is in progress */
  isLoading: boolean;
  /** Callback to trigger the native push subscribe flow */
  onSubscribe: () => Promise<boolean>;
}

/**
 * PostOrderPushPrompt — shown on the order-confirmation page.
 *
 * Authed users: dismissible "shipping updates via notifications" card.
 *   - Hidden once dismissed (localStorage) or already subscribed.
 *   - Calm second-person copy, ≤12 words, no "!", no fake urgency.
 * Guests: calm one-line "create an account to track your order" nudge.
 *   - Also dismissible, no retention wall.
 *
 * Ethics (hooked §1): second person, calm, no "!", no shame/loss-aversion,
 *   no dark patterns, dismiss = one tap.
 */
export default function PostOrderPushPrompt({
  isAuthenticated,
  isSubscribed,
  isLoading,
  onSubscribe,
}: PostOrderPushPromptProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [guestDismissed, setGuestDismissed] = useState(false);
  const [initialised, setInitialised] = useState(false);

  // Read dismissal state from localStorage after mount (SSR-safe)
  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY) === 'true') {
        setDismissed(true);
      }
      if (localStorage.getItem(GUEST_DISMISSED_KEY) === 'true') {
        setGuestDismissed(true);
      }
    } catch {
      // localStorage may be unavailable in some contexts
    }
    setInitialised(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
  };

  const handleGuestDismiss = () => {
    setGuestDismissed(true);
    try {
      localStorage.setItem(GUEST_DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
  };

  // Don't render until localStorage has been read (prevents hydration flicker)
  if (!initialised) return null;

  // ── Authenticated user: push notification card ──────────────────────────────
  if (isAuthenticated) {
    // Hide if already subscribed or previously dismissed
    if (isSubscribed || dismissed) return null;

    return (
      <div
        data-testid="push-prompt-card"
        className="bg-white rounded-2xl shadow-atlas-sm ring-1 ring-indigo-100 p-5"
        role="complementary"
        aria-label={t('post_order_push.enable_aria')}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-9 h-9 rounded-full bg-indigo-50 ring-1 ring-indigo-200 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bell className="w-4 h-4 text-indigo-600" aria-hidden="true" />
          </div>

          {/* Copy */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 mb-0.5">
              {t('post_order_push.title')}
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              {t('post_order_push.subtitle')}
            </p>

            {/* Subscribe CTA */}
            <button
              data-testid="push-prompt-cta"
              onClick={onSubscribe}
              disabled={isLoading}
              aria-label={t('post_order_push.enable_aria')}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors disabled:opacity-50"
            >
              <Bell className="w-3.5 h-3.5" aria-hidden="true" />
              {isLoading ? t('post_order_push.enabling') : t('post_order_push.enable_cta')}
            </button>
          </div>

          {/* Dismiss — one tap, no retention wall */}
          <button
            data-testid="push-prompt-dismiss"
            onClick={handleDismiss}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label={t('common.close', 'Close')}
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  // ── Guest user: calm register nudge ─────────────────────────────────────────
  if (guestDismissed) return null;

  return (
    <div
      data-testid="guest-register-nudge"
      className="bg-amber-50 rounded-2xl ring-1 ring-amber-200 p-4"
      role="complementary"
      aria-label={t('post_order_push.guest_aria')}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-100 ring-1 ring-amber-200 flex items-center justify-center flex-shrink-0">
          <UserPlus className="w-4 h-4 text-amber-700" aria-hidden="true" />
        </div>

        <p className="text-xs text-gray-600 leading-relaxed flex-1">
          {t('post_order_push.guest_title')}{' '}
          <Link
            href="/register"
            className="font-semibold text-indigo-700 hover:underline"
          >
            {t('post_order_push.guest_cta')}
          </Link>
        </p>

        {/* Dismiss — guest nudge must also be dismissible */}
        <button
          data-testid="guest-nudge-dismiss"
          onClick={handleGuestDismiss}
          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-amber-100 transition-colors flex-shrink-0"
          aria-label={t('common.close', 'Close')}
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
