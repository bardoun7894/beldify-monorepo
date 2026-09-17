// @vitest-environment jsdom
/**
 * Open Souk blind bidding — buyer-side "Contact seller" gating (F4).
 *
 * Current rule (relaxed from the original accept-gate): the post owner may
 * contact any seller who has SUBMITTED a proposal — before or after acceptance —
 * so buyers can clarify details pre-hire. Non-owners never see the affordance.
 * ResponseCard deep-links to /community/messages/{shopId}; this test proves
 * the gating, not the link target.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import ResponseCard from '@/components/community/ResponseCard';
import type { CommunityResponse } from '@/types/community';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({ useParams: () => ({ id: '10' }) }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'en' }, t: (_k: string, d?: string) => d ?? _k }),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/hooks/useDirection', () => ({ useDirection: () => ({ isRTL: false, direction: 'ltr' }) }));
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, 'data-testid': 'contact-seller' }, children),
}));
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) =>
    React.createElement('img', { alt: '', ...(props as object) }),
}));

const baseResponse = (overrides: Partial<CommunityResponse> = {}): CommunityResponse => ({
  id: 1,
  postId: 10,
  userId: 5,
  shopId: 77,
  description: 'My proposal',
  price: 1200,
  currency: 'MAD',
  status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('Open Souk — Contact seller gating (F4)', () => {
  it('shows "Contact seller" to the post owner on a PENDING (submitted) proposal', () => {
    render(<ResponseCard response={baseResponse({ status: 'pending' })} isPostOwner postId="10" />);
    const link = screen.getByTestId('contact-seller');
    expect(link.getAttribute('href')).toBe('/community/messages/77?postId=10');
  });

  it('hides "Contact seller" for a NON-owner viewer on an accepted proposal', () => {
    render(<ResponseCard response={baseResponse({ status: 'accepted' })} isPostOwner={false} postId="10" />);
    expect(screen.queryByTestId('contact-seller')).toBeNull();
  });

  it('shows "Contact seller" ONLY for the owner on the ACCEPTED proposal, linking to messaging', () => {
    render(<ResponseCard response={baseResponse({ status: 'accepted', shopId: 77 })} isPostOwner postId="10" />);
    const link = screen.getByTestId('contact-seller');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/community/messages/77?postId=10');
  });
});
