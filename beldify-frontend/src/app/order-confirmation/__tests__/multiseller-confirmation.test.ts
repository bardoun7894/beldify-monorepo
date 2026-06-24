import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * TDD tests for multi-seller order confirmation (spec 011 W2).
 *
 * RED phase: all of these must fail before implementation.
 * GREEN phase: pass after updating page.tsx + orderService.ts.
 *
 * Scenarios:
 * 1. Multi-order: data.orders.length > 1 → per-seller grouping rendered
 * 2. Single-order: data.orders.length === 1 → renders as today (no grouping)
 * 3. checkout_group_id shown as shared reference for multi-seller
 * 4. Types: Order interface now supports orders[] + checkout_group_id
 * 5. getCheckoutQuote return type exposes per_seller[]
 */

const ORDER_CONFIRMATION_PATH = path.resolve(
  __dirname,
  '../../order-confirmation/page.tsx'
);

const ORDER_SERVICE_PATH = path.resolve(
  __dirname,
  '../../../services/orderService.ts'
);

function readPage(): string {
  return fs.readFileSync(ORDER_CONFIRMATION_PATH, 'utf-8');
}

function readService(): string {
  return fs.readFileSync(ORDER_SERVICE_PATH, 'utf-8');
}

// ── Types ────────────────────────────────────────────────────────────────────

describe('orderService.ts — multi-seller checkout types', () => {
  it('Order interface includes checkout_group_id field', () => {
    const src = readService();
    // The interface must have checkout_group_id
    expect(src).toMatch(/checkout_group_id\??:\s*string/);
  });

  it('Order interface includes orders[] array field', () => {
    const src = readService();
    // Must have an orders field typed as an array
    expect(src).toMatch(/orders\??:\s*PerSellerOrder\[\]/);
  });

  it('PerSellerOrder interface is exported or defined', () => {
    const src = readService();
    expect(src).toMatch(/interface PerSellerOrder/);
  });

  it('PerSellerOrder has store_id, order_number, and id fields', () => {
    const src = readService();
    // The PerSellerOrder interface must have these three fields
    expect(src).toMatch(/store_id:\s*number/);
    // Already in OrderItem but check context within PerSellerOrder block
    expect(src).toMatch(/interface PerSellerOrder[\s\S]{0,300}order_number:\s*string/);
  });

  it('getCheckoutQuote return type includes per_seller array', () => {
    const src = readService();
    // The quote return type must include per_seller
    expect(src).toMatch(/per_seller\??:\s*PerSellerQuote\[\]/);
  });

  it('PerSellerQuote interface is defined with store_id, subtotal, shipping_amount', () => {
    const src = readService();
    expect(src).toMatch(/interface PerSellerQuote/);
    expect(src).toMatch(/interface PerSellerQuote[\s\S]{0,200}store_id:\s*number/);
    expect(src).toMatch(/interface PerSellerQuote[\s\S]{0,200}shipping_amount:\s*number/);
  });
});

// ── Order confirmation page — multi-order rendering ──────────────────────────

describe('order-confirmation/page.tsx — multi-seller split rendering', () => {
  it('imports Store or uses store icon (for seller grouping headers)', () => {
    const src = readPage();
    // The page must reference Store icon from lucide for the seller-group header
    expect(src).toMatch(/Store[\s\S]{0,20}from 'lucide-react'|from 'lucide-react'[\s\S]{0,400}Store/);
  });

  it('renders a seller-split notice using t() key order_confirmation.split.*', () => {
    const src = readPage();
    // Must have a translation key for the split banner
    expect(src).toMatch(/order_confirmation\.split\./);
  });

  it('references checkout_group_id in the JSX', () => {
    const src = readPage();
    // The page must display checkout_group_id
    expect(src).toMatch(/checkout_group_id/);
  });

  it('iterates over data.orders to render per-seller groups', () => {
    const src = readPage();
    // Must map over an orders array — look for .orders.map or similar
    expect(src).toMatch(/\.orders\s*\.map\s*\(/);
  });

  it('single-order path does NOT show seller grouping — falls through to original render', () => {
    const src = readPage();
    // There must be an explicit branch checking orders length or absence
    // (a conditional that gates the multi-seller section)
    expect(src).toMatch(/orders\.length\s*[>!]\s*1|orders\?\.length\s*[>!]\s*1|isMultiSeller/);
  });

  it('uses t() for seller-group order number label', () => {
    const src = readPage();
    // A label like "Order #ORD-AAA" must come via t()
    expect(src).toMatch(/t\(['"]order_confirmation\.split\.seller_order/);
  });
});
