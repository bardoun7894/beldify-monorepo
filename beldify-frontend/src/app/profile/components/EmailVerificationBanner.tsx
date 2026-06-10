'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, X, RefreshCw } from 'lucide-react';
import { authService } from '@/services/authService';
import toast from '@/utils/toast';

interface EmailVerificationBannerProps {
  emailVerifiedAt: string | null | undefined;
}

/**
 * A slim, dismissible banner shown on the profile page when the user's
 * email address is not yet verified. Calls resendVerification on demand.
 * Renders nothing when the email is already verified.
 */
export default function EmailVerificationBanner({
  emailVerifiedAt,
}: EmailVerificationBannerProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Don't render if verified or dismissed
  if (emailVerifiedAt || dismissed) return null;

  const handleResend = async () => {
    setIsSending(true);
    try {
      await authService.resendVerification();
      toast.success(
        t('auth.verify_email_resent', 'Verification email sent! Check your inbox.')
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'request_failed';
      if (message === 'rate_limit') {
        toast.error(t('auth.rate_limit', 'Too many requests. Please wait a moment.'));
      } else {
        toast.error(t('auth.resend_failed', 'Failed to send. Please try again.'));
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-5"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Mail className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
        <span className="leading-relaxed">
          {t(
            'auth.verify_email_banner',
            'Please verify your email address to unlock all features.'
          )}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          disabled={isSending}
          onClick={handleResend}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline-offset-2 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40 rounded disabled:opacity-50"
          aria-busy={isSending}
        >
          {isSending && <RefreshCw className="h-3 w-3 animate-spin" aria-hidden />}
          {isSending
            ? t('auth.resending', 'Sending…')
            : t('auth.resend_link', 'Resend link')}
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={t('common.dismiss', 'Dismiss')}
          className="text-amber-500 hover:text-amber-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
