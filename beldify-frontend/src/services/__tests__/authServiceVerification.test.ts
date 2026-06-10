/**
 * TDD — RED phase
 * Tests for authService.resendVerification and authService.verifyEmail
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

describe('authService — email verification methods (src/services/authService.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resendVerification', () => {
    it('exports a resendVerification function', async () => {
      const mod = await import('../authService');
      expect(typeof mod.authService.resendVerification).toBe('function');
    });

    it('POSTs to /api/auth/email/verification-notification', async () => {
      mockPost.mockResolvedValueOnce({
        data: { success: true, message: 'Verification email sent.' },
      });

      const mod = await import('../authService');
      const result = await mod.authService.resendVerification();

      expect(mockPost).toHaveBeenCalledWith('/api/auth/email/verification-notification');
      expect(result.success).toBe(true);
    });

    it('returns already_verified:true when backend reports already verified', async () => {
      mockPost.mockResolvedValueOnce({
        data: { success: true, already_verified: true },
      });

      const mod = await import('../authService');
      const result = await mod.authService.resendVerification();

      expect(result.success).toBe(true);
      expect(result.already_verified).toBe(true);
    });

    it('throws an error with message "rate_limit" on 429 response', async () => {
      const axiosError = Object.assign(new Error('Too Many Requests'), {
        isAxiosError: true,
        response: { status: 429, data: { message: 'Too many requests.' } },
      });
      mockPost.mockRejectedValueOnce(axiosError);

      const mod = await import('../authService');
      await expect(mod.authService.resendVerification()).rejects.toThrow('rate_limit');
    });

    it('throws a generic error on non-429 failure', async () => {
      const axiosError = Object.assign(new Error('Unauthorized'), {
        isAxiosError: true,
        response: { status: 401, data: { message: 'Unauthenticated.' } },
      });
      mockPost.mockRejectedValueOnce(axiosError);

      const mod = await import('../authService');
      await expect(mod.authService.resendVerification()).rejects.toThrow('Unauthenticated.');
    });
  });

  describe('verifyEmail', () => {
    const validParams = {
      id: '42',
      hash: 'abc123hash',
      expires: '1700000000',
      signature: 'sig123',
    };

    it('exports a verifyEmail function', async () => {
      const mod = await import('../authService');
      expect(typeof mod.authService.verifyEmail).toBe('function');
    });

    it('POSTs to /api/auth/email/verify with all params', async () => {
      mockPost.mockResolvedValueOnce({
        data: { success: true },
      });

      const mod = await import('../authService');
      await mod.authService.verifyEmail(validParams);

      expect(mockPost).toHaveBeenCalledWith('/api/auth/email/verify', validParams);
    });

    it('returns success:true on successful verification', async () => {
      mockPost.mockResolvedValueOnce({
        data: { success: true },
      });

      const mod = await import('../authService');
      const result = await mod.authService.verifyEmail(validParams);

      expect(result.success).toBe(true);
    });

    it('returns already_verified:true when backend reports already verified', async () => {
      mockPost.mockResolvedValueOnce({
        data: { success: true, already_verified: true },
      });

      const mod = await import('../authService');
      const result = await mod.authService.verifyEmail(validParams);

      expect(result.success).toBe(true);
      expect(result.already_verified).toBe(true);
    });

    it('throws with message "invalid_or_expired" when backend returns that code', async () => {
      mockPost.mockResolvedValueOnce({
        data: { success: false, message: 'invalid_or_expired' },
      });

      const mod = await import('../authService');
      await expect(mod.authService.verifyEmail(validParams)).rejects.toThrow('invalid_or_expired');
    });

    it('throws with message "invalid_or_expired" on 422 axios error', async () => {
      const axiosError = Object.assign(new Error('Unprocessable Entity'), {
        isAxiosError: true,
        response: { status: 422, data: { success: false, message: 'invalid_or_expired' } },
      });
      mockPost.mockRejectedValueOnce(axiosError);

      const mod = await import('../authService');
      await expect(mod.authService.verifyEmail(validParams)).rejects.toThrow('invalid_or_expired');
    });
  });
});
