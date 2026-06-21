'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Lock, CheckCircle, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from '@/utils/toast';

/** Shape of the beldify_last_order sessionStorage stash */
export interface LastOrderStash {
  order_number?: string;
  shipping_info?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
  };
  [key: string]: any;
}

interface Props {
  isAuthenticated: boolean;
  lastOrderStash: LastOrderStash | null;
}

/**
 * One-tap post-purchase account card.
 *
 * Rendered on the order-confirmation page for unauthenticated guests who have
 * a valid beldify_last_order stash that contains a phone number (required for
 * phone-first registration). The buyer only needs to enter a password — all
 * other fields are pre-filled from the stash.
 */
export default function OneTapAccountCard({ isAuthenticated, lastOrderStash }: Props) {
  const { register } = useAuth();
  const { t } = useTranslation();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Guard: only render for guests with a stash that has a phone number
  if (isAuthenticated || !lastOrderStash) return null;

  const stashPhone = lastOrderStash.shipping_info?.phone?.trim() || '';
  if (!stashPhone) return null;

  const stashFirstName = lastOrderStash.shipping_info?.first_name || '';
  const stashLastName = lastOrderStash.shipping_info?.last_name || '';
  const stashFullName = `${stashFirstName} ${stashLastName}`.trim();
  const stashEmail = lastOrderStash.shipping_info?.email?.trim() || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (password.length < 8) {
      setError(t('auth.password_too_short', 'Use at least 8 characters'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: Record<string, string> = {
        full_name_en: stashFullName,
        phone: stashPhone,
        password,
        password_confirmation: password,
      };
      if (stashEmail) {
        payload.email = stashEmail;
      }

      const result = await register(payload);

      if (result?.success) {
        setSuccess(true);
        toast.success(t('auth.registration_successful', 'Account created — welcome to Beldify!'));
      } else {
        const msg = result?.message || t('auth.registration_failed', 'Registration failed. Please try again.');
        setError(msg);
      }
    } catch (err: any) {
      const firstFieldError =
        err?.errors && typeof err.errors === 'object'
          ? (Object.values(err.errors)[0] as any)?.[0]
          : undefined;
      const msg =
        firstFieldError ||
        err?.response?.data?.message ||
        err?.message ||
        t('auth.registration_failed', 'Registration failed. Please try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    'w-full ps-9 pe-10 py-3 border rounded-2xl text-gray-900 placeholder-gray-400 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 border-gray-200 focus:border-indigo-700 focus:ring-indigo-700/20';
  const inputError = inputBase.replace(
    'border-gray-200 focus:border-indigo-700 focus:ring-indigo-700/20',
    'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
  );

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-atlas-sm ring-1 ring-indigo-200 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 ring-1 ring-indigo-200 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-indigo-700" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {t('auth.account_created_success', 'Account created — you\'re signed in!')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('auth.account_created_sub', 'Track this order and reorder faster next time.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Card form ──────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-atlas-sm ring-1 ring-amber-200 p-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
          <UserPlus className="w-5 h-5 text-amber-600" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900">
            {t('auth.one_tap_title', 'Track this order & reorder faster')}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            {t(
              'auth.one_tap_sub',
              'Create an account in one tap — your phone and name are already filled in.'
            )}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm mb-4"
          role="alert"
        >
          {error}
          {/* If phone is taken, offer sign-in */}
          {/taken|exists|already/i.test(error) && (
            <span className="block mt-1">
              <Link
                href="/login"
                className="font-semibold text-indigo-700 hover:text-indigo-800 underline"
              >
                {t('auth.sign_in', 'Sign in')}
              </Link>
              {' '}
              {t('auth.with_existing_account', 'to your existing account instead.')}
            </span>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Password */}
        <div className="mb-4">
          <label
            htmlFor="one-tap-password"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {t('auth.choose_password', 'Choose a password')}
          </label>
          <div className="relative" dir="ltr">
            <span className="absolute start-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
              <Lock className="h-4 w-4" aria-hidden />
            </span>
            <input
              id="one-tap-password"
              name="one-tap-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              aria-invalid={!!error && password.length < 8}
              className={error ? inputError : inputBase}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute end-3 inset-y-0 flex items-center text-gray-400 hover:text-indigo-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
              aria-label={showPassword ? t('auth.hide_password', 'Hide password') : t('auth.show_password', 'Show password')}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {t('auth.password_min_hint', 'At least 8 characters')}
          </p>
        </div>

        {/* Pre-fill preview (reassurance) */}
        {stashFullName && (
          <p className="text-xs text-gray-500 mb-4">
            <span className="text-gray-400">{t('auth.registering_as', 'Registering as')}</span>{' '}
            <span className="font-medium text-gray-700">{stashFullName}</span>
            {' · '}
            <span className="font-medium text-gray-700 tabular-nums">{stashPhone}</span>
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold rounded-2xl shadow-atlas-sm hover:shadow-atlas-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          aria-busy={loading}
        >
          {loading && (
            <svg
              className="animate-spin h-4 w-4 text-white flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {t(
            loading ? 'auth.registering' : 'auth.one_tap_cta',
            loading ? 'Creating account...' : 'Create my account'
          )}
        </button>
      </form>
    </div>
  );
}
