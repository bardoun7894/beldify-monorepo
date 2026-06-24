/**
 * TDD — RED phase
 * Tests for returnService.create and returnService.get
 * Written BEFORE implementation to fail first.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import api from '@/lib/api';

const mockPost = api.post as ReturnType<typeof vi.fn>;
const mockGet = api.get as ReturnType<typeof vi.fn>;

describe('returnService (src/services/returnService.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('exports a create function', async () => {
      const mod = await import('../returnService');
      expect(typeof mod.returnService.create).toBe('function');
    });

    it('POSTs to /api/orders/{orderNumber}/return-request with reason', async () => {
      mockPost.mockResolvedValueOnce({
        status: 201,
        data: {
          success: true,
          data: {
            return_request: {
              id: 1,
              order_number: 'ORD-001',
              reason: 'damaged',
              status: 'pending',
            },
          },
        },
      });

      const mod = await import('../returnService');
      const result = await mod.returnService.create('ORD-001', {
        reason: 'damaged',
        details: 'Item arrived broken.',
      });

      expect(mockPost).toHaveBeenCalledWith('/api/orders/ORD-001/return-request', {
        reason: 'damaged',
        details: 'Item arrived broken.',
      });
      expect(result.success).toBe(true);
      expect(result.data.return_request.status).toBe('pending');
    });

    it('sends without details (optional field)', async () => {
      mockPost.mockResolvedValueOnce({
        status: 201,
        data: { success: true, data: { return_request: { id: 2, status: 'pending' } } },
      });

      const mod = await import('../returnService');
      await mod.returnService.create('ORD-002', { reason: 'wrong_item' });

      expect(mockPost).toHaveBeenCalledWith('/api/orders/ORD-002/return-request', {
        reason: 'wrong_item',
      });
    });

    it('throws the API message on 422 (not delivered / duplicate / >14 days)', async () => {
      const axiosError = Object.assign(new Error('Unprocessable Entity'), {
        isAxiosError: true,
        response: {
          status: 422,
          data: { success: false, message: 'Return window has expired.' },
        },
      });
      mockPost.mockRejectedValueOnce(axiosError);

      const mod = await import('../returnService');
      await expect(
        mod.returnService.create('ORD-003', { reason: 'damaged' })
      ).rejects.toThrow('Return window has expired.');
    });
  });

  describe('get', () => {
    it('exports a get function', async () => {
      const mod = await import('../returnService');
      expect(typeof mod.returnService.get).toBe('function');
    });

    it('GETs /api/orders/{orderNumber}/return-request and returns existing request', async () => {
      mockGet.mockResolvedValueOnce({
        status: 200,
        data: {
          success: true,
          data: {
            return_request: {
              id: 5,
              order_number: 'ORD-001',
              reason: 'damaged',
              status: 'approved',
            },
          },
        },
      });

      const mod = await import('../returnService');
      const result = await mod.returnService.get('ORD-001');

      expect(mockGet).toHaveBeenCalledWith('/api/orders/ORD-001/return-request');
      expect(result?.status).toBe('approved');
    });

    it('returns null on 404 (no existing request)', async () => {
      const axiosError = Object.assign(new Error('Not Found'), {
        isAxiosError: true,
        response: { status: 404, data: { message: 'Not found.' } },
      });
      mockGet.mockRejectedValueOnce(axiosError);

      const mod = await import('../returnService');
      const result = await mod.returnService.get('ORD-999');

      expect(result).toBeNull();
    });
  });
});
