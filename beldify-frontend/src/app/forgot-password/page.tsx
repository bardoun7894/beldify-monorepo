'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { authService } from '@/services/authService';
import toast from '@/utils/toast';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setEmailError(t('auth.email_required', 'Email is required'));
      return;
    }
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setEmailError(t('auth.invalid_email', 'Please enter a valid email address'));
      return;
    }

    setIsLoading(true);
    setEmailError('');
    setRateLimited(false);

    try {
      // The backend always returns success:true regardless of whether the
      // email exists (no user enumeration). We can safely show the success
      // state for any 200 response.
      await authService.forgotPassword(email);
      setIsSubmitted(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'rate_limit') {
        setRateLimited(true);
      } else {
        // Surface generic error but still move to success view — the backend
        // is designed to never leak whether an account exists, so even on
        // unexpected errors we can show the same "check your email" screen.
        setIsSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const brandPanelProps = {
    heading: t('auth.get_back_in', "Let's get you back in."),
    subtext: t('auth.get_back_in_sub', "We'll email you a reset link in seconds."),
  };

  // — Success state ——————————————————————————————————————
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex">
        <AuthBrandPanel {...brandPanelProps} />

        {/* Success confirmation */}
        <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-10 lg:px-14">
          {/* Mobile wordmark */}
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

          <div className="w-full max-w-md text-center">
            {/* Success icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-50 ring-1 ring-amber-200 mb-6">
              <CheckCircle2 className="h-8 w-8 text-indigo-700" aria-hidden />
            </div>

            <h2
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('auth.check_email', 'Check your email')}
            </h2>

            <p className="text-gray-600 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
              {t('auth.reset_instructions_sent', 'We have sent password reset instructions to')}{' '}
              <strong className="text-gray-900 font-semibold" dir="ltr">{email}</strong>
            </p>

            {/* Instructional note */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 mb-8 text-start">
              <p className="font-medium mb-1">
                {t('auth.didnt_receive', "Didn't receive the email?")}
              </p>
              <p className="text-amber-700">
                {t(
                  'auth.check_spam',
                  "Check your spam folder, or wait a few minutes and try again."
                )}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold rounded-2xl shadow-atlas-sm hover:shadow-atlas-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2 transition-all duration-200"
              >
                {t('auth.resend_link', 'Resend link')}
              </button>

              <Link
                href="/login"
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border-2 border-indigo-700 text-indigo-700 hover:bg-indigo-50 font-semibold rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2 transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden />
                {t('auth.back_to_login', 'Back to sign in')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // — Main form ——————————————————————————————————————————
  return (
    <div className="min-h-screen flex">
      <AuthBrandPanel {...brandPanelProps} />

      {/* Form side — inherits dir from <html> via useDirection hook */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-10 lg:px-14">
        {/* Mobile wordmark */}
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

        <div className="w-full max-w-md">
          {/* Back link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden />
            {t('auth.back_to_login', 'Back to sign in')}
          </Link>

          {/* Page heading */}
          <div className="mb-8">
            <h2
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 leading-tight"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('auth.forgot_password', 'Forgot password?')}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {t(
                'auth.reset_instructions',
                "Enter your email and we'll send you instructions to reset your password."
              )}
            </p>
          </div>

          {/* Rate-limit banner */}
          {rateLimited && (
            <div
              role="alert"
              className="mb-5 rounded-2xl border border-gray-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              {t(
                'auth.rate_limited',
                "You've requested too many reset links. Please wait a few minutes and try again."
              )}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t('auth.email', 'Email address')}
              </label>
              {/* dir=ltr on the wrapper makes the whole field (icon + padding) one
                  LTR island so start-3/ps-9 resolve to the same physical side. */}
              <div className="relative" dir="ltr">
                <span className="absolute start-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-4 w-4" aria-hidden />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  className={`w-full ps-9 pe-4 py-3 border rounded-2xl text-gray-900 placeholder-gray-400 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 ${
                    emailError
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-gray-200 focus:border-indigo-700 focus:ring-indigo-700/20'
                  }`}
                  placeholder={t('auth.enter_email', 'you@example.com')}
                />
              </div>
              {emailError && (
                <p id="email-error" className="mt-1.5 text-xs text-rose-700" role="alert">
                  {emailError}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold rounded-2xl shadow-atlas-sm hover:shadow-atlas-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              aria-busy={isLoading}
            >
              {isLoading && (
                <svg
                  className="animate-spin h-4 w-4 text-white flex-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {isLoading
                ? t('auth.sending', 'Sending...')
                : t('auth.send_reset_link', 'Send reset link')}
            </button>
          </form>

          {/* Contextual help */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500">
              {t('auth.remembered_password', 'Remembered your password?')}{' '}
              <Link
                href="/login"
                className="font-semibold text-indigo-700 hover:text-indigo-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
              >
                {t('auth.sign_in', 'Sign in')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
