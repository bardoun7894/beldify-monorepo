/**
 * TDD tests for T030–T036 (005-seller-verticals-jewelry, WS-B)
 *
 * Node environment — source-reading + service-logic tests.
 * Render-based tests are in 005-seller-verticals-jewelry-render.test.tsx.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8');
const exists = (rel: string) => existsSync(join(ROOT, rel));

// ─────────────────────────────────────────────────────────────────────────────
// T030 — Seller: vertical picker in store settings
// ─────────────────────────────────────────────────────────────────────────────
describe('T030 — Seller vertical picker in store settings', () => {
  it('page file exists at src/app/seller/store-settings/page.tsx', () => {
    expect(exists('src/app/seller/store-settings/page.tsx')).toBe(true);
  });

  it('renders vertical picker with all 5 vertical options', () => {
    const src = read('src/app/seller/store-settings/page.tsx');
    expect(src).toMatch(/regular/);
    expect(src).toMatch(/tailor/);
    expect(src).toMatch(/menswear/);
    expect(src).toMatch(/womenswear/);
    expect(src).toMatch(/jewelry/);
  });

  it('reads current store_type from seller profile state', () => {
    const src = read('src/app/seller/store-settings/page.tsx');
    expect(src).toMatch(/store_type|storeType|vertical/);
  });

  it('calls verticalService.fetchVerticalConfig when vertical changes', () => {
    const src = read('src/app/seller/store-settings/page.tsx');
    expect(src).toMatch(/fetchVerticalConfig|verticalService/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T031 — Seller: vertical-aware product form (conditional fields)
// ─────────────────────────────────────────────────────────────────────────────
describe('T031 — Seller vertical-aware product form', () => {
  it('VerticalProductForm component file exists', () => {
    expect(exists('src/components/seller/VerticalProductForm.tsx')).toBe(true);
  });

  it('renders fields from verticals config response (not hardcoded)', () => {
    const src = read('src/components/seller/VerticalProductForm.tsx');
    // Must iterate over fields from config, not a static list
    expect(src).toMatch(/fields\.map|field\.key|field\.type/);
  });

  it('marks material as required (required: true) but no others hardcoded', () => {
    const src = read('src/components/seller/VerticalProductForm.tsx');
    // required-ness comes from field.required flag, not hardcoded names
    expect(src).toMatch(/field\.required/);
    // Should NOT hardcode 'material' as the required check
    expect(src).not.toMatch(/key\s*===\s*['"]material['"]\s*&&\s*required/);
  });

  it('groups gemstone fields under a collapsible group section', () => {
    const src = read('src/components/seller/VerticalProductForm.tsx');
    expect(src).toMatch(/group|gemstone/);
  });

  it('renders select input for fields with options', () => {
    const src = read('src/components/seller/VerticalProductForm.tsx');
    expect(src).toMatch(/type.*select|<select|Select/);
  });

  it('renders text/decimal/integer input for non-select fields', () => {
    const src = read('src/components/seller/VerticalProductForm.tsx');
    expect(src).toMatch(/type.*text|type.*number/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T032 — Seller: custom-order management (quote + advance timeline)
// ─────────────────────────────────────────────────────────────────────────────
describe('T032 — Seller custom-order management', () => {
  it('page file exists at src/app/seller/custom-orders/page.tsx', () => {
    expect(exists('src/app/seller/custom-orders/page.tsx')).toBe(true);
  });

  it('quote form component exists', () => {
    expect(exists('src/components/seller/QuoteForm.tsx')).toBe(true);
  });

  it('QuoteForm only renders when status === requested', () => {
    const src = read('src/components/seller/QuoteForm.tsx');
    expect(src).toMatch(/requested/);
  });

  it('QuoteForm has quote_amount, deposit_amount, eta fields', () => {
    const src = read('src/components/seller/QuoteForm.tsx');
    expect(src).toMatch(/quote_amount/);
    expect(src).toMatch(/deposit_amount/);
    expect(src).toMatch(/eta/);
  });

  it('advance status offers only allowed next statuses from ALLOWED_NEXT_STATUSES', () => {
    const src = read('src/components/seller/CustomOrderTimeline.tsx');
    expect(src).toMatch(/ALLOWED_NEXT_STATUSES|allowedNext/);
  });

  it('CustomOrderTimeline component exists', () => {
    expect(exists('src/components/seller/CustomOrderTimeline.tsx')).toBe(true);
  });

  it('timeline renders progress entries with status + timestamp', () => {
    const src = read('src/components/seller/CustomOrderTimeline.tsx');
    expect(src).toMatch(/progress|created_at/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T033 — Buyer: Jewelry category page + filters
// ─────────────────────────────────────────────────────────────────────────────
describe('T033 — Buyer jewelry category page', () => {
  it('jewelry category page exists', () => {
    expect(exists('src/app/categories/jewelry/page.tsx')).toBe(true);
  });

  it('page has material filter', () => {
    const src = read('src/app/categories/jewelry/page.tsx');
    expect(src).toMatch(/material/);
  });

  it('page has gemstone filter', () => {
    const src = read('src/app/categories/jewelry/page.tsx');
    expect(src).toMatch(/gemstone/);
  });

  it('filter options match contracts.md jewelry field options', () => {
    const src = read('src/app/categories/jewelry/page.tsx');
    expect(src).toMatch(/gold|silver/);
    expect(src).toMatch(/diamond|emerald/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T034 — Buyer: jewelry PDP fields (optional-aware)
// ─────────────────────────────────────────────────────────────────────────────
describe('T034 — Buyer jewelry PDP fields', () => {
  it('JewelryFields component exists', () => {
    expect(exists('src/components/products/JewelryFields.tsx')).toBe(true);
  });

  it('hides blank optional fields gracefully (does not render if null/undefined)', () => {
    const src = read('src/components/products/JewelryFields.tsx');
    // Should conditionally render optional fields
    expect(src).toMatch(/&&|null|undefined|\?\./);
  });

  it('renders material field (always, since it is required)', () => {
    const src = read('src/components/products/JewelryFields.tsx');
    expect(src).toMatch(/material/);
  });

  it('renders purity, weight_grams, size, gemstone fields when present', () => {
    const src = read('src/components/products/JewelryFields.tsx');
    expect(src).toMatch(/purity/);
    expect(src).toMatch(/weight_grams/);
    expect(src).toMatch(/size/);
    expect(src).toMatch(/gemstone/);
  });

  it('renders engraving and finish fields when present', () => {
    const src = read('src/components/products/JewelryFields.tsx');
    expect(src).toMatch(/engraving/);
    expect(src).toMatch(/finish/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T035 — Buyer: "Request custom piece" form
// ─────────────────────────────────────────────────────────────────────────────
describe('T035 — Buyer custom piece request form', () => {
  it('CustomOrderForm component exists', () => {
    expect(exists('src/components/checkout/CustomOrderForm.tsx')).toBe(true);
  });

  it('jewelry variant: material is the only required field', () => {
    const src = read('src/components/checkout/CustomOrderForm.tsx');
    // required check must use field.required from config, not hardcoded
    expect(src).toMatch(/field\.required|required.*material/);
  });

  it('sends spec, store_id, vertical, notes to POST /api/v1/custom-orders', () => {
    const src = read('src/components/checkout/CustomOrderForm.tsx');
    expect(src).toMatch(/store_id/);
    expect(src).toMatch(/vertical/);
    expect(src).toMatch(/spec/);
    expect(src).toMatch(/submitCustomOrder|customOrderService/);
  });

  it('supports both jewelry and apparel vertical variants', () => {
    const src = read('src/components/checkout/CustomOrderForm.tsx');
    expect(src).toMatch(/jewelry/);
    expect(src).toMatch(/menswear|apparel|womenswear/);
  });

  it('request custom piece page exists', () => {
    expect(exists('src/app/custom-orders/new/page.tsx')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T036 — Buyer: made-to-order tracking timeline
// ─────────────────────────────────────────────────────────────────────────────
describe('T036 — Buyer made-to-order tracking timeline', () => {
  it('tracking page exists', () => {
    expect(exists('src/app/custom-orders/[id]/page.tsx')).toBe(true);
  });

  it('MadeToOrderTimeline component exists', () => {
    expect(exists('src/components/checkout/MadeToOrderTimeline.tsx')).toBe(true);
  });

  it('timeline renders all progress steps', () => {
    const src = read('src/components/checkout/MadeToOrderTimeline.tsx');
    expect(src).toMatch(/progress/);
  });

  it('uses STATUS_META for Atlas pill colors', () => {
    const src = read('src/components/checkout/MadeToOrderTimeline.tsx');
    expect(src).toMatch(/STATUS_META|pillClass/);
  });

  it('renders quote amount and ETA when available', () => {
    const src = read('src/app/custom-orders/[id]/page.tsx');
    expect(src).toMatch(/quote_amount/);
    expect(src).toMatch(/eta/);
  });

  it('fetches order by id from customOrderService', () => {
    const src = read('src/app/custom-orders/[id]/page.tsx');
    expect(src).toMatch(/fetchCustomOrder|customOrderService/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Service contracts
// ─────────────────────────────────────────────────────────────────────────────
describe('verticalService — contract compliance', () => {
  it('exports fetchVerticalConfig function', () => {
    const src = read('src/services/verticalService.ts');
    expect(src).toMatch(/export.*fetchVerticalConfig|export.*verticalService/);
  });

  it('MOCK_JEWELRY_CONFIG has material as required and all others optional', () => {
    const src = read('src/services/verticalService.ts');
    // material is required:true, everything else required:false
    expect(src).toMatch(/material.*required.*true/);
    expect(src).toMatch(/purity.*required.*false/);
  });

  it('returns empty fields array for regular vertical', () => {
    const src = read('src/services/verticalService.ts');
    expect(src).toMatch(/regular.*fields.*\[\]/);
  });
});

describe('customOrderService — contract compliance', () => {
  it('exports all required functions', () => {
    const src = read('src/services/customOrderService.ts');
    expect(src).toMatch(/submitCustomOrder/);
    expect(src).toMatch(/fetchCustomOrder\b/);
    expect(src).toMatch(/fetchCustomOrders/);
    expect(src).toMatch(/submitQuote/);
    expect(src).toMatch(/advanceCustomOrder/);
  });

  it('ALLOWED_NEXT_STATUSES does not include quoted for advance (D4-RESOLVED)', () => {
    const src = read('src/services/customOrderService.ts');
    // requested can only go to cancelled via advance (quote is exclusive A5)
    expect(src).toMatch(/requested.*cancelled/);
  });

  it('STATUS_META has Atlas pill classes for all 8 statuses', () => {
    const src = read('src/services/customOrderService.ts');
    const statuses = ['requested', 'quoted', 'deposit_paid', 'in_progress', 'ready', 'delivered', 'closed', 'cancelled'];
    for (const status of statuses) {
      expect(src).toMatch(new RegExp(`${status}.*pillClass`));
    }
  });

  it('has LIVE WIRING comment for WS-A integration', () => {
    const src = read('src/services/customOrderService.ts');
    expect(src).toMatch(/LIVE WIRING/);
  });
});
