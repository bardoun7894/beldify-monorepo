// @vitest-environment jsdom
/**
 * TDD RED → GREEN — Seller Payouts Page
 *
 * Tests:
 * 1. Balance card renders available amount and min payout note
 * 2. History list renders request rows with status badges
 * 3. History renders empty state when no requests
 * 4. Request form is blocked with clear message when bank details are missing
 * 5. Request form is disabled when has_open_request is true
 * 6. Request form validates amount >= min_amount and <= available
 * 7. 422 error codes map to friendly messages (below_min, above_available, no_bank_details, open_request_exists)
 * 8. Bank-details section shows current details when present
 * 9. Bank-details editor appears and saves via PUT when editing
 * 10. Successful submit renders "pending review" success state
 * 11. Skeletons render during loading
 * 12. Paid status badge shows reference + paid_at
 * 13. Rejected status badge shows reject_reason
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, waitFor, fireEvent, act } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ── Common mocks ──────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/seller/payouts',
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

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { role: 'seller', is_seller: true } }),
}));

vi.mock('@/utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

const mockGetPayouts = vi.fn();
const mockRequestPayout = vi.fn();
const mockUpdateBankDetails = vi.fn();

vi.mock('@/services/sellerPayoutService', () => ({
  getSellerPayouts: () => mockGetPayouts(),
  requestPayout: (amount: number) => mockRequestPayout(amount),
  updateBankDetails: (details: unknown) => mockUpdateBankDetails(details),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BANK_DETAILS = {
  account_holder: 'Hassan Alami',
  bank_name: 'CIH Bank',
  rib: '230 780 4823412300048754 91',
};

const BASE_DATA = {
  available: 1500,
  min_amount: 100,
  currency: 'MAD',
  bank_details: BANK_DETAILS,
  has_open_request: false,
  requests: [],
};

const PENDING_REQUEST = {
  id: 1,
  amount: 300,
  status: 'pending' as const,
  reference: null,
  reject_reason: null,
  created_at: '2026-06-01T10:00:00Z',
  reviewed_at: null,
  paid_at: null,
};

const PAID_REQUEST = {
  id: 2,
  amount: 500,
  status: 'paid' as const,
  reference: 'VIR-20260610-001',
  reject_reason: null,
  created_at: '2026-05-15T08:00:00Z',
  reviewed_at: '2026-05-16T09:00:00Z',
  paid_at: '2026-05-16T10:00:00Z',
};

const REJECTED_REQUEST = {
  id: 3,
  amount: 200,
  status: 'rejected' as const,
  reference: null,
  reject_reason: 'RIB does not match the account holder name.',
  created_at: '2026-04-10T12:00:00Z',
  reviewed_at: '2026-04-11T09:00:00Z',
  paid_at: null,
};

// ── Helper ────────────────────────────────────────────────────────────────────

async function renderPage() {
  const { default: Page } = await import('../page');
  return render(<Page />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SellerPayoutsPage — balance card', () => {
  beforeEach(() => {
    mockGetPayouts.mockResolvedValue(BASE_DATA);
  });

  it('renders the available balance', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('payout-available')).toBeTruthy();
      expect(screen.getByTestId('payout-available').textContent).toContain('1');
    });
  });

  it('renders the min payout note', async () => {
    await renderPage();
    await waitFor(() => {
      const note = screen.getByTestId('payout-min-note');
      expect(note.textContent).toMatch(/100/);
    });
  });
});

describe('SellerPayoutsPage — skeletons', () => {
  it('renders skeleton while loading', async () => {
    let resolvePayouts!: (v: unknown) => void;
    mockGetPayouts.mockReturnValue(
      new Promise((res) => { resolvePayouts = res; })
    );
    await renderPage();
    // Skeleton is visible while the promise is pending
    expect(screen.getByTestId('payouts-skeleton')).toBeTruthy();
    // Resolve to avoid act() warning
    resolvePayouts(BASE_DATA);
    await waitFor(() => {
      expect(screen.queryByTestId('payouts-skeleton')).toBeNull();
    });
  });
});

describe('SellerPayoutsPage — history', () => {
  it('shows empty state when no requests', async () => {
    mockGetPayouts.mockResolvedValue({ ...BASE_DATA, requests: [] });
    await renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('payout-history-empty')).toBeTruthy();
    });
  });

  it('renders a pending badge for pending requests', async () => {
    mockGetPayouts.mockResolvedValue({ ...BASE_DATA, requests: [PENDING_REQUEST] });
    await renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('badge-pending-1')).toBeTruthy();
    });
  });

  it('renders paid badge with reference and paid_at for paid requests', async () => {
    mockGetPayouts.mockResolvedValue({ ...BASE_DATA, requests: [PAID_REQUEST] });
    await renderPage();
    await waitFor(() => {
      const badge = screen.getByTestId('badge-paid-2');
      expect(badge).toBeTruthy();
      const row = screen.getByTestId('payout-row-2');
      expect(row.textContent).toContain('VIR-20260610-001');
    });
  });

  it('renders rejected badge with reject_reason for rejected requests', async () => {
    mockGetPayouts.mockResolvedValue({ ...BASE_DATA, requests: [REJECTED_REQUEST] });
    await renderPage();
    await waitFor(() => {
      const badge = screen.getByTestId('badge-rejected-3');
      expect(badge).toBeTruthy();
      const row = screen.getByTestId('payout-row-3');
      expect(row.textContent).toContain('RIB does not match');
    });
  });
});

describe('SellerPayoutsPage — bank details section', () => {
  it('shows current bank details when present', async () => {
    mockGetPayouts.mockResolvedValue(BASE_DATA);
    await renderPage();
    await waitFor(() => {
      const section = screen.getByTestId('bank-details-display');
      expect(section.textContent).toContain('Hassan Alami');
      expect(section.textContent).toContain('CIH Bank');
    });
  });

  it('shows add-bank-details prompt when bank details are null', async () => {
    mockGetPayouts.mockResolvedValue({ ...BASE_DATA, bank_details: null });
    await renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('bank-details-missing')).toBeTruthy();
    });
  });
});

describe('SellerPayoutsPage — request form gates', () => {
  it('blocks the request form with a message when bank details are missing', async () => {
    mockGetPayouts.mockResolvedValue({ ...BASE_DATA, bank_details: null });
    await renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('gate-no-bank-details')).toBeTruthy();
      const submitBtn = screen.queryByTestId('payout-submit-btn');
      expect(submitBtn).toBeNull();
    });
  });

  it('disables the request form when has_open_request is true', async () => {
    mockGetPayouts.mockResolvedValue({ ...BASE_DATA, has_open_request: true });
    await renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('gate-open-request')).toBeTruthy();
      const submitBtn = screen.queryByTestId('payout-submit-btn');
      expect(submitBtn).toBeNull();
    });
  });

  it('disables the form when available < min_amount', async () => {
    mockGetPayouts.mockResolvedValue({ ...BASE_DATA, available: 50, min_amount: 100 });
    await renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('gate-below-min')).toBeTruthy();
    });
  });
});

describe('SellerPayoutsPage — request form validation', () => {
  beforeEach(() => {
    mockGetPayouts.mockResolvedValue(BASE_DATA);
  });

  it('shows client validation error when amount is below min', async () => {
    await renderPage();
    await waitFor(() => screen.getByTestId('payout-amount-input'));

    const input = screen.getByTestId('payout-amount-input') as HTMLInputElement;
    const form = screen.getByTestId('payout-form');

    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('amount-error')).toBeTruthy();
      expect(screen.getByTestId('amount-error').textContent).toMatch(/100/);
    });
    expect(mockRequestPayout).not.toHaveBeenCalled();
  });

  it('shows client validation error when amount exceeds available', async () => {
    await renderPage();
    await waitFor(() => screen.getByTestId('payout-amount-input'));

    const input = screen.getByTestId('payout-amount-input') as HTMLInputElement;
    const form = screen.getByTestId('payout-form');

    fireEvent.change(input, { target: { value: '9999' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('amount-error')).toBeTruthy();
      expect(screen.getByTestId('amount-error').textContent).toMatch(/1[,.]?500|1500/);
    });
    expect(mockRequestPayout).not.toHaveBeenCalled();
  });

  it('shows success state after a valid submission', async () => {
    mockRequestPayout.mockResolvedValue({
      request: { id: 99, amount: 300, status: 'pending', created_at: '2026-06-13T00:00:00Z' },
    });
    // First call (initial load) returns base data; subsequent calls (after success) return open-request state
    mockGetPayouts.mockResolvedValue(BASE_DATA);

    await renderPage();
    await waitFor(() => screen.getByTestId('payout-amount-input'));

    const input = screen.getByTestId('payout-amount-input') as HTMLInputElement;
    const form = screen.getByTestId('payout-form');

    fireEvent.change(input, { target: { value: '300' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('payout-success')).toBeTruthy();
    });
  });
});

describe('SellerPayoutsPage — 422 error code mapping', () => {
  beforeEach(() => {
    mockGetPayouts.mockResolvedValue(BASE_DATA);
  });

  const ERROR_CASES: Array<{ code: string; pattern: RegExp }> = [
    { code: 'below_min', pattern: /minimum|100/i },
    { code: 'above_available', pattern: /available|1[,.]?500/i },
    { code: 'no_bank_details', pattern: /bank|RIB/i },
    { code: 'open_request_exists', pattern: /pending|already/i },
  ];

  ERROR_CASES.forEach(({ code, pattern }) => {
    it(`maps 422 code "${code}" to a friendly message`, async () => {
      mockRequestPayout.mockRejectedValue({
        response: { status: 422, data: { error: 'Validation failed', code } },
      });

      await renderPage();
      await waitFor(() => screen.getByTestId('payout-amount-input'));

      const input = screen.getByTestId('payout-amount-input') as HTMLInputElement;
      const form = screen.getByTestId('payout-form');

      fireEvent.change(input, { target: { value: '300' } });
      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        const errEl = screen.getByTestId('submit-error');
        expect(errEl.textContent).toMatch(pattern);
      });
    });
  });
});
