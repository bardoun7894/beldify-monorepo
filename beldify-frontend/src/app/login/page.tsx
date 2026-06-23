'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import toast from '@/utils/toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import logger from '@/utils/consoleLogger';
import { useCart } from '@/contexts/CartContext';
import { AtSign, Lock, Eye, EyeOff } from 'lucide-react';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';

export default function LoginPage() {
  const router = useRouter();
  const { login, googleAuth } = useAuth();
  const { t } = useTranslation();
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    remember: false,
  });

  // Check for redirect parameter in URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      try {
        sessionStorage.setItem('redirectAfterLogin', redirect);
      } catch {
        /* sessionStorage unavailable (Safari private mode / sandboxed iframe) */
      }
    }
  }, []);

  // Function to handle stored actions after successful login
  const handleStoredAction = async () => {
    const redirectAction = sessionStorage.getItem('redirectAction');

    if (!redirectAction) return false; // No stored action

    try {
      const productId = sessionStorage.getItem('redirectProductId');
      const quantity = parseInt(sessionStorage.getItem('redirectQuantity') || '1');
      const variantData = sessionStorage.getItem('redirectVariant');

      if (!productId) {
        logger.warn('No product ID found for stored action');
        return false;
      }

      if (redirectAction === 'addToCart') {
        // Add item to cart
        if (variantData) {
          const variant = JSON.parse(variantData);
          await addItem(Number(variant.id), quantity, 'variant');
        } else {
          await addItem(Number(productId), quantity, 'stock');
        }

        // Clear stored data
        sessionStorage.removeItem('redirectAction');
        sessionStorage.removeItem('redirectProductId');
        sessionStorage.removeItem('redirectQuantity');
        sessionStorage.removeItem('redirectVariant');

        // Navigate to cart
        router.push('/cart');
        return true;
      } else if (redirectAction === 'purchaseNow') {
        // Add item to cart first
        if (variantData) {
          const variant = JSON.parse(variantData);
          await addItem(Number(variant.id), quantity, 'variant');
        } else {
          await addItem(Number(productId), quantity, 'stock');
        }

        // Set purchase now flag
        sessionStorage.setItem('purchaseNow', 'true');

        // Clear stored data
        sessionStorage.removeItem('redirectAction');
        sessionStorage.removeItem('redirectProductId');
        sessionStorage.removeItem('redirectQuantity');
        sessionStorage.removeItem('redirectVariant');

        // Navigate to checkout
        router.push('/checkout');
        return true;
      }
    } catch (error) {
      logger.error('Error handling stored action:', error);
      toast.error(t('auth.action_failed'));

      // Clear stored data on error
      sessionStorage.removeItem('redirectAction');
      sessionStorage.removeItem('redirectProductId');
      sessionStorage.removeItem('redirectQuantity');
      sessionStorage.removeItem('redirectVariant');
    }

    return false;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear field error on change
    if (name in fieldErrors) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: { identifier?: string; password?: string } = {};
    if (!formData.identifier.trim()) {
      errors.identifier = t('auth.identifier_required', 'Phone or email is required');
    }
    if (!formData.password) {
      errors.password = t('auth.password_required', 'Password is required');
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await login(formData.identifier, formData.password);

      if (!result.success) {
        toast.error(result.message || t('auth.login_error'));
        return;
      }

      toast.success(t('auth.login_success'));

      // First, try to handle stored actions (add to cart or purchase now)
      const handledStoredAction = await handleStoredAction();

      if (!handledStoredAction) {
        // If no stored action was handled, check for general redirect path
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
          // Clear the redirect path from sessionStorage
          sessionStorage.removeItem('redirectAfterLogin');

          // Use router for internal paths, window.location for external
          if (redirectPath.startsWith('/')) {
            router.push(redirectPath);
          } else {
            // For external URLs or complex paths
            window.location.href = redirectPath;
          }
        } else {
          // If no specific redirect, go to profile
          router.push('/profile');
        }
      }
    } catch (error: any) {
      logger.error('Login error:', error);
      toast.error(error.response?.data?.message || t('auth.login_error'));
    } finally {
      setLoading(false);
    }
  };

  // Mount-only effect: loads the Google Identity script once. initializeGoogleButton and t
  // are referenced inside but must not trigger a re-load on language or function identity changes.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return;

    // Capture the button container ref at effect registration time so the cleanup
    // closure uses the value that was current when the effect ran, not at teardown.
    const buttonContainer = googleButtonRef.current;

    // Skip if the script is already loaded
    if (document.querySelector('script#google-identity-script')) {
      // If script exists, just initialize the button
      if (window.google?.accounts) {
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
      toast.error(t('auth.google_unavailable'));
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup function to safely handle component unmounting
      try {
        // First, cancel any active Google Sign-In prompts
        if (window.google?.accounts) {
          window.google.accounts.id.cancel();
        }

        // Use the ref value captured at effect registration time (above).
        if (buttonContainer) {
          while (buttonContainer.firstChild) {
            buttonContainer.removeChild(buttonContainer.firstChild);
          }
        }
      } catch (e) {
        logger.error('Error during Google Identity cleanup:', e);
      }
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

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
        text: 'signin_with',
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

    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      const authResult = await googleAuth(response.credential, false); // false indicates this is login, not registration

      if (authResult.success) {
        toast.success(t('auth.google_login_success'));

        // First, try to handle stored actions (add to cart or purchase now)
        const handledStoredAction = await handleStoredAction();

        if (!handledStoredAction) {
          // If no stored action was handled, check for general redirect path
          const redirectPath = sessionStorage.getItem('redirectAfterLogin');
          if (redirectPath) {
            sessionStorage.removeItem('redirectAfterLogin');

            if (redirectPath.startsWith('/')) {
              router.push(redirectPath);
            } else {
              window.location.href = redirectPath;
            }
          } else {
            router.push('/profile');
          }
        }
      } else {
        toast.error(authResult.message || t('auth.google_login_failed'));
      }
    } catch (err: any) {
      logger.error('Google auth error:', err);
      const errorMsg = err.message || 'Login with Google failed';
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

  // Heading/subtext use English fallbacks — Arabic translation provided via i18n keys

  const inputBase =
    'w-full ps-9 pe-10 py-3 border rounded-2xl text-gray-900 placeholder-gray-400 text-sm transition-colors duration-200 focus:outline-none focus:ring-2';
  const inputDefault = `${inputBase} border-gray-200 focus:border-indigo-700 focus:ring-indigo-700/20`;
  const inputError = `${inputBase} border-rose-300 focus:border-rose-500 focus:ring-rose-500/20`;

  return (
    <div className="min-h-screen flex">
      {/* Brand editorial panel — inherits dir from <html> via useDirection hook */}
      <AuthBrandPanel
        heading={t('auth.welcome_back', 'Welcome back to Beldify.')}
        subtext={t(
          'auth.welcome_back_sub',
          'Pick up where you left off. Your wishlist, orders and tailoring chats are waiting.'
        )}
        bullets={bullets}
      />

      {/* Form side */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-10 lg:px-14 min-h-screen">
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
          {/* Page heading */}
          <div className="mb-8">
            <h2
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 leading-tight"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('auth.login_title', 'Sign in')}
            </h2>
            <p className="text-gray-600 text-sm">
              {t('auth.login_subtitle', 'Welcome back. Please enter your details.')}
            </p>
          </div>

          {/* Google Sign-In — only rendered when client_id is configured */}
          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
          <div className="mb-5">
            <div
              className="w-full flex flex-col gap-2 items-center"
              aria-label={t('auth.sign_in_with_google', 'Sign in with Google')}
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
          )}

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-500 uppercase tracking-[0.14em]">
                {t('auth.or_continue_with', 'Or continue with email')}
              </span>
            </div>
          </div>

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {/* Phone or email — unified identifier field */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t('auth.identifier', 'Phone or email')}
              </label>
              {/* dir=ltr so icon and padding stay on the same physical side */}
              <div className="relative" dir="ltr">
                <span className="absolute start-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                  <AtSign className="h-4 w-4" aria-hidden />
                </span>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.identifier}
                  onChange={handleChange}
                  aria-invalid={!!fieldErrors.identifier}
                  aria-describedby={fieldErrors.identifier ? 'identifier-error' : undefined}
                  className={fieldErrors.identifier ? inputError : inputDefault}
                  placeholder={t('auth.identifier_placeholder', '+212 6 12 34 56 78 or email')}
                />
              </div>
              {fieldErrors.identifier && (
                <p id="identifier-error" className="mt-1.5 text-xs text-rose-700" role="alert">
                  {fieldErrors.identifier}
                </p>
              )}
            </div>

            {/* Password */}
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
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  className={fieldErrors.password ? inputError : inputDefault}
                  placeholder={t('auth.password_placeholder', '••••••••')}
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
              {fieldErrors.password && (
                <p id="password-error" className="mt-1.5 text-xs text-rose-700" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-200 text-indigo-700 focus:ring-indigo-700/30"
                />
                <label htmlFor="remember" className="text-sm text-gray-600">
                  {t('auth.remember_me', 'Remember me')}
                </label>
              </div>

              <Link
                href="/forgot-password"
                className="text-sm font-medium text-indigo-700 hover:text-indigo-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
              >
                {t('auth.forgot_password', 'Forgot password?')}
              </Link>
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
              {t(loading ? 'auth.logging_in' : 'auth.login', loading ? 'Signing in...' : 'Sign in')}
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-500 mt-8">
            {t('auth.dont_have_account', "Don't have an account?")}{' '}
            <Link
              href="/register"
              className="font-semibold text-indigo-700 hover:text-indigo-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
            >
              {t('auth.create_account', 'Create an account')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
