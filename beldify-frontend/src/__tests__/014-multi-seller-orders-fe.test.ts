/**
 * Feature 014 — Multi-Seller Order Splitting: Frontend Tests (TDD)
 *
 * Tests verify FR-011, FR-017, FR-018 (User Story 2 & 3 frontend half):
 *
 *  T1: Cart page — groups items by seller when multi-store cart
 *  T2: Cart page — renders per-seller subtotal + shipping sub-header
 *  T3: Checkout page — `sellers[]` contract type defined in orderService
 *  T4: Checkout page — `group_number` is read from checkout response
 *  T5: Checkout page — per-seller shipment breakdown section present (multi-seller quote)
 *  T6: Order confirmation — stores group reference in sessionStorage stash
 *  T7: Order confirmation — renders per-seller sub-order cards when `orders[]` present
 *  T8: Buyer order history — group card renders sub-order rows per-seller
 *  T9: orderService — quote return type includes `sellers[]` field
 *  T10: orderService — createCheckoutOrder reads back `group_number` from response
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');

const cartPage          = readFileSync(join(ROOT, 'src/app/cart/page.tsx'), 'utf-8');
const checkoutPage      = readFileSync(join(ROOT, 'src/app/checkout/page.tsx'), 'utf-8');
const confirmationPage  = readFileSync(join(ROOT, 'src/app/order-confirmation/page.tsx'), 'utf-8');
const ordersPage        = readFileSync(join(ROOT, 'src/app/orders/page.tsx'), 'utf-8');
const orderService      = readFileSync(join(ROOT, 'src/services/orderService.ts'), 'utf-8');

// ── T1-T2: Cart — grouping by seller ────────────────────────────────────────

describe('T1 — Cart page groups line items by seller (multi-store cart)', () => {
  it('groups items by store id — references store?.id in item grouping logic', () => {
    // The cart already groups by store when isMultiStore. Test ensures the
    // group-header path exists and is not bypassed.
    expect(cartPage).toMatch(/store\??\.id.*storeId|storeId.*store\??\.id/);
  });

  it('renders a per-seller divider/header in the multi-store branch', () => {
    // Must show some form of "seller group header" in the multi-store path
    expect(cartPage).toMatch(/storeName|store_name|storeHeader|seller.*header|group.*header/i);
  });
});

describe('T2 — Cart page shows per-seller subtotal + shipping in multi-store header', () => {
  it('shows per-seller subtotal derived from the quote sellers[] or computed locally', () => {
    // The cart page must show a per-seller subtotal or reference sellers[] data
    // when multi-store. It can come from quote.sellers or computed from item prices.
    // We verify the seller group section shows a financial breakdown.
    expect(cartPage).toMatch(
      /sellerSubtotal|seller_subtotal|seller.*subtotal|groupSubtotal|per.*seller.*amount|sellers\[/i
    );
  });

  it('shows per-seller shipping in the cart seller group header', () => {
    // Each seller group must display shipping info (can be "shipping calculated at checkout"
    // or an actual amount from the quote sellers[] breakdown)
    expect(cartPage).toMatch(
      /sellerShipping|seller.*shipping|shipping_amount.*seller|sellers.*shipping/i
    );
  });
});

// ── T3-T5: Checkout — sellers[] contract + group_number ──────────────────────

describe('T3 — orderService defines sellers[] in the quote response type', () => {
  it('exports a PerSellerQuote or SellerBreakdown type with store_id + subtotal + shipping_amount', () => {
    // The plan.md contract: sellers[{ store_id, store_name, subtotal, shipping_amount, ... }]
    expect(orderService).toMatch(/store_id.*subtotal|subtotal.*store_id/);
    expect(orderService).toMatch(/shipping_amount/);
  });

  it('getCheckoutQuote return type includes sellers field (from plan.md FR-017)', () => {
    // The quote must now declare sellers[] in its return type (plan.md API contract)
    expect(orderService).toMatch(/sellers\s*\??\s*:/);
  });
});

describe('T4 — Checkout page reads group_number from checkout response (plan.md)', () => {
  it('extracts group_number from the checkout API response', () => {
    // On submit success, the checkout page must read group_number (in addition to
    // the back-compat order_number). This is the new OrderGroup identifier (plan.md).
    expect(checkoutPage).toMatch(/group_number/);
  });

  it('uses group_number for confirmation redirect when present', () => {
    // group_number is set as the primary value of orderNumber before the
    // router.push call — the redirect uses group_number via the orderNumber variable.
    // Test: group_number is assigned before orderNumber (||) so the redirect picks it up.
    expect(checkoutPage).toMatch(/const group_number\s*=|group_number\s*\|\|/);
    // And orderNumber is derived from group_number (first fallback wins)
    expect(checkoutPage).toMatch(/orderNumber\s*=\s*[\r\n\s]*group_number/);
  });
});

describe('T5 — Checkout page renders per-seller shipment breakdown for multi-seller quote', () => {
  it('renders a per-seller breakdown section when quote has sellers[] data', () => {
    // The checkout summary must show a per-seller breakdown when the quote response
    // contains sellers[] (FR-017). This section groups items + shipping by seller.
    expect(checkoutPage).toMatch(/sellers|per_seller|PerSeller|seller.*breakdown|shipment.*breakdown/i);
  });

  it('displays each seller name/store and their shipping amount in the summary', () => {
    // Each seller row shows store_name + shipping_amount
    expect(checkoutPage).toMatch(/store_name|storeName|seller.*name/i);
  });
});

// ── T6-T7: Order confirmation — group stash + sub-order enumeration ──────────

describe('T6 — Order confirmation stores group reference in sessionStorage (FR-018)', () => {
  it('writes group_number or checkout_group_id into beldify_last_order stash', () => {
    // The checkout page stash must include group_number (or checkout_group_id)
    // so confirmation page can enumerate sub-orders even for guests.
    expect(checkoutPage).toMatch(/group_number|checkout_group_id/);
  });

  it('stash includes orders[] array (sub-orders) for multi-seller checkout', () => {
    // The checkout stash (guestOrderStash) must carry an orders field populated from
    // the group response sub-orders so confirmation can enumerate all per-seller orders.
    // Test: the stash object literal contains an `orders:` property assignment.
    expect(checkoutPage).toMatch(/guestOrderStash\s*=\s*\{/);
    // The stash has an orders key (derived from subOrders / response.data.orders)
    expect(checkoutPage).toMatch(/orders\s*:\s*subOrders|subOrders.*orders/);
  });
});

describe('T7 — Order confirmation enumerates all sub-orders from orders[] (FR-018)', () => {
  it('renders per-seller order cards when order.orders[] has entries', () => {
    // The confirmation page already reads order.orders[] — verify it renders
    // sub-order cards for each seller (PerSellerOrder[])
    expect(confirmationPage).toMatch(/order\.orders|orders\.map|PerSellerOrder/);
  });

  it('shows the multi-seller split notice when orders.length > 1', () => {
    // A split notice (banner) must appear to inform the buyer
    expect(confirmationPage).toMatch(/split|multi.*seller|seller.*split|isMultiSeller/i);
  });

  it('shows each sub-order number in the per-seller section', () => {
    // Each per-seller card should display its own order_number
    expect(confirmationPage).toMatch(/sellerOrder\.order_number|order_number.*sellerOrder|sub.*order.*number/i);
  });
});

// ── T8: Buyer order history — group card with sub-order rows ─────────────────

describe('T8 — Buyer order history renders group card with per-seller sub-order rows', () => {
  it('imports or references OrderGroup type or handles group-level orders', () => {
    // The orders page must handle OrderGroup structure (orders with sub-orders)
    // This can be via a GroupOrderCard component or inline rendering
    expect(ordersPage).toMatch(/OrderGroup|order_group|group_number|orders.*sub.*order|GroupOrderCard/i);
  });

  it('renders sub-order rows with per-seller status badges', () => {
    // Each sub-order must show its own status independently
    expect(ordersPage).toMatch(/sub.*order.*status|subOrder.*status|sellerOrder.*status|order\.orders.*status/i);
  });

  it('renders a per-seller row with store name within the group card', () => {
    // The group card shows each seller's sub-order with store_name
    expect(ordersPage).toMatch(/store_name|storeName|seller.*name|sub.*order.*store/i);
  });
});

// ── T9-T10: orderService contract updates ────────────────────────────────────

describe('T9 — orderService quote shape includes plan.md sellers[] contract', () => {
  it('getCheckoutQuote return type has sellers property matching plan.md', () => {
    // Plan contract: sellers: [{ store_id, store_name, subtotal, shipping_amount,
    //   tax_amount, discount_amount, items[] }]
    // At minimum: sellers with store_id, store_name, subtotal, shipping_amount
    expect(orderService).toMatch(/sellers\s*\?\s*:\s*Array|sellers\?\s*:\s*\{|sellers\s*\?:\s*/);
  });

  it('SellerQuote or equivalent type has store_name field', () => {
    expect(orderService).toMatch(/store_name\s*\??\s*:/);
  });

  it('SellerQuote or equivalent type has tax_amount field', () => {
    expect(orderService).toMatch(/tax_amount\s*\??\s*:/);
  });

  it('SellerQuote or equivalent type has discount_amount field', () => {
    expect(orderService).toMatch(/discount_amount\s*\??\s*:/);
  });
});

describe('T10 — Checkout response includes group_number for redirect', () => {
  it('checkout page handles group_number in response data extraction', () => {
    // The orderNumber extraction block must also try group_number and
    // use it as the primary redirect identifier when present
    expect(checkoutPage).toMatch(/group_number/);
  });
});
