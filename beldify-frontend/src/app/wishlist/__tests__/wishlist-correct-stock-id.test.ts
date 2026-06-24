/**
 * TDD RED→GREEN — Wishlist add-to-cart uses real stock_id (not product_id).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const src = readFileSync(join(__dirname, '../page.tsx'), 'utf-8');

describe('wishlist/page.tsx — correct stock_id resolution', () => {
  it('imports productService to fetch product details', () => {
    expect(src).toContain('productService');
  });

  it('does NOT send stock_id: productId directly', () => {
    // The old buggy pattern — should be gone
    expect(src).not.toContain('stock_id: productId');
  });

  it('resolves stock_id from product.stock.id', () => {
    expect(src).toContain('product.stock?.id');
  });

  it('resolves stock_id from product.stock_id as fallback', () => {
    expect(src).toContain('product.stock_id');
  });

  it('shows error toast when stock_id cannot be resolved', () => {
    expect(src).toContain('errors.stock_unavailable');
  });
});
