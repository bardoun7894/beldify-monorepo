/**
 * TDD RED — sellerDashboardService
 *
 * Written BEFORE implementation to fail first.
 * Tests that the service module exports functions matching the API contracts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api module
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '@/lib/api';
import {
  getSellerOrders,
  getSellerOrder,
  updateOrderStatus,
  getSellerEarnings,
} from '../sellerDashboardService';

const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPatch = api.patch as ReturnType<typeof vi.fn>;

describe('sellerDashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSellerOrders', () => {
    it('calls GET /api/seller/orders with no params', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: [], meta: { current_page: 1, last_page: 1, total: 0 } } });
      await getSellerOrders({});
      expect(mockGet).toHaveBeenCalledWith('/api/seller/orders', { params: {} });
    });

    it('calls GET /api/seller/orders with status and page params', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: [], meta: { current_page: 1, last_page: 1, total: 0 } } });
      await getSellerOrders({ status: 'pending', page: 2 });
      expect(mockGet).toHaveBeenCalledWith('/api/seller/orders', { params: { status: 'pending', page: 2 } });
    });

    it('returns data and meta from the response', async () => {
      const mockData = {
        data: [
          { id: 1, order_number: 'ORD-001', customer_name: 'Ahmed', status: 'pending', total_amount: 200, items_count: 2, created_at: '2026-01-01' },
        ],
        meta: { current_page: 1, last_page: 1, total: 1 },
      };
      mockGet.mockResolvedValueOnce({ data: mockData });
      const result = await getSellerOrders({});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getSellerOrder', () => {
    it('calls GET /api/seller/orders/{id}', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: { id: 42, order_number: 'ORD-042', status: 'pending', customer: { name: 'Fatima' }, items: [], subtotal: 100, total_amount: 100, commission_amount: 10, commission_rate: 10, net_amount: 90, shipping_address: '123 Rue', created_at: '2026-01-01' } } });
      await getSellerOrder(42);
      expect(mockGet).toHaveBeenCalledWith('/api/seller/orders/42');
    });

    it('returns the order data', async () => {
      const mockOrder = { id: 42, order_number: 'ORD-042', status: 'pending', customer: { name: 'Fatima' }, items: [], subtotal: 100, total_amount: 100, commission_amount: 10, commission_rate: 10, net_amount: 90, shipping_address: '123 Rue', created_at: '2026-01-01' };
      mockGet.mockResolvedValueOnce({ data: { data: mockOrder } });
      const result = await getSellerOrder(42);
      expect(result.data.order_number).toBe('ORD-042');
    });
  });

  describe('updateOrderStatus', () => {
    it('calls PATCH /api/seller/orders/{id}/status with status body', async () => {
      mockPatch.mockResolvedValueOnce({ data: { data: { id: 42, status: 'shipped' } } });
      await updateOrderStatus(42, 'shipped');
      expect(mockPatch).toHaveBeenCalledWith('/api/seller/orders/42/status', { status: 'shipped' });
    });

    it('returns updated order data', async () => {
      mockPatch.mockResolvedValueOnce({ data: { data: { id: 42, status: 'shipped' } } });
      const result = await updateOrderStatus(42, 'shipped');
      expect(result.data.status).toBe('shipped');
    });
  });

  describe('getSellerEarnings', () => {
    it('calls GET /api/seller/earnings with period param', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: { currency: 'MAD', gross_revenue: 1000, total_commission: 100, net_revenue: 900, orders_count: 5, average_order_value: 200, by_day: [], period: 7 } } });
      await getSellerEarnings(7);
      expect(mockGet).toHaveBeenCalledWith('/api/seller/earnings', { params: { period: 7 } });
    });

    it('returns earnings data', async () => {
      const mockEarnings = { currency: 'MAD', gross_revenue: 1000, total_commission: 100, net_revenue: 900, orders_count: 5, average_order_value: 200, by_day: [{ date: '2026-01-01', revenue: 200 }], period: 7 };
      mockGet.mockResolvedValueOnce({ data: { data: mockEarnings } });
      const result = await getSellerEarnings(7);
      expect(result.data.gross_revenue).toBe(1000);
      expect(result.data.by_day).toHaveLength(1);
    });
  });
});
