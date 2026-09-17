/**
 * ProductCard.currencyDisplay.test.tsx
 *
 * TDD: verify ProductCard wires the display-only CurrencyContext to show a
 * converted price alongside the MAD price. Static source analysis (matches
 * the project's existing pattern for this heavy component).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');

function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf-8');
}

describe('ProductCard — display-only currency conversion', () => {
  const src = read('src/components/products/ProductCard.tsx');

  it('imports useCurrency from CurrencyContext', () => {
    expect(src).toContain("from '@/contexts/CurrencyContext'");
    expect(src).toMatch(/useCurrency\s*\(/);
  });

  it('calls format() to render a converted price near the MAD price', () => {
    expect(src).toMatch(/format\(/);
  });
});
