/**
 * TDD — RED phase
 * Tests for orderService.cancel (new method)
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

describe('orderService.cancel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is a method on orderService', async () => {
    const mod = await import('../orderService');
    expect(typeof (mod.orderService as any).cancel).toBe('function');
  });

  it('POSTs to /api/orders/{orderNumber}/cancel with optional reason', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        success: true,
        order: { order_number: 'ORD-001', status: 'cancelled' },
      },
    });

    const mod = await import('../orderService');
    const result = await (mod.orderService as any).cancel('ORD-001', 'Changed my mind');

    expect(mockPost).toHaveBeenCalledWith('/api/orders/ORD-001/cancel', { reason: 'Changed my mind' });
    expect(result.success).toBe(true);
    expect(result.order.status).toBe('cancelled');
  });

  it('POSTs without reason when not provided', async () => {
    mockPost.mockResolvedValueOnce({
      data: { success: true, order: { order_number: 'ORD-002', status: 'cancelled' } },
    });

    const mod = await import('../orderService');
    await (mod.orderService as any).cancel('ORD-002');

    expect(mockPost).toHaveBeenCalledWith('/api/orders/ORD-002/cancel', {});
  });

  it('throws the API message on 403 (not owner)', async () => {
    const axiosError = Object.assign(new Error('Forbidden'), {
      isAxiosError: true,
      response: { status: 403, data: { success: false, message: 'You do not own this order.' } },
    });
    mockPost.mockRejectedValueOnce(axiosError);

    const mod = await import('../orderService');
    await expect((mod.orderService as any).cancel('ORD-003')).rejects.toThrow(
      'You do not own this order.'
    );
  });

  it('throws the API message on 422 (not cancellable — paid or shipped)', async () => {
    const axiosError = Object.assign(new Error('Unprocessable Entity'), {
      isAxiosError: true,
      response: {
        status: 422,
        data: { success: false, message: 'Order cannot be cancelled once shipped.' },
      },
    });
    mockPost.mockRejectedValueOnce(axiosError);

    const mod = await import('../orderService');
    await expect((mod.orderService as any).cancel('ORD-004')).rejects.toThrow(
      'Order cannot be cancelled once shipped.'
    );
  });
});
