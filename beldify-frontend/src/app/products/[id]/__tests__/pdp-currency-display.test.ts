/**
 * pdp-currency-display.test.ts
 *
 * TDD: verify the PDP wires the display-only CurrencyContext to show a
 * converted price next to the main MAD price. Static source analysis,
 * matching the project's existing pattern for this heavy page.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..', '..', '..', '..');

function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf-8');
}

describe('Product page — display-only currency conversion', () => {
  const src = read('src/app/products/[id]/page.tsx');

  it('imports useCurrency from CurrencyContext', () => {
    expect(src).toContain("from '@/contexts/CurrencyContext'");
    expect(src).toMatch(/useCurrency\s*\(/);
  });

  it('calls format() to render a converted price near the main price', () => {
    expect(src).toMatch(/format\(/);
  });
});
