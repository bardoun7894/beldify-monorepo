/**
 * ProductCard.availability.test.tsx
 *
 * Guards the stock-semantics fix: listing cards must decide availability from
 * the boolean `in_stock` (which handles made-to-order = null quantity), NOT
 * from a raw numeric `stock_quantity <= 0`. Static source analysis, matching
 * the project's existing pattern for these heavy components.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf-8');

describe('listing cards — boolean availability, not numeric stock', () => {
  const cards = [
    'src/components/products/ProductCard.tsx',
    'src/components/products/TraditionalProductCard.tsx',
    'src/components/products/ProductQuickView.tsx',
  ];

  it.each(cards)('%s derives an isAvailable boolean from in_stock', (path) => {
    const src = read(path);
    expect(src).toMatch(/isAvailable/);
    expect(src).toMatch(/rawInStock/);
  });

  it.each(cards)('%s no longer gates purchase on stock_quantity <= 0', (path) => {
    const src = read(path);
    expect(src).not.toMatch(/stock_quantity\s*<=\s*0/);
  });

  it('TraditionalProductCard no longer gates on the never-populated `stock` field', () => {
    const src = read('src/components/products/TraditionalProductCard.tsx');
    expect(src).not.toMatch(/\bstock\s*<=\s*0\b/);
    expect(src).not.toMatch(/\bstock\s*>\s*0\b/);
  });
});

describe('backend emits sellable boolean + nullable quantity for listings', () => {
  const be = join(ROOT, '..', 'beldify-backend');
  it('CategoryProductsController uses isSellable() and keeps quantity nullable', () => {
    const src = readFileSync(
      join(be, 'app/Http/Controllers/API/Frontend/CategoryProductsController.php'),
      'utf-8'
    );
    expect(src).toMatch(/'in_stock'\s*=>\s*\$stock->isSellable\(\)/);
    expect(src).toMatch(/'stock_quantity'\s*=>\s*\$stock->quantity/);
    // must NOT coerce null -> 0 on this listing
    expect(src).not.toMatch(/'in_stock'\s*=>\s*\$stock->quantity\s*>\s*0/);
  });
});
