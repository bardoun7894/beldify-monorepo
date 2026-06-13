/**
 * TryOnPaidMode — paid-mode UX tests
 *
 * Tests:
 *  1. paid+guest → sign-in gate shown, no upload step
 *  2. paid+authed → wallet balance fetched and shown
 *  3. paid+authed happy path → submit charges and updates balance from response
 *  4. 402 → top-up sheet shown with packs and RIB
 *  5. receipt upload → pending confirmation state
 *  6. refunded fail → refund message shown
 *  7. paid=false → free flow unchanged (upload step visible without auth)
 *  8. Button: paid config shows credit hint chip
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) =>
      typeof fallback === 'string' ? fallback : _key,
  }),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | false | null | undefined)[]) =>
    classes.filter(Boolean).join(' '),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/products/123',
  useRouter: () => ({ push: vi.fn() }),
}));

// ─── service mocks ────────────────────────────────────────────────────────────

const mockFetchTryonConfig = vi.fn();
const mockSubmitTryon = vi.fn();
const mockFetchTryonStatus = vi.fn();
const mockFetchWalletBalance = vi.fn();
const mockSubmitTopup = vi.fn();
const mockFetchTopups = vi.fn();

vi.mock('@/services/tryonService', () => ({
  fetchTryonConfig: (...args: unknown[]) => mockFetchTryonConfig(...args),
  submitTryon: (...args: unknown[]) => mockSubmitTryon(...args),
  fetchTryonStatus: (...args: unknown[]) => mockFetchTryonStatus(...args),
  fetchWalletBalance: (...args: unknown[]) => mockFetchWalletBalance(...args),
  submitTopup: (...args: unknown[]) => mockSubmitTopup(...args),
  fetchTopups: (...args: unknown[]) => mockFetchTopups(...args),
}));

// ─── URL stubs ────────────────────────────────────────────────────────────────

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  configurable: true,
  value: vi.fn(() => 'blob:mock-preview-url'),
});
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  configurable: true,
  value: vi.fn(),
});

vi.stubGlobal('Image', class {
  width = 100;
  height = 100;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_: string) {
    queueMicrotask(() => this.onload?.());
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fakeFile(name = 'photo.jpg', type = 'image/jpeg') {
  return new File(['data'], name, { type });
}

function selectFile(input: HTMLInputElement, file: File) {
  Object.defineProperty(input, 'files', {
    value: [file],
    writable: false,
    configurable: true,
  });
  fireEvent.change(input);
}

async function importModal() {
  const mod = await import('../TryOnModal');
  return mod.TryOnModal;
}

async function importButton() {
  const mod = await import('../TryOnButton');
  return mod.TryOnButton;
}

// Default paid config
const PAID_CONFIG = {
  enabled: true,
  paid: true,
  free_credits: 1,
  packs: [
    { credits: 3, price_mad: 29 },
    { credits: 7, price_mad: 59 },
    { credits: 15, price_mad: 99 },
  ],
  rib: 'MA64 0111 2222 3333 4444 5555 6666',
};

const FREE_CONFIG = { enabled: true, paid: false, free_credits: 0, packs: [], rib: '' };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TryOnModal — paid mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // By default: not authenticated
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  });

  afterEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  });

  it('paid+guest: shows sign-in gate and NO upload step', async () => {
    mockFetchTryonConfig.mockResolvedValue(PAID_CONFIG);
    mockFetchTopups.mockResolvedValue([]);

    const TryOnModal = await importModal();
    render(
      <TryOnModal
        open={true}
        onClose={vi.fn()}
        onHideFeature={vi.fn()}
        productId="1"
        onBuyNow={vi.fn()}
        config={PAID_CONFIG}
        isAuthenticated={false}
      />
    );

    await waitFor(() => {
      // Sign-in gate should be visible
      expect(screen.getByTestId('tryon-guest-gate')).toBeInTheDocument();
    });

    // Upload step must NOT be visible
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it('paid+guest gate: shows sign-in CTA linking to /login', async () => {
    mockFetchTryonConfig.mockResolvedValue(PAID_CONFIG);
    mockFetchTopups.mockResolvedValue([]);

    const TryOnModal = await importModal();
    render(
      <TryOnModal
        open={true}
        onClose={vi.fn()}
        onHideFeature={vi.fn()}
        productId="1"
        onBuyNow={vi.fn()}
        config={PAID_CONFIG}
        isAuthenticated={false}
      />
    );

    await waitFor(() => {
      const link = screen.getByTestId('tryon-signin-link');
      expect(link).toBeInTheDocument();
      expect((link as HTMLAnchorElement).href).toMatch(/login/);
    });
  });

  it('paid+guest gate: sign-in link carries the current pathname as redirect param (SSR-safe via usePathname)', async () => {
    // usePathname mock returns '/products/123' (see mock at top of file)
    const TryOnModal = await importModal();
    render(
      <TryOnModal
        open={true}
        onClose={vi.fn()}
        onHideFeature={vi.fn()}
        productId="1"
        onBuyNow={vi.fn()}
        config={PAID_CONFIG}
        isAuthenticated={false}
      />
    );

    await waitFor(() => {
      const link = screen.getByTestId('tryon-signin-link') as HTMLAnchorElement;
      // Must encode /products/123 as redirect param
      expect(link.href).toContain(encodeURIComponent('/products/123'));
    });
  });

  it('paid+authed: fetches wallet balance and shows it', async () => {
    localStorage.setItem('token', 'fake-token');
    mockFetchTryonConfig.mockResolvedValue(PAID_CONFIG);
    mockFetchWalletBalance.mockResolvedValue({ balance: 3 });
    mockFetchTopups.mockResolvedValue([]);

    const TryOnModal = await importModal();
    render(
      <TryOnModal
        open={true}
        onClose={vi.fn()}
        onHideFeature={vi.fn()}
        productId="1"
        onBuyNow={vi.fn()}
        config={PAID_CONFIG}
        isAuthenticated={true}
      />
    );

    await waitFor(() => {
      expect(mockFetchWalletBalance).toHaveBeenCalledOnce();
      expect(screen.getByTestId('tryon-balance-chip')).toBeInTheDocument();
      expect(screen.getByTestId('tryon-balance-chip').textContent).toMatch(/3/);
    });
  });

  it('paid+authed happy path: submits and updates balance from response', async () => {
    localStorage.setItem('token', 'fake-token');
    mockFetchTryonConfig.mockResolvedValue(PAID_CONFIG);
    mockFetchWalletBalance.mockResolvedValue({ balance: 5 });
    mockFetchTopups.mockResolvedValue([]);
    mockSubmitTryon.mockResolvedValue({ task_id: 'task-paid', balance: 4 });
    mockFetchTryonStatus.mockResolvedValue({
      status: 'success',
      progress: 100,
      result_url: 'https://example.com/result.jpg',
      error: null,
    });

    const TryOnModal = await importModal();
    render(
      <TryOnModal
        open={true}
        onClose={vi.fn()}
        onHideFeature={vi.fn()}
        productId="5"
        onBuyNow={vi.fn()}
        config={PAID_CONFIG}
        isAuthenticated={true}
      />
    );

    // Wait for balance to load
    await waitFor(() => screen.getByTestId('tryon-balance-chip'));

    // Select file
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    selectFile(input, fakeFile());
    await waitFor(() => screen.getByAltText(/photo preview/i));

    vi.useFakeTimers();
    try {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /generate/i }));
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3500);
      });
    } finally {
      vi.useRealTimers();
    }

    await waitFor(() => {
      expect(screen.getByAltText(/result/i)).toBeInTheDocument();
      // Balance should update to 4 from response
      expect(screen.getByTestId('tryon-balance-chip').textContent).toMatch(/4/);
    });
  });

  it('402: shows top-up sheet with packs and RIB', async () => {
    localStorage.setItem('token', 'fake-token');
    mockFetchWalletBalance.mockResolvedValue({ balance: 0 });
    mockFetchTopups.mockResolvedValue([]);

    const err = Object.assign(new Error('Payment Required'), {
      response: {
        status: 402,
        data: {
          error: 'insufficient_credits',
          packs: PAID_CONFIG.packs,
          rib: PAID_CONFIG.rib,
        },
      },
    });
    mockSubmitTryon.mockRejectedValue(err);

    const TryOnModal = await importModal();
    render(
      <TryOnModal
        open={true}
        onClose={vi.fn()}
        onHideFeature={vi.fn()}
        productId="5"
        onBuyNow={vi.fn()}
        config={PAID_CONFIG}
        isAuthenticated={true}
      />
    );

    await waitFor(() => screen.getByTestId('tryon-balance-chip'));

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    selectFile(input, fakeFile());
    await waitFor(() => screen.getByAltText(/photo preview/i));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /generate/i }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('tryon-topup-sheet')).toBeInTheDocument();
    });

    // Packs should be shown
    expect(screen.getByTestId('tryon-topup-sheet').textContent).toMatch(/29/);

    // RIB should be shown
    expect(screen.getByTestId('tryon-rib-display')).toBeInTheDocument();
  });

  it('402: receipt upload and submit shows pending confirmation', async () => {
    localStorage.setItem('token', 'fake-token');
    mockFetchWalletBalance.mockResolvedValue({ balance: 0 });
    mockFetchTopups.mockResolvedValue([]);
    mockSubmitTopup.mockResolvedValue({
      id: 'topup-1',
      status: 'pending',
      credits: 7,
      price_mad: 59,
    });

    const err = Object.assign(new Error('Payment Required'), {
      response: {
        status: 402,
        data: { error: 'insufficient_credits', packs: PAID_CONFIG.packs, rib: PAID_CONFIG.rib },
      },
    });
    mockSubmitTryon.mockRejectedValue(err);

    const TryOnModal = await importModal();
    render(
      <TryOnModal
        open={true}
        onClose={vi.fn()}
        onHideFeature={vi.fn()}
        productId="5"
        onBuyNow={vi.fn()}
        config={PAID_CONFIG}
        isAuthenticated={true}
      />
    );

    await waitFor(() => screen.getByTestId('tryon-balance-chip'));

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    selectFile(input, fakeFile());
    await waitFor(() => screen.getByAltText(/photo preview/i));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /generate/i }));
    });

    await waitFor(() => screen.getByTestId('tryon-topup-sheet'));

    // Select a pack (first one)
    const packCards = screen.getAllByTestId(/tryon-pack-card/);
    fireEvent.click(packCards[0]);

    // Upload a receipt
    const receiptInput = document.querySelector('input[data-testid="tryon-receipt-input"]') as HTMLInputElement;
    expect(receiptInput).not.toBeNull();
    selectFile(receiptInput, new File(['pdf'], 'receipt.pdf', { type: 'application/pdf' }));

    // Submit
    await act(async () => {
      fireEvent.click(screen.getByTestId('tryon-topup-submit'));
    });

    await waitFor(() => {
      expect(mockSubmitTopup).toHaveBeenCalledOnce();
      expect(screen.getByTestId('tryon-topup-pending')).toBeInTheDocument();
    });
  });

  it('failed generation with refunded:true shows refund message', async () => {
    localStorage.setItem('token', 'fake-token');
    mockFetchWalletBalance.mockResolvedValue({ balance: 2 });
    mockFetchTopups.mockResolvedValue([]);
    mockSubmitTryon.mockResolvedValue({ task_id: 'task-refund', balance: 2 });
    mockFetchTryonStatus.mockResolvedValue({
      status: 'fail',
      progress: 0,
      result_url: null,
      error: 'Processing error',
      refunded: true,
    });

    const TryOnModal = await importModal();
    render(
      <TryOnModal
        open={true}
        onClose={vi.fn()}
        onHideFeature={vi.fn()}
        productId="5"
        onBuyNow={vi.fn()}
        config={PAID_CONFIG}
        isAuthenticated={true}
      />
    );

    await waitFor(() => screen.getByTestId('tryon-balance-chip'));

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    selectFile(input, fakeFile());
    await waitFor(() => screen.getByAltText(/photo preview/i));

    vi.useFakeTimers();
    try {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /generate/i }));
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3500);
      });
    } finally {
      vi.useRealTimers();
    }

    await waitFor(() => {
      expect(screen.getByTestId('tryon-refund-notice')).toBeInTheDocument();
    });
  });

  it('paid=false: free flow — upload step visible without auth check', async () => {
    mockFetchTryonConfig.mockResolvedValue(FREE_CONFIG);
    mockFetchTopups.mockResolvedValue([]);

    const TryOnModal = await importModal();
    render(
      <TryOnModal
        open={true}
        onClose={vi.fn()}
        onHideFeature={vi.fn()}
        productId="1"
        onBuyNow={vi.fn()}
        config={FREE_CONFIG}
        isAuthenticated={false}
      />
    );

    // No guest gate
    expect(screen.queryByTestId('tryon-guest-gate')).toBeNull();

    // Upload input is visible
    expect(document.querySelector('input[type="file"]')).not.toBeNull();
  });
});

describe('TryOnButton — paid credit hint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  });

  it('shows credit hint chip when config.paid is true', async () => {
    mockFetchTryonConfig.mockResolvedValue(PAID_CONFIG);
    const TryOnButton = await importButton();
    render(
      <TryOnButton isJewelry={false} productId="1" onOpen={vi.fn()} />
    );
    await waitFor(() => {
      expect(screen.getByTestId('tryon-credit-chip')).toBeInTheDocument();
    });
  });

  it('does NOT show credit hint chip when config.paid is false', async () => {
    mockFetchTryonConfig.mockResolvedValue(FREE_CONFIG);
    const TryOnButton = await importButton();
    render(
      <TryOnButton isJewelry={false} productId="1" onOpen={vi.fn()} />
    );
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('tryon-credit-chip')).toBeNull();
  });
});
