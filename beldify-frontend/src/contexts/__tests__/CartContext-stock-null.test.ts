/**
 * TDD — RED phase
 *
 * Proves that validateStock() in CartContext currently throws "insufficient_stock"
 * when available_quantity is null (made-to-order items), because null < 1 evaluates
 * to true in JS (null coerces to 0). After the fix, null must be treated as
 * "always available" (made-to-order = unlimited production).
 *
 * These tests target the pure logic in cartService.checkStock + validateStock behaviour.
 * We test it via source-code pattern inspection (same approach as pdp-atlas.test.ts)
 * because validateStock is a private-ish closure inside the CartContext provider.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const cartContextSrc = readFileSync(
  join(__dirname, '../../contexts/CartContext.tsx'),
  'utf-8'
);

const typesSrc = readFileSync(
  join(__dirname, '../../services/api/types.ts'),
  'utf-8'
);

describe('CartContext — validateStock null-quantity (made-to-order) fix', () => {
  it('StockResponse.available_quantity allows null (made-to-order)', () => {
    // The type must be number | null — plain `number` forces coercion bugs
    expect(typesSrc).toMatch(/available_quantity:\s*number\s*\|\s*null/);
  });

  it('validateStock returns true (not throws) when available_quantity is null', () => {
    // There must be an explicit null guard BEFORE the `< quantity` comparison.
    // Pattern: if (stockAvailable.available_quantity === null) return true
    expect(cartContextSrc).toMatch(
      /available_quantity\s*===\s*null[^}]*return\s+true/s
    );
  });

  it('does not compare null directly to quantity (null < qty coercion bug)', () => {
    // The old code did `if (stockAvailable.available_quantity < quantity)` without
    // guarding for null first — that coerces null → 0 and always throws.
    // After the fix there must be a null guard preceding any `< quantity` check.
    // We verify by confirming the null-return pattern comes before the lt-check.
    const nullReturnIdx = cartContextSrc.indexOf('available_quantity === null');
    const ltQtyIdx = cartContextSrc.indexOf('available_quantity < quantity');
    // Both must exist and null guard must appear before the comparison
    expect(nullReturnIdx).toBeGreaterThan(-1);
    expect(ltQtyIdx).toBeGreaterThan(-1);
    expect(nullReturnIdx).toBeLessThan(ltQtyIdx);
  });

  it('null guard appears before the out_of_stock status check (defensive ordering)', () => {
    // If the backend sends status: out_of_stock alongside available_quantity: null
    // (non-standard but possible for made-to-order mis-classification), the null
    // guard must fire first — otherwise the status check throws before we can rescue.
    // This verifies the null guard comes before the out_of_stock/no_stock include() check.
    const nullReturnIdx = cartContextSrc.indexOf('available_quantity === null');
    const outOfStockCheckIdx = cartContextSrc.indexOf("'out_of_stock', 'no_stock', 'variant_not_found'");
    expect(nullReturnIdx).toBeGreaterThan(-1);
    expect(outOfStockCheckIdx).toBeGreaterThan(-1);
    // null guard must come BEFORE the out_of_stock status check
    expect(nullReturnIdx).toBeLessThan(outOfStockCheckIdx);
  });
});
