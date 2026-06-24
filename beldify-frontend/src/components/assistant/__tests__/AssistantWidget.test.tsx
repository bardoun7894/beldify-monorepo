// @vitest-environment jsdom
/**
 * TDD RED → GREEN — AssistantWidget + AssistantPanel integration
 *
 * Tests:
 *   1. renders launcher button
 *   2. clicking launcher opens the chat panel
 *   3. typing + send calls the service with correct payload and renders the reply
 *   4. product cards from mocked response are rendered with in-app PDP links
 *   5. clicking a suggestion chip sends that suggestion
 *   6. RTL: ar/ma locale → panel container has dir="rtl"
 *   7. a11y: message list has aria-live region
 *   8. graceful error: service failure shows localised error string, widget doesn't crash
 *
 * Strategy: Test AssistantPanel directly for 3-8 (bypasses dynamic import entirely).
 *           Test AssistantWidget launcher for 1-2 using a mock panel.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ── Service mock ──────────────────────────────────────────────────────────────
vi.mock('@/services/assistantService', () => ({
  assistant: vi.fn(),
}));

// ── next/link: render as <a> ──────────────────────────────────────────────────
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: Record<string, unknown>) =>
    React.createElement('a', { href: href as string, ...(rest as object) }, children as React.ReactNode),
}));

// ── next/image: render as <img> ───────────────────────────────────────────────
vi.mock('next/image', () => ({
  default: ({ src, alt, fill: _fill, sizes: _sizes, ...rest }: Record<string, unknown>) =>
    React.createElement('img', { src, alt, ...(rest as object) }),
}));

// ── next/dynamic: synchronously returns AssistantPanel (no lazy loading in tests)
vi.mock('next/dynamic', () => ({
  default: (_importFn: unknown, _opts?: unknown) => {
    // Return a wrapper that renders AssistantPanel using its mocked module
    // vi.mock hoisting ensures @/components/assistant/AssistantPanel is available
    const Sync = (props: Record<string, unknown>) =>
      React.createElement(MockPanelComponent as React.ComponentType, props);
    Sync.displayName = 'SyncDynamic';
    return Sync;
  },
}));

// ── react-i18next ─────────────────────────────────────────────────────────────
const mockI18n = { language: 'en' };
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) => {
      if (typeof fallback === 'string') return fallback;
      return key;
    },
    i18n: mockI18n,
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// ── @/hooks/useDirection ──────────────────────────────────────────────────────
let mockIsRTL = false;
vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ isRTL: mockIsRTL, currentLang: mockI18n.language }),
}));

// ── @/utils/imageUtils ────────────────────────────────────────────────────────
vi.mock('@/utils/imageUtils', () => ({
  getImageUrl: (src: string | null) => src || '/placeholder-product.svg',
  DEFAULT_PLACEHOLDER_IMAGE: '/placeholder-product.svg',
}));

// ── @/utils/formatters ────────────────────────────────────────────────────────
vi.mock('@/utils/formatters', () => ({
  formatPrice: (p: number | string | null) => (p != null ? `${p} MAD` : ''),
}));

// ── @/lib/utils ──────────────────────────────────────────────────────────────
vi.mock('@/lib/utils', () => ({
  cn: (...args: (string | false | null | undefined)[]) => args.filter(Boolean).join(' '),
}));

// ── @/utils/consoleLogger ─────────────────────────────────────────────────────
vi.mock('@/utils/consoleLogger', () => ({
  default: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// ── A real AssistantPanel-like component for integration tests ────────────────
// We import AssistantPanel directly (not via dynamic) to avoid lazy-load issues.
// This variable is assigned in beforeEach so vi.mock above can reference it.
let MockPanelComponent: React.ComponentType<{ onClose: () => void; isRTL: boolean }>;

afterEach(() => vi.clearAllMocks());

import { assistant as mockAssistant } from '@/services/assistantService';

const MOCK_SUCCESS_RESPONSE = {
  reply: 'مرحبا! Here are some great products for you.',
  products: [
    {
      id: 42,
      name: 'Caftan Tetouani',
      price: 350,
      image: '/products/caftan.jpg',
      slug: 'caftan-tetouani-42',
    },
  ],
  suggestions: ['Show me more caftans', 'Filter by price'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Widget-level tests (launcher behaviour, uses a lightweight mock panel)
// ─────────────────────────────────────────────────────────────────────────────
describe('AssistantWidget — launcher', () => {
  beforeEach(() => {
    mockIsRTL = false;
    mockI18n.language = 'en';
    // Use a simple panel stub for launcher tests
    function StubPanel({ onClose }: { onClose: () => void; isRTL: boolean }) {
      return React.createElement(
        'div',
        { role: 'dialog' },
        React.createElement('textarea', { 'aria-label': 'Message to assistant' }),
        React.createElement('button', { onClick: onClose, 'aria-label': 'Close' }, 'Close')
      );
    }
    MockPanelComponent = StubPanel;
  });

  // ── 1. Renders launcher ────────────────────────────────────────────────────
  it('renders the launcher button', async () => {
    const { AssistantWidget } = await import('@/components/assistant/AssistantWidget');
    render(<AssistantWidget />);

    // The launcher should be a button in the document
    const launcher = screen.getByRole('button', { name: /assistant|chat|shop|help|ai/i });
    expect(launcher).toBeTruthy();
  });

  // ── 2. Clicking launcher opens the chat panel ─────────────────────────────
  it('clicking the launcher opens the chat panel', async () => {
    const { AssistantWidget } = await import('@/components/assistant/AssistantWidget');
    render(<AssistantWidget />);

    const launcher = screen.getByRole('button', { name: /assistant|chat|shop|help|ai/i });
    fireEvent.click(launcher);

    // Panel should be visible — look for the dialog/textbox
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeTruthy();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Panel-level tests (use AssistantPanel directly, bypassing dynamic import)
// ─────────────────────────────────────────────────────────────────────────────
describe('AssistantWidget — panel behaviour', () => {
  beforeEach(() => {
    mockIsRTL = false;
    mockI18n.language = 'en';
  });

  // ── 3. Typing + send calls service and renders reply ──────────────────────
  it('typing a message and clicking send calls the service and shows the reply', async () => {
    vi.mocked(mockAssistant).mockResolvedValue(MOCK_SUCCESS_RESPONSE);

    const { AssistantPanel } = await import('@/components/assistant/AssistantPanel');
    const onClose = vi.fn();
    render(<AssistantPanel onClose={onClose} isRTL={false} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'أبغي كفطان' } });

    const sendBtn = screen.getByRole('button', { name: /send/i });
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    await waitFor(() => {
      expect(vi.mocked(mockAssistant)).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'أبغي كفطان',
          history: expect.any(Array),
          locale: expect.any(String),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/مرحبا!/)).toBeTruthy();
    });
  });

  // ── 4. Product cards rendered with in-app PDP links ───────────────────────
  it('renders product cards from response with in-app PDP links (no external links)', async () => {
    vi.mocked(mockAssistant).mockResolvedValue(MOCK_SUCCESS_RESPONSE);

    const { AssistantPanel } = await import('@/components/assistant/AssistantPanel');
    render(<AssistantPanel onClose={vi.fn()} isRTL={false} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'show me caftan' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Caftan Tetouani')).toBeTruthy();
    });

    // All links must be in-app (start with /)
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      const href = link.getAttribute('href') || '';
      expect(href.startsWith('/')).toBe(true);
      expect(href).not.toMatch(/^https?:\/\//);
      expect(href).not.toMatch(/wa\.me|whatsapp|tel:/);
    });

    // PDP link must use /products/{id}
    const pdpLink = links.find((l) =>
      (l.getAttribute('href') || '').includes('/products/42')
    );
    expect(pdpLink).toBeTruthy();
  });

  // ── 5. Suggestion chip sends the suggestion ───────────────────────────────
  it('clicking a suggestion chip sends it as the next message', async () => {
    vi.mocked(mockAssistant).mockResolvedValue(MOCK_SUCCESS_RESPONSE);

    const { AssistantPanel } = await import('@/components/assistant/AssistantPanel');
    render(<AssistantPanel onClose={vi.fn()} isRTL={false} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Show me more caftans')).toBeTruthy();
    });

    vi.mocked(mockAssistant).mockResolvedValue({
      reply: 'Here are more caftans!',
      products: [],
      suggestions: [],
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Show me more caftans'));
    });

    await waitFor(() => {
      expect(vi.mocked(mockAssistant)).toHaveBeenLastCalledWith(
        expect.objectContaining({ message: 'Show me more caftans' })
      );
    });
  });

  // ── 6. RTL: ar locale → panel has dir="rtl" ───────────────────────────────
  it('renders with dir="rtl" when isRTL=true', async () => {
    const { AssistantPanel } = await import('@/components/assistant/AssistantPanel');
    const { container } = render(<AssistantPanel onClose={vi.fn()} isRTL={true} />);

    const rtlEl = container.querySelector('[dir="rtl"]');
    expect(rtlEl).toBeTruthy();
  });

  // ── 7. a11y: message list has aria-live="polite" region ───────────────────
  it('message list has an aria-live="polite" region', async () => {
    const { AssistantPanel } = await import('@/components/assistant/AssistantPanel');
    const { container } = render(<AssistantPanel onClose={vi.fn()} isRTL={false} />);

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeTruthy();
  });

  // ── 8. Graceful error: service failure shows localised error ─────────────
  it('shows a localised error when the service throws, does not crash', async () => {
    vi.mocked(mockAssistant).mockRejectedValue(new Error('Network error'));

    const { AssistantPanel } = await import('@/components/assistant/AssistantPanel');
    render(<AssistantPanel onClose={vi.fn()} isRTL={false} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send/i }));
    });

    // Widget should show an error rather than crash
    await waitFor(() => {
      const errorEl =
        screen.queryByText(/error|retry|wrong|حاول|essayez/i) ||
        document.querySelector('[role="alert"]') ||
        document.querySelector('[data-testid="error-message"]');
      expect(errorEl).toBeTruthy();
    });
  });

  // ── 9 (P2). No nested aria-live: thinking-dots must not carry its own ─────
  it('thinking indicator does not introduce a nested aria-live region', async () => {
    // The outer message-list container already has aria-live="polite".
    // A second live region inside it double-announces on NVDA/VoiceOver.
    vi.mocked(mockAssistant).mockReturnValue(new Promise(() => {})); // never resolves → keeps isLoading=true

    const { AssistantPanel } = await import('@/components/assistant/AssistantPanel');
    const { container } = render(<AssistantPanel onClose={vi.fn()} isRTL={false} />);

    // Trigger loading state
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send/i }));
    });

    // Exactly ONE aria-live region anywhere in the panel
    const liveRegions = container.querySelectorAll('[aria-live]');
    expect(liveRegions.length).toBe(1);
  });

  // ── 10 (P3). No RefreshCcw import usage in rendered output ───────────────
  it('no retry/refresh icon is rendered (RefreshCcw should not be in use)', async () => {
    const { AssistantPanel } = await import('@/components/assistant/AssistantPanel');
    const { container } = render(<AssistantPanel onClose={vi.fn()} isRTL={false} />);

    // Lucide RefreshCcw renders an SVG with a specific path — none should appear
    // We just verify no button with "retry" label exists (the import is dead)
    const retryBtn = container.querySelector('[aria-label*="retry" i], [aria-label*="Retry" i]');
    expect(retryBtn).toBeNull();
  });

  // ── 11 (P3). Dialog labeled via aria-labelledby pointing to h2 ───────────
  it('dialog uses aria-labelledby referencing the visible h2 heading', async () => {
    const { AssistantPanel } = await import('@/components/assistant/AssistantPanel');
    const { container } = render(<AssistantPanel onClose={vi.fn()} isRTL={false} />);

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();

    // Must use aria-labelledby, not aria-label
    expect(dialog!.hasAttribute('aria-labelledby')).toBe(true);
    expect(dialog!.hasAttribute('aria-label')).toBe(false);

    // The referenced id must resolve to an h2 element
    const labelledById = dialog!.getAttribute('aria-labelledby')!;
    const heading = container.querySelector(`#${labelledById}`);
    expect(heading).toBeTruthy();
    expect(heading!.tagName.toLowerCase()).toBe('h2');
  });

  // ── 12 (P3). over_limit renders via t() key, not a raw JS template literal ─
  it('over-limit counter renders the i18n key string (not a raw "X over limit" English fallback)', async () => {
    // The top-level vi.mock for react-i18next returns the key when no string fallback is provided.
    // With the old code: t('assistant.over_limit', `${n} over limit`) → string fallback wins → "10 over limit"
    // With new code: t('assistant.over_limit', { count: n }) → opts is an object → mock returns the key
    // So we verify: rendered text shows "assistant.over_limit" (the key) NOT the pattern "N over limit"
    const { AssistantPanel } = await import('@/components/assistant/AssistantPanel');
    render(<AssistantPanel onClose={vi.fn()} isRTL={false} />);

    // Type enough to exceed 500 chars (triggers over-limit counter path)
    const longText = 'a'.repeat(510);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: longText } });

    await waitFor(() => {
      // The key itself should appear (mock returns key when opts is an object)
      expect(screen.getByText('assistant.over_limit')).toBeTruthy();
    });

    // The old raw template literal would have produced "10 over limit" — that must NOT appear
    const rawPattern = screen.queryByText(/\d+ over limit/);
    expect(rawPattern).toBeNull();
  });
});
