// @vitest-environment jsdom
/**
 * TDD RED → GREEN — InsufficientCreditsModal
 *
 * Tests:
 * 1. Renders when open=true
 * 2. Does not render when open=false
 * 3. Shows cost, balance and feature label
 * 4. CTA links to /seller/credits
 * 5. Calls onClose when dismiss button clicked
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'en' },
  }),
}));

describe('InsufficientCreditsModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders nothing when open=false', async () => {
    const { InsufficientCreditsModal } = await import('@/components/seller/InsufficientCreditsModal');
    const onClose = vi.fn();
    render(<InsufficientCreditsModal open={false} onClose={onClose} />);
    // Modal should not be visible
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the modal when open=true', async () => {
    const { InsufficientCreditsModal } = await import('@/components/seller/InsufficientCreditsModal');
    const onClose = vi.fn();
    render(<InsufficientCreditsModal open={true} onClose={onClose} cost={2} balance={0} feature="listing_writer" />);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('shows cost and balance when provided', async () => {
    const { InsufficientCreditsModal } = await import('@/components/seller/InsufficientCreditsModal');
    const onClose = vi.fn();
    render(<InsufficientCreditsModal open={true} onClose={onClose} cost={5} balance={2} feature="store_creator" />);
    // cost = 5 and balance = 2 should appear
    expect(screen.getByText(/5/)).toBeTruthy();
    expect(screen.getByText(/2/)).toBeTruthy();
  });

  it('CTA link points to /seller/credits', async () => {
    const { InsufficientCreditsModal } = await import('@/components/seller/InsufficientCreditsModal');
    const onClose = vi.fn();
    render(<InsufficientCreditsModal open={true} onClose={onClose} cost={2} balance={0} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/seller/credits');
  });

  it('calls onClose when dismiss/close button is clicked', async () => {
    const { InsufficientCreditsModal } = await import('@/components/seller/InsufficientCreditsModal');
    const onClose = vi.fn();
    render(<InsufficientCreditsModal open={true} onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: /dismiss|close|later/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
