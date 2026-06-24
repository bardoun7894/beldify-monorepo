/**
 * TDD RED→GREEN — PDP must include JSON-LD Product schema script.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const src = readFileSync(join(__dirname, '../page.tsx'), 'utf-8');

describe('products/[id]/page.tsx — JSON-LD structured data', () => {
  it('includes application/ld+json script tag', () => {
    expect(src).toContain('application/ld+json');
  });

  it('uses schema.org/Product type', () => {
    expect(src).toContain("'https://schema.org'");
    expect(src).toContain("'Product'");
  });

  it('includes price in MAD currency', () => {
    expect(src).toContain("priceCurrency: 'MAD'");
  });

  it('includes InStock availability from stock status', () => {
    expect(src).toContain('https://schema.org/InStock');
    expect(src).toContain('https://schema.org/OutOfStock');
  });
});
