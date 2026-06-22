/**
 * Unit tests for src/lib/analytics.ts
 *
 * Covers:
 * (a) Events push to window.dataLayer
 * (b) Each vendor forwarder no-ops when its global (gtag/fbq/ttq) is absent
 * (c) Backend POST /api/analytics/track is attempted (fire-and-forget)
 * (d) SSR-safe — no throw when window is undefined (Node env tests)
 *
 * Environment: node (the default for src/__tests__/ per vitest.config.mts,
 * overridden to jsdom inline via the annotation below for (a)/(b)/(c)).
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── helpers ──────────────────────────────────────────────────────────────────

type DataLayerEntry = Record<string, unknown>;

function setupWindow(overrides: Record<string, unknown> = {}) {
  // Reset dataLayer
  (window as unknown as Record<string, unknown>).dataLayer = [];
  // Clean vendor globals
  delete (window as unknown as Record<string, unknown>).gtag;
  delete (window as unknown as Record<string, unknown>).fbq;
  delete (window as unknown as Record<string, unknown>).ttq;

  // Apply per-test overrides
  for (const [key, value] of Object.entries(overrides)) {
    (window as unknown as Record<string, unknown>)[key] = value;
  }
}

// ── test suite ───────────────────────────────────────────────────────────────

describe('analytics.track()', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupWindow();
    // Spy on fetch so we can verify backend POST without real network
    fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = fetchSpy as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── (a) dataLayer ──────────────────────────────────────────────────────────

  it('pushes a normalized event object to window.dataLayer', async () => {
    const { track } = await import('@/lib/analytics');

    await track({
      event: 'page_view',
      page_path: '/test',
    });

    const dl = (window as unknown as { dataLayer: DataLayerEntry[] }).dataLayer;
    expect(dl).toHaveLength(1);
    expect(dl[0]).toMatchObject({ event: 'page_view', page_path: '/test' });
  });

  it('pushes an add_to_cart event with items and value to dataLayer', async () => {
    const { track } = await import('@/lib/analytics');

    await track({
      event: 'add_to_cart',
      currency: 'MAD',
      value: 299,
      items: [{ item_id: '42', item_name: 'Caftan Rouge', price: 299, quantity: 1 }],
    });

    const dl = (window as unknown as { dataLayer: DataLayerEntry[] }).dataLayer;
    const entry = dl[dl.length - 1] as Record<string, unknown>;
    expect(entry.event).toBe('add_to_cart');
    expect(entry.currency).toBe('MAD');
    expect(entry.value).toBe(299);
    expect(Array.isArray(entry.items)).toBe(true);
  });

  it('pushes a purchase event with transaction_id, value, and items', async () => {
    const { track } = await import('@/lib/analytics');

    await track({
      event: 'purchase',
      transaction_id: 'ORD-001',
      value: 899,
      currency: 'MAD',
      items: [{ item_id: '7', item_name: 'Djellaba', price: 899, quantity: 1 }],
    });

    const dl = (window as unknown as { dataLayer: DataLayerEntry[] }).dataLayer;
    const entry = dl[dl.length - 1] as Record<string, unknown>;
    expect(entry.event).toBe('purchase');
    expect(entry.transaction_id).toBe('ORD-001');
  });

  // ── (b) vendor forwarders no-op when global absent ─────────────────────────

  it('does NOT throw when gtag is absent (GA4 vendor no-ops)', async () => {
    const { track } = await import('@/lib/analytics');
    // gtag not on window — should not throw
    await expect(
      track({ event: 'page_view', page_path: '/' })
    ).resolves.not.toThrow();
  });

  it('does NOT throw when fbq is absent (Meta Pixel vendor no-ops)', async () => {
    const { track } = await import('@/lib/analytics');
    await expect(
      track({ event: 'view_item', currency: 'MAD', value: 100, items: [] })
    ).resolves.not.toThrow();
  });

  it('does NOT throw when ttq is absent (TikTok vendor no-ops)', async () => {
    const { track } = await import('@/lib/analytics');
    await expect(
      track({ event: 'begin_checkout', currency: 'MAD', value: 450, items: [] })
    ).resolves.not.toThrow();
  });

  it('calls gtag when it IS present on window', async () => {
    const gtagSpy = vi.fn();
    setupWindow({ gtag: gtagSpy });
    const { track } = await import('@/lib/analytics');

    await track({ event: 'page_view', page_path: '/home' });

    expect(gtagSpy).toHaveBeenCalled();
  });

  it('calls fbq when it IS present on window', async () => {
    const fbqSpy = vi.fn();
    setupWindow({ fbq: fbqSpy });
    const { track } = await import('@/lib/analytics');

    await track({ event: 'view_item', currency: 'MAD', value: 100, items: [] });

    expect(fbqSpy).toHaveBeenCalled();
  });

  it('calls ttq.track when it IS present on window', async () => {
    const ttqTrackSpy = vi.fn();
    setupWindow({ ttq: { track: ttqTrackSpy } });
    const { track } = await import('@/lib/analytics');

    await track({ event: 'add_to_cart', currency: 'MAD', value: 200, items: [] });

    expect(ttqTrackSpy).toHaveBeenCalled();
  });

  // ── (c) backend POST is attempted ─────────────────────────────────────────

  it('POSTs the event to /api/analytics/track (fire-and-forget)', async () => {
    const { track } = await import('@/lib/analytics');

    await track({ event: 'page_view', page_path: '/products' });

    // Give the fire-and-forget a tick to resolve
    await new Promise((r) => setTimeout(r, 0));

    const postedToBackend = fetchSpy.mock.calls.some(
      (call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('/api/analytics/track')
    );
    expect(postedToBackend).toBe(true);
  });

  it('does NOT throw if the backend POST fails (swallows error)', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));
    const { track } = await import('@/lib/analytics');

    await expect(
      track({ event: 'page_view', page_path: '/error-path' })
    ).resolves.not.toThrow();
  });

  // ── (d) SSR safety — no throw when window is undefined ────────────────────
  // The module is tested in jsdom but we can simulate the SSR guard by
  // temporarily removing window.
  it('returns early without throwing when window is undefined (SSR guard)', async () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error intentional undefined for SSR test
    delete globalThis.window;

    let threwError = false;
    try {
      const { track } = await import('@/lib/analytics');
      await track({ event: 'page_view', page_path: '/ssr' });
    } catch {
      threwError = true;
    }

    // Restore window
    (globalThis as typeof globalThis & { window: typeof originalWindow }).window = originalWindow;

    expect(threwError).toBe(false);
  });
});
