/**
 * Global vitest setup — runs before every test file.
 *
 * Responsibilities:
 * 1. Extend vitest's expect with @testing-library/jest-dom DOM matchers
 *    (toBeInTheDocument, toHaveTextContent, toBeDisabled, toBeVisible, etc.)
 * 2. Wire up afterEach cleanup so stale DOM is removed between tests.
 * 3. Stub browser APIs that jsdom doesn't implement
 *    (localStorage, matchMedia, ResizeObserver, IntersectionObserver).
 */
import { afterEach, expect, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import * as ReactAll from 'react';

// When vitest.config.ts (without @vitejs/plugin-react) is the active config,
// production files that use JSX without `import React` fail with
// "React is not defined" because the automatic JSX runtime is not injected.
// Assigning React to globalThis provides the fallback that the classic JSX
// transform expects, keeping all component tests green regardless of which
// config file vitest resolves.
// This is safe: the assignment is a no-op when the automatic transform IS active.
(globalThis as typeof globalThis & { React: typeof ReactAll }).React =
  (globalThis as typeof globalThis & { React: typeof ReactAll }).React ?? ReactAll;

// Extend vitest expect with jest-dom DOM matchers.
// Using the explicit matchers import avoids the "expect is not defined" error
// that occurs when jest-dom's index.mjs calls global `expect.extend()` in a
// non-globals vitest environment.
expect.extend(matchers);

// Auto-cleanup DOM between tests — prevents "Found multiple elements" failures
// caused by stale renders from prior test cases accumulating in document.body.
afterEach(() => {
  cleanup();
});

// ── Browser API stubs (jsdom does not implement these) ───────────────────────

// Only install browser stubs when the test environment has a `window` object
// (i.e., jsdom). Node-environment tests don't need these.
if (typeof window !== 'undefined') {
  // localStorage — jsdom throws in opaque origin contexts; provide a spy-able stub.
  const _store: Record<string, string> = {};
  const _getItem = vi.fn((key: string) => _store[key] ?? null);
  const _setItem = vi.fn((key: string, value: string) => { _store[key] = value; });
  const _removeItem = vi.fn((key: string) => { delete _store[key]; });
  const _clear = vi.fn(() => { Object.keys(_store).forEach((k) => delete _store[k]); });
  const _key = vi.fn((index: number) => Object.keys(_store)[index] ?? null);

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: _getItem,
      setItem: _setItem,
      removeItem: _removeItem,
      clear: _clear,
      key: _key,
      get length() { return Object.keys(_store).length; },
    },
    writable: true,
    configurable: true,
  });

  // matchMedia — jsdom does not implement it; return a minimal stub.
  if (!window.matchMedia) {
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
        dispatchEvent: vi.fn(() => false),
      })),
    });
  }

  // ResizeObserver — not in jsdom.
  if (typeof ResizeObserver === 'undefined') {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  // IntersectionObserver — not in jsdom.
  if (typeof IntersectionObserver === 'undefined') {
    // @ts-expect-error -- intentional global stub for jsdom environments
    global.IntersectionObserver = class IntersectionObserver {
      constructor(_cb: unknown, _opts?: unknown) {}
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
}
