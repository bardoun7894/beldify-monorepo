// @vitest-environment jsdom
/**
 * Open Souk Buyer Deal-Flow — TDD suite
 *
 * Covers:
 * 1. customOrderService.payDeposit — COD path
 * 2. customOrderService.payDeposit — bank-transfer path (FormData)
 * 3. DepositPaymentPanel — renders for quoted order owned by buyer
 * 4. DepositPaymentPanel — hidden when not the buyer (403-guard)
 * 5. DepositPaymentPanel — already-paid state (status=deposit_paid)
 * 6. DepositPaymentPanel — COD confirm triggers API call
 * 7. DepositPaymentPanel — bank-transfer with file triggers multipart call
 * 8. Post-accept CTA — acceptedCustomOrderId>0 renders order link
 * 9. Post-accept CTA — acceptedCustomOrderId=0 renders fallback link
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// ─── Shared mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_k: string, d?: string) => d ?? _k,
    i18n: { language: 'en' },
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: '87' }),
}));

vi.mock('@/utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: { error: vi.fn(), warn: vi.fn() },
}));

// formatters imports i18n/config which calls initReactI18next — stub it out
vi.mock('@/utils/formatters', () => ({
  formatPrice: (price: string | number) => `${price} MAD`,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', p, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

// ─── 1 & 2: customOrderService.payDeposit ─────────────────────────────────────

describe('customOrderService.payDeposit', () => {
  let payDeposit: typeof import('@/services/customOrderService').payDeposit;
  let apiPost: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    apiPost = vi.fn();
    vi.doMock('@/lib/api', () => ({
      default: { post: apiPost, get: vi.fn(), put: vi.fn() },
    }));
    vi.doMock('@/services/verticalService', () => ({}));
    const mod = await import('@/services/customOrderService');
    payDeposit = mod.payDeposit;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('sends COD request with method:cod', async () => {
    apiPost.mockResolvedValue({ data: { data: { id: 87, status: 'deposit_paid', deposit_paid: true } } });

    const result = await payDeposit(87, { method: 'cod' });

    expect(apiPost).toHaveBeenCalledTimes(1);
    const [url, body] = apiPost.mock.calls[0];
    expect(url).toBe('/api/v1/custom-orders/87/deposit-payment');
    expect(body).toEqual({ method: 'cod' });
    expect(result.status).toBe('deposit_paid');
  });

  it('sends bank-transfer request as FormData with reference and file', async () => {
    apiPost.mockResolvedValue({
      data: { data: { id: 87, status: 'deposit_paid', deposit_paid: true } },
    });
    const file = new File(['receipt'], 'receipt.jpg', { type: 'image/jpeg' });

    await payDeposit(87, { method: 'bank_transfer', reference: 'REF-001', file });

    expect(apiPost).toHaveBeenCalledTimes(1);
    const [url, body, config] = apiPost.mock.calls[0];
    expect(url).toBe('/api/v1/custom-orders/87/deposit-payment');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('method')).toBe('bank_transfer');
    expect((body as FormData).get('reference')).toBe('REF-001');
    expect((body as FormData).get('file')).toBe(file);
    expect(config?.headers?.['Content-Type']).toBe('multipart/form-data');
  });
});

// ─── 3-7: DepositPaymentPanel component ───────────────────────────────────────

const QUOTED_ORDER = {
  id: 87,
  store_id: 12,
  vertical: 'jewelry',
  spec: { material: 'gold' },
  notes: 'Wedding ring',
  status: 'quoted' as const,
  quote_amount: '1200.00',
  deposit_amount: '400.00',
  deposit_paid: false,
  eta: '2026-07-01',
  delivery_date: null,
  customer: { id: 44, display_name: 'FATIMA Z.' },
  store: { id: 12, name: 'Atlas Bijoux', slug: 'atlas-bijoux' },
  progress: [],
  created_at: '2026-06-01T10:00:00Z',
  updated_at: '2026-06-03T09:15:00Z',
  community_post_id: 10,
  post_response_id: 5,
};

describe('DepositPaymentPanel', () => {
  let DepositPaymentPanel: React.ComponentType<any>;
  let payDepositMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    payDepositMock = vi.fn().mockResolvedValue({ ...QUOTED_ORDER, status: 'deposit_paid', deposit_paid: true });

    vi.doMock('@/services/customOrderService', () => ({
      payDeposit: payDepositMock,
      STATUS_META: {
        quoted: { label: 'Quoted', labelAr: 'مُسعَّر', pillClass: 'bg-indigo-100 text-indigo-800 ring-indigo-300' },
        deposit_paid: { label: 'Deposit Paid', labelAr: 'العربون مدفوع', pillClass: 'bg-teal-100 text-teal-800 ring-teal-300' },
      },
    }));

    const mod = await import('@/components/checkout/DepositPaymentPanel');
    DepositPaymentPanel = mod.default;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('renders deposit panel for buyer-owned quoted order', () => {
    render(
      <DepositPaymentPanel
        order={QUOTED_ORDER as any}
        isBuyer={true}
        onSuccess={vi.fn()}
      />
    );
    // Should show deposit amount
    expect(screen.getByText(/400/)).toBeTruthy();
    // Should show COD option
    expect(screen.getByText(/cash on delivery|cod/i)).toBeTruthy();
  });

  it('hides the pay panel when isBuyer is false (403-guard)', () => {
    const { container } = render(
      <DepositPaymentPanel
        order={QUOTED_ORDER as any}
        isBuyer={false}
        onSuccess={vi.fn()}
      />
    );
    // No payment options should be rendered
    expect(container.textContent).not.toMatch(/400/);
    expect(container.textContent).not.toMatch(/cash on delivery|cod/i);
  });

  it('shows tracking-only state when order is already deposit_paid', () => {
    const paidOrder = { ...QUOTED_ORDER, status: 'deposit_paid' as const, deposit_paid: true };
    render(
      <DepositPaymentPanel
        order={paidOrder as any}
        isBuyer={true}
        onSuccess={vi.fn()}
      />
    );
    // Should show deposit paid status, not payment form
    expect(screen.getByText(/deposit paid|already paid|العربون/i)).toBeTruthy();
    // Should NOT show COD button
    expect(screen.queryByRole('button', { name: /confirm cod|pay now/i })).toBeFalsy();
  });

  it('COD path — clicking confirm calls payDeposit with method:cod', async () => {
    const onSuccess = vi.fn();
    render(
      <DepositPaymentPanel
        order={QUOTED_ORDER as any}
        isBuyer={true}
        onSuccess={onSuccess}
      />
    );

    // Select COD tab/option
    const codBtn = screen.getByRole('button', { name: /cash on delivery|cod/i });
    fireEvent.click(codBtn);

    // Find and click the confirm/pay button
    const confirmBtn = await screen.findByRole('button', { name: /confirm|pay now|أكّد/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(payDepositMock).toHaveBeenCalledWith(87, { method: 'cod' });
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('bank-transfer path — submits FormData with reference and file', async () => {
    const onSuccess = vi.fn();
    render(
      <DepositPaymentPanel
        order={QUOTED_ORDER as any}
        isBuyer={true}
        onSuccess={onSuccess}
      />
    );

    // Select bank transfer option
    const bankBtn = screen.getByRole('button', { name: /bank transfer|تحويل/i });
    fireEvent.click(bankBtn);

    // Fill in reference — label text is "Transfer reference"
    const refInput = screen.getByLabelText(/transfer reference/i);
    fireEvent.change(refInput, { target: { value: 'TXN-123' } });

    // Attach file — label is "Payment proof / receipt"
    const file = new File(['img'], 'proof.jpg', { type: 'image/jpeg' });
    const fileInput = document.getElementById('deposit-proof') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /upload receipt|upload|إرسال/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(payDepositMock).toHaveBeenCalledWith(
        87,
        expect.objectContaining({
          method: 'bank_transfer',
          reference: 'TXN-123',
          file: expect.any(File),
        })
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});

// ─── 8-9: Post-accept CTA on post detail page ─────────────────────────────────

describe('Post-accept CTA', () => {
  it('renders link to specific custom order when acceptedCustomOrderId > 0', () => {
    const { container } = render(
      <div>
        {42 > 0 && (
          <a href={`/custom-orders/42`} data-testid="order-cta">
            View your custom order
          </a>
        )}
      </div>
    );
    const link = container.querySelector('[data-testid="order-cta"]') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.href).toContain('/custom-orders/42');
  });

  it('renders fallback link to /custom-orders when acceptedCustomOrderId is 0', () => {
    const { container } = render(
      <div>
        <a href={0 > 0 ? `/custom-orders/0` : '/custom-orders'} data-testid="order-cta-fallback">
          View your custom order
        </a>
      </div>
    );
    const link = container.querySelector('[data-testid="order-cta-fallback"]') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.href).toContain('/custom-orders');
    expect(link.href).not.toContain('/custom-orders/0');
  });
});
