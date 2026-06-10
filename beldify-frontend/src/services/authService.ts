/**
 * authService — password-reset endpoints
 *
 * Wraps POST /api/auth/forgot-password and POST /api/auth/reset-password.
 * Uses the same `api` (axios) instance as all other services — Bearer token
 * injected automatically by lib/api interceptor.
 */

import api from '@/lib/api';
import axios from 'axios';
import logger from '@/utils/consoleLogger';

export interface ForgotPasswordResult {
  success: true;
  message: string;
}

export interface ResetPasswordPayload {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ResetPasswordResult {
  success: true;
  message: string;
}

export const authService = {
  /**
   * POST /api/auth/forgot-password
   *
   * The backend always returns 200 {success:true, message} regardless of
   * whether the email exists (no user enumeration). Throws 'rate_limit'
   * string-keyed error on 429 so callers can surface a friendly message.
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResult> {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      return response.data as ForgotPasswordResult;
    } catch (error: unknown) {
      logger.error('forgotPassword error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('rate_limit');
        }
        throw new Error(error.response?.data?.message || error.message || 'request_failed');
      }
      throw error;
    }
  },

  /**
   * POST /api/auth/reset-password
   *
   * Sends token + email + password + password_confirmation. Returns
   * {success:true} on 200. Throws with the API message on 4xx (invalid /
   * expired token, validation failure).
   */
  async resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResult> {
    try {
      const response = await api.post('/api/auth/reset-password', payload);
      return response.data as ResetPasswordResult;
    } catch (error: unknown) {
      logger.error('resetPassword error:', error);
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || error.message || 'reset_failed';
        throw new Error(message);
      }
      throw error;
    }
  },
};
