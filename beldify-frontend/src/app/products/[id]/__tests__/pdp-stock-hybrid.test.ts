/**
 * TDD — RED phase
 *
 * Tests for the hybrid-stock purchase flow on the PDP:
 * - Variant-less products use product.stock object (new backend contract)
 * - No hardcoded size pill fallback ['S','M','L','XL']
 * - shouldDisableButton uses product.stock.in_stock for variant-less products
 * - handleAddToCart has a variant-less branch calling addItem(..., 'stock')
 * - Made-to-order indicator + Only-N-left urgency nudge
 * - Sticky mobile bar has state-aware label for variant-less
 * - ProductDetails interface has the new stock object type
 *
 * Source-reading approach (like pdp-atlas.test.ts) because the component is a
 * large 'use client' page with internal closures that aren't unit-testable in isolation.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const pageSrc = readFileSync(join(__dirname, '../page.tsx'), 'utf-8');

// ── P0 Bug Fixes ──────────────────────────────────────────────────────────────

describe('PDP hybrid-stock — P0 bug fixes', () => {
  describe('Fake size pill fallback removed', () => {
    it('does NOT have a hardcoded ["S","M","L","XL"] fallback in sizePills', () => {
      // The old code: const sizePills: string[] = availableSizes.length > 0
      //   ? availableSizes.map(s => s.name) : ['S', 'M', 'L', 'XL'];
      // Must be removed. Only real sizes should appear.
      expect(pageSrc).not.toContain("'S', 'M', 'L', 'XL'");
      expect(pageSrc).not.toContain('"S", "M", "L", "XL"');
    });

    it('renders the size fieldset only when availableSizes.length > 0', () => {
      // The <fieldset> for sizes must be guarded with availableSizes.length > 0
      // Pattern: {availableSizes.length > 0 && (<fieldset>
      expect(pageSrc).toMatch(/availableSizes\.length\s*>\s*0[^}]*<fieldset/s);
    });
  });

  describe('ProductDetails interface — stock object type', () => {
    it('ProductDetails has stock typed as { id, quantity, in_stock, made_to_order } object', () => {
      // The interface must declare stock as an object, not a plain number.
      // Pattern: stock?: { id: string; quantity: number | null; in_stock: boolean; made_to_order: boolean }
      expect(pageSrc).toMatch(/stock\?:\s*\{[^}]*in_stock:\s*boolean/s);
    });

    it('ProductDetails stock object includes made_to_order boolean field', () => {
      expect(pageSrc).toMatch(/made_to_order:\s*boolean/);
    });

    it('ProductDetails stock.quantity allows null (made-to-order unlimited)', () => {
      // quantity: number | null
      expect(pageSrc).toMatch(/quantity:\s*number\s*\|\s*null/);
    });
  });

  describe('shouldDisableButton — variant-less stock object', () => {
    it('uses product.stock.in_stock to disable button for variant-less products', () => {
      // Must check the new `product.stock.in_stock` flag, not the old scalar product.stock
      expect(pageSrc).toMatch(/product\.stock\.in_stock/);
    });

    it('does NOT use the old product.stock ?? product.quantity scalar pattern for disable logic', () => {
      // The old: const productStock = product.stock ?? product.quantity
      // should be gone from shouldDisableButton
      // We check the function region by looking for the bad pattern near shouldDisableButton
      // Allow it in stockStatus IIFE but not in shouldDisableButton.
      // Since the IIFE is also updated, neither should have it.
      expect(pageSrc).not.toContain('product.stock ?? product.quantity');
    });
  });

  describe('handleAddToCart — variant-less branch', () => {
    it('calls addItem with type "stock" for variant-less products', () => {
      // Must have a branch that resolves stock id from product.stock?.id and
      // calls addItem(..., 'stock') for variant-less products.
      // The implementation uses an intermediate stockId variable for clarity.
      expect(pageSrc).toMatch(/product\.stock\?\.id/);
      expect(pageSrc).toMatch(/addItem\(\s*stockId\s*,\s*quantity\s*,\s*'stock'\s*\)/);
    });

    it('has the variant-less branch BEFORE the !selectedVariant guard', () => {
      // The variant-less add must not fall through to the `!selectedVariant` error guard.
      const variantlessBranchIdx = pageSrc.indexOf("product.stock.id");
      const variantGuardIdx = pageSrc.indexOf("typeof selectedVariant.id !== 'string'");
      // Variant-less branch must appear before the guard
      expect(variantlessBranchIdx).toBeGreaterThan(-1);
      expect(variantGuardIdx).toBeGreaterThan(-1);
      expect(variantlessBranchIdx).toBeLessThan(variantGuardIdx);
    });
  });

  describe('stockStatus IIFE — updated for new stock object', () => {
    it('uses product.stock.in_stock in stockStatus (not old scalar pattern)', () => {
      // The stockStatus IIFE must reference the new stock object
      expect(pageSrc).toMatch(/product\.stock\.in_stock|product\.stock\?\.in_stock/);
    });
  });
});

// ── Conversion Polish ─────────────────────────────────────────────────────────

describe('PDP hybrid-stock — conversion polish', () => {
  describe('Stock indicator for variant-less products', () => {
    it('renders "Made to order" indicator when product.stock.made_to_order is true', () => {
      // Must have a JSX branch checking made_to_order
      expect(pageSrc).toMatch(/made_to_order/);
    });

    it('uses i18n key stock.made_to_order for made-to-order label', () => {
      expect(pageSrc).toContain("stock.made_to_order");
    });
  });

  describe('Urgency / scarcity nudge', () => {
    it('renders "Only N left" nudge when stock <= 5 (low stock scarcity)', () => {
      // Must check stock quantity <= 5 for the urgency nudge
      expect(pageSrc).toMatch(/<=\s*5|<\s*6/);
    });

    it('uses i18n key stock.only_left for the "Only N left" message', () => {
      expect(pageSrc).toContain("stock.only_left");
    });
  });

  describe('Mobile sticky bar — state-aware label for variant-less', () => {
    it('PdpBuyBar is the mobile sticky component (not inline sticky JSX)', () => {
      // The sticky bar was extracted to PdpBuyBar; page.tsx renders it via
      // the <PdpBuyBar ... /> import.  Dynamic label logic for made_to_order
      // lives in the in-page buy buttons (not inside PdpBuyBar).
      expect(pageSrc).toContain('PdpBuyBar');
      // Confirm the page passes an addToCartLabel prop to PdpBuyBar
      expect(pageSrc).toMatch(/addToCartLabel=/);
    });

    it('page has state-aware made_to_order label logic for in-page buy buttons', () => {
      // The in-page buy buttons (desktop) use made_to_order to show the right label.
      expect(pageSrc).toMatch(/made_to_order/);
      expect(pageSrc).toContain("stock.made_to_order");
    });
  });
});

// ── Conversion Polish — Social proof prominence ───────────────────────────────

describe('PDP conversion polish — social proof', () => {
  it('shows numeric rating score next to stars (e.g. "4.8")', () => {
    // Must render product.rating as a numeric text node near the star row,
    // not just visually via star fill. Provides scannable social proof.
    // Pattern: product.rating rendered as a text value (toFixed(1) or similar)
    const hasNumericRating =
      pageSrc.includes('product.rating.toFixed(1)') ||
      pageSrc.includes('toFixed(1)') ||
      pageSrc.includes('(product.rating ?? 0).toFixed');
    expect(hasNumericRating).toBe(true);
  });

  it('numeric score uses prominent weight (font-bold or font-semibold)', () => {
    // The score should visually stand out — bold weight anchors trust
    const ratingIdx = pageSrc.indexOf('toFixed(1)');
    expect(ratingIdx).toBeGreaterThan(-1);
    // The surrounding 200 chars should include a font-bold or font-semibold class
    const ratingRegion = pageSrc.slice(Math.max(0, ratingIdx - 150), ratingIdx + 150);
    const hasBold = ratingRegion.includes('font-bold') || ratingRegion.includes('font-semibold');
    expect(hasBold).toBe(true);
  });
});

// ── Conversion Polish — Richer media: click-to-zoom ──────────────────────────

describe('PDP conversion polish — richer media', () => {
  it('main image is clickable (has onClick handler or button wrapper)', () => {
    // Click-to-zoom requires the main image container to be interactive.
    // Look for a zoom state variable or a click handler on the image container.
    const hasZoomInteraction =
      pageSrc.includes('isZoomed') ||
      pageSrc.includes('setIsZoomed') ||
      pageSrc.includes('zoomOpen') ||
      pageSrc.includes('setZoomOpen') ||
      pageSrc.includes('lightboxOpen') ||
      pageSrc.includes('handleImageClick');
    expect(hasZoomInteraction).toBe(true);
  });

  it('shows a fullscreen/dialog overlay for zoomed image', () => {
    // There must be a dialog or fixed-position overlay that shows the full image.
    // Pattern: role="dialog" or fixed inset-0 overlay, or a <dialog> element.
    const hasOverlay =
      pageSrc.includes('role="dialog"') ||
      (pageSrc.includes('fixed inset-0') && pageSrc.includes('isZoom')) ||
      (pageSrc.includes('fixed inset-0') && pageSrc.includes('zoomOpen')) ||
      (pageSrc.includes('fixed inset-0') && pageSrc.includes('lightbox'));
    expect(hasOverlay).toBe(true);
  });

  it('active thumbnail has a visually distinct selected state (ring-2 ring-indigo-700)', () => {
    // Clearer active-thumbnail state — already exists but test confirms it survives
    expect(pageSrc).toContain('ring-2 ring-indigo-700');
  });
});

// ── i18n keys in en.json ──────────────────────────────────────────────────────

describe('PDP hybrid-stock — i18n keys (en.json)', () => {
  const enJson = readFileSync(
    join(__dirname, '../../../../i18n/locales/en.json'),
    'utf-8'
  );

  it('en.json has stock.only_left key', () => {
    expect(enJson).toContain('"only_left"');
  });

  it('en.json has stock.made_to_order key', () => {
    expect(enJson).toContain('"made_to_order"');
  });

  it('en.json has stock.made_to_order_ships key', () => {
    expect(enJson).toContain('"made_to_order_ships"');
  });
});
