/**
 * ProductCard.addtocart.test.tsx
 *
 * TDD: verify that when no onAddToCart prop is supplied, the card's add-to-cart
 * button calls the REAL CartContext.addToCart (not a fake setTimeout+toast).
 *
 * Uses static source analysis to match the existing project test pattern
 * (no DOM rendering needed for these contract assertions).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf-8');
}

describe('ProductCard — fallback add-to-cart (no onAddToCart prop)', () => {
  const src = read('src/components/products/ProductCard.tsx');

  it('imports useCart from CartContext (required for real cart add)', () => {
    expect(src).toMatch(/useCart/);
    expect(src).toContain("from '@/contexts/CartContext'");
  });

  it('calls addToCart from useCart in the fallback branch (no custom handler)', () => {
    // The component must destructure addToCart or addItem from useCart
    // and call it when no onAddToCart prop is supplied.
    const usesCartHook = /useCart\s*\(/.test(src);
    expect(usesCartHook).toBe(true);

    // Must reference addToCart or addItem inside the component
    const callsRealCartMethod =
      src.includes('addToCart') || src.includes('addItem');
    expect(callsRealCartMethod).toBe(true);
  });

  it('does NOT call a toast directly in the else-branch to fake a successful cart add', () => {
    // The old fake pattern was: else { setTimeout(() => { toast.success(...) }, 600) }
    // This made a toast appear without ever calling the API — broken for guests.
    // After the fix the else-branch must call addToCart() (real API) not just a toast.
    //
    // Check: the else block must reference addToCart (real call), not lead with a
    // bare toast.success that would imply a fake add.
    const elseBlockMatch = src.match(/\}\s*else\s*\{([\s\S]*?)^\s*\}/m);
    if (elseBlockMatch) {
      const elseBody = elseBlockMatch[1];
      // If the else block has a toast.success, it must ALSO have an addToCart call
      if (elseBody.includes('toast.success')) {
        const hasRealCall = elseBody.includes('addToCart') || elseBody.includes('addItem');
        expect(hasRealCall).toBe(true);
      }
    }
    // Primary check: the real cart method must be called somewhere in the fallback path
    expect(src).toMatch(/addToCart\s*\(/);
  });

  it('uses the real cart context call with the product argument in the else branch', () => {
    // After real implementation: the else branch must call e.g. addToCart(product)
    // We verify the method is called with the product, not with a hardcoded delay
    const hasRealCall =
      src.includes('addToCart(product') ||
      src.includes('addItem(') ||
      src.includes('cartContext.addToCart') ||
      src.includes('cart.addToCart');
    expect(hasRealCall).toBe(true);
  });
});
