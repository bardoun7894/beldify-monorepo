/**
 * TDD — RED phase
 * Tests for the createCheckoutOrder guest method on OrderService.
 * Written BEFORE implementation to fail first.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api module
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

// Import after mocks
import api from '@/lib/api';
import { orderService } from '../orderService';

const mockPost = api.post as ReturnType<typeof vi.fn>;

describe('orderService.createCheckoutOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is a method on orderService', () => {
    expect(typeof (orderService as any).createCheckoutOrder).toBe('function');
  });

  it('POSTs to /api/orders/checkout (not /api/orders)', async () => {
    mockPost.mockResolvedValueOnce({
      data: { success: true, data: { order_number: 'ORD-001' } },
    });

    const payload = {
      items: [{ stock_id: 42, quantity: 1, unit_price: 350 }],
      shipping_info: {
        first_name: 'Hassan',
        last_name: 'Benali',
        email: 'hassan@example.com',
        phone: '0612345678',
        address: '1 Rue de Fez',
        city: 'Casablanca',
        state: 'Casablanca',
        country: 'MA',
      },
      payment_method: 'cod',
      subtotal: 350,
      total_amount: 350,
      shipping_amount: 30,
      tax_amount: 0,
      discount_amount: 0,
    };

    await (orderService as any).createCheckoutOrder(payload);

    expect(mockPost).toHaveBeenCalledOnce();
    const [url] = mockPost.mock.calls[0];
    expect(url).toBe('/api/orders/checkout');
  });

  it('returns the response data on success', async () => {
    const expected = { success: true, data: { order_number: 'ORD-999' } };
    mockPost.mockResolvedValueOnce({ data: expected });

    const result = await (orderService as any).createCheckoutOrder({
      items: [],
      shipping_info: {},
      payment_method: 'cod',
      subtotal: 0,
      total_amount: 0,
      shipping_amount: 0,
      tax_amount: 0,
      discount_amount: 0,
    });

    expect(result).toEqual(expected);
  });

  it('throws a human-readable Error on axios failure', async () => {
    const axiosError = Object.assign(new Error('Network Error'), {
      isAxiosError: true,
      response: { data: { message: 'COD not available above 500 MAD' } },
    });
    mockPost.mockRejectedValueOnce(axiosError);

    await expect(
      (orderService as any).createCheckoutOrder({
        items: [],
        shipping_info: {},
        payment_method: 'cod',
        subtotal: 0,
        total_amount: 0,
        shipping_amount: 0,
        tax_amount: 0,
        discount_amount: 0,
      })
    ).rejects.toThrow('COD not available above 500 MAD');
  });
});
