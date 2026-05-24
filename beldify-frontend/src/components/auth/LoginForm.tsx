'use client';

import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import toast from '@/utils/toast';
import Image from 'next/image';
import { Mail, Lock } from 'lucide-react';

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm() as ReturnType<typeof useForm<LoginFormData>>;

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError('');
      const result = await login(data.email, data.password);
      if (!result.success && result.message) {
        setError(result.message);
      } else {
        toast.success(t('auth.login_success', 'Signed in successfully'));
      }
    } catch {
      setError(t('errors.something_went_wrong', 'An unexpected error occurred. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col md:flex-row">
      {/* Left Side — Atlas indigo editorial panel */}
      <div className="hidden md:flex md:w-1/2 bg-indigo-900 p-12 items-center justify-center relative overflow-hidden">
        {/* Radial gradient overlay */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_80%_60%,_#6366f1_0,_transparent_50%)]"
        />
        <div className="relative z-10 max-w-sm text-white">
          <Link href="/" className="flex items-center gap-2 mb-10">
            <Image
              src="/icons/beldify.png"
              alt={t('auth.logo_alt', 'Beldify')}
              width={32}
              height={32}
              className="object-contain"
            />
            <span
              className="text-xl font-bold text-white tracking-tight"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              Beldify
            </span>
          </Link>
          <h1
            className="text-4xl font-bold leading-[1.1] tracking-tight mb-4"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('auth.welcome_to_our_store', 'Welcome back to Beldify.')}
          </h1>
          <p className="text-indigo-200 text-base mb-8">
            {t('auth.get_access_to_exclusive_deals', 'Your wishlist, orders and tailoring chats are waiting.')}
          </p>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm text-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              {t('auth.easy_order_tracking', 'Easy order tracking')}
            </li>
            <li className="flex items-center gap-3 text-sm text-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              {t('auth.exclusive_deals', 'Exclusive deals for members')}
            </li>
          </ul>
        </div>
      </div>

      {/* Right Side — Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 bg-white">
        <div className="mx-auto w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="md:hidden flex items-center justify-center gap-2 mb-6">
              <Image
                src="/icons/beldify.png"
                alt={t('auth.logo_alt', 'Beldify')}
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <h2
              className="text-3xl font-bold text-gray-900"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('auth.sign_in_to_your_account', 'Sign in')}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {t('auth.or', 'Or')}{' '}
              <Link
                href="/register"
                className="font-semibold text-indigo-700 hover:text-indigo-800 transition-colors"
              >
                {t('auth.create_account', 'Create account')}
              </Link>
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 border border-amber-200 rounded-2xl bg-white text-sm font-medium text-gray-600 hover:bg-amber-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              aria-label={t('auth.sign_in_with_google', 'Sign in with Google')}
              onClick={() => toast.success('Google login coming soon!')}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 border border-amber-200 rounded-2xl bg-white text-sm font-medium text-gray-600 hover:bg-amber-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              aria-label={t('auth.sign_in_with_apple', 'Sign in with Apple')}
              onClick={() => toast.success('Apple login coming soon!')}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Apple
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-amber-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-400 uppercase tracking-[0.12em]">
                {t('auth.or_continue_with', 'Or continue with email')}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div
                className="p-4 text-sm text-rose-800 rounded-2xl bg-rose-50 ring-1 ring-rose-200"
                role="alert"
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="lf-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.email_address', 'Email address')}
              </label>
              <div className="relative">
                <span className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  {...register('email', {
                    required: t('auth.email_required', 'Email is required'),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t('auth.invalid_email', 'Invalid email address'),
                    },
                  })}
                  type="email"
                  id="lf-email"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 sm:text-sm transition-colors duration-200"
                  placeholder={t('auth.email_placeholder', 'you@example.com')}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-rose-700">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lf-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.password', 'Password')}
              </label>
              <div className="relative">
                <span className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  {...register('password', {
                    required: t('auth.password_required', 'Password is required'),
                    minLength: {
                      value: 8,
                      message: t('auth.password_min_length', 'Password must be at least 8 characters'),
                    },
                  })}
                  type="password"
                  id="lf-password"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 sm:text-sm transition-colors duration-200"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-rose-700">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  id="lf-remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-700 focus:ring-amber-500 border-gray-300 rounded"
                />
                <label htmlFor="lf-remember-me" className="text-sm text-gray-600">
                  {t('auth.remember_me', 'Remember me')}
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-indigo-700 hover:text-indigo-800 transition-colors"
              >
                {t('auth.forgot_password', 'Forgot password?')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              ) : null}
              {t(isLoading ? 'auth.signing_in' : 'auth.sign_in', isLoading ? 'Signing in…' : 'Sign In')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
