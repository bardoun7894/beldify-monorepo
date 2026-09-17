/**
 * ResponseCard — "Edit proposal" affordance (seller-owned pending proposal)
 *
 * Tests:
 *  1. Owner sees "Edit proposal" with correct "editsRemaining" count when pending
 *  2. Hidden when response is not owned by the viewer (isMine=false)
 *  3. Hidden when the proposal is not pending (accepted)
 *  4. Hidden when editsRemaining <= 0 (edit cap reached)
 *  5. Clicking "Edit proposal" opens the edit form pre-filled with description
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string, opts?: Record<string, unknown>) => {
      if (!fallback) return _key;
      if (opts) {
        return Object.entries(opts).reduce(
          (acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)),
          fallback
        );
      }
      return fallback;
    },
  }),
}));

vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ isRTL: false, direction: 'ltr' }),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => React.createElement('img', props),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      React.createElement('div', props, children),
  },
}));

vi.mock('@/components/common/LoadingSpinner', () => ({
  default: () => React.createElement('span', { 'data-testid': 'spinner' }),
}));

vi.mock('../ProposalAiDraft', () => ({
  ProposalAiDraft: () => React.createElement('div', { 'data-testid': 'ai-draft' }),
}));

vi.mock('@/services/communityService', () => ({
  submitSellerReview: vi.fn(),
  updateResponse: vi.fn(),
}));

const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

import ResponseCard from '../ResponseCard';
import type { CommunityResponse } from '@/types/community';

const baseResponse: CommunityResponse = {
  id: 10,
  postId: 1,
  userId: 5,
  description: 'My original proposal description',
  price: 500,
  currency: 'MAD',
  delivery_days: 7,
  status: 'pending',
  created_at: '2026-07-01T00:00:00Z',
  updated_at: '2026-07-01T00:00:00Z',
  isMine: true,
  editCount: 1,
  editsRemaining: 2,
};

describe('ResponseCard — Edit proposal affordance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 5 } });
  });

  it('shows "Edit proposal" with remaining-edits count when owner + pending + edits remaining', () => {
    render(<ResponseCard response={baseResponse} />);

    const editButton = screen.getByRole('button', { name: /edit proposal/i });
    expect(editButton).toBeInTheDocument();
    expect(screen.getByText(/2 edits left/i)).toBeInTheDocument();
  });

  it('hides the edit control when the viewer does not own the proposal', () => {
    render(<ResponseCard response={{ ...baseResponse, isMine: false }} />);

    expect(screen.queryByRole('button', { name: /edit proposal/i })).not.toBeInTheDocument();
  });

  it('hides the edit control when the proposal is not pending (accepted)', () => {
    render(<ResponseCard response={{ ...baseResponse, status: 'accepted' }} />);

    expect(screen.queryByRole('button', { name: /edit proposal/i })).not.toBeInTheDocument();
  });

  it('hides the edit control when editsRemaining is 0 (cap reached)', () => {
    render(<ResponseCard response={{ ...baseResponse, editsRemaining: 0 }} />);

    expect(screen.queryByRole('button', { name: /edit proposal/i })).not.toBeInTheDocument();
  });

  it('opens the edit form pre-filled with the current description on click', () => {
    render(<ResponseCard response={baseResponse} />);

    fireEvent.click(screen.getByRole('button', { name: /edit proposal/i }));

    const textarea = screen.getByLabelText(/cover message/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe('My original proposal description');
  });
});
