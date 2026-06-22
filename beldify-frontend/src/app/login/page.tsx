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
import { Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, googleAuth } = useAuth();
  const { t } = useTranslation();
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });

  // Check for redirect parameter in URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      sessionStorage.setItem('redirectAfterLogin', redirect);
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
      toast.error(t('errors.something_went_wrong', 'Something went wrong. Please try again.'));

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (!result.success) {
        toast.error(t('auth.login_error'));
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
      toast.error(t('auth.login_error'));
    } finally {
      setLoading(false);
    }
  };

  // Load the Google Identity Services script
  useEffect(() => {
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
      toast.error(t('auth.google_unavailable', 'Google Sign-In is currently unavailable'));
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
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 280,
      });

      logger.log('Google button initialized successfully');
    } catch (error) {
      logger.error('Error initializing Google button:', error);
      toast.error(t('auth.google_init_failed', 'Failed to initialize Google Sign-In'));
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
        toast.success(t('auth.google_login_success', 'Signed in with Google'));

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
        toast.error(t('auth.google_login_failed'));
      }
    } catch (err: any) {
      logger.error('Google auth error:', err);
      toast.error(t('auth.google_login_failed'));
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
              {t('auth.welcome_back', 'Welcome back to Beldify.')}
            </h1>
            <p className="text-indigo-200 text-lg leading-relaxed mb-10 max-w-sm">
              {t(
                'auth.welcome_back_sub',
                'Pick up where you left off — your wishlist, orders and tailoring chats are waiting.'
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

        <div className="w-full max-w-md">
          <h2
            className="text-3xl font-bold text-gray-900 mb-1"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('auth.login_title', 'Sign in')}
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            {t('auth.login_subtitle', 'Welcome back. Please enter your details.')}
          </p>

          {/* Google Sign-In */}
          <div className="mb-6">
            <div
              className="w-full flex flex-col gap-2 items-center"
              aria-label={t('auth.sign_in_with_google', 'Sign in with Google')}
            >
              <div
                ref={googleButtonRef}
                className="w-full flex justify-center min-h-[40px]"
              />

              {googleLoading && !window.google && (
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

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
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
                  placeholder={t('auth.email_placeholder', 'you@example.com')}
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
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 sm:text-sm transition"
                  placeholder={t('auth.password_placeholder', '••••••••')}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-600">
                  {t('auth.remember_me', 'Remember me')}
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  {t('auth.forgot_password', 'Forgot password?')}
                </Link>
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
              {t(loading ? 'auth.logging_in' : 'auth.login', loading ? 'Signing in...' : 'Sign in')}
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-500 mt-8">
            {t('auth.dont_have_account', "Don't have an account?")}{' '}
            <Link
              href="/register"
              className="font-semibold text-indigo-700 hover:text-indigo-800 transition-colors"
            >
              {t('auth.create_account', 'Create an account')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
