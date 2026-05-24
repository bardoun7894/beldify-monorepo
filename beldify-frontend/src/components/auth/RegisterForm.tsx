'use client';

import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { User, Mail, Phone, Lock } from 'lucide-react';

type RegisterFormData = {
  [key: string]: string;
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  contact_number: string;
};

export default function RegisterForm() {
  const { register: registerUser } = useAuth();
  const { t, i18n } = useTranslation();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const locale = i18n.language;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await registerUser(data);
      if (response.success) {
        window.location.href = '/login';
      }
    } catch (err: any) {
      if (err.errors) {
        const messages = Object.values(err.errors).flat();
        setError((messages[0] as string) || t('auth.registration_failed', 'Registration failed'));
      } else {
        setError(err.message || t('auth.registration_failed', 'Registration failed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col md:flex-row">
      {/* Left Side — Atlas indigo editorial panel */}
      <div className="hidden md:flex md:w-1/2 bg-indigo-900 p-12 items-center justify-center relative overflow-hidden">
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
              {t('brand.name', 'Beldify')}
            </span>
          </Link>
          <h1
            className="text-4xl font-bold leading-[1.1] tracking-tight mb-4"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('auth.create_your_account', 'Join the Beldify community.')}
          </h1>
          <p className="text-indigo-200 text-base mb-8">
            {t('auth.join_our_community', 'Discover artisan crafts from across Morocco.')}
          </p>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm text-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              {t('auth.exclusive_member_benefits', 'Exclusive member benefits')}
            </li>
            <li className="flex items-center gap-3 text-sm text-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              {t('auth.fast_checkout', 'Fast, secure checkout')}
            </li>
            <li className="flex items-center gap-3 text-sm text-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              {t('auth.personalized_recommendations', 'Personalized recommendations')}
            </li>
          </ul>
        </div>
      </div>

      {/* Right Side — Register Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 bg-white overflow-y-auto">
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
              {t('auth.create_account', 'Create account')}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {t('auth.already_have_account', 'Already have an account?')}{' '}
              <Link
                href="/login"
                className="font-semibold text-indigo-700 hover:text-indigo-800 transition-colors"
              >
                {t('auth.sign_in', 'Sign in')}
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div
                className="p-4 text-sm text-rose-800 rounded-2xl bg-rose-50 ring-1 ring-rose-200"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Full name */}
            <div>
              <label htmlFor="rf-full-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.full_name', 'Full Name')}
              </label>
              <div className="relative">
                <span className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  {...register(`full_name_${locale}`, {
                    required: t('auth.full_name_required', 'Full name is required'),
                  })}
                  type="text"
                  id="rf-full-name"
                  dir={locale === 'ar' || locale === 'ma' ? 'rtl' : 'ltr'}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 sm:text-sm transition-colors duration-200"
                />
              </div>
              {errors[`full_name_${locale}`] && (
                <p className="mt-1.5 text-sm text-rose-700">
                  {errors[`full_name_${locale}`]?.message}
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="rf-username" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.username', 'Username')}
              </label>
              <div className="relative">
                <span className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                  <span className="text-xs font-mono">@</span>
                </span>
                <input
                  {...register('username', {
                    required: t('auth.username_required', 'Username is required'),
                    minLength: {
                      value: 3,
                      message: t('auth.username_min_length', 'Username must be at least 3 characters'),
                    },
                  })}
                  type="text"
                  id="rf-username"
                  className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 sm:text-sm transition-colors duration-200"
                />
              </div>
              {errors.username && (
                <p className="mt-1.5 text-sm text-rose-700">{errors.username.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="rf-email" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  id="rf-email"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 sm:text-sm transition-colors duration-200"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-rose-700">{errors.email.message}</p>
              )}
            </div>

            {/* Contact number */}
            <div>
              <label htmlFor="rf-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.contact_number', 'Contact Number')}
              </label>
              <div className="relative">
                <span className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  {...register('contact_number')}
                  type="tel"
                  id="rf-phone"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 sm:text-sm transition-colors duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="rf-password" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  id="rf-password"
                  autoComplete="new-password"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 sm:text-sm transition-colors duration-200"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-rose-700">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="rf-password-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.password_confirmation', 'Confirm Password')}
              </label>
              <div className="relative">
                <span className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  {...register('password_confirmation', {
                    required: t('auth.password_required', 'Password is required'),
                    validate: (value) =>
                      value === password || t('auth.passwords_must_match', 'Passwords must match'),
                  })}
                  type="password"
                  id="rf-password-confirm"
                  autoComplete="new-password"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 sm:text-sm transition-colors duration-200"
                  placeholder="••••••••"
                />
              </div>
              {errors.password_confirmation && (
                <p className="mt-1.5 text-sm text-rose-700">{errors.password_confirmation.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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
              {t(isLoading ? 'auth.registering' : 'auth.register', isLoading ? 'Registering…' : 'Register')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
