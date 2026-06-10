/**
 * TDD — RED phase
 * Tests for messagingService.getSellerUnreadCount
 * Written BEFORE implementation to fail first.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios used in messagingService
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    create: vi.fn().mockReturnThis(),
  },
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/config/constants', () => ({
  API_BASE_URL: 'https://pro.beldify.com',
}));

import axios from 'axios';
const mockGet = axios.get as ReturnType<typeof vi.fn>;

describe('messagingService.getSellerUnreadCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue('mock-seller-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
    Object.defineProperty(globalThis, 'document', {
      value: { cookie: '' },
      writable: true,
    });
  });

  it('exports a getSellerUnreadCount function', async () => {
    const mod = await import('../messagingService');
    expect(typeof mod.getSellerUnreadCount).toBe('function');
  });

  it('GETs from the seller-scoped unread endpoint /api/v1/backend/messages/unread-count', async () => {
    mockGet.mockResolvedValueOnce({
      data: { unread_count: 5 },
    });

    const mod = await import('../messagingService');
    await mod.getSellerUnreadCount();

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/backend/messages/unread-count'),
      expect.any(Object)
    );
  });

  it('returns the unread count from backend response', async () => {
    mockGet.mockResolvedValueOnce({
      data: { unread_count: 7 },
    });

    const mod = await import('../messagingService');
    const result = await mod.getSellerUnreadCount();

    expect(result).toBe(7);
  });

  it('returns 0 when there is no token (unauthenticated)', async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    const mod = await import('../messagingService');
    const result = await mod.getSellerUnreadCount();

    expect(result).toBe(0);
  });

  it('returns 0 on network error (does not throw)', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network Error'));

    const mod = await import('../messagingService');
    const result = await mod.getSellerUnreadCount();

    expect(result).toBe(0);
  });
});
