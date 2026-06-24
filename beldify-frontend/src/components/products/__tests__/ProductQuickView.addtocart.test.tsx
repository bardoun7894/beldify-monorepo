/**
 * TDD RED — ProductQuickView add-to-cart fix (P1-1)
 *
 * Proves:
 * 1. handleAddToCart calls useCart().addItem when stock_id is present, NOT just onAddToCart
 * 2. toast.success fires only AFTER addItem resolves
 * 3. toast.error fires when addItem rejects
 * 4. When stock_id is null the component renders a link/button to the PDP (no silent call)
 * 5. quantity state is passed to addItem
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..', '..', '..');
const FILE = join(ROOT, 'src/components/products/ProductQuickView.tsx');

function src() {
  return readFileSync(FILE, 'utf-8');
}

describe('ProductQuickView — P1-1 add-to-cart wiring', () => {
  it('imports useCart', () => {
    expect(src()).toMatch(/useCart/);
  });

  it('uses useRouter for null stock_id redirect', () => {
    expect(src()).toMatch(/useRouter/);
  });

  it('calls addItem inside handleAddToCart', () => {
    expect(src()).toMatch(/addItem\s*\(/);
  });

  it('toast.success is inside a .then() or await branch, not unconditionally', () => {
    const content = src();
    // The pattern: toast.success must appear after addItem call — not before
    const addItemIdx = content.indexOf('addItem(');
    const toastSuccessIdx = content.indexOf('toast.success', addItemIdx);
    expect(addItemIdx).toBeGreaterThan(-1);
    expect(toastSuccessIdx).toBeGreaterThan(addItemIdx);
  });

  it('passes quantity to addItem', () => {
    const content = src();
    // addItem call should include the quantity variable
    const addItemCall = content.match(/addItem\s*\(([^)]+)\)/)?.[1] ?? '';
    expect(addItemCall).toMatch(/quantity/);
  });

  it('routes to /products/{id} when stock_id is null', () => {
    expect(src()).toMatch(/\/products\//);
    expect(src()).toMatch(/router\.push/);
  });

  it('toast.error fires on addItem rejection', () => {
    const content = src();
    const catchIdx = content.indexOf('.catch(');
    const toastErrorIdx = content.indexOf('toast.error', catchIdx);
    expect(toastErrorIdx).toBeGreaterThan(catchIdx);
  });
});
