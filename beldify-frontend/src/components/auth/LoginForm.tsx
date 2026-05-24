'use client';

import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import toast from '@/utils/toast';
import Image from 'next/image';

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
  } = useForm() as ReturnType<typeof useForm<LoginFormData>>; // Fix type casting

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError('');

      const result = await login(data.email, data.password);
      if (!result.success && result.message) {
        setError(result.message);
      } else {
        toast.success(t('auth.login_success'));
        // router.push('/profile');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tw-min-h-screen tw-bg-gray-50 tw-flex tw-flex-col md:tw-flex-row">
      {/* Left Side - Banner */}
      <div className="tw-hidden md:tw-flex md:tw-w-1/2 tw-bg-gradient-to-br tw-from-blue-600 tw-to-blue-800 tw-p-12 tw-items-center tw-justify-center">
        <div className="tw-max-w-lg tw-text-white">
          <h1 className="tw-text-4xl tw-font-bold tw-mb-8">{t('auth.welcome_to_our_store')}</h1>
          <p className="tw-text-xl tw-mb-8">{t('auth.get_access_to_exclusive_deals')}</p>
          <div className="tw-flex tw-space-x-4 tw-mb-8">
            <div className="tw-flex tw-items-center">
              <svg className="tw-w-6 tw-h-6 tw-mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{t('auth.easy_order_tracking')}</span>
            </div>
            <div className="tw-flex tw-items-center">
              <svg className="tw-w-6 tw-h-6 tw-mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{t('auth.exclusive_deals')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="tw-flex-1 tw-flex tw-flex-col tw-justify-center tw-px-4 tw-py-12 sm:tw-px-6 lg:tw-flex-none lg:tw-px-20 xl:tw-px-24">
        <div className="tw-mx-auto tw-w-full tw-max-w-sm lg:tw-w-96">
          <div className="tw-text-center tw-mb-8">
            <Image
              src="/logo.png"
              alt="Logo"
              width={120}
              height={40}
              className="tw-mx-auto tw-mb-4"
            />
            <h2 className="tw-text-3xl tw-font-bold tw-text-gray-900">
              {t('auth.sign_in_to_your_account')}
            </h2>
            <p className="tw-mt-2 tw-text-sm tw-text-gray-600">
              {t('auth.or')}{' '}
              <Link
                href="/register"
                className="tw-font-medium tw-text-blue-600 hover:tw-text-blue-500"
              >
                {t('auth.create_account')}
              </Link>
            </p>
          </div>

          <div className="tw-mt-6">
            <div className="tw-mt-6 tw-grid tw-grid-cols-2 tw-gap-3">
              <button
                type="button"
                className="tw-w-full tw-inline-flex tw-justify-center tw-py-2 tw-px-4 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm tw-bg-white tw-text-sm tw-font-medium tw-text-gray-500 hover:tw-bg-gray-50"
                onClick={() => toast.success('Google login coming soon!')}
              >
                <svg className="tw-w-5 tw-h-5 tw-mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                className="tw-w-full tw-inline-flex tw-justify-center tw-py-2 tw-px-4 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm tw-bg-white tw-text-sm tw-font-medium tw-text-gray-500 hover:tw-bg-gray-50"
                onClick={() => toast.success('Apple login coming soon!')}
              >
                <svg className="tw-w-5 tw-h-5 tw-mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                Apple
              </button>
            </div>

            <div className="tw-mt-6">
              <div className="tw-relative">
                <div className="tw-absolute tw-inset-0 tw-flex tw-items-center">
                  <div className="tw-w-full tw-border-t tw-border-gray-300"></div>
                </div>
                <div className="tw-relative tw-flex tw-justify-center tw-text-sm">
                  <span className="tw-px-2 tw-bg-gray-50 tw-text-gray-500">
                    {t('auth.or_continue_with')}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="tw-space-y-6 tw-mt-6">
              {error && (
                <div
                  className="tw-p-4 tw-text-sm tw-text-red-800 tw-rounded-lg tw-bg-red-50"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="tw-block tw-text-sm tw-font-medium tw-text-gray-700"
                >
                  {t('auth.email_address')}
                </label>
                <div className="tw-mt-1">
                  <input
                    {...register('email', {
                      required: t('auth.email_required'),
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: t('auth.invalid_email'),
                      },
                    })}
                    type="email"
                    id="email"
                    className="tw-appearance-none tw-block tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm placeholder-gray-400 focus:tw-outline-none focus:tw-ring-blue-500 focus:tw-border-blue-500"
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="tw-block tw-text-sm tw-font-medium tw-text-gray-700"
                >
                  {t('auth.password')}
                </label>
                <div className="tw-mt-1">
                  <input
                    {...register('password', {
                      required: t('auth.password_required'),
                      minLength: {
                        value: 8,
                        message: t('auth.password_min_length'),
                      },
                    })}
                    type="password"
                    id="password"
                    className="tw-appearance-none tw-block tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm placeholder-gray-400 focus:tw-outline-none focus:tw-ring-blue-500 focus:tw-border-blue-500"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="tw-h-4 tw-w-4 tw-text-blue-600 focus:tw-ring-blue-500 tw-border-gray-300 tw-rounded"
                  />
                  <label
                    htmlFor="remember-me"
                    className="tw-ml-2 tw-block tw-text-sm tw-text-gray-900"
                  >
                    {t('auth.remember_me')}
                  </label>
                </div>

                <div className="tw-text-sm">
                  <Link
                    href="/forgot-password"
                    className="tw-font-medium tw-text-blue-600 hover:tw-text-blue-500"
                  >
                    {t('auth.forgot_password')}
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`tw-w-full tw-flex tw-justify-center tw-py-2 tw-px-4 tw-border tw-border-transparent tw-rounded-md tw-shadow-sm tw-text-sm tw-font-medium tw-text-white tw-bg-blue-600 hover:tw-bg-blue-700 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-blue-500 ${
                    isLoading ? 'tw-opacity-50 tw-cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="tw-animate-spin tw-h-5 tw-w-5 tw-mr-3" viewBox="0 0 24 24">
                        <circle
                          className="tw-opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="tw-opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {t('auth.signing_in')}
                    </>
                  ) : (
                    <>{t('auth.sign_in')}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
