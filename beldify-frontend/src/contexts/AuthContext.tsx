'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from '@/lib/axios';
import toast from '@/utils/toast';
import logger from '@/utils/consoleLogger';
import { User, AuthResponse } from '@/types/auth';
import { cartService } from '@/services/api';
import { getGuestWishlist, clearGuestWishlist } from '@/utils/guestWishlist';

// Define interface for registration data
interface RegisterUserData {
  // Phone-first required fields
  full_name_en: string;
  phone: string;
  password: string;
  password_confirmation: string;
  // Optional
  email?: string;
  // Legacy fields still accepted for backward-compat (Google auth, old paths)
  full_name?: string | null;
  full_name_ar?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  contact_number?: string | null;
  // Allow extra fields from callers
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  /** identifier can be phone OR email */
  login: (identifier: string, password: string, remember?: boolean) => Promise<{ success: boolean; message?: string }>;
  register: (userData: RegisterUserData) => Promise<{ success: boolean; message?: string; errors?: any }>;
  googleAuth: (credential: string, isRegistration?: boolean) => Promise<{ success: boolean; message?: string; errors?: any }>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<{ success: boolean; message?: string }>;
  updatePassword: (data: any) => Promise<{ success: boolean; message?: string }>;
  updatePreferences: (data: any) => Promise<{ success: boolean; message?: string }>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  googleAuth: async () => ({ success: false }),
  logout: async () => {},
  updateProfile: async () => ({ success: false }),
  updatePassword: async () => ({ success: false }),
  updatePreferences: async () => ({ success: false }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize axios with stored token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Check authentication status on mount and cache the result.
  // checkAuth and handleAuthError are defined after this effect and intentionally omitted from
  // the dep array: including them would create a new function reference on every render and
  // cause an infinite auth-check loop.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    // Check if token is expired (older than 24 hours)
    const tokenTimestamp = localStorage.getItem('token_timestamp');
    const now = new Date().getTime();
    const tokenAge = tokenTimestamp ? now - parseInt(tokenTimestamp) : Infinity;
    const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

    if (tokenAge > TOKEN_EXPIRY) {
      // Token is expired, clear everything
      handleAuthError().catch(error => logger.error('Error handling auth error:', error));
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      // Always set the Authorization header if we have a token
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Check cached user data first
      const cachedUserData = localStorage.getItem('cached_user_data');
      if (cachedUserData) {
        try {
          const { user: cachedUser, timestamp } = JSON.parse(cachedUserData);
          // Use cached data if less than 15 minutes old
          if (now - timestamp < 15 * 60 * 1000) {
            setUser(cachedUser);
            setIsAuthenticated(true);
            setLoading(false);
            logger.log('Using cached user data');
            // Still check auth in the background to refresh data
            checkAuth(false);
            return;
          }
        } catch (e) {
          // Invalid cached data, ignore and fetch fresh
          localStorage.removeItem('cached_user_data');
        }
      }
      
      // No valid cached data, check auth with the server
      checkAuth();
    } else {
      // No token, clear user
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
    }
  }, [pathname]); // Re-run when pathname changes to handle navigation
  /* eslint-enable react-hooks/exhaustive-deps */

  const checkAuth = async (isInitialLoad = true) => {
    if (!isInitialLoad) setLoading(true); // Set loading true only for non-initial checks
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        // No token, clear auth state
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      // Set token in axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Check for cached user data with timestamp
      const cachedUserData = localStorage.getItem('cached_user_data');
      const now = new Date().getTime();

      // Always update token timestamp when checking auth to prevent premature expiration
      localStorage.setItem('token_timestamp', now.toString());

      if (cachedUserData && isInitialLoad) {
        try {
          const { user: cachedUser, timestamp } = JSON.parse(cachedUserData);
          // Use cached data if less than 15 minutes old
          if (now - timestamp < 15 * 60 * 1000) {
            setUser(cachedUser);
            setIsAuthenticated(true);
            setLoading(false);
            // Still fetch in background if using cached data
            setTimeout(() => fetchUserProfile(token), 100);
            return;
          }
        } catch (e) {
          // Invalid cached data, ignore and fetch fresh
          localStorage.removeItem('cached_user_data');
        }
      }

      await fetchUserProfile(token);
    } catch (error) {
      handleAuthError();
    } finally {
      setLoading(false);
    }
  };

    // Helper function to fetch user profile
  const fetchUserProfile = async (token: string) => {
    try {
      // Ensure we have the Authorization header set
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.get('/api/user/profile');

      if (response.data.status === 'success') {
        setUser(response.data.user);
        setIsAuthenticated(true);

        // Cache the user data with timestamp
        localStorage.setItem('cached_user_data', JSON.stringify({
          user: response.data.user,
          timestamp: new Date().getTime()
        }));
      } else {
        await handleAuthError();
      }
    } catch (error: any) {
      logger.error('Failed to fetch user profile:', error);
      if (error.response?.status === 401) {
        await handleAuthError();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = async () => {
    // Clear all auth-related cache
    localStorage.removeItem('token');
    localStorage.removeItem('token_timestamp');
    localStorage.removeItem('cached_token');
    localStorage.removeItem('cached_user_data');
    delete axios.defaults.headers.common['Authorization'];

    // Clear authentication cookies
    try {
      // Use window.location.origin to get the base URL dynamically
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      await axios.delete(`${baseUrl}/api/auth/set-cookie`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        withCredentials: true
      });
      logger.log('Authentication cookies cleared on auth error');
    } catch (cookieError) {
      logger.error('Failed to clear authentication cookies on auth error:', cookieError);
      // Fallback method - manually delete cookies if API fails
      if (typeof document !== 'undefined') {
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        logger.log('Fallback: Cookies manually cleared');
      }
    }

    setIsAuthenticated(false);
    setUser(null);

    // Only redirect if on a protected route and not already on login page
    if (pathname && protectedRoutes.some(route => pathname.startsWith(route)) && pathname !== '/login') {
      // Prefetch login page for faster redirection
      router.prefetch('/login');
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  };

  const login = async (identifier: string, password: string, remember = false): Promise<AuthResponse> => {
    setLoading(true);
    try {
      toast.debug(`Attempting login for identifier: ${identifier}`);
      logger.log('Attempting login...');

      // Get CSRF token from our custom endpoint
      let csrfToken = '';
      try {
        const csrfResponse = await axios.get('/api/auth/csrf-cookie', { withCredentials: true });
        logger.log('CSRF response:', csrfResponse.data);
        if (csrfResponse.data && csrfResponse.data.csrf_token) {
          csrfToken = csrfResponse.data.csrf_token;
        }
      } catch (csrfError) {
        logger.error('Failed to get CSRF cookie:', csrfError);
        // Continue with login attempt even if CSRF fetch fails
      }

      // Post identifier (phone or email) as both `identifier` (new contract)
      // and `email` (backward-compat for older backend paths).
      const response = await axios.post('/api/auth/login',
        { identifier, email: identifier, password },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken || ''
          }
        }
      );

      // Handle both Laravel and custom response formats
      const isSuccess = response.data.status === 'success' ||
                       response.data.success === true ||
                       response.status === 200;

      logger.log('Login response data:', response.data);

      if (isSuccess && (response.data.token || response.data.access_token)) {
        // Handle both 'token' and 'access_token' field names
        const token = response.data.token || response.data.access_token;
        let user = response.data.user || response.data.data?.user;

        // If no user data in response, create a basic user object
        if (!user && response.data.email) {
          user = {
            id: response.data.id || 1,
            email: response.data.email,
            name: response.data.name || response.data.email.split('@')[0],
          };
        }

        logger.log('Login successful, setting token and user');

        // Store token with timestamp for expiration tracking
        const now = new Date().getTime();
        localStorage.setItem('token', token);
        localStorage.setItem('token_timestamp', now.toString());
        localStorage.setItem('cached_token', token);

        // Also set token as a cookie for API routes to access
        if (typeof document !== 'undefined') {
          // Set token cookie with secure settings
          const expires = new Date();
          expires.setDate(expires.getDate() + 7); // 7 days expiry
          const cookieOptions = `expires=${expires.toUTCString()}; path=/; samesite=strict`;
          document.cookie = `token=${token}; ${cookieOptions}`;
          document.cookie = `auth_token=${token}; ${cookieOptions}`; // Fallback cookie name
          logger.log('Token set in both localStorage and cookies');
        }

        // Set axios defaults immediately
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        setUser(user);
        setIsAuthenticated(true);

        // If we still don't have complete user data, fetch it
        if (!user || !user.id) {
          try {
            logger.log('Fetching user profile after login...');
            await fetchUserProfile(token);
          } catch (error) {
            logger.error('Failed to fetch user profile after login:', error);
            // Continue anyway, basic authentication is working
          }
        } else {
          // Cache user data with timestamp
          localStorage.setItem('cached_user_data', JSON.stringify({
            user,
            timestamp: new Date().getTime()
          }));
        }

        // Attempt to merge guest cart if guest token exists
        const guestToken = localStorage.getItem('guest_token');
        if (guestToken) {
          try {
            await cartService.mergeGuestCart();
            // Clear guest token after successful merge and refresh cart state
            localStorage.removeItem('guest_token');
            window.dispatchEvent(new Event('cart:refresh'));
          } catch (error) {
            // Keep the guest token so a later session can retry the merge.
            logger.error('Failed to merge guest cart:', error);
            // Don't show error to user, as login was still successful
          }
        }

        // Merge guest wishlist (localStorage) into the user's account, mirroring
        // the guest-cart merge above. Each item is an independent POST; duplicates
        // (already-in-wishlist) are expected and harmless, so allSettled + always
        // clear afterwards to avoid re-POSTing on every future login. Never block
        // login on a merge failure.
        const guestWishlist = getGuestWishlist();
        if (guestWishlist.length > 0) {
          try {
            await Promise.allSettled(
              guestWishlist.map((item) =>
                axios.post('/api/wishlist', {
                  product_id: item.product_id,
                  // Forward stored notify flags so guest opt-ins survive login.
                  // Hardcoding false was silently killing the back-in-stock and
                  // price-drop trigger for guests who opted in pre-login.
                  notify_price_drop: item.notify_price_drop ?? false,
                  notify_back_in_stock: item.notify_back_in_stock ?? false,
                  target_price: item.target_price ?? null,
                  notes: '',
                })
              )
            );
          } catch (error) {
            logger.error('Failed to merge guest wishlist:', error);
          } finally {
            clearGuestWishlist();
            window.dispatchEvent(new Event('wishlist:refresh'));
          }
        }

        toast.debug('Login response received successfully');
        toast.success('Successfully logged in');

        return { success: true, data: user, message: 'Login successful' };
      }

      // Login failed - log details for debugging
      logger.log('Login response not successful:', response.data);
      logger.log('Response status:', response.status);
      logger.log('Full response:', response);

      // Try to extract error message from various response formats
      const errorMessage = response.data.message ||
                          response.data.error ||
                          response.data.errors?.message ||
                          'Login failed - invalid credentials';

      return { success: false, message: errorMessage };
    } catch (error: any) {
      // Log the error details in debug mode only
      toast.debug(`Login error: ${error.message}`);
      logger.error('Login failed:', error.response || error);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterUserData): Promise<AuthResponse> => {
    setLoading(true);
    try {
      toast.debug(`Attempting registration for phone: ${userData.phone || userData.email || ''}`);
      // Get CSRF token from our custom endpoint
      let csrfToken = '';
      try {
        const csrfResponse = await axios.get('/api/csrf-cookie', { withCredentials: true });
        logger.log('CSRF response for registration:', csrfResponse.data);
        if (csrfResponse.data && csrfResponse.data.csrf_token) {
          csrfToken = csrfResponse.data.csrf_token;
        }
      } catch (csrfError) {
        logger.error('Failed to get CSRF cookie for registration:', csrfError);
        // Continue with registration attempt even if CSRF fetch fails
      }

      // Phone-first payload: forward userData as-is. Username is generated
      // server-side now. Legacy fields (first_name, last_name, username) are
      // still accepted for backward-compat with Google auth paths.
      const dataPayload = { ...userData };

      // Make registration request with the CSRF token
      const response = await axios.post(
        '/api/auth/register',
        dataPayload,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken || ''
          }
        }
      );

      if (response.data.status === 'success') {
        // Backend nests the auth payload under `data`:
        // { status, message, data: { user, token } }. Fall back to the flat
        // shape just in case. Reading the wrong level stored "undefined" and
        // broke auto-login after registration.
        const authPayload = response.data.data ?? response.data;
        const token = authPayload.token ?? authPayload.access_token ?? response.data.token;
        const user = authPayload.user ?? response.data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('token_timestamp', new Date().getTime().toString());

        // Set authentication cookies for server-side access
        try {
          await axios.post('/api/auth/set-cookie', { token });
          logger.log('Authentication cookies set successfully for registration');
        } catch (cookieError) {
          logger.error('Failed to set authentication cookies for registration:', cookieError);
          // Fallback: set cookies directly if API fails
          if (typeof document !== 'undefined') {
            const expires = new Date();
            expires.setDate(expires.getDate() + 7);
            const cookieOptions = `expires=${expires.toUTCString()}; path=/; samesite=strict`;
            document.cookie = `token=${token}; ${cookieOptions}`;
            document.cookie = `auth_token=${token}; ${cookieOptions}`;
            logger.log('Fallback: Cookies set directly for registration');
          }
        }

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
        setIsAuthenticated(true);
        await checkAuth(false); // Re-check auth to ensure profile is fresh after registration

        // Merge guest cart (if any) into the new account — mirrors what login() does.
        // A guest who adds items then registers would otherwise lose their cart.
        const guestToken = localStorage.getItem('guest_token');
        if (guestToken) {
          try {
            await cartService.mergeGuestCart();
            localStorage.removeItem('guest_token');
            window.dispatchEvent(new Event('cart:refresh'));
          } catch (mergeError) {
            logger.error('Failed to merge guest cart on register:', mergeError);
            // Non-fatal: registration succeeded, cart merge is best-effort.
          }
        }

        // Merge guest wishlist — same logic as login()
        const guestWishlist = getGuestWishlist();
        if (guestWishlist.length > 0) {
          try {
            await Promise.allSettled(
              guestWishlist.map((item) =>
                axios.post('/api/wishlist', {
                  product_id: item.product_id,
                  notify_price_drop: item.notify_price_drop ?? false,
                  notify_back_in_stock: item.notify_back_in_stock ?? false,
                  target_price: item.target_price ?? null,
                  notes: '',
                })
              )
            );
          } catch (wishlistMergeError) {
            logger.error('Failed to merge guest wishlist on register:', wishlistMergeError);
          } finally {
            clearGuestWishlist();
            window.dispatchEvent(new Event('wishlist:refresh'));
          }
        }

        toast.debug('Registration successful');
        // Success toast is shown by the caller (register page) to avoid a
        // double toast; auto-login state (token + user + isAuthenticated) is
        // already set above so the post-register redirect stays authenticated.
        return { success: true, data: null, message: response.data.message };
      }

      throw new Error(response.data.message || 'Registration failed');
    } catch (error: any) {
      // Log the error details in debug mode only
      toast.debug(`Registration error: ${error.message}`);
      logger.error('Registration error:', error);
      if (error.response?.data?.errors) {
        // Extract validation errors
        const validationErrors = error.response.data.errors;
        throw {
          message: error.response.data.message || 'Registration failed',
          errors: validationErrors,
        };
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      // Clear authentication cookies
      try {
        await axios.delete('/api/auth/set-cookie');
        logger.log('Authentication cookies cleared successfully');
      } catch (cookieError) {
        logger.error('Failed to clear authentication cookies:', cookieError);
      }
      // handleAuthError is called within logout, which clears local state
      // and then we explicitly call checkAuth to finalize state from server perspective if needed
    } catch (error) {
      logger.error('Logout failed:', error);
    } finally {
      await handleAuthError(); // Ensure local state is cleared
      toast.success('Successfully logged out');
      // No need to call checkAuth() here as handleAuthError already sets user to null and isAuthenticated to false.
      // The next navigation or app interaction will rely on this cleared state.
    }
  };

  const updateProfile = async (data: any) => {
    try {
      const response = await axios.put('/api/auth/profile', data);

      if (response.data.status === 'success') {
        setUser(response.data.user);
        toast.success(response.data.message);
        return { success: true };
      }

      return { success: false, message: response.data.message };
    } catch (error: any) {
      logger.error('Profile update failed:', error);
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      return { success: false, message };
    }
  };

  const updatePassword = async (data: any) => {
    try {
      const response = await axios.put('/api/auth/profile/password', data);

      if (response.data.status === 'success') {
        toast.success(response.data.message);
        return { success: true };
      }

      return { success: false, message: response.data.message };
    } catch (error: any) {
      logger.error('Password update failed:', error);
      const message = error.response?.data?.message || 'Failed to update password';
      toast.error(message);
      return { success: false, message };
    }
  };

  const updatePreferences = async (data: any) => {
    try {
      const response = await axios.put('/api/auth/profile/preferences', data);

      if (response.data.status === 'success') {
        setUser(response.data.user);
        toast.success(response.data.message);
        return { success: true };
      }

      return { success: false, message: response.data.message };
    } catch (error: any) {
      logger.error('Preferences update failed:', error);
      const message = error.response?.data?.message || 'Failed to update preferences';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Google Authentication for both login and registration
  const googleAuth = async (credential: string, isRegistration: boolean = false) => {
    try {
      logger.log('Verifying Google credential...');

      // Get CSRF token from our custom endpoint
      let csrfToken = '';
      try {
        const csrfResponse = await axios.get('/api/auth/csrf-cookie', { withCredentials: true });
        logger.log('CSRF response for Google auth:', csrfResponse.data);
        if (csrfResponse.data && csrfResponse.data.csrf_token) {
          csrfToken = csrfResponse.data.csrf_token;
        }
      } catch (csrfError) {
        logger.error('Failed to get CSRF cookie for Google auth:', csrfError);
        // Continue with auth attempt even if CSRF fetch fails
      }

      // Verify the Google token with our backend
      const verifyResponse = await axios.post('/api/auth/verify-google-token',
        { credential },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken || ''
          }
        }
      );

      if (verifyResponse.data.status !== 'success' || !verifyResponse.data.payload) {
        throw new Error('Google token verification failed');
      }

      const payload = verifyResponse.data.payload;
      logger.log('Google payload verified:', payload);

      // Prepare the auth data
      const authData = {
        email: payload.email,
        password: 'google-oauth-' + payload.sub, // Create a pseudo-password
        password_confirmation: 'google-oauth-' + payload.sub,
        is_google_auth: true,
        google_id: payload.sub,
        username: payload.email.split('@')[0], // Use email prefix as username
        full_name_en: payload.name,
        full_name_ar: payload.name,
      };

      // First try to login regardless of whether this was initiated from registration or login page
      // This handles the case where a user tries to register with an email that already exists
      try {
        const loginResponse = await axios.post(
          '/api/auth/login',
          {
            email: payload.email,
            password: authData.password,
            is_google_auth: true,
            google_id: payload.sub
          },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'X-CSRF-TOKEN': csrfToken || ''
            }
          }
        );

        if (loginResponse.data.status === 'success') {
          // User exists, log them in
          const { token, user } = loginResponse.data;
          localStorage.setItem('token', token);
          localStorage.setItem('token_timestamp', new Date().getTime().toString());

          // Set authentication cookies for server-side access
          try {
            await axios.post('/api/auth/set-cookie', { token });
            logger.log('Authentication cookies set successfully for Google auth');
          } catch (cookieError) {
            logger.error('Failed to set authentication cookies for Google auth:', cookieError);
          }

          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(user);
          setIsAuthenticated(true);
          toast.success('Google authentication successful!');
          await checkAuth(false);
          return { success: true };
        }
      } catch (loginError) {
        logger.log('Google login attempt failed, will try to register if requested', loginError);
        // If login fails and this was initiated from registration, continue with registration
        if (!isRegistration) {
          throw loginError; // If this was a login attempt, propagate the error
        }
        // Otherwise continue to registration
      }

      // If we're here and isRegistration is true, attempt to register the user
      if (isRegistration) {
        try {
          const registerResponse = await axios.post(
            '/api/auth/register',
            authData,
            {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken || ''
              }
            }
          );

          if (registerResponse.data.status === 'success') {
            const { token, user } = registerResponse.data.data || registerResponse.data;
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            setIsAuthenticated(true);
            toast.success('Google registration successful!');
            await checkAuth(false);
            return { success: true };
          } else {
            return { success: false, message: registerResponse.data.message || 'Registration failed' };
          }
        } catch (registerError: any) {
          // Special handling for common registration errors
          if (registerError.response?.status === 422 && registerError.response?.data?.message.includes('email has already been taken')) {
            // Try one more login attempt as a fallback in case the first one failed for some transient reason
            try {
              const finalLoginResponse = await axios.post('/api/auth/login',
                { email: payload.email, password: authData.password, is_google_auth: true, google_id: payload.sub },
                { withCredentials: true, headers: { 'X-CSRF-TOKEN': csrfToken || '' } }
              );

              if (finalLoginResponse.data.status === 'success') {
                const { token, user } = finalLoginResponse.data;
                localStorage.setItem('token', token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                setUser(user);
                setIsAuthenticated(true);
                toast.success('Logged in with existing account');
                await checkAuth(false);
                return { success: true };
              }
            } catch (finalError) {
              logger.error('Final login attempt failed:', finalError);
            }

            return {
              success: false,
              message: 'An account with this email already exists. Please log in instead.'
            };
          }
          throw registerError;
        }
      }

      return { success: false, message: 'Authentication failed' };
    } catch (error: any) {
      logger.error('Google auth failed:', error.response || error);
      const message = error.response?.data?.message || error.message || 'Google authentication failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        googleAuth,
        logout,
        updateProfile,
        updatePassword,
        updatePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// List of routes that require authentication.
// NOTE: '/checkout' is intentionally NOT listed here — guests must reach checkout
// to complete COD / bank-transfer purchases via the guest cart (X-Guest-Token).
// Removing it from this list was a P0 fix (WCAG / guest-checkout parity).
const protectedRoutes = [
  '/profile',
  '/orders',
  '/account',
  '/address',
  '/settings',
];

// Common routes for faster navigation
const commonRoutes = [
  '/',
  '/shops',
  '/community',
  '/cart',
  '/wishlist'
];

// Function to prefetch routes that doesn't use hooks directly
const doPrefetchRoutes = (router: any, routes: string[]) => {
  if (typeof window !== 'undefined') {
    routes.forEach(route => {
      router.prefetch(route);
    });
  }
};

// Router prefetch component - this is allowed to use hooks
function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch common routes in the background
    try {
      doPrefetchRoutes(router, commonRoutes);
    } catch (error) {
      // Ignore prefetch errors
      logger.error('Error prefetching routes:', error);
    }
  }, [router]);

  return null;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
