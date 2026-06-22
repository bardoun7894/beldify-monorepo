'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import toast from '@/utils/toast';
import Image from 'next/image';
import logger from '@/utils/consoleLogger';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Phone } from 'lucide-react';

export default function RegisterPage() {
  const { register, googleAuth } = useAuth();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get locale from URL parameters
  const locale = searchParams?.get('locale');

  // Set language based on URL parameter
  useEffect(() => {
    if (locale && i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
    contact_number: '',
    username: '', // Hidden field, will be generated dynamically
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Prepare data for backend
      const submitData = {
        ...formData,
        full_name_en: `${formData.first_name} ${formData.last_name}`.trim(),
        first_name: formData.first_name,
        last_name: formData.last_name,
      };

      // Include credentials to handle cookies
      const response = await axios.post('/api/auth/register', submitData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (response.data.status) {
        toast.success('Registration successful!');
        // Redirect to dashboard or home page
        router.push('/profile');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Registration failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prevData) => {
      const updatedData = { ...prevData, [name]: value };

      // Generate username automatically when last_name changes
      if (name === 'last_name' && value) {
        // Generate username from last name + random numbers
        const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit number
        const generatedUsername = `${value.toLowerCase()}${randomSuffix}`;

        updatedData.username = generatedUsername;
      }

      return updatedData;
    });
  };

  // Load the Google Identity Services script
  useEffect(() => {
    // Skip if the script is already loaded
    if (document.querySelector('script#google-identity-script')) {
      // If script exists, just initialize the button
      if (typeof window !== 'undefined' && window.google?.accounts) {
        setTimeout(initializeGoogleButton, 100);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleButton;
    script.onerror = () => {
      logger.error('Failed to load Google Identity script');
      toast.error('Google Sign-In is currently unavailable');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup function to safely handle component unmounting
      try {
        // First, cancel any active Google Sign-In prompts
        if (window.google?.accounts) {
          window.google.accounts.id.cancel();
        }

        // Then, safely remove the Google button if it exists
        if (googleButtonRef.current) {
          // Clear the button container instead of removing it
          while (googleButtonRef.current.firstChild) {
            googleButtonRef.current.removeChild(googleButtonRef.current.firstChild);
          }
        }
      } catch (e) {
        logger.error('Error during Google Identity cleanup:', e);
      }
    };
  }, []);

  const initializeGoogleButton = () => {
    if (!window.google || !googleButtonRef.current) return;

    try {
      // First, ensure the button container is empty to prevent duplicate buttons
      if (googleButtonRef.current) {
        while (googleButtonRef.current.firstChild) {
          googleButtonRef.current.removeChild(googleButtonRef.current.firstChild);
        }
      }

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Create a container div for the button to isolate it from React's DOM management
      const buttonContainer = document.createElement('div');
      if (googleButtonRef.current) {
        googleButtonRef.current.appendChild(buttonContainer);
      }

      // Render the button in the container
      window.google.accounts.id.renderButton(buttonContainer, {
        type: 'standard',
        size: 'large',
        text: 'signup_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 280,
      });

      logger.log('Google button initialized successfully');
    } catch (error) {
      logger.error('Error initializing Google button:', error);
      toast.error(t('auth.google_init_failed'));
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    setGoogleLoading(true);
    setError('');

    try {
      if (!response.credential) {
        throw new Error('NO_GOOGLE_CREDENTIAL');
      }

      const authResult = await googleAuth(response.credential, true);

      if (authResult.success) {
        toast.success(t('auth.google_login_success'));
        router.push('/profile');
      } else {
        const msg = t('auth.register_with_google_failed');
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      logger.error('Google auth error:', err);
      const key = err?.message === 'NO_GOOGLE_CREDENTIAL'
        ? 'auth.google_no_credential'
        : 'auth.register_with_google_failed';
      const msg = t(key);
      setError(msg);
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const bullets = [
    t('auth.bullet_verified', 'Verified Moroccan sellers'),
    t('auth.bullet_bespoke', 'Bespoke tailoring on demand'),
    t('auth.bullet_returns', 'Free 14-day returns'),
  ];

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
              {t('auth.join_circle', 'Join the Beldify circle.')}
            </h1>
            <p className="text-indigo-200 text-lg leading-relaxed mb-10 max-w-sm">
              {t(
                'auth.join_circle_sub',
                'Save your favorites, follow ateliers, and book bespoke fittings.'
              )}
            </p>

            <ul className="space-y-3">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-3 text-sm text-indigo-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  {bullet}
                </li>
              ))}
            </ul>
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

        <div className="w-full max-w-lg">
          <h2
            className="text-3xl font-bold text-gray-900 mb-1"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('auth.register_title', 'Create your account')}
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            {t('auth.register_subtitle', 'Join thousands of customers across Morocco.')}
          </p>

          {/* Google Sign-Up */}
          <div className="mb-6">
            <div
              className="w-full flex flex-col gap-2 items-center"
              aria-label={t('auth.sign_up_with_google', 'Sign up with Google')}
            >
              <div
                ref={googleButtonRef}
                className="w-full flex justify-center min-h-[40px]"
              />

              {googleLoading && typeof window !== 'undefined' && !window.google && (
                <div className="text-sm text-gray-500 mt-1 flex items-center">
                  <svg
                    className="animate-spin h-4 w-4 mr-2 text-indigo-600"
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
                  {t('auth.loading_google', 'Loading Google Sign-In...')}
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-amber-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-400 uppercase tracking-[0.12em]">
                {t('auth.or_continue_with', 'Or continue with email')}
              </span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          {/* Registration form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First name */}
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('auth.first_name', 'First Name')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 sm:text-sm transition"
                    placeholder={t('auth.first_name', 'First Name')}
                  />
                </div>
              </div>

              {/* Last name */}
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('auth.last_name', 'Last Name')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 sm:text-sm transition"
                    placeholder={t('auth.last_name', 'Last Name')}
                  />
                </div>
                {formData.username && (
                  <p className="text-xs text-gray-400 mt-1">
                    {t('auth.username_generated', 'Username:')}{' '}
                    <span className="font-medium text-gray-600">{formData.username}</span>
                  </p>
                )}
              </div>

              {/* Email */}
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
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 sm:text-sm transition"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Contact number */}
              <div>
                <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('auth.contact_number', 'Contact Number')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    id="contact_number"
                    name="contact_number"
                    type="tel"
                    required
                    value={formData.contact_number}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 sm:text-sm transition"
                    placeholder="+212 6 12 34 56 78"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('auth.password', 'Password')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 sm:text-sm transition"
                    placeholder={t('auth.password', '••••••••')}
                  />
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="password_confirmation"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  {t('auth.password_confirmation', 'Confirm Password')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 sm:text-sm transition"
                    placeholder={t('auth.password', '••••••••')}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
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
              {t(loading ? 'auth.registering' : 'auth.register', loading ? 'Creating account...' : 'Create account')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            {t('auth.already_have_account', 'Already have an account?')}{' '}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {t('auth.sign_in', 'Sign in')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
