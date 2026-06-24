// @vitest-environment jsdom
/**
 * TDD RED → GREEN — Layout Messages nav item
 *
 * Covers:
 * 1. Messages nav item appears in the sidebar linking to /seller/messages
 *    (updated from /community/messages — seller inbox ships at /seller/messages)
 * 2. Messages nav item appears with visible label text
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const mockPush = vi.fn();
let mockPathname = '/seller';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

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

vi.mock('@/utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const AUTH_SELLER = { isAuthenticated: true, user: { role: 'seller', is_seller: true } };

describe('SellerLayout — Messages nav item', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(AUTH_SELLER);
    mockPathname = '/seller';
  });

  it('renders a Messages nav link pointing to /seller/messages in the sidebar', async () => {
    const { default: Layout } = await import('../layout');
    render(<Layout><span>CHILD</span></Layout>);
    // Find a link that points to /seller/messages
    const links = screen.getAllByRole('link');
    const messagesLink = links.find(l => l.getAttribute('href') === '/seller/messages');
    expect(messagesLink).toBeTruthy();
  });

  it('renders Messages link with visible label text', async () => {
    const { default: Layout } = await import('../layout');
    render(<Layout><span>CHILD</span></Layout>);
    const links = screen.getAllByRole('link');
    const messagesLink = links.find(l => l.getAttribute('href') === '/seller/messages');
    expect(messagesLink?.textContent?.toLowerCase()).toMatch(/messages|رسائل/i);
  });
});
