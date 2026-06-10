/**
 * TDD — RED phase
 * Tests for seller-inbox functions in messagingService:
 *   getSellerConversations, getSellerThread, sendSellerMessage, markSellerThreadRead
 *
 * Written BEFORE implementation — they must fail first.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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
const mockPost = axios.post as ReturnType<typeof vi.fn>;

// ── Shared localStorage/document setup ──────────────────────────────────────
function withToken() {
  Object.defineProperty(globalThis, 'localStorage', {
    value: { getItem: vi.fn().mockReturnValue('mock-seller-token'), setItem: vi.fn(), removeItem: vi.fn() },
    writable: true,
  });
  Object.defineProperty(globalThis, 'document', {
    value: { cookie: '' },
    writable: true,
  });
}

function withoutToken() {
  Object.defineProperty(globalThis, 'localStorage', {
    value: { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn(), removeItem: vi.fn() },
    writable: true,
  });
  Object.defineProperty(globalThis, 'document', {
    value: { cookie: '' },
    writable: true,
  });
}

// ── getSellerConversations ────────────────────────────────────────────────────
describe('messagingService.getSellerConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withToken();
  });

  it('is exported as a function', async () => {
    const mod = await import('../messagingService');
    expect(typeof mod.getSellerConversations).toBe('function');
  });

  it('GETs /api/v1/backend/messages/conversations', async () => {
    mockGet.mockResolvedValueOnce({ data: { conversations: [], total_unread: 0 } });
    const mod = await import('../messagingService');
    await mod.getSellerConversations();
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/backend/messages/conversations'),
      expect.any(Object)
    );
  });

  it('returns the conversations array from the response', async () => {
    const conv = [
      { id: 1, display_name: 'Ahmed', avatar: null, last_message_preview: 'hi', unread_count: 2, updated_at: '2024-01-01' },
    ];
    mockGet.mockResolvedValueOnce({ data: { conversations: conv, total_unread: 2 } });
    const mod = await import('../messagingService');
    const result = await mod.getSellerConversations();
    expect(result.conversations).toEqual(conv);
    expect(result.total_unread).toBe(2);
  });

  it('returns empty conversations when not authenticated', async () => {
    withoutToken();
    const mod = await import('../messagingService');
    const result = await mod.getSellerConversations();
    expect(result.conversations).toEqual([]);
    expect(result.total_unread).toBe(0);
  });

  it('returns empty result and does not throw on network error', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network Error'));
    const mod = await import('../messagingService');
    const result = await mod.getSellerConversations();
    expect(result.conversations).toEqual([]);
  });
});

// ── getSellerThread ───────────────────────────────────────────────────────────
describe('messagingService.getSellerThread', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withToken();
  });

  it('is exported as a function', async () => {
    const mod = await import('../messagingService');
    expect(typeof mod.getSellerThread).toBe('function');
  });

  it('GETs /api/v1/backend/messages/conversations/{buyerId}', async () => {
    mockGet.mockResolvedValueOnce({ data: { messages: [], pagination: { current_page: 1, last_page: 1, total: 0 }, otherUser: {} } });
    const mod = await import('../messagingService');
    await mod.getSellerThread('42');
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/backend/messages/conversations/42'),
      expect.any(Object)
    );
  });

  it('passes page param when provided', async () => {
    mockGet.mockResolvedValueOnce({ data: { messages: [], pagination: { current_page: 2, last_page: 3, total: 10 }, otherUser: {} } });
    const mod = await import('../messagingService');
    await mod.getSellerThread('42', 2);
    const callArgs = mockGet.mock.calls[0][1];
    expect(callArgs.params?.page).toBe(2);
  });

  it('returns messages and pagination from backend', async () => {
    const messages = [{ id: 1, content: 'hello', isSentByMe: false, created_at: '2024-01-01' }];
    mockGet.mockResolvedValueOnce({
      data: {
        messages,
        pagination: { current_page: 1, last_page: 2, total: 5 },
        otherUser: { id: 42, display_name: 'Fatima', avatar: null },
      },
    });
    const mod = await import('../messagingService');
    const result = await mod.getSellerThread('42');
    expect(result.messages).toEqual(messages);
    expect(result.pagination.last_page).toBe(2);
    expect(result.otherUser.display_name).toBe('Fatima');
  });

  it('throws on 403 (no-thread access denied)', async () => {
    const err = Object.assign(new Error('Forbidden'), { response: { status: 403 } });
    mockGet.mockRejectedValueOnce(err);
    const mod = await import('../messagingService');
    await expect(mod.getSellerThread('99')).rejects.toThrow();
  });
});

// ── sendSellerMessage ─────────────────────────────────────────────────────────
describe('messagingService.sendSellerMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withToken();
  });

  it('is exported as a function', async () => {
    const mod = await import('../messagingService');
    expect(typeof mod.sendSellerMessage).toBe('function');
  });

  it('POSTs to /api/v1/backend/messages/send with buyer_id and content', async () => {
    mockPost.mockResolvedValueOnce({ data: { message: { id: 10, content: 'سلام', isSentByMe: true }, status: 'success' } });
    const mod = await import('../messagingService');
    await mod.sendSellerMessage('42', 'سلام');
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/backend/messages/send'),
      expect.objectContaining({ buyer_id: '42', content: 'سلام' }),
      expect.any(Object)
    );
  });

  it('returns the message object from backend', async () => {
    const msg = { id: 10, content: 'hello', isSentByMe: true, created_at: '2024-01-01' };
    mockPost.mockResolvedValueOnce({ data: { message: msg, status: 'success' } });
    const mod = await import('../messagingService');
    const result = await mod.sendSellerMessage('42', 'hello');
    expect(result).toEqual(msg);
  });

  it('throws when unauthenticated', async () => {
    withoutToken();
    const mod = await import('../messagingService');
    await expect(mod.sendSellerMessage('42', 'hello')).rejects.toThrow();
  });

  it('throws on network error', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network Error'));
    const mod = await import('../messagingService');
    await expect(mod.sendSellerMessage('42', 'hello')).rejects.toThrow('Network Error');
  });
});

// ── markSellerThreadRead ──────────────────────────────────────────────────────
describe('messagingService.markSellerThreadRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withToken();
  });

  it('is exported as a function', async () => {
    const mod = await import('../messagingService');
    expect(typeof mod.markSellerThreadRead).toBe('function');
  });

  it('POSTs to /api/v1/backend/messages/mark-all-read/{buyerId}', async () => {
    mockPost.mockResolvedValueOnce({ data: { status: 'success', count: 3 } });
    const mod = await import('../messagingService');
    await mod.markSellerThreadRead('42');
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/backend/messages/mark-all-read/42'),
      expect.anything(),
      expect.any(Object)
    );
  });

  it('returns the count of marked messages', async () => {
    mockPost.mockResolvedValueOnce({ data: { status: 'success', count: 5 } });
    const mod = await import('../messagingService');
    const result = await mod.markSellerThreadRead('42');
    expect(result.count).toBe(5);
  });

  it('returns count 0 and does not throw on network error', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network Error'));
    const mod = await import('../messagingService');
    const result = await mod.markSellerThreadRead('42');
    expect(result.count).toBe(0);
  });
});
