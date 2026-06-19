// @vitest-environment jsdom
/**
 * TDD — C3: InsufficientCreditsModal is now built on the shared Dialog primitive.
 *
 * The hand-rolled backdrop/panel is replaced by <Dialog>, so the modal inherits
 * Escape-to-close, body scroll-lock, focus-trap and backdrop click-to-close for
 * free. The existing public API (open / onClose / cost / balance / feature) and
 * the single CTA link to /seller/credits are preserved.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  document.body.style.overflow = '';
});

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

describe('InsufficientCreditsModal on Dialog primitive', () => {
  it('closes on Escape (inherited from Dialog)', async () => {
    const { InsufficientCreditsModal } = await import('@/components/seller/InsufficientCreditsModal');
    const onClose = vi.fn();
    render(<InsufficientCreditsModal open onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll while open (inherited from Dialog)', async () => {
    const { InsufficientCreditsModal } = await import('@/components/seller/InsufficientCreditsModal');
    render(<InsufficientCreditsModal open onClose={() => {}} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('still renders an accessible dialog with a single CTA to /seller/credits', async () => {
    const { InsufficientCreditsModal } = await import('@/components/seller/InsufficientCreditsModal');
    render(<InsufficientCreditsModal open onClose={() => {}} cost={2} balance={0} />);
    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/seller/credits');
  });
});
