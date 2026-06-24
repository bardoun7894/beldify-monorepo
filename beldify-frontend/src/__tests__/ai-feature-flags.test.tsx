/**
 * ai-feature-flags — FAB gating tests
 *
 * Tests for FloatingSupportButton — "Shop with AI" hidden when buyer_assistant=false, shown when true.
 * Hook tests are in ai-features-hook.test.ts.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Shared mocks
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) =>
      typeof fallback === 'string' ? fallback : _key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ isRTL: false }),
}));

// Mock next/dynamic to render children synchronously (no lazy loading in tests)
vi.mock('next/dynamic', () => ({
  default: (_importFn: () => Promise<{ default: React.ComponentType }>) => {
    return function DynamicComponent(props: Record<string, unknown>) {
      return React.createElement('div', { 'data-testid': 'assistant-panel', ...props });
    };
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Mock useAiFeatures — injected per test
// ─────────────────────────────────────────────────────────────────────────────

const mockUseAiFeatures = vi.fn();
vi.mock('@/hooks/useAiFeatures', () => ({
  useAiFeatures: (...args: unknown[]) => mockUseAiFeatures(...args),
}));

import FloatingSupportButton from '@/components/support/FloatingSupportButton';

// ─────────────────────────────────────────────────────────────────────────────
// FloatingSupportButton — "Shop with AI" gating
// ─────────────────────────────────────────────────────────────────────────────

describe('FloatingSupportButton — AI launcher gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function openMenu() {
    render(<FloatingSupportButton />);
    // Open the contact menu by clicking the FAB
    const fab = screen.getByRole('button', { name: /need help/i });
    fab.click();
    // Wait for the menu to appear
    await waitFor(() => {
      expect(screen.getByText('Need Help?')).toBeInTheDocument();
    });
  }

  it('"Shop with AI" is HIDDEN when buyer_assistant is false', async () => {
    mockUseAiFeatures.mockReturnValue({
      buyer_assistant: false,
      buyer_ai: false,
      tryon: false,
    });

    await openMenu();

    expect(screen.queryByText('Shop with AI')).toBeNull();
    // Call/Email are always visible
    expect(screen.getByText('Call us')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('"Shop with AI" is SHOWN when buyer_assistant is true', async () => {
    mockUseAiFeatures.mockReturnValue({
      buyer_assistant: true,
      buyer_ai: false,
      tryon: false,
    });

    await openMenu();

    expect(screen.getByText('Shop with AI')).toBeInTheDocument();
    expect(screen.getByText('Call us')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('Call and Email are always present regardless of AI flags', async () => {
    mockUseAiFeatures.mockReturnValue({
      buyer_assistant: false,
      buyer_ai: false,
      tryon: false,
    });

    await openMenu();

    expect(screen.getByText('Call us')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });
});
