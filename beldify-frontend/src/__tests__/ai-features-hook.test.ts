/**
 * ai-features-hook — useAiFeatures hook unit tests
 *
 * Tests:
 *  1. Defaults to all-false before fetch resolves
 *  2. Stays all-false on network error
 *  3. Stays all-false on non-ok HTTP response
 *  4. Returns server flags on success
 *  5. Fills in missing flags with false
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

// Helper: freshly import useAiFeatures after module reset to clear module-level cache
async function freshHook() {
  const mod = await import('@/hooks/useAiFeatures');
  return mod.useAiFeatures;
}

describe('useAiFeatures', () => {
  it('returns all-false defaults before the fetch resolves', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const useAiFeatures = await freshHook();

    const { result } = renderHook(() => useAiFeatures());

    expect(result.current).toEqual({
      buyer_assistant: false,
      buyer_ai: false,
      tryon: false,
    });
  });

  it('returns all-false when fetch fails (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const useAiFeatures = await freshHook();

    const { result } = renderHook(() => useAiFeatures());

    await waitFor(() => {
      expect(result.current).toEqual({
        buyer_assistant: false,
        buyer_ai: false,
        tryon: false,
      });
    });
  });

  it('returns all-false when fetch returns a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) })
    );
    const useAiFeatures = await freshHook();

    const { result } = renderHook(() => useAiFeatures());

    await waitFor(() => {
      expect(result.current).toEqual({
        buyer_assistant: false,
        buyer_ai: false,
        tryon: false,
      });
    });
  });

  it('returns the server flags when fetch succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ buyer_assistant: true, buyer_ai: true, tryon: true }),
      })
    );
    const useAiFeatures = await freshHook();

    const { result } = renderHook(() => useAiFeatures());

    await waitFor(() => {
      expect(result.current).toEqual({
        buyer_assistant: true,
        buyer_ai: true,
        tryon: true,
      });
    });
  });

  it('fills in missing fields with false if server omits them', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ buyer_assistant: true }), // buyer_ai + tryon omitted
      })
    );
    const useAiFeatures = await freshHook();

    const { result } = renderHook(() => useAiFeatures());

    await waitFor(() => {
      expect(result.current).toEqual({
        buyer_assistant: true,
        buyer_ai: false,
        tryon: false,
      });
    });
  });
});
