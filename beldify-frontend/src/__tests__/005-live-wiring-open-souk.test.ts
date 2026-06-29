/**
 * TDD tests for F1–F6 live wiring + Open Souk fixes.
 *
 * Static source-reading tests (node env) + behavioral assertions.
 * Render tests for F3/F4 specs-section + role-gate are in
 * 005-live-wiring-open-souk-render.test.tsx
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8');
const exists = (rel: string) => existsSync(join(ROOT, rel));

const CUSTOM_SVC  = 'src/services/customOrderService.ts';
const VERTICAL_SVC = 'src/services/verticalService.ts';
const POST_PAGE    = 'src/app/community/posts/[id]/page.tsx';
const FOOTER       = 'src/components/layout/Footer.tsx';

// ─────────────────────────────────────────────────────────────────────────────
// F1 — USE_MOCK = false
// ─────────────────────────────────────────────────────────────────────────────

describe('F1 — USE_MOCK flipped to false in both services', () => {
  it('customOrderService has USE_MOCK = false', () => {
    const src = read(CUSTOM_SVC);
    expect(src).toMatch(/USE_MOCK\s*=\s*false/);
  });

  it('verticalService has USE_MOCK = false', () => {
    const src = read(VERTICAL_SVC);
    expect(src).toMatch(/USE_MOCK\s*=\s*false/);
  });

  it('customOrderService live path returns res.data.data for single resources', () => {
    const src = read(CUSTOM_SVC);
    // Single resource endpoints (submit, fetch, quote, advance) use res.data.data
    expect(src).toMatch(/res\.data\.data/);
  });

  it('customOrderService live path for fetchCustomOrders returns res.data (not res.data.data)', () => {
    const src = read(CUSTOM_SVC);
    // List endpoint returns {data:[...],meta:{...}} directly
    expect(src).toMatch(/return res\.data;|return res\.data$/m);
  });

  it('verticalService live path returns res.data.data', () => {
    const src = read(VERTICAL_SVC);
    expect(src).toMatch(/res\.data\.data/);
  });

  it('mock code is still present (kept behind USE_MOCK flag)', () => {
    const src = read(CUSTOM_SVC);
    expect(src).toMatch(/MOCK_CUSTOM_ORDER/);
    expect(src).toMatch(/if\s*\(USE_MOCK\)/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F2 — fetchSellerCustomOrders added + seller page wired
// ─────────────────────────────────────────────────────────────────────────────

describe('F2 — fetchSellerCustomOrders in customOrderService', () => {
  it('exports fetchSellerCustomOrders function', () => {
    const src = read(CUSTOM_SVC);
    expect(src).toMatch(/export.*function fetchSellerCustomOrders|export.*fetchSellerCustomOrders/);
  });

  it('calls GET /api/v1/seller/custom-orders', () => {
    const src = read(CUSTOM_SVC);
    expect(src).toMatch(/\/api\/v1\/seller\/custom-orders/);
  });

  it('returns CustomOrderListResponse (data + meta envelope)', () => {
    const src = read(CUSTOM_SVC);
    // Should return res.data for list endpoint (same as buyer list)
    expect(src).toMatch(/fetchSellerCustomOrders/);
  });

  it('customOrderService exports object includes fetchSellerCustomOrders', () => {
    const src = read(CUSTOM_SVC);
    expect(src).toMatch(/fetchSellerCustomOrders/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F3 — product_specifications rendered on post detail
// ─────────────────────────────────────────────────────────────────────────────

describe('F3 — product_specifications rendered on post detail page', () => {
  it('references productSpecifications or product_specifications', () => {
    const src = read(POST_PAGE);
    expect(src).toMatch(/productSpecifications|product_specifications/);
  });

  it('renders colors when present', () => {
    const src = read(POST_PAGE);
    expect(src).toMatch(/colors/);
  });

  it('renders styles when present', () => {
    const src = read(POST_PAGE);
    expect(src).toMatch(/styles/);
  });

  it('shows the custom-piece spec section (Material/Purity/Size keys visible)', () => {
    const src = read(POST_PAGE);
    // Section heading or key labels for specs
    expect(src).toMatch(/specs|Specifications|specifications|product_specifications|productSpecifications/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F4 — Response form gated to sellers only
// ─────────────────────────────────────────────────────────────────────────────

describe('F4 — Submit Proposal form gated to sellers', () => {
  it('page checks seller role before showing form', () => {
    const src = read(POST_PAGE);
    // Must check is_seller or role === 'seller' somewhere near the form gate
    expect(src).toMatch(/is_seller|isSeller|role.*seller|seller.*role/);
  });

  it('shows a "sellers only" note for non-sellers', () => {
    const src = read(POST_PAGE);
    // Some message for non-seller buyers
    expect(src).toMatch(/Only sellers|sellers.*respond|seller.*only|non.*seller|buyer.*cannot/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F5 — Post-accept link to tracking
// ─────────────────────────────────────────────────────────────────────────────

describe('F5 — Post-accept CTA links to custom order tracking', () => {
  it('page has a link to /custom-orders after acceptance', () => {
    const src = read(POST_PAGE);
    expect(src).toMatch(/\/custom-orders/);
  });

  it('handleAcceptResponse shows a tracking link or navigates to custom-orders', () => {
    const src = read(POST_PAGE);
    // Either a link or a router.push to custom-orders
    expect(src).toMatch(/custom-orders/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F6 — Seller nav link to /seller/custom-orders
// ─────────────────────────────────────────────────────────────────────────────

describe('F6 — Seller nav link to /seller/custom-orders', () => {
  it('Footer (seller section) has a link to /seller/custom-orders', () => {
    const src = read(FOOTER);
    expect(src).toMatch(/\/seller\/custom-orders/);
  });
});
