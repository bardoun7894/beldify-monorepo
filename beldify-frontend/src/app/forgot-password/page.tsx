'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { authService } from '@/services/api/authService';
import toast from '@/utils/toast';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error(t('auth.email_required', 'Email is required'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(email);

      if (response.success) {
        setIsSubmitted(true);
        toast.success(t('auth.reset_link_sent', 'Password reset link sent to your email'));
      } else {
        toast.error(response.message || t('auth.reset_failed', 'Failed to send reset link'));
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(t('auth.reset_failed', 'Failed to send reset link'));
    } finally {
      setIsLoading(false);
    }
  };

  // — Success state ——————————————————————————————————————————————
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex">
        {/* Left — editorial brand panel */}
        <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative flex-col bg-indigo-900 text-white px-12 py-16 overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_80%_60%,_#6366f1_0,_transparent_50%)]"
          />
          <div className="relative z-10 flex flex-col h-full">
            <Link href="/" className="inline-flex items-center gap-3 mb-auto">
              <Image
                src="/icons/beldify.png"
                alt="Beldify"
                width={36}
                height={36}
                className="object-contain brightness-110"
              />
              <span
                className="text-2xl font-bold text-white tracking-tight"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                Beldify
              </span>
            </Link>
            <div className="mt-auto pb-4">
              <h1
                className="text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight mb-5"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('auth.get_back_in', "Let's get you back in.")}
              </h1>
              <p className="text-indigo-200 text-lg leading-relaxed max-w-sm">
                {t('auth.get_back_in_sub', "We'll email you a reset link in seconds.")}
              </p>
            </div>
          </div>
        </div>

        {/* Right — success confirmation */}
        <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-12">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Image
              src="/icons/beldify.png"
              alt="Beldify"
              width={32}
              height={32}
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
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 ring-1 ring-emerald-200 mb-6">
              <Mail className="h-8 w-8 text-emerald-600" />
            </div>
            <h2
              className="text-3xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('auth.check_email', 'Check your email')}
            </h2>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-sm mb-8">
              {t('auth.reset_instructions_sent', 'We have sent password reset instructions to')}{' '}
              <strong>{email}</strong>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('auth.back_to_login', 'Back to sign in')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // — Main form ——————————————————————————————————————————————
  return (
    <div className="min-h-screen flex">
      {/* Left — editorial brand panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative flex-col bg-indigo-900 text-white px-12 py-16 overflow-hidden">
        {/* Radial gradient overlay */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_80%_60%,_#6366f1_0,_transparent_50%)]"
        />

        <div className="relative z-10 flex flex-col h-full">
          {/* Wordmark */}
          <Link href="/" className="inline-flex items-center gap-3 mb-auto">
            <Image
              src="/icons/beldify.png"
              alt="Beldify"
              width={36}
              height={36}
              className="object-contain brightness-110"
            />
            <span
              className="text-2xl font-bold text-white tracking-tight"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              Beldify
            </span>
          </Link>

          {/* Editorial copy */}
          <div className="mt-auto pb-4">
            <h1
              className="text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight mb-5"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('auth.get_back_in', "Let's get you back in.")}
            </h1>
            <p className="text-indigo-200 text-lg leading-relaxed max-w-sm">
              {t('auth.get_back_in_sub', "We'll email you a reset link in seconds.")}
            </p>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-12">
        {/* Mobile wordmark */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <Image
            src="/icons/beldify.png"
            alt="Beldify"
            width={32}
            height={32}
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
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('auth.back_to_login', 'Back to sign in')}
          </Link>

          <h2
            className="text-3xl font-bold text-gray-900 mb-1"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('auth.forgot_password', 'Forgot password?')}
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            {t(
              'auth.reset_instructions',
              "Enter your email and we'll send you instructions to reset your password."
            )}
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.email', 'Email address')}
              </label>
              <div className="relative">
                <span className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 sm:text-sm transition"
                  placeholder={t('auth.enter_email', 'you@example.com')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
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
              ) : null}
              {isLoading
                ? t('auth.sending', 'Sending...')
                : t('auth.send_reset_link', 'Send reset link')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
