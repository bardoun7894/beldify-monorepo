// @vitest-environment jsdom
/**
 * TDD tests for PostOrderPushPrompt — P2 post-order push prompt.
 *
 * RED: component does not exist yet.
 * GREEN: component renders for authed users; hides after dismiss; guest path is calm.
 *
 * Ethics compliance (hooked §1):
 * - Second person, calm copy ≤12 words
 * - No "!" in push copy
 * - No shame / loss-aversion language
 * - Dismiss = one tap, no retention wall
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, within, act, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import PostOrderPushPrompt from '../PostOrderPushPrompt';

// ── localStorage mock ─────────────────────────────────────────────────────────

function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() { return Object.keys(store).length; },
    _seed: (data: Record<string, string>) => { Object.assign(store, data); },
  };
}

let localStorageMock: ReturnType<typeof createLocalStorageMock>;

function mountInContainer(jsx: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const result = render(jsx, { container });
  return { ...result, q: () => within(container) };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PostOrderPushPrompt', () => {
  beforeEach(() => {
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

  // ── Authed user: push card renders ───────────────────────────────────────────

  it('renders the push notification card for authenticated users', () => {
    // RED: component does not exist yet
    const onSubscribe = vi.fn().mockResolvedValue(true);
    const { q } = mountInContainer(
      <PostOrderPushPrompt
        isAuthenticated={true}
        isSubscribed={false}
        isLoading={false}
        onSubscribe={onSubscribe}
      />
    );

    const card = q().getByTestId('push-prompt-card');
    expect(card).toBeTruthy();
  });

  it('shows calm AR copy with no exclamation mark for authed users', () => {
    const onSubscribe = vi.fn().mockResolvedValue(true);
    const { q } = mountInContainer(
      <PostOrderPushPrompt
        isAuthenticated={true}
        isSubscribed={false}
        isLoading={false}
        onSubscribe={onSubscribe}
      />
    );

    const card = q().getByTestId('push-prompt-card');
    // Push copy must not contain "!" (no fake urgency)
    expect(card.textContent).not.toMatch(/!/);
  });

  it('does not render the push card when already dismissed (localStorage key set)', () => {
    localStorageMock._seed({ 'push-prompt-dismissed': 'true' });

    const onSubscribe = vi.fn().mockResolvedValue(true);
    const { q } = mountInContainer(
      <PostOrderPushPrompt
        isAuthenticated={true}
        isSubscribed={false}
        isLoading={false}
        onSubscribe={onSubscribe}
      />
    );

    expect(q().queryByTestId('push-prompt-card')).toBeNull();
  });

  it('hides the card after dismiss tap and writes localStorage key', async () => {
    const onSubscribe = vi.fn().mockResolvedValue(true);
    const { q } = mountInContainer(
      <PostOrderPushPrompt
        isAuthenticated={true}
        isSubscribed={false}
        isLoading={false}
        onSubscribe={onSubscribe}
      />
    );

    const dismissBtn = q().getByTestId('push-prompt-dismiss');
    await act(async () => { fireEvent.click(dismissBtn); });

    await waitFor(() => {
      expect(q().queryByTestId('push-prompt-card')).toBeNull();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('push-prompt-dismissed', 'true');
  });

  it('calls onSubscribe when the subscribe CTA is tapped', async () => {
    const onSubscribe = vi.fn().mockResolvedValue(true);
    const { q } = mountInContainer(
      <PostOrderPushPrompt
        isAuthenticated={true}
        isSubscribed={false}
        isLoading={false}
        onSubscribe={onSubscribe}
      />
    );

    const cta = q().getByTestId('push-prompt-cta');
    await act(async () => { fireEvent.click(cta); });

    expect(onSubscribe).toHaveBeenCalledTimes(1);
  });

  it('does not show the push card when already subscribed', () => {
    const onSubscribe = vi.fn().mockResolvedValue(true);
    const { q } = mountInContainer(
      <PostOrderPushPrompt
        isAuthenticated={true}
        isSubscribed={true}
        isLoading={false}
        onSubscribe={onSubscribe}
      />
    );

    expect(q().queryByTestId('push-prompt-card')).toBeNull();
  });

  // ── Guest path: no push card, calm register nudge ────────────────────────────

  it('does not render the push card for guest users', () => {
    const { q } = mountInContainer(
      <PostOrderPushPrompt
        isAuthenticated={false}
        isSubscribed={false}
        isLoading={false}
        onSubscribe={vi.fn()}
      />
    );

    expect(q().queryByTestId('push-prompt-card')).toBeNull();
  });

  it('renders a calm register nudge for guest users', () => {
    const { q } = mountInContainer(
      <PostOrderPushPrompt
        isAuthenticated={false}
        isSubscribed={false}
        isLoading={false}
        onSubscribe={vi.fn()}
      />
    );

    // Guests see a register link, not a push card — no blocking wall
    const nudge = q().getByTestId('guest-register-nudge');
    expect(nudge).toBeTruthy();
    // Must not contain "!" (calm copy)
    expect(nudge.textContent).not.toMatch(/!/);
  });

  it('does not show a retention wall for guests (nudge is dismissible)', async () => {
    const { q } = mountInContainer(
      <PostOrderPushPrompt
        isAuthenticated={false}
        isSubscribed={false}
        isLoading={false}
        onSubscribe={vi.fn()}
      />
    );

    const dismissBtn = q().queryByTestId('guest-nudge-dismiss');
    // Guest nudge must have a dismiss button (no retention wall)
    expect(dismissBtn).toBeTruthy();

    await act(async () => { fireEvent.click(dismissBtn!); });

    await waitFor(() => {
      expect(q().queryByTestId('guest-register-nudge')).toBeNull();
    });
  });
});
