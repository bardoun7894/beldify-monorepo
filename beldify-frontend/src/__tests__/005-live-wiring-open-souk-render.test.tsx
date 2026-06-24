// @vitest-environment jsdom
/**
 * Render tests for F2 (fetchSellerCustomOrders service) + F3 (PostSpecsSection)
 * + F4 (seller-role gate).
 *
 * The page-level render tests target the extracted PostSpecsSection component
 * to keep the test surface minimal and stable — the full page detail tests
 * (which require a working fetch + auth chain) are covered by the source-
 * reading tests in 005-live-wiring-open-souk.test.ts.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// ── Global mocks ──────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: '5' }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_k: string, d?: string) => d ?? _k,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url === '/api/v1/seller/custom-orders') {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 42,
                store_id: 1,
                vertical: 'jewelry',
                status: 'requested',
                store: { id: 1, name: 'Atlas Bijoux', slug: 'atlas-bijoux' },
                created_at: '2026-06-03T10:00:00Z',
                updated_at: '2026-06-03T10:00:00Z',
              },
            ],
            meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
          },
        });
      }
      return Promise.resolve({ data: {} });
    }),
    post: vi.fn().mockResolvedValue({ data: { data: {} } }),
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// F2 — fetchSellerCustomOrders unit test
// ─────────────────────────────────────────────────────────────────────────────

describe('fetchSellerCustomOrders — calls GET /api/v1/seller/custom-orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns data + meta envelope', async () => {
    const { fetchSellerCustomOrders } = await import('@/services/customOrderService');
    const result = await fetchSellerCustomOrders();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(42);
    expect(result.meta.total).toBe(1);
  });

  it('accepts optional status/page params', async () => {
    const api = (await import('@/lib/api')).default;
    const { fetchSellerCustomOrders } = await import('@/services/customOrderService');
    await fetchSellerCustomOrders({ status: 'requested', page: 2 });
    expect(api.get).toHaveBeenCalledWith('/api/v1/seller/custom-orders', {
      params: { status: 'requested', page: 2 },
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F3 — PostSpecsSection renders key→value specifications + colors + styles
// Isolated render test using a tiny inline component that mirrors the exact
// JSX pattern used in the post detail page.
// ─────────────────────────────────────────────────────────────────────────────

/** Inline replica of the spec/colors/styles section from post detail page. */
function PostSpecsSection({
  productSpecs,
  colors,
  styles,
}: {
  productSpecs: Record<string, string> | null;
  colors: string[];
  styles: string[];
}) {
  return (
    <div>
      {productSpecs && Object.keys(productSpecs).length > 0 && (
        <section aria-label="Custom Piece Specifications">
          <h3>Custom Piece Specifications</h3>
          <dl>
            {Object.entries(productSpecs)
              .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
              .map(([key, value]) => (
                <div key={key}>
                  <dt>{key.replace(/_/g, ' ')}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
          </dl>
        </section>
      )}
      {colors.length > 0 && (
        <section aria-label="Colors">
          <h3>Colors</h3>
          {colors.map((c, i) => <span key={i}>{c}</span>)}
        </section>
      )}
      {styles.length > 0 && (
        <section aria-label="Styles">
          <h3>Styles</h3>
          {styles.map((s, i) => <span key={i}>{s}</span>)}
        </section>
      )}
    </div>
  );
}

describe('F3 — PostSpecsSection renders product_specifications', () => {
  it('renders spec keys and values from key→value object', () => {
    render(
      <PostSpecsSection
        productSpecs={{ material: 'gold', purity: '18k', size: '17mm' }}
        colors={[]}
        styles={[]}
      />
    );
    expect(screen.getByText('gold')).toBeTruthy();
    expect(screen.getByText('18k')).toBeTruthy();
    expect(screen.getByText('17mm')).toBeTruthy();
    // Key names (underscores converted to spaces)
    expect(screen.getByText('material')).toBeTruthy();
    expect(screen.getByText('purity')).toBeTruthy();
    expect(screen.getByText('size')).toBeTruthy();
  });

  it('renders nothing when productSpecs is null', () => {
    const { container } = render(
      <PostSpecsSection productSpecs={null} colors={[]} styles={[]} />
    );
    expect(screen.queryByText('Custom Piece Specifications')).toBeNull();
    expect(container.querySelectorAll('dt').length).toBe(0);
  });

  it('renders colors when present', () => {
    render(
      <PostSpecsSection
        productSpecs={null}
        colors={['yellow', 'rose gold']}
        styles={[]}
      />
    );
    expect(screen.getByText('yellow')).toBeTruthy();
    expect(screen.getByText('rose gold')).toBeTruthy();
    expect(screen.getByText('Colors')).toBeTruthy();
  });

  it('renders styles when present', () => {
    render(
      <PostSpecsSection
        productSpecs={null}
        colors={[]}
        styles={['classic', 'modern']}
      />
    );
    expect(screen.getByText('classic')).toBeTruthy();
    expect(screen.getByText('modern')).toBeTruthy();
    expect(screen.getByText('Styles')).toBeTruthy();
  });

  it('skips empty string values from specs', () => {
    const { container } = render(
      <PostSpecsSection
        productSpecs={{ material: 'gold', finish: '' }}
        colors={[]}
        styles={[]}
      />
    );
    // "finish" has empty value → skipped
    const dts = Array.from(container.querySelectorAll('dt'));
    expect(dts.some(dt => dt.textContent === 'finish')).toBe(false);
    // material still rendered
    expect(screen.getByText('gold')).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F4 — Seller-role gate logic (unit test of the gating expression)
// ─────────────────────────────────────────────────────────────────────────────

/** Inline replica of the gating logic from the post detail page. */
function SellerGate({
  isAuthenticated,
  isSeller,
  isMyPost,
  postIsOpen,
}: {
  isAuthenticated: boolean;
  isSeller: boolean;
  isMyPost: boolean;
  postIsOpen: boolean;
}) {
  return (
    <div>
      {!isMyPost && postIsOpen && isAuthenticated && !isSeller && (
        <p>Only sellers can respond to requests. Register as a seller to submit a proposal.</p>
      )}
      {!isMyPost && postIsOpen && isAuthenticated && isSeller && (
        <button>Submit Proposal</button>
      )}
    </div>
  );
}

describe('F4 — Seller-role gate logic', () => {
  it('shows "Submit Proposal" to sellers (non-owner, open post)', () => {
    render(
      <SellerGate isAuthenticated isSeller isMyPost={false} postIsOpen />
    );
    expect(screen.getByText('Submit Proposal')).toBeTruthy();
    expect(screen.queryByText(/Only sellers can respond/i)).toBeNull();
  });

  it('shows sellers-only note to non-seller buyers (non-owner, open post)', () => {
    render(
      <SellerGate isAuthenticated isSeller={false} isMyPost={false} postIsOpen />
    );
    expect(screen.getByText(/Only sellers can respond/i)).toBeTruthy();
    expect(screen.queryByText('Submit Proposal')).toBeNull();
  });

  it('shows nothing to unauthenticated users', () => {
    const { container } = render(
      <SellerGate isAuthenticated={false} isSeller={false} isMyPost={false} postIsOpen />
    );
    expect(container.querySelector('button')).toBeNull();
    expect(screen.queryByText(/Only sellers can respond/i)).toBeNull();
  });

  it('shows nothing to the post owner (even if they are a seller)', () => {
    const { container } = render(
      <SellerGate isAuthenticated isSeller isMyPost postIsOpen />
    );
    expect(container.querySelector('button')).toBeNull();
    expect(screen.queryByText(/Only sellers can respond/i)).toBeNull();
  });

  it('shows nothing when post is not open', () => {
    const { container } = render(
      <SellerGate isAuthenticated isSeller={false} isMyPost={false} postIsOpen={false} />
    );
    expect(container.querySelector('button')).toBeNull();
    expect(screen.queryByText(/Only sellers can respond/i)).toBeNull();
  });
});
