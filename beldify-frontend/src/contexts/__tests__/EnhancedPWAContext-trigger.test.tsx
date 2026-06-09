// @vitest-environment jsdom
/**
 * TDD tests for EnhancedPWAContext — P5 fix.
 *
 * RED: triggerInstallOnAction('order-complete') currently discards shouldTrigger
 *      via `void shouldTrigger;` — the prompt never opens.
 * GREEN: after fix, shouldTrigger=true → setShowInstallPrompt(true).
 *
 * Also covers checkOptimalTiming() using calculateOptimalTiming().shouldShow.
 *
 * Note: jsdom with opaque origins throws on real localStorage.
 * We mock it on window before each test so the context can read/write engagement data.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, within, act, waitFor } from '@testing-library/react';
import React from 'react';
import { EnhancedPWAProvider, useEnhancedPWA } from '../EnhancedPWAContext';

// ── localStorage mock ─────────────────────────────────────────────────────────

function createLocalStorageMock() {
  let store: Record<string, string> = {};
  const mock = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() { return Object.keys(store).length; },
    _seed: (data: Record<string, string>) => { Object.assign(store, data); },
  };
  return mock;
}

// ── DOM / browser API stubs ───────────────────────────────────────────────────

function stubBrowserAPIs() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });

  if (typeof (globalThis as any).Notification === 'undefined') {
    (globalThis as any).Notification = { permission: 'default' };
  }
}

// ── Test consumer ─────────────────────────────────────────────────────────────

type TriggerAction = Parameters<ReturnType<typeof useEnhancedPWA>['triggerInstallOnAction']>[0];

function PWAConsumer({ action }: { action?: TriggerAction }) {
  const { showInstallPrompt, triggerInstallOnAction, checkOptimalTiming } = useEnhancedPWA();
  return (
    <div data-testid="pwa-consumer">
      <span data-testid="show-prompt">{showInstallPrompt ? 'visible' : 'hidden'}</span>
      <button
        data-testid="trigger-btn"
        onClick={() => action && triggerInstallOnAction(action)}
      >
        trigger
      </button>
      <button
        data-testid="optimal-btn"
        onClick={() => checkOptimalTiming()}
      >
        checkOptimal
      </button>
    </div>
  );
}

function renderWithProvider(action?: TriggerAction) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const result = render(
    <EnhancedPWAProvider>
      <PWAConsumer action={action} />
    </EnhancedPWAProvider>,
    { container }
  );
  return { ...result, container, within: () => within(container) };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('EnhancedPWAContext — triggerInstallOnAction (P5 fix)', () => {
  let localStorageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    stubBrowserAPIs();
    localStorageMock = createLocalStorageMock();
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      configurable: true,
      value: localStorageMock,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the install prompt when order-complete is triggered (no prior dismiss)', async () => {
    // RED: void shouldTrigger means this never opens. GREEN: should flip to visible.
    const { within: q } = renderWithProvider('order-complete');

    expect(q().getByTestId('show-prompt').textContent).toBe('hidden');

    await act(async () => {
      q().getByTestId('trigger-btn').click();
    });

    await waitFor(() => {
      expect(q().getByTestId('show-prompt').textContent).toBe('visible');
    });
  });

  it('keeps the prompt hidden when dismissed within 24 hours', async () => {
    const oneHourAgo = Date.now() - 1 * 60 * 60 * 1000;
    const engagement = {
      pageViews: 0, timeSpent: 0, cartValue: 0, hasWishlist: false,
      lastVisit: Date.now(), installDismissed: oneHourAgo,
      sessionStart: Date.now(), productsViewed: 0, cartAbandoned: false,
    };
    localStorageMock._seed({ 'pwa-engagement': JSON.stringify(engagement) });

    const { within: q } = renderWithProvider('order-complete');

    await act(async () => {
      q().getByTestId('trigger-btn').click();
    });

    // Dismiss guard must still block: hidden expected
    expect(q().getByTestId('show-prompt').textContent).toBe('hidden');
  });

  it('shows the prompt when dismiss was more than 24 hours ago', async () => {
    const twentyFiveHoursAgo = Date.now() - 25 * 60 * 60 * 1000;
    const engagement = {
      pageViews: 0, timeSpent: 0, cartValue: 0, hasWishlist: false,
      lastVisit: Date.now(), installDismissed: twentyFiveHoursAgo,
      sessionStart: Date.now(), productsViewed: 0, cartAbandoned: false,
    };
    localStorageMock._seed({ 'pwa-engagement': JSON.stringify(engagement) });

    const { within: q } = renderWithProvider('order-complete');

    await act(async () => {
      q().getByTestId('trigger-btn').click();
    });

    await waitFor(() => {
      expect(q().getByTestId('show-prompt').textContent).toBe('visible');
    });
  });

  it('checkOptimalTiming opens the prompt when engagement score exceeds threshold', async () => {
    // cartValue=600 (+35+40), hasWishlist (+25), productsViewed=6 (+15+25+30),
    // pageViews=8 (+10+15+20+25), 6min session (+5+8+12+15+20), returning visitor (+25)
    const twoMinutesAgo = Date.now() - 360000;
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    const engagement = {
      pageViews: 8, timeSpent: 360000, cartValue: 600, hasWishlist: true,
      lastVisit: twoDaysAgo, installDismissed: 0,
      sessionStart: twoMinutesAgo, productsViewed: 6, cartAbandoned: false,
    };
    localStorageMock._seed({ 'pwa-engagement': JSON.stringify(engagement) });

    const { within: q } = renderWithProvider();

    await act(async () => {
      q().getByTestId('optimal-btn').click();
    });

    await waitFor(() => {
      expect(q().getByTestId('show-prompt').textContent).toBe('visible');
    });
  });
});
