// @vitest-environment jsdom
/**
 * TDD — RED phase
 * Tests for the FollowShopButton component:
 *   1. Renders investment-framing hint copy (ethics requirement, hooked §1)
 *   2. Renders "تابِع المتجر" (AR) / "Follow" (EN) in unfollow state
 *   3. Renders "تتابِع" (AR) / "Following" indicator in follow state
 *   4. Is disabled while loading
 *   5. Calls onToggle on click
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import FollowShopButton from '../FollowShopButton';

// Minimal i18next stub — returns the fallback string as-is
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string, _opts?: any) => fallback ?? _key,
    i18n: { language: 'en' },
  }),
}));

// Default: LTR (English). RTL tests override this mock per-test.
const mockUseDirection = vi.fn(() => ({ isRTL: false }));
vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => mockUseDirection(),
}));

describe('FollowShopButton', () => {
  const defaultProps = {
    shopName: 'Maison Atlas',
    isFollowing: false,
    isLoading: false,
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    // Reset to LTR before each test
    mockUseDirection.mockReturnValue({ isRTL: false });
  });

  afterEach(() => {
    cleanup();
  });

  // ── English / LTR ────────────────────────────────────────────────────────

  it('renders investment-framing hint when not following (EN)', () => {
    render(<FollowShopButton {...defaultProps} />);
    // Must contain investment framing — "see new pieces first" or equivalent
    expect(
      screen.getByText(/see new pieces first/i)
    ).toBeTruthy();
  });

  it('renders English follow label in unfollow state', () => {
    render(<FollowShopButton {...defaultProps} isFollowing={false} />);
    expect(screen.getByRole('button').textContent).toMatch(/Follow/);
  });

  it('renders English "Following" label in follow state', () => {
    render(<FollowShopButton {...defaultProps} isFollowing={true} />);
    expect(screen.getByRole('button').textContent).toMatch(/Following/);
  });

  // ── Arabic / RTL ─────────────────────────────────────────────────────────

  it('renders Arabic follow label "تابِع" in unfollow state (RTL)', () => {
    mockUseDirection.mockReturnValue({ isRTL: true });
    render(<FollowShopButton {...defaultProps} isFollowing={false} />);
    // Arabic label — partial match acceptable
    expect(screen.getByRole('button').textContent).toMatch(/تابِع/);
  });

  it('renders Arabic following label "تتابِع" in following state (RTL)', () => {
    mockUseDirection.mockReturnValue({ isRTL: true });
    render(<FollowShopButton {...defaultProps} isFollowing={true} />);
    expect(screen.getByRole('button').textContent).toMatch(/تتابِع/);
  });

  it('renders Arabic investment-framing hint (RTL)', () => {
    mockUseDirection.mockReturnValue({ isRTL: true });
    render(<FollowShopButton {...defaultProps} />);
    // "لترى القطع الجديدة أولاً" — see new pieces first (AR)
    expect(screen.getByText(/لترى القطع الجديدة أولاً/)).toBeTruthy();
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<FollowShopButton {...defaultProps} onToggle={onToggle} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('is disabled while loading', () => {
    render(<FollowShopButton {...defaultProps} isLoading={true} />);
    expect(screen.getByRole('button')).toHaveProperty('disabled', true);
  });

  it('has aria-pressed true when following', () => {
    render(<FollowShopButton {...defaultProps} isFollowing={true} />);
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
  });

  it('has aria-pressed false when not following', () => {
    render(<FollowShopButton {...defaultProps} isFollowing={false} />);
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('false');
  });
});
