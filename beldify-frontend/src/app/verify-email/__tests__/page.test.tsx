// @vitest-environment jsdom
/**
 * TDD — RED phase
 * Tests for /verify-email page component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import * as React from 'react';
const { Suspense } = React;

// Mock next/navigation
const mockGet = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: mockGet }),
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock authService
const mockVerifyEmail = vi.fn();
const mockResendVerification = vi.fn();
vi.mock('@/services/authService', () => ({
  authService: {
    verifyEmail: (...args: any[]) => mockVerifyEmail(...args),
    resendVerification: (...args: any[]) => mockResendVerification(...args),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, user: null }),
  AuthContext: { Consumer: ({ children }: any) => children({ isAuthenticated: false, user: null }) },
}));

// Mock useTranslation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en' },
  }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

// Mock AuthBrandPanel
vi.mock('@/components/auth/AuthBrandPanel', () => ({
  default: () => <div data-testid="brand-panel" />,
}));

// Mock toast
vi.mock('@/utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

describe('/verify-email page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithSuspense = async (Component: React.ComponentType) => {
    const { container } = render(
      <Suspense fallback={<div>loading...</div>}>
        <Component />
      </Suspense>
    );
    // wait for suspense to resolve
    await waitFor(() => {
      expect(screen.queryByText('loading...')).toBeNull();
    });
    return container;
  };

  it('shows a spinner / verifying state when params are present and request is in-flight', async () => {
    mockGet.mockImplementation((key: string) => {
      const params: Record<string, string> = { id: '1', hash: 'hash', expires: '9999', signature: 'sig' };
      return params[key] ?? null;
    });
    // Never resolves during this test
    mockVerifyEmail.mockReturnValue(new Promise(() => {}));

    const { default: VerifyEmailPage } = await import('../page');
    await renderWithSuspense(VerifyEmailPage);

    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('shows success state after successful verification', async () => {
    mockGet.mockImplementation((key: string) => {
      const params: Record<string, string> = { id: '1', hash: 'hash', expires: '9999', signature: 'sig' };
      return params[key] ?? null;
    });
    mockVerifyEmail.mockResolvedValueOnce({ success: true });

    const { default: VerifyEmailPage } = await import('../page');
    await renderWithSuspense(VerifyEmailPage);

    await waitFor(() => {
      expect(screen.getByText(/verified/i)).toBeTruthy();
    });
  });

  it('shows already-verified state when backend returns already_verified:true', async () => {
    mockGet.mockImplementation((key: string) => {
      const params: Record<string, string> = { id: '1', hash: 'hash', expires: '9999', signature: 'sig' };
      return params[key] ?? null;
    });
    mockVerifyEmail.mockResolvedValueOnce({ success: true, already_verified: true });

    const { default: VerifyEmailPage } = await import('../page');
    await renderWithSuspense(VerifyEmailPage);

    await waitFor(() => {
      expect(screen.getByText(/already verified/i)).toBeTruthy();
    });
  });

  it('shows invalid/expired state when verifyEmail throws invalid_or_expired', async () => {
    mockGet.mockImplementation((key: string) => {
      const params: Record<string, string> = { id: '1', hash: 'hash', expires: '9999', signature: 'sig' };
      return params[key] ?? null;
    });
    mockVerifyEmail.mockRejectedValueOnce(new Error('invalid_or_expired'));

    const { default: VerifyEmailPage } = await import('../page');
    await renderWithSuspense(VerifyEmailPage);

    await waitFor(() => {
      expect(screen.getAllByText(/expired/i).length).toBeGreaterThan(0);
    });
  });

  it('shows missing-params error state when searchParams are absent', async () => {
    mockGet.mockReturnValue(null);

    const { default: VerifyEmailPage } = await import('../page');
    await renderWithSuspense(VerifyEmailPage);

    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeTruthy();
    });
  });
});
