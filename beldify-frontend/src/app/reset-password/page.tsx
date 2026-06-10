'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { authService } from '@/services/authService';
import toast from '@/utils/toast';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';

// Password strength meter — same scoring as register page
function usePasswordScore(password: string) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
  return score; // 0–3
}

function ResetPasswordForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const token = searchParams?.get('token') ?? '';
  const email = searchParams?.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmation?: string }>({});

  const passwordScore = usePasswordScore(password);
  const strengthMeta = [
    {
      label: t('auth.password_weak', 'Weak'),
      bar: 'w-1/3 bg-amber-400',
      text: 'text-amber-700',
    },
    {
      label: t('auth.password_fair', 'Fair'),
      bar: 'w-2/3 bg-amber-500',
      text: 'text-amber-700',
    },
    {
      label: t('auth.password_strong', 'Strong'),
      bar: 'w-full bg-indigo-700',
      text: 'text-indigo-700',
    },
  ][Math.max(0, passwordScore - 1)];

  // Missing params guard — show friendly error + link to forgot-password
  if (!token || !email) {
    return (
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
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-50 ring-1 ring-amber-200 mb-6">
            <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden />
          </div>

          <h2
            className="text-3xl font-bold text-gray-900 mb-3"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('auth.reset_link_invalid', 'Invalid reset link')}
          </h2>

          <p className="text-gray-600 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            {t(
              'auth.reset_link_invalid_desc',
              'This password reset link is missing required information. Please request a new one.'
            )}
          </p>

          <Link
            href="/forgot-password"
            className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold rounded-2xl shadow-atlas-sm hover:shadow-atlas-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2 transition-all duration-200"
          >
            {t('auth.request_new_link', 'Request a new link')}
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

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!password) {
      errors.password = t('auth.password_required', 'Password is required');
    } else if (password.length < 8) {
      errors.password = t('auth.password_too_short', 'Use at least 8 characters');
    }
    if (!passwordConfirmation) {
      errors.confirmation = t('auth.confirm_required', 'Please confirm your password');
    } else if (password !== passwordConfirmation) {
      errors.confirmation = t('auth.passwords_no_match', 'Passwords do not match');
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      await authService.resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setIsSuccess(true);
      toast.success(t('auth.password_reset_success', 'Password updated successfully'));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'reset_failed';
      // Distinguish invalid/expired token from other errors
      const isTokenError =
        message.toLowerCase().includes('token') ||
        message.toLowerCase().includes('expired') ||
        message.toLowerCase().includes('invalid');

      if (isTokenError) {
        setApiError('token_error');
      } else {
        setApiError(message);
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // — Success state ——————————————————————————————————————
  if (isSuccess) {
    return (
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
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-50 ring-1 ring-amber-200 mb-6">
            <CheckCircle2 className="h-8 w-8 text-indigo-700" aria-hidden />
          </div>

          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('auth.password_updated', 'Password updated')}
          </h2>

          <p className="text-gray-600 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            {t(
              'auth.password_updated_desc',
              'Your password has been changed. You can now sign in with your new password.'
            )}
          </p>

          <Link
            href="/login"
            className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold rounded-2xl shadow-atlas-sm hover:shadow-atlas-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2 transition-all duration-200"
          >
            {t('auth.sign_in', 'Sign in')}
          </Link>
        </div>
      </div>
    );
  }

  // — Expired/invalid token state ——————————————————————
  if (apiError === 'token_error') {
    return (
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
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-rose-50 ring-1 ring-rose-200 mb-6">
            <AlertTriangle className="h-8 w-8 text-rose-600" aria-hidden />
          </div>

          <h2
            className="text-3xl font-bold text-gray-900 mb-3"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('auth.link_expired', 'Link expired')}
          </h2>

          <p className="text-gray-600 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            {t(
              'auth.link_expired_desc',
              'This reset link is no longer valid. Please request a new one — they expire after 60 minutes.'
            )}
          </p>

          <Link
            href="/forgot-password"
            className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold rounded-2xl shadow-atlas-sm hover:shadow-atlas-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2 transition-all duration-200"
          >
            {t('auth.request_new_link', 'Request a new link')}
          </Link>
        </div>
      </div>
    );
  }

  // — Main form ——————————————————————————————————————————
  return (
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
            {t('auth.create_new_password', 'Create new password')}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {t(
              'auth.create_new_password_desc',
              'Choose a strong password with at least 8 characters.'
            )}
          </p>
        </div>

        {/* Generic API error banner */}
        {apiError && apiError !== 'token_error' && (
          <div
            role="alert"
            className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {apiError}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          {/* New password field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              {t('auth.new_password', 'New password')}
            </label>
            <div className="relative" dir="ltr">
              <span className="absolute start-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-4 w-4" aria-hidden />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                }}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                className={`w-full ps-9 pe-10 py-3 border rounded-2xl text-gray-900 placeholder-gray-400 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 ${
                  fieldErrors.password
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-gray-200 focus:border-indigo-700 focus:ring-indigo-700/20'
                }`}
                placeholder={t('auth.new_password_placeholder', 'Min. 8 characters')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute end-3 inset-y-0 flex items-center text-gray-400 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? t('auth.hide_password', 'Hide password') : t('auth.show_password', 'Show password')}
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="password-error" className="mt-1.5 text-xs text-rose-700" role="alert">
                {fieldErrors.password}
              </p>
            )}

            {/* Strength meter — only visible when user is typing */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strengthMeta?.bar ?? 'w-0'}`}
                  />
                </div>
                <p className={`text-xs font-medium ${strengthMeta?.text ?? 'text-gray-500'}`}>
                  {strengthMeta?.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm password field */}
          <div>
            <label
              htmlFor="password_confirmation"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              {t('auth.confirm_password', 'Confirm password')}
            </label>
            <div className="relative" dir="ltr">
              <span className="absolute start-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-4 w-4" aria-hidden />
              </span>
              <input
                id="password_confirmation"
                name="password_confirmation"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={passwordConfirmation}
                onChange={(e) => {
                  setPasswordConfirmation(e.target.value);
                  if (fieldErrors.confirmation)
                    setFieldErrors((p) => ({ ...p, confirmation: undefined }));
                }}
                aria-invalid={!!fieldErrors.confirmation}
                aria-describedby={fieldErrors.confirmation ? 'confirm-error' : undefined}
                className={`w-full ps-9 pe-10 py-3 border rounded-2xl text-gray-900 placeholder-gray-400 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 ${
                  fieldErrors.confirmation
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-gray-200 focus:border-indigo-700 focus:ring-indigo-700/20'
                }`}
                placeholder={t('auth.confirm_password_placeholder', 'Repeat your password')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute end-3 inset-y-0 flex items-center text-gray-400 hover:text-gray-700 focus:outline-none"
                aria-label={showConfirm ? t('auth.hide_password', 'Hide password') : t('auth.show_password', 'Show password')}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </button>
            </div>
            {fieldErrors.confirmation && (
              <p id="confirm-error" className="mt-1.5 text-xs text-rose-700" role="alert">
                {fieldErrors.confirmation}
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
              ? t('auth.saving', 'Saving...')
              : t('auth.set_new_password', 'Set new password')}
          </button>
        </form>
      </div>
    </div>
  );
}

// Suspense boundary required for useSearchParams in Next.js 15 App Router
export default function ResetPasswordPage() {
  const { t } = useTranslation();

  const brandPanelProps = {
    heading: t('auth.almost_there', "Almost there."),
    subtext: t('auth.almost_there_sub', "Choose a strong new password and you're back in."),
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
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
