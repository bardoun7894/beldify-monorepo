'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, AlertTriangle, ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import toast from '@/utils/toast';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';

// ─── State machine ────────────────────────────────────────────────────────────
type VerifyState =
  | 'verifying'
  | 'success'
  | 'already_verified'
  | 'invalid_or_expired'
  | 'missing_params'
  | 'resending'
  | 'resent';

function VerifyEmailForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const id = searchParams?.get('id') ?? '';
  const hash = searchParams?.get('hash') ?? '';
  const expires = searchParams?.get('expires') ?? '';
  const signature = searchParams?.get('signature') ?? '';

  const hasParams = !!(id && hash && expires && signature);

  const [state, setState] = useState<VerifyState>(
    hasParams ? 'verifying' : 'missing_params'
  );

  // Auto-verify on mount when params are present
  useEffect(() => {
    if (!hasParams) return;

    let cancelled = false;

    authService
      .verifyEmail({ id, hash, expires, signature })
      .then((result) => {
        if (cancelled) return;
        if (result.already_verified) {
          setState('already_verified');
        } else {
          setState('success');
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState('invalid_or_expired');
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — run once on mount

  const handleResend = async () => {
    setState('resending');
    try {
      await authService.resendVerification();
      setState('resent');
      toast.success(t('auth.verify_email_resent', 'Verification email sent!'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'request_failed';
      if (message === 'rate_limit') {
        toast.error(t('auth.rate_limit', 'Too many requests. Please wait a moment.'));
      } else {
        toast.error(t('auth.resend_failed', 'Failed to resend. Please try again.'));
      }
      setState('invalid_or_expired');
    }
  };

  // ── Shared mobile wordmark ──────────────────────────────────────────────────
  const MobileWordmark = () => (
    <div className="lg:hidden flex items-center gap-2 mb-10">
      <Image
        src="/icons/favicon-32x32.png"
        alt="Beldify"
        width={28}
        height={28}
        className="object-contain"
      />
      <span
        className="text-xl font-bold text-gray-900 tracking-tight"
        style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
      >
        Beldify
      </span>
    </div>
  );

  // ── Verifying spinner ───────────────────────────────────────────────────────
  if (state === 'verifying') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-10 lg:px-14">
        <MobileWordmark />
        <div className="w-full max-w-md text-center">
          <div
            role="status"
            aria-label={t('auth.verifying_email', 'Verifying your email')}
            className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-50 ring-1 ring-indigo-200 mb-6"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-200 border-t-indigo-700" />
          </div>
          <h2
            className="text-3xl font-bold text-gray-900 mb-3"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('auth.verifying_email_title', 'Verifying your email')}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {t('auth.verifying_email_desc', 'Please wait a moment…')}
          </p>
        </div>
      </div>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (state === 'success') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-10 lg:px-14">
        <MobileWordmark />
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-50 ring-1 ring-amber-200 mb-6">
            <CheckCircle2 className="h-8 w-8 text-indigo-700" aria-hidden />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('auth.email_verified', 'Email verified')}
          </h2>
          <p className="text-gray-600 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            {t(
              'auth.email_verified_desc',
              'Your email address has been confirmed. You can now access all features.'
            )}
          </p>
          <Link
            href="/"
            className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold rounded-2xl shadow-atlas-sm hover:shadow-atlas-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2 transition-all duration-200"
          >
            {t('auth.go_to_home', 'Go to homepage')}
          </Link>
          <div className="mt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden />
              {t('auth.back_to_login', 'Back to sign in')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Already verified ────────────────────────────────────────────────────────
  if (state === 'already_verified') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-10 lg:px-14">
        <MobileWordmark />
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-50 ring-1 ring-amber-200 mb-6">
            <CheckCircle2 className="h-8 w-8 text-amber-500" aria-hidden />
          </div>
          <h2
            className="text-3xl font-bold text-gray-900 mb-3"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('auth.already_verified', 'Already verified')}
          </h2>
          <p className="text-gray-600 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            {t(
              'auth.already_verified_desc',
              'Your email address is already confirmed. You are good to go.'
            )}
          </p>
          <Link
            href="/"
            className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold rounded-2xl shadow-atlas-sm hover:shadow-atlas-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2 transition-all duration-200"
          >
            {t('auth.go_to_home', 'Go to homepage')}
          </Link>
        </div>
      </div>
    );
  }

  // ── Invalid / expired + resending / resent ──────────────────────────────────
  if (
    state === 'invalid_or_expired' ||
    state === 'resending' ||
    state === 'resent'
  ) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-10 lg:px-14">
        <MobileWordmark />
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-rose-50 ring-1 ring-rose-200 mb-6">
            <AlertTriangle className="h-8 w-8 text-rose-600" aria-hidden />
          </div>
          <h2
            className="text-3xl font-bold text-gray-900 mb-3"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {state === 'resent'
              ? t('auth.check_your_inbox', 'Check your inbox')
              : t('auth.link_expired', 'Link expired')}
          </h2>
          <p className="text-gray-600 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            {state === 'resent'
              ? t(
                  'auth.link_expired_resent_desc',
                  'A new verification link has been sent to your inbox.'
                )
              : t(
                  'auth.link_expired_desc',
                  'This verification link is no longer valid or has expired. Request a new one below.'
                )}
          </p>

          {isAuthenticated ? (
            <button
              type="button"
              disabled={state === 'resending' || state === 'resent'}
              onClick={handleResend}
              className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold rounded-2xl shadow-atlas-sm hover:shadow-atlas-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              aria-busy={state === 'resending'}
            >
              {state === 'resending' && (
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
              )}
              {state === 'resending'
                ? t('auth.resending', 'Sending…')
                : state === 'resent'
                ? t('auth.resent', 'Resent!')
                : t('auth.resend_verification', 'Resend verification email')}
            </button>
          ) : (
            <Link
              href="/login"
              className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold rounded-2xl shadow-atlas-sm hover:shadow-atlas-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2 transition-all duration-200"
            >
              <Mail className="h-4 w-4" aria-hidden />
              {t('auth.sign_in_to_resend', 'Sign in to resend')}
            </Link>
          )}

          <div className="mt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden />
              {t('auth.back_to_login', 'Back to sign in')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Missing params ──────────────────────────────────────────────────────────
  // state === 'missing_params'
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-10 lg:px-14">
      <MobileWordmark />
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-50 ring-1 ring-amber-200 mb-6">
          <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden />
        </div>
        <h2
          className="text-3xl font-bold text-gray-900 mb-3"
          style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
        >
          {t('auth.verify_link_invalid', 'Invalid verification link')}
        </h2>
        <p className="text-gray-600 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
          {t(
            'auth.verify_link_invalid_desc',
            'This verification link is missing required information. Please use the link from your email.'
          )}
        </p>
        <Link
          href="/login"
          className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold rounded-2xl shadow-atlas-sm hover:shadow-atlas-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2 transition-all duration-200"
        >
          {t('auth.back_to_login', 'Back to sign in')}
        </Link>
      </div>
    </div>
  );
}

// Suspense boundary required for useSearchParams in Next.js 15 App Router
export default function VerifyEmailPage() {
  const { t } = useTranslation();

  const brandPanelProps = {
    heading: t('auth.confirm_your_email', 'Confirm your email.'),
    subtext: t(
      'auth.confirm_your_email_sub',
      "One click and you're all set. Your account is almost ready."
    ),
  };

  return (
    <div className="min-h-screen flex">
      <AuthBrandPanel {...brandPanelProps} />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-700 animate-spin" />
          </div>
        }
      >
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}
