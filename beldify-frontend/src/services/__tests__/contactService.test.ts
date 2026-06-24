/**
 * TDD — RED phase
 * Tests for contactService.send
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

describe('contactService (src/services/contactService.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports a send function', async () => {
    const mod = await import('../contactService');
    expect(typeof mod.contactService.send).toBe('function');
  });

  it('POSTs to /api/contact with name, email, subject, message', async () => {
    mockPost.mockResolvedValueOnce({
      status: 201,
      data: { success: true, message: 'Message received.' },
    });

    const mod = await import('../contactService');
    const result = await mod.contactService.send({
      name: 'Hassan Benali',
      email: 'hassan@example.com',
      subject: 'Hello',
      message: 'I have a question.',
    });

    expect(mockPost).toHaveBeenCalledWith('/api/contact', {
      name: 'Hassan Benali',
      email: 'hassan@example.com',
      subject: 'Hello',
      message: 'I have a question.',
    });
    expect(result.success).toBe(true);
  });

  it('sends without subject (optional field)', async () => {
    mockPost.mockResolvedValueOnce({
      status: 201,
      data: { success: true, message: 'Message received.' },
    });

    const mod = await import('../contactService');
    await mod.contactService.send({
      name: 'Fatima',
      email: 'fatima@example.com',
      message: 'No subject here.',
    });

    expect(mockPost).toHaveBeenCalledWith('/api/contact', {
      name: 'Fatima',
      email: 'fatima@example.com',
      message: 'No subject here.',
    });
  });

  it('throws rate_limit error on 429 response', async () => {
    const axiosError = Object.assign(new Error('Too Many Requests'), {
      isAxiosError: true,
      response: { status: 429, data: { message: 'Too many requests.' } },
    });
    mockPost.mockRejectedValueOnce(axiosError);

    const mod = await import('../contactService');
    await expect(
      mod.contactService.send({ name: 'X', email: 'x@x.com', message: 'test' })
    ).rejects.toThrow('rate_limit');
  });

  it('throws the API message on generic error', async () => {
    const axiosError = Object.assign(new Error('Server Error'), {
      isAxiosError: true,
      response: { status: 500, data: { message: 'Internal server error.' } },
    });
    mockPost.mockRejectedValueOnce(axiosError);

    const mod = await import('../contactService');
    await expect(
      mod.contactService.send({ name: 'X', email: 'x@x.com', message: 'test' })
    ).rejects.toThrow('Internal server error.');
  });
});
