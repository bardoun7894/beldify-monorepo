/**
 * TDD RED→GREEN — Navbar dead-link fixes.
 * Static source analysis to verify link correctness.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const navbarSrc = readFileSync(
  join(__dirname, '../layout/Navbar.tsx'),
  'utf-8'
);

describe('Navbar.tsx — dead link fixes', () => {
  it('does NOT link to /journal (removed)', () => {
    // The journal link should be gone from staticNavLinks
    expect(navbarSrc).not.toMatch(/href.*['"]\s*\/journal\s*['"]/);
  });

  it('does NOT link to /tailoring (fixed to /services/tailoring)', () => {
    expect(navbarSrc).not.toMatch(/href.*['"]\/tailoring['"]/);
  });

  it('links tailoring to /services/tailoring', () => {
    expect(navbarSrc).toContain('/services/tailoring');
  });

  it('pushes search to /products?q= not /search?q=', () => {
    expect(navbarSrc).not.toContain('`/search?q=');
    expect(navbarSrc).toContain('`/products?q=');
  });
});
