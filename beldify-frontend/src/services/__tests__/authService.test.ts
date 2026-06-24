/**
 * TDD — RED phase
 * Tests for authService.forgotPassword and authService.resetPassword
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

describe('authService (src/services/authService.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('forgotPassword', () => {
    it('exports a forgotPassword function', async () => {
      const mod = await import('../authService');
      expect(typeof mod.authService.forgotPassword).toBe('function');
    });

    it('POSTs to /api/auth/forgot-password with the email', async () => {
      mockPost.mockResolvedValueOnce({
        data: { success: true, message: 'If that email exists, you will receive a reset link.' },
      });

      const mod = await import('../authService');
      const result = await mod.authService.forgotPassword('test@example.com');

      expect(mockPost).toHaveBeenCalledWith('/api/auth/forgot-password', { email: 'test@example.com' });
      expect(result.success).toBe(true);
    });

    it('always returns success:true (no user enumeration) even for unknown email', async () => {
      mockPost.mockResolvedValueOnce({
        data: { success: true, message: 'If that email exists, you will receive a reset link.' },
      });

      const mod = await import('../authService');
      const result = await mod.authService.forgotPassword('nobody@nowhere.com');

      expect(result.success).toBe(true);
    });

    it('throws an error with message on 429 rate-limit response', async () => {
      const axiosError = Object.assign(new Error('Too Many Requests'), {
        isAxiosError: true,
        response: { status: 429, data: { message: 'Too many requests. Please wait.' } },
      });
      mockPost.mockRejectedValueOnce(axiosError);

      const mod = await import('../authService');
      await expect(mod.authService.forgotPassword('test@example.com')).rejects.toThrow('rate_limit');
    });
  });

  describe('resetPassword', () => {
    it('exports a resetPassword function', async () => {
      const mod = await import('../authService');
      expect(typeof mod.authService.resetPassword).toBe('function');
    });

    it('POSTs to /api/auth/reset-password with all required fields', async () => {
      mockPost.mockResolvedValueOnce({
        data: { success: true, message: 'Password has been reset.' },
      });

      const mod = await import('../authService');
      await mod.authService.resetPassword({
        token: 'abc123',
        email: 'user@example.com',
        password: 'NewPass123',
        password_confirmation: 'NewPass123',
      });

      expect(mockPost).toHaveBeenCalledWith('/api/auth/reset-password', {
        token: 'abc123',
        email: 'user@example.com',
        password: 'NewPass123',
        password_confirmation: 'NewPass123',
      });
    });

    it('returns success:true on 200 response', async () => {
      mockPost.mockResolvedValueOnce({
        data: { success: true, message: 'Password has been reset.' },
      });

      const mod = await import('../authService');
      const result = await mod.authService.resetPassword({
        token: 'abc123',
        email: 'user@example.com',
        password: 'NewPass123',
        password_confirmation: 'NewPass123',
      });

      expect(result.success).toBe(true);
    });

    it('throws an error with the API message on 4xx (invalid/expired token)', async () => {
      const axiosError = Object.assign(new Error('Unprocessable Entity'), {
        isAxiosError: true,
        response: { status: 422, data: { success: false, message: 'Invalid or expired token.' } },
      });
      mockPost.mockRejectedValueOnce(axiosError);

      const mod = await import('../authService');
      await expect(
        mod.authService.resetPassword({
          token: 'bad-token',
          email: 'user@example.com',
          password: 'NewPass123',
          password_confirmation: 'NewPass123',
        })
      ).rejects.toThrow('Invalid or expired token.');
    });
  });
});
