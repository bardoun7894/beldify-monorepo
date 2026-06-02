// @vitest-environment jsdom
/**
 * T030–T036 behavioral (render) tests
 *
 * Proves the load-bearing behaviors listed in the WS-B task packet:
 * - QuoteForm renders only for status=requested (D4-RESOLVED)
 * - CustomOrderTimeline offers only ALLOWED_NEXT_STATUSES (not 'quoted' via advance)
 * - JewelryFields hides blank optional fields gracefully
 * - MadeToOrderTimeline shows quote_amount + eta when available
 * - CustomOrderForm: material is aria-required=true; purity/others are not
 *
 * These tests import the real service modules to test against real constants.
 * Only network calls (api.get/post) are mocked — not the data structures.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';

// Explicit cleanup after each test to ensure DOM isolation
afterEach(() => { cleanup(); });

// ─── Module-level mocks — MUST come before component imports ─────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams('vertical=jewelry&store_id=12'),
  usePathname: () => '/custom-orders/new',
  useParams: () => ({ id: '87' }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/utils/formatters', () => ({
  formatPrice: (n: number) => `MAD ${n.toFixed(2)}`,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' '),
}));

// Mock ONLY the network call layer, not the data structures
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: { data: { id: 87, status: 'requested' } } }),
  },
}));

// ─── Import components AFTER mocks ────────────────────────────────────────────
import QuoteForm from '../components/seller/QuoteForm';
import CustomOrderTimeline from '../components/seller/CustomOrderTimeline';
import JewelryFields from '../components/products/JewelryFields';
import MadeToOrderTimeline from '../components/checkout/MadeToOrderTimeline';
import CustomOrderForm from '../components/checkout/CustomOrderForm';

// Import real service constants (no network calls — just the data structures)
import { ALLOWED_NEXT_STATUSES, STATUS_META } from '../services/customOrderService';
import { fetchVerticalConfig } from '../services/verticalService';

import type { CustomOrder } from '../services/customOrderService';

// ─── Test data helpers ────────────────────────────────────────────────────────

function makeOrder(overrides: Partial<CustomOrder> = {}): CustomOrder {
  return {
    id: 87,
    store_id: 12,
    vertical: 'jewelry',
    spec: { material: 'gold', purity: '18k' },
    notes: null,
    status: 'requested',
    quote_amount: null,
    deposit_amount: null,
    deposit_paid: false,
    eta: null,
    delivery_date: null,
    customer: { id: 44, display_name: 'FATIMA Z.' },
    store: { id: 12, name: 'Atlas Bijoux', slug: 'atlas-bijoux' },
    progress: [
      { id: 1, status: 'requested', note: null, created_by: 44, created_at: '2026-06-02T10:00:00Z' },
    ],
    created_at: '2026-06-02T10:00:00Z',
    updated_at: '2026-06-02T10:00:00Z',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// QuoteForm — renders only for requested status (D4-RESOLVED)
// ─────────────────────────────────────────────────────────────────────────────

describe('QuoteForm — renders only for requested status', () => {
  it('renders the three inputs when status is requested', () => {
    const order = makeOrder({ status: 'requested' });
    const { container } = render(
      <QuoteForm order={order} onQuoted={vi.fn()} />
    );
    expect(container.querySelector('#quote_amount')).toBeTruthy();
    expect(container.querySelector('#deposit_amount')).toBeTruthy();
    expect(container.querySelector('#eta')).toBeTruthy();
  });

  it('renders NOTHING when status is quoted', () => {
    const order = makeOrder({
      status: 'quoted',
      quote_amount: '1200.00',
      deposit_amount: '400.00',
      eta: '2026-06-30',
    });
    const { container } = render(
      <QuoteForm order={order} onQuoted={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders NOTHING when status is in_progress', () => {
    const order = makeOrder({ status: 'in_progress' });
    const { container } = render(
      <QuoteForm order={order} onQuoted={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders NOTHING when status is deposit_paid', () => {
    const order = makeOrder({ status: 'deposit_paid' });
    const { container } = render(
      <QuoteForm order={order} onQuoted={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALLOWED_NEXT_STATUSES constants — verify the D4 contract
// (These test the exported constants directly — not via component render)
// ─────────────────────────────────────────────────────────────────────────────

describe('ALLOWED_NEXT_STATUSES — D4-RESOLVED transition table', () => {
  it('requested can only transition to cancelled via advance (quote is exclusive to /quote endpoint)', () => {
    expect(ALLOWED_NEXT_STATUSES.requested).toEqual(['cancelled']);
    expect(ALLOWED_NEXT_STATUSES.requested).not.toContain('quoted');
  });

  it('quoted can transition to deposit_paid or cancelled', () => {
    expect(ALLOWED_NEXT_STATUSES.quoted).toContain('deposit_paid');
    expect(ALLOWED_NEXT_STATUSES.quoted).toContain('cancelled');
    expect(ALLOWED_NEXT_STATUSES.quoted).not.toContain('quoted');
  });

  it('delivered can only transition to closed', () => {
    expect(ALLOWED_NEXT_STATUSES.delivered).toEqual(['closed']);
  });

  it('closed has no allowed transitions (terminal state)', () => {
    expect(ALLOWED_NEXT_STATUSES.closed).toEqual([]);
  });

  it('cancelled has no allowed transitions (terminal state)', () => {
    expect(ALLOWED_NEXT_STATUSES.cancelled).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CustomOrderTimeline — renders correct next-status options
// ─────────────────────────────────────────────────────────────────────────────

describe('CustomOrderTimeline — renders allowed next statuses per transition table', () => {
  it('quoted order: select has deposit_paid and cancelled options', () => {
    const order = makeOrder({
      status: 'quoted',
      quote_amount: '1200.00',
      deposit_amount: '400.00',
      eta: '2026-06-30',
      progress: [
        { id: 1, status: 'requested', note: null, created_by: 44, created_at: '2026-06-02T10:00:00Z' },
        { id: 2, status: 'quoted', note: null, created_by: 99, created_at: '2026-06-03T09:00:00Z' },
      ],
    });
    const { container } = render(<CustomOrderTimeline order={order} onAdvanced={vi.fn()} />);

    const select = within(container).getByLabelText(/Next Status/i) as HTMLSelectElement;
    const optionValues = Array.from(select.options).map(o => o.value).filter(v => v);

    // ALLOWED_NEXT_STATUSES.quoted = ['deposit_paid', 'cancelled']
    expect(optionValues).toContain('deposit_paid');
    expect(optionValues).toContain('cancelled');
    // Should NOT contain statuses not in the table
    expect(optionValues).not.toContain('quoted');
    expect(optionValues).not.toContain('in_progress');
    expect(optionValues).not.toContain('requested');
    // Exactly 2 options (excluding the blank default)
    expect(optionValues).toHaveLength(2);
  });

  it('requested order: only cancelled is offered via advance', () => {
    const order = makeOrder({ status: 'requested' });
    const { container } = render(<CustomOrderTimeline order={order} onAdvanced={vi.fn()} />);

    const select = within(container).getByLabelText(/Next Status/i) as HTMLSelectElement;
    const optionValues = Array.from(select.options).map(o => o.value).filter(v => v);

    // ALLOWED_NEXT_STATUSES.requested = ['cancelled']
    expect(optionValues).toEqual(['cancelled']);
    expect(optionValues).not.toContain('quoted'); // D4-RESOLVED
    expect(optionValues).not.toContain('deposit_paid');
  });

  it('delivered order: only closed is offered', () => {
    const order = makeOrder({
      status: 'delivered',
      progress: [
        { id: 1, status: 'requested', note: null, created_by: 44, created_at: '2026-06-02T10:00:00Z' },
        { id: 2, status: 'delivered', note: null, created_by: 99, created_at: '2026-06-10T09:00:00Z' },
      ],
    });
    const { container } = render(<CustomOrderTimeline order={order} onAdvanced={vi.fn()} />);

    const select = within(container).getByLabelText(/Next Status/i) as HTMLSelectElement;
    const optionValues = Array.from(select.options).map(o => o.value).filter(v => v);

    expect(optionValues).toEqual(['closed']);
  });

  it('closed order: no advance form rendered (terminal state message shown)', () => {
    const order = makeOrder({
      status: 'closed',
      progress: [
        { id: 1, status: 'requested', note: null, created_by: 44, created_at: '2026-06-02T10:00:00Z' },
        { id: 2, status: 'closed', note: null, created_by: 99, created_at: '2026-06-15T09:00:00Z' },
      ],
    });
    const { container } = render(<CustomOrderTimeline order={order} onAdvanced={vi.fn()} />);

    expect(within(container).queryByLabelText(/Next Status/i)).toBeNull();
    expect(within(container).getByText(/terminal state/i)).toBeTruthy();
  });

  it('progress note is visible in the timeline', () => {
    const order = makeOrder({
      status: 'quoted',
      quote_amount: '1200.00',
      deposit_amount: '400.00',
      progress: [
        { id: 1, status: 'requested', note: null, created_by: 44, created_at: '2026-06-02T10:00:00Z' },
        { id: 2, status: 'quoted', note: 'Price quoted for 18k gold ring', created_by: 99, created_at: '2026-06-03T09:00:00Z' },
      ],
    });
    const { container } = render(<CustomOrderTimeline order={order} onAdvanced={vi.fn()} />);

    expect(within(container).getByText('Price quoted for 18k gold ring')).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// JewelryFields — optional fields hidden when null/empty
// ─────────────────────────────────────────────────────────────────────────────

describe('JewelryFields — hides blank optional fields gracefully', () => {
  it('renders material and hides null purity/size/weight', () => {
    const { container } = render(
      <JewelryFields spec={{ material: 'gold', purity: null, size: null, weight_grams: null }} />
    );
    expect(container.textContent).toContain('gold');
    expect(container.textContent).not.toContain('Purity');
    expect(container.textContent).not.toContain('Size');
    expect(container.textContent).not.toContain('Weight');
  });

  it('does not render gemstone when value is "none"', () => {
    const { container } = render(
      <JewelryFields spec={{ material: 'silver', gemstone_type: 'none' }} />
    );
    expect(container.textContent).not.toContain('Gemstone');
  });

  it('renders gemstone label and value when non-none emerald', () => {
    const { container } = render(
      <JewelryFields spec={{ material: 'gold', gemstone_type: 'emerald', gemstone_count: 2 }} />
    );
    expect(container.textContent).toContain('emerald');
    expect(container.textContent).toContain('Gemstone');
  });

  it('returns null for entirely empty/null spec', () => {
    const { container } = render(
      <JewelryFields spec={{ material: null, purity: null }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders engraving text and label when present', () => {
    const { container } = render(
      <JewelryFields spec={{ material: 'gold', engraving: 'لنا' }} />
    );
    expect(container.textContent).toContain('لنا');
    expect(container.textContent).toContain('Engraving');
  });

  it('hides finish field when empty string', () => {
    const { container } = render(
      <JewelryFields spec={{ material: 'silver', finish: '' }} />
    );
    expect(container.textContent).not.toContain('Finish');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MadeToOrderTimeline — quote_amount + eta display
// ─────────────────────────────────────────────────────────────────────────────

describe('MadeToOrderTimeline — quote and ETA display', () => {
  it('renders formatted MAD quote_amount when available', () => {
    const order = makeOrder({
      status: 'quoted',
      quote_amount: '1200.00',
      deposit_amount: '400.00',
      eta: '2026-06-30',
      progress: [
        { id: 1, status: 'requested', note: null, created_by: 44, created_at: '2026-06-02T10:00:00Z' },
        { id: 2, status: 'quoted', note: 'Includes gold + emerald', created_by: 99, created_at: '2026-06-03T09:00:00Z' },
      ],
    });
    const { container } = render(<MadeToOrderTimeline order={order} />);

    // formatPrice mock: `MAD ${n.toFixed(2)}`
    expect(container.textContent).toContain('MAD 1200.00');
  });

  it('renders "ETA" label when eta is present', () => {
    const order = makeOrder({
      status: 'quoted',
      quote_amount: '1200.00',
      deposit_amount: '400.00',
      eta: '2026-06-30',
      progress: [
        { id: 1, status: 'requested', note: null, created_by: 44, created_at: '2026-06-02T10:00:00Z' },
        { id: 2, status: 'quoted', note: null, created_by: 99, created_at: '2026-06-03T09:00:00Z' },
      ],
    });
    const { container } = render(<MadeToOrderTimeline order={order} />);

    expect(container.textContent).toContain('ETA');
  });

  it('does not render Quote Details section when quote_amount and eta are null', () => {
    const order = makeOrder({ status: 'requested', quote_amount: null, eta: null });
    const { container } = render(<MadeToOrderTimeline order={order} />);

    expect(container.textContent).not.toContain('Quote Details');
    expect(container.textContent).not.toContain('Quote Amount');
  });

  it('renders cancelled state: shows Cancelled status pill', () => {
    const order = makeOrder({ status: 'cancelled', progress: [] });
    const { container } = render(<MadeToOrderTimeline order={order} />);

    expect(container.textContent).toMatch(/Cancelled/i);
  });

  it('renders activity log with progress notes', () => {
    const order = makeOrder({
      status: 'quoted',
      quote_amount: '1200.00',
      deposit_amount: '400.00',
      progress: [
        { id: 1, status: 'requested', note: null, created_by: 44, created_at: '2026-06-02T10:00:00Z' },
        { id: 2, status: 'quoted', note: 'Price includes 18k gold ring setting', created_by: 99, created_at: '2026-06-03T09:00:00Z' },
      ],
    });
    const { container } = render(<MadeToOrderTimeline order={order} />);

    expect(container.textContent).toContain('Price includes 18k gold ring setting');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CustomOrderForm — material is the only required field for jewelry
// (mocks verticalService.fetchVerticalConfig to avoid USE_MOCK branch)
// ─────────────────────────────────────────────────────────────────────────────

// The real verticalService USE_MOCK=true will return the jewelry config synchronously
// after setTimeout(r, 0), so we can use findBy* with waitFor.

describe('CustomOrderForm — jewelry fields from verticalService', () => {
  it('material input has aria-required=true after fields load', async () => {
    const { container } = render(
      <CustomOrderForm storeId={12} storeName="Atlas Bijoux" vertical="jewelry" />
    );

    // Wait for useEffect + fetchVerticalConfig (setTimeout(0) in USE_MOCK) to resolve
    await waitFor(() => {
      const selects = container.querySelectorAll('select, input[type="number"], input[type="text"]');
      expect(selects.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // The material select should have aria-required="true"
    const requiredInput = container.querySelector('[aria-required="true"]');
    expect(requiredInput).toBeTruthy();
    // Verify it's the material field by checking its id
    expect(requiredInput?.getAttribute('id')).toBe('cf-material');
  });

  it('only material is aria-required — all others are not', async () => {
    const { container } = render(
      <CustomOrderForm storeId={12} storeName="Atlas Bijoux" vertical="jewelry" />
    );

    await waitFor(() => {
      const selects = container.querySelectorAll('select, input[type="number"], input[type="text"]');
      expect(selects.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Exactly one field should be aria-required=true
    const requiredInputs = container.querySelectorAll('[aria-required="true"]');
    expect(requiredInputs.length).toBe(1);
    expect(requiredInputs[0].getAttribute('id')).toBe('cf-material');
  });

  it('submitting without material shows a required error for material', async () => {
    const { container } = render(
      <CustomOrderForm storeId={12} storeName="Atlas Bijoux" vertical="jewelry" />
    );

    // Wait for fields to load
    await waitFor(() => {
      const selects = container.querySelectorAll('select, input[type="number"], input[type="text"]');
      expect(selects.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Click submit without filling required field
    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn).toBeTruthy();
    fireEvent.click(submitBtn);

    // Error for material should appear
    await waitFor(() => {
      const alerts = container.querySelectorAll('[role="alert"]');
      expect(alerts.length).toBeGreaterThan(0);
      const hasMatError = Array.from(alerts).some(a => /material/i.test(a.textContent ?? ''));
      expect(hasMatError).toBe(true);
    }, { timeout: 3000 });
  });
});
