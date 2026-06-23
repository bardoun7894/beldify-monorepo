import axios from 'axios';
import logger from '@/utils/consoleLogger';
import { API_BASE_URL } from '@/config/constants';
import i18nInstance from '@/i18n/config';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Keep this for session cookies
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add authorization token to requests if available
    // Try different token names that might be used
    const tokenSources = ['authToken', 'auth_token', 'token', 'access_token'];
    let token = null;
    
    if (typeof window !== 'undefined') {
      try {
        for (const source of tokenSources) {
          const possibleToken = localStorage.getItem(source);
          if (possibleToken) {
            token = possibleToken;
            logger.log(`Found token with key: ${source}`);
            break;
          }
        }
      } catch { /* Safari ITP private-mode */ }
    }
    
    if (token) {
      // Make sure token has Bearer prefix if not already present
      const tokenValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers['Authorization'] = tokenValue;
      logger.log('Added authorization header to request');
    } else {
      logger.log('No auth token found in localStorage');
    }

    // Set Accept-Language from current i18n language so the backend can
    // serve translated product names / descriptions for every locale.
    if (typeof window !== 'undefined') {
      const lang = i18nInstance.language || 'ma';
      config.headers['Accept-Language'] = lang;
    }
    
    // Add XSRF-TOKEN header if available for CSRF protection
    // Only run in browser environment
    if (typeof document !== 'undefined') {
      try {
        // Try to get Laravel Sanctum XSRF token
        const xsrfToken = document.cookie.match(/(^|;)\s*XSRF-TOKEN\s*=\s*([^;]+)/);
        if (xsrfToken) {
          config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken[2]);
          logger.log('Added XSRF token to request');
        }
        
        // Also check for Laravel session cookie
        const laravelSession = document.cookie.match(/(^|;)\s*laravel_session\s*=\s*([^;]+)/);
        if (laravelSession) {
          logger.log('Laravel session cookie is present');
        } else {
          logger.log('No Laravel session cookie found');
        }
      } catch (error) {
        logger.error('Error processing cookies:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    if (response.config?.url?.includes('/following')) {
      logger.log(`Response from ${response.config.url}:`, response.data);
    }
    return response;
  },
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      logger.error('Authentication error (401):', error.config?.url);
      
      // Log the headers that were sent
      logger.log('Request headers that failed:', error.config?.headers);
      
      // Check if token exists but might be invalid
      if (typeof window !== 'undefined') {
        const tokenSources = ['authToken', 'auth_token', 'token', 'access_token'];
        let foundToken = false;
        try {
          for (const source of tokenSources) {
            const token = localStorage.getItem(source);
            if (token) {
              logger.log(`Found potentially invalid token in ${source}`);
              foundToken = true;
            }
          }
        } catch { /* Safari ITP private-mode */ }
        
        // If we have a token but still got a 401, we might need to refresh the CSRF token
        if (foundToken) {
          logger.log('Token exists but got 401 - might need to refresh CSRF token');
          
          // You could implement a token refresh mechanism here
          // For now, we'll just log the issue
        }
      }
      
      // Check if we're on a page that requires authentication
      if (typeof window !== 'undefined' && 
          (window.location.pathname.includes('/account') || 
           window.location.pathname.includes('/checkout'))) {
        logger.log('On protected page with authentication error - might need to redirect');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
