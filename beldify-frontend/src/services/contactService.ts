/**
 * contactService — wraps POST /api/contact
 *
 * Rate limit: 10/hour. Throws 'rate_limit' error on 429 so callers
 * can surface a friendly cooldown message.
 */

import api from '@/lib/api';
import axios from 'axios';
import logger from '@/utils/consoleLogger';

export interface ContactPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export interface ContactResult {
  success: true;
  message: string;
}

export const contactService = {
  /**
   * POST /api/contact
   * Returns {success:true, message} on 201.
   * Throws 'rate_limit' on 429, or API message on other errors.
   */
  async send(payload: ContactPayload): Promise<ContactResult> {
    try {
      const body: Record<string, string> = {
        name: payload.name,
        email: payload.email,
        message: payload.message,
      };
      if (payload.subject !== undefined) {
        body.subject = payload.subject;
      }

      const response = await api.post('/api/contact', body);
      return response.data as ContactResult;
    } catch (error: unknown) {
      logger.error('contactService.send error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('rate_limit');
        }
        throw new Error(
          error.response?.data?.message || error.message || 'contact_failed'
        );
      }
      throw error;
    }
  },
};
