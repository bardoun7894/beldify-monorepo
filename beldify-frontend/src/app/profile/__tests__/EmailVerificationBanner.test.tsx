// @vitest-environment jsdom
/**
 * TDD — RED phase
 * Tests for EmailVerificationBanner component on profile page
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import * as React from 'react';

// Mock authService
const mockResendVerification = vi.fn();
vi.mock('@/services/authService', () => ({
  authService: {
    resendVerification: (...args: any[]) => mockResendVerification(...args),
  },
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en' },
  }),
}));

// Mock toast
vi.mock('@/utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import EmailVerificationBanner from '../components/EmailVerificationBanner';

describe('EmailVerificationBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders a banner when email_verified_at is null', () => {
    render(<EmailVerificationBanner emailVerifiedAt={null} />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('renders nothing when email is already verified', () => {
    const { container } = render(<EmailVerificationBanner emailVerifiedAt="2025-01-01T00:00:00Z" />);
    expect(container.firstChild).toBeNull();
  });

  it('shows a resend button', () => {
    render(<EmailVerificationBanner emailVerifiedAt={null} />);
    // Two buttons: resend + dismiss — just confirm at least one exists
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(1);
  });

  it('can be dismissed (banner disappears after clicking dismiss)', async () => {
    render(<EmailVerificationBanner emailVerifiedAt={null} />);
    const dismissBtn = screen.getByLabelText('Dismiss');
    fireEvent.click(dismissBtn);
    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  it('calls resendVerification when the resend button is clicked', async () => {
    mockResendVerification.mockResolvedValueOnce({ success: true });
    render(<EmailVerificationBanner emailVerifiedAt={null} />);
    // The resend button is the first button
    const buttons = screen.getAllByRole('button');
    const resendBtn = buttons.find((b) => /resend/i.test(b.textContent ?? ''));
    expect(resendBtn).toBeTruthy();
    fireEvent.click(resendBtn!);
    await waitFor(() => {
      expect(mockResendVerification).toHaveBeenCalledTimes(1);
    });
  });
});
