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
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';

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
  const [fieldErrors, setFieldErrors] = useState<{
    first_name?: string;
    last_name?: string;
    email?: string;
    contact_number?: string;
    password?: string;
    password_confirmation?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Lightweight password strength: count satisfied rules (length, mixed case, digit/symbol).
  const passwordScore = (() => {
    const p = formData.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score += 1;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score += 1;
    if (/\d/.test(p) || /[^A-Za-z0-9]/.test(p)) score += 1;
    return score; // 0–3
  })();
  const strengthMeta = [
    { label: t('auth.password_weak', 'Weak'), bar: 'w-1/3 bg-amber-400', text: 'text-amber-700' },
    { label: t('auth.password_fair', 'Fair'), bar: 'w-2/3 bg-amber-500', text: 'text-amber-700' },
    { label: t('auth.password_strong', 'Strong'), bar: 'w-full bg-indigo-700', text: 'text-indigo-700' },
  ][Math.max(0, passwordScore - 1)];

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!formData.first_name.trim()) {
      errors.first_name = t('auth.first_name_required', 'First name is required');
    }
    if (!formData.last_name.trim()) {
      errors.last_name = t('auth.last_name_required', 'Last name is required');
    }
    if (!formData.email) {
      errors.email = t('auth.email_required', 'Email is required');
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      errors.email = t('auth.invalid_email', 'Please enter a valid email address');
    }
    if (!formData.contact_number.trim()) {
      errors.contact_number = t('auth.contact_required', 'Contact number is required');
    }
    if (!formData.password) {
      errors.password = t('auth.password_required', 'Password is required');
    } else if (formData.password.length < 8) {
      errors.password = t('auth.password_too_short', 'Use at least 8 characters');
    }
    if (!formData.password_confirmation) {
      errors.password_confirmation = t('auth.confirm_required', 'Please confirm your password');
    } else if (formData.password !== formData.password_confirmation) {
      errors.password_confirmation = t('auth.passwords_no_match', 'Passwords do not match');
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!validateForm()) return;
    setError('');
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

    // Clear field error on change (mirrors login's pattern)
    if (name in fieldErrors) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
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
      toast.error('Failed to initialize Google Sign-Up');
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    setGoogleLoading(true);
    setError('');

    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      const authResult = await googleAuth(response.credential, true);

      if (authResult.success) {
        toast.success('Google registration successful!');
        router.push('/profile');
      } else {
        setError(authResult.message || 'Registration failed');
        toast.error(authResult.message || 'Registration with Google failed');
      }
    } catch (err: any) {
      logger.error('Google auth error:', err);
      const errorMsg = err.message || 'Registration with Google failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const bullets = [
    t('auth.bullet_verified', 'Verified Moroccan sellers'),
    t('auth.bullet_bespoke', 'Bespoke tailoring on demand'),
    t('auth.bullet_returns', 'Free 14-day returns'),
  ];

  // Shared input class pair (mirrors login's inputDefault/inputError contract).
  const inputBase =
    'w-full ps-9 pe-4 py-3 border rounded-2xl text-gray-900 placeholder-gray-400 text-sm transition-colors duration-200 focus:outline-none focus:ring-2';
  const inputDefault = `${inputBase} border-amber-200 focus:border-indigo-700 focus:ring-indigo-700/20`;
  const inputError = `${inputBase} border-rose-300 focus:border-rose-500 focus:ring-rose-500/20`;

  // Variant with extra trailing padding for the show/hide toggle button.
  const inputWithToggleBase =
    'w-full ps-9 pe-10 py-3 border rounded-2xl text-gray-900 placeholder-gray-400 text-sm transition-colors duration-200 focus:outline-none focus:ring-2';
  const inputWithToggleDefault = `${inputWithToggleBase} border-amber-200 focus:border-indigo-700 focus:ring-indigo-700/20`;
  const inputWithToggleError = `${inputWithToggleBase} border-rose-300 focus:border-rose-500 focus:ring-rose-500/20`;

  return (
    <div className="min-h-screen flex">
      {/* Brand panel — inherits dir from <html> via useDirection hook */}
      <AuthBrandPanel
        heading={t('auth.join_circle', 'Join the Beldify circle.')}
        subtext={t(
          'auth.join_circle_sub',
          'Save your favorites, follow ateliers, and book bespoke fittings.'
        )}
        bullets={bullets}
      />

      {/* Form side */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-10 lg:px-14 overflow-y-auto">
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

        <div className="w-full max-w-lg">
          {/* Page heading */}
          <div className="mb-8">
            <h2
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 leading-tight"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('auth.register_title', 'Create your account')}
            </h2>
            <p className="text-gray-600 text-sm">
              {t('auth.register_subtitle', 'Join thousands of customers across Morocco.')}
            </p>
          </div>

          {/* Google Sign-Up */}
          <div className="mb-5">
            <div
              className="w-full flex flex-col gap-2 items-center"
              aria-label={t('auth.sign_up_with_google', 'Sign up with Google')}
            >
              <div
                ref={googleButtonRef}
                className="w-full flex justify-center min-h-[44px]"
              />

              {googleLoading && (
                <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-indigo-600"
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
                  {t('auth.loading_google', 'Loading Google Sign-In...')}
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-amber-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-500 uppercase tracking-[0.14em]">
                {t('auth.or_continue_with', 'Or continue with email')}
              </span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm mb-5"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Registration form */}
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {/* Name row — kept side-by-side; names may be Arabic so NO dir=ltr */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First name */}
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  {t('auth.first_name', 'First Name')}
                </label>
                <div className="relative">
                  <span className="absolute start-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                    <User className="h-4 w-4" aria-hidden />
                  </span>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    aria-invalid={!!fieldErrors.first_name}
                    aria-describedby={fieldErrors.first_name ? 'first_name-error' : undefined}
                    className={fieldErrors.first_name ? inputError : inputDefault}
                    placeholder={t('auth.first_name_placeholder', 'First Name')}
                  />
                </div>
                {fieldErrors.first_name && (
                  <p id="first_name-error" className="mt-1.5 text-xs text-rose-700" role="alert">
                    {fieldErrors.first_name}
                  </p>
                )}
              </div>

              {/* Last name */}
              <div>
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  {t('auth.last_name', 'Last Name')}
                </label>
                <div className="relative">
                  <span className="absolute start-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                    <User className="h-4 w-4" aria-hidden />
                  </span>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    aria-invalid={!!fieldErrors.last_name}
                    aria-describedby={fieldErrors.last_name ? 'last_name-error' : undefined}
                    className={fieldErrors.last_name ? inputError : inputDefault}
                    placeholder={t('auth.last_name_placeholder', 'Last Name')}
                  />
                </div>
                {fieldErrors.last_name && (
                  <p id="last_name-error" className="mt-1.5 text-xs text-rose-700" role="alert">
                    {fieldErrors.last_name}
                  </p>
                )}
              </div>
            </div>

            {/* Email — full width, LTR island (icon span + input padding) */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t('auth.email', 'Email address')}
              </label>
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
                  value={formData.email}
                  onChange={handleChange}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  className={fieldErrors.email ? inputError : inputDefault}
                  placeholder="example@mail.com"
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="mt-1.5 text-xs text-rose-700" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Contact number — full width, LTR island */}
            <div>
              <label
                htmlFor="contact_number"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t('auth.contact_number', 'Contact Number')}
              </label>
              <div className="relative" dir="ltr">
                <span className="absolute start-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                  <Phone className="h-4 w-4" aria-hidden />
                </span>
                <input
                  id="contact_number"
                  name="contact_number"
                  type="tel"
                  required
                  value={formData.contact_number}
                  onChange={handleChange}
                  aria-invalid={!!fieldErrors.contact_number}
                  aria-describedby={fieldErrors.contact_number ? 'contact_number-error' : undefined}
                  className={fieldErrors.contact_number ? inputError : inputDefault}
                  placeholder="+212 6 12 34 56 78"
                />
              </div>
              {fieldErrors.contact_number && (
                <p id="contact_number-error" className="mt-1.5 text-xs text-rose-700" role="alert">
                  {fieldErrors.contact_number}
                </p>
              )}
            </div>

            {/* Password — full width, stacked above confirm (not side-by-side) */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t('auth.password', 'Password')}
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
                  value={formData.password}
                  onChange={handleChange}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  className={fieldErrors.password ? inputWithToggleError : inputWithToggleDefault}
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
              {/* Password strength affordance */}
              {formData.password && strengthMeta && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1 flex-1 rounded-full bg-amber-100 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-200 ${strengthMeta.bar}`} />
                  </div>
                  <span className={`text-xs font-medium ${strengthMeta.text}`}>
                    {strengthMeta.label}
                  </span>
                </div>
              )}
              {fieldErrors.password && (
                <p id="password-error" className="mt-1.5 text-xs text-rose-700" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm password — full width */}
            <div>
              <label
                htmlFor="password_confirmation"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t('auth.password_confirmation', 'Confirm Password')}
              </label>
              <div className="relative" dir="ltr">
                <span className="absolute start-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" aria-hidden />
                </span>
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  aria-invalid={!!fieldErrors.password_confirmation}
                  aria-describedby={fieldErrors.password_confirmation ? 'password_confirmation-error' : undefined}
                  className={fieldErrors.password_confirmation ? inputWithToggleError : inputWithToggleDefault}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute end-3 inset-y-0 flex items-center text-gray-400 hover:text-indigo-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
                  aria-label={showConfirmPassword ? t('auth.hide_password', 'Hide password') : t('auth.show_password', 'Show password')}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password_confirmation && (
                <p id="password_confirmation-error" className="mt-1.5 text-xs text-rose-700" role="alert">
                  {fieldErrors.password_confirmation}
                </p>
              )}
            </div>

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
              {t(loading ? 'auth.registering' : 'auth.register', loading ? 'Creating account...' : 'Create account')}
            </button>
          </form>

          {/* Sign in link */}
          <p className="text-center text-sm text-gray-500 mt-8">
            {t('auth.already_have_account', 'Already have an account?')}{' '}
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
  );
}
