/**
 * TDD — RED phase
 * Tests for shopService follow/unfollow/checkFollowing methods.
 * Written BEFORE any implementation changes to verify correct endpoints + verbs.
 *
 * shopService uses ./axiosInstance (NOT @/lib/api) — mock that module.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axiosInstance before importing shopService
vi.mock('../axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import axiosInstance from '../axiosInstance';
import { shopService } from '../shopService';

const mockGet = axiosInstance.get as ReturnType<typeof vi.fn>;
const mockPost = axiosInstance.post as ReturnType<typeof vi.fn>;
const mockDelete = axiosInstance.delete as ReturnType<typeof vi.fn>;

describe('shopService — follow endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear sessionStorage between tests (jsdom not used — guard for safety)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  });

  // ── followShop ──────────────────────────────────────────────────────────────

  describe('followShop', () => {
    it('POSTs to /api/shops/{storeId}/follow', async () => {
      mockPost.mockResolvedValueOnce({
        data: { status: 'success', message: 'Followed successfully' },
      });

      await shopService.followShop(42);

      expect(mockPost).toHaveBeenCalledTimes(1);
      const calledUrl: string = mockPost.mock.calls[0][0];
      expect(calledUrl).toMatch(/^\/api\/shops\/42\/follow/);
    });

    it('returns isAuthenticated: true on success', async () => {
      mockPost.mockResolvedValueOnce({
        data: { status: 'success' },
      });

      const result = await shopService.followShop(7);

      expect(result.isAuthenticated).toBe(true);
      expect(result.error).toBeNull();
    });

    it('returns isAuthenticated: false on 401', async () => {
      const err: any = new Error('Unauthorized');
      err.response = { status: 401, data: { message: 'Unauthenticated' } };
      mockPost.mockRejectedValueOnce(err);

      const result = await shopService.followShop(7);

      expect(result.isAuthenticated).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  // ── unfollowShop ────────────────────────────────────────────────────────────

  describe('unfollowShop', () => {
    it('DELETEs /api/shops/{storeId}/follow', async () => {
      mockDelete.mockResolvedValueOnce({
        data: { status: 'success', message: 'Unfollowed successfully' },
      });

      await shopService.unfollowShop(99);

      expect(mockDelete).toHaveBeenCalledTimes(1);
      const calledUrl: string = mockDelete.mock.calls[0][0];
      expect(calledUrl).toMatch(/^\/api\/shops\/99\/follow/);
    });

    it('returns isAuthenticated: true and no error on success', async () => {
      mockDelete.mockResolvedValueOnce({ data: {} });

      const result = await shopService.unfollowShop(3);

      expect(result.isAuthenticated).toBe(true);
      expect(result.error).toBeNull();
    });

    it('returns isAuthenticated: false on 401', async () => {
      const err: any = new Error('Unauthorized');
      err.response = { status: 401, data: {} };
      mockDelete.mockRejectedValueOnce(err);

      const result = await shopService.unfollowShop(3);

      expect(result.isAuthenticated).toBe(false);
    });
  });

  // ── checkFollowing ──────────────────────────────────────────────────────────

  describe('checkFollowing', () => {
    it('GETs /api/shops/{storeId}/following', async () => {
      mockGet.mockResolvedValueOnce({
        data: { status: 'success', data: { isFollowing: true } },
      });

      await shopService.checkFollowing(15);

      expect(mockGet).toHaveBeenCalledTimes(1);
      const calledUrl: string = mockGet.mock.calls[0][0];
      expect(calledUrl).toMatch(/^\/api\/shops\/15\/following/);
    });

    it('returns isFollowing: true when API says true', async () => {
      mockGet.mockResolvedValueOnce({
        data: { status: 'success', data: { isFollowing: true } },
      });

      const result = await shopService.checkFollowing(15);

      expect(result.data?.isFollowing).toBe(true);
      expect(result.isAuthenticated).toBe(true);
    });

    it('returns isFollowing: false when API says false', async () => {
      mockGet.mockResolvedValueOnce({
        data: { status: 'success', data: { isFollowing: false } },
      });

      const result = await shopService.checkFollowing(15);

      expect(result.data?.isFollowing).toBe(false);
    });

    it('handles flat response shape { isFollowing: bool }', async () => {
      mockGet.mockResolvedValueOnce({
        data: { isFollowing: false },
      });

      const result = await shopService.checkFollowing(20);

      expect(result.data?.isFollowing).toBe(false);
      expect(result.isAuthenticated).toBe(true);
    });

    it('returns isAuthenticated: false and isFollowing: false on 401', async () => {
      const err: any = new Error('Unauthorized');
      err.response = { status: 401, data: {} };
      mockGet.mockRejectedValueOnce(err);

      const result = await shopService.checkFollowing(5);

      expect(result.isAuthenticated).toBe(false);
      expect(result.data?.isFollowing).toBe(false);
    });
  });
});
