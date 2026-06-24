/**
 * returnService — wraps POST/GET /api/orders/{orderNumber}/return-request
 *
 * POST → 201 {success:true, data:{return_request}} on success
 *       → 422 {success:false, message} for not-delivered / >14 days / duplicate
 * GET  → 200 {success:true, data:{return_request}} when one exists
 *       → 404 when no request exists (returns null)
 */

import api from '@/lib/api';
import axios from 'axios';
import logger from '@/utils/consoleLogger';

export type ReturnRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface ReturnRequest {
  id: number;
  order_number: string;
  reason: string;
  details?: string;
  status: ReturnRequestStatus;
  created_at?: string;
}

export interface CreateReturnPayload {
  reason: string;
  details?: string;
}

export interface CreateReturnResult {
  success: true;
  data: {
    return_request: ReturnRequest;
  };
}

export const returnService = {
  /**
   * POST /api/orders/{orderNumber}/return-request
   * Throws with the API message on 422 or other errors.
   */
  async create(orderNumber: string, payload: CreateReturnPayload): Promise<CreateReturnResult> {
    try {
      const body: Record<string, string> = { reason: payload.reason };
      if (payload.details !== undefined) {
        body.details = payload.details;
      }

      const response = await api.post(`/api/orders/${orderNumber}/return-request`, body);
      return response.data as CreateReturnResult;
    } catch (error: unknown) {
      logger.error('returnService.create error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || error.message || 'return_request_failed'
        );
      }
      throw error;
    }
  },

  /**
   * GET /api/orders/{orderNumber}/return-request
   * Returns the existing ReturnRequest or null if none exists (404).
   */
  async get(orderNumber: string): Promise<ReturnRequest | null> {
    try {
      const response = await api.get(`/api/orders/${orderNumber}/return-request`);
      const data = response.data?.data?.return_request ?? null;
      return data as ReturnRequest | null;
    } catch (error: unknown) {
      logger.error('returnService.get error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return null;
        }
        throw new Error(
          error.response?.data?.message || error.message || 'return_get_failed'
        );
      }
      throw error;
    }
  },
};
