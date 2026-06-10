/**
 * TDD RED phase — search/page.tsx should permanently redirect to /products
 * preserving the `q` query parameter.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const pagePath = join(__dirname, '../page.tsx');

describe('search/page.tsx — permanent redirect to /products', () => {
  it('file exists', () => {
    expect(() => readFileSync(pagePath, 'utf-8')).not.toThrow();
  });

  it('exports a default component or redirect', () => {
    const src = readFileSync(pagePath, 'utf-8');
    expect(src).toMatch(/export default/);
  });

  it('redirects to /products preserving q param', () => {
    const src = readFileSync(pagePath, 'utf-8');
    // Must reference /products and include q parameter forwarding
    expect(src).toContain('/products');
    // Must have q param forwarding logic
    expect(src).toMatch(/searchParams|q/);
  });

  it('performs a 301 or permanent redirect (not just a link)', () => {
    const src = readFileSync(pagePath, 'utf-8');
    // Next.js server redirect: redirect() or permanentRedirect()
    expect(src).toMatch(/permanentRedirect|redirect\(/);
  });
});
